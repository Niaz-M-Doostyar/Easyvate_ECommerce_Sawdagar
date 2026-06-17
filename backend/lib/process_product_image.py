import argparse
import io
import json
import os
import sys
import warnings
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter
from pymatting import estimate_alpha_cf, estimate_foreground_ml
from rembg import new_session, remove
from scipy import ndimage


MODEL_FILENAMES = {
	"u2net": "u2net.onnx",
	"u2netp": "u2netp.onnx",
	"u2net_human_seg": "u2net_human_seg.onnx",
	"u2net_cloth_seg": "u2net_cloth_seg.onnx",
	"silueta": "silueta.onnx",
	"isnet-general-use": "isnet-general-use.onnx",
	"isnet-anime": "isnet-anime.onnx",
	"sam": "vit_b-encoder-quant.onnx",
	"birefnet-general": "birefnet-general.onnx",
	"birefnet-general-lite": "birefnet-general-lite.onnx",
	"birefnet-portrait": "birefnet-portrait.onnx",
	"birefnet-dis": "birefnet-dis.onnx",
	"birefnet-hrsod": "birefnet-hrsod.onnx",
	"birefnet-cod": "birefnet-cod.onnx",
	"birefnet-massive": "birefnet-massive.onnx",
	"bria-rmbg": "bria-rmbg.onnx",
}


def build_parser() -> argparse.ArgumentParser:
	parser = argparse.ArgumentParser(description="Remove product-image backgrounds with rembg.")
	parser.add_argument("input_path", help="Source image path")
	parser.add_argument("output_path", help="RGBA PNG output path")
	parser.add_argument(
		"--models",
		default="birefnet-general,isnet-general-use,birefnet-general-lite,u2netp",
		help="Comma-separated rembg model order",
	)
	parser.add_argument(
		"--max-refine-side",
		type=int,
		default=1600,
		help="Maximum side length used during alpha matting refinement",
	)
	parser.add_argument(
		"--foreground-threshold",
		type=int,
		default=235,
		help="Pixels above this mask value are treated as sure foreground",
	)
	parser.add_argument(
		"--background-threshold",
		type=int,
		default=15,
		help="Pixels below this mask value are treated as sure background",
	)
	parser.add_argument(
		"--trimap-erosion",
		type=int,
		default=3,
		help="Erosion iterations applied before building the trimap",
	)
	return parser


def normalize_models(raw_models: str) -> list[str]:
	seen = set()
	ordered_models = []
	for model_name in raw_models.split(","):
		normalized = model_name.strip()
		if normalized and normalized not in seen:
			ordered_models.append(normalized)
			seen.add(normalized)
	return ordered_models or ["birefnet-general", "birefnet-general-lite", "u2netp"]


def resolve_model_home() -> Path:
	configured = os.getenv("U2NET_HOME")
	if configured:
		return Path(configured).expanduser().resolve()

	xdg_data_home = os.getenv("XDG_DATA_HOME")
	if xdg_data_home:
		return Path(xdg_data_home).expanduser().resolve() / ".u2net"

	return Path.home() / ".u2net"


def filter_cached_models(model_names: list[str]) -> list[str]:
	model_home = resolve_model_home()
	cached_models = []
	for model_name in model_names:
		filename = MODEL_FILENAMES.get(model_name)
		if filename and (model_home / filename).exists():
			cached_models.append(model_name)
	return cached_models


def create_session(model_names: list[str]):
	ordered_candidates = filter_cached_models(model_names) or model_names
	errors = {}
	for model_name in ordered_candidates:
		try:
			return model_name, new_session(model_name)
		except Exception as exc:  # pragma: no cover - depends on local model/cache state
			errors[model_name] = str(exc)
	raise RuntimeError(json.dumps(errors))


def keep_significant_components(mask: np.ndarray) -> np.ndarray:
	labels, component_count = ndimage.label(mask)
	if component_count <= 1:
		return mask

	areas = ndimage.sum(mask, labels, index=range(1, component_count + 1))
	if len(areas) == 0:
		return mask

	largest_area = float(max(areas))
	minimum_area = max(64.0, largest_area * 0.02)
	keep = np.zeros_like(mask, dtype=bool)
	for index, area in enumerate(areas, start=1):
		if float(area) >= minimum_area:
			keep |= labels == index
	return keep


def keep_primary_component(mask: np.ndarray) -> np.ndarray:
	labels, component_count = ndimage.label(mask)
	if component_count <= 1:
		return mask

	areas = ndimage.sum(mask, labels, index=range(1, component_count + 1))
	if len(areas) == 0:
		return mask

	primary_index = int(np.argmax(areas)) + 1
	return labels == primary_index


def resize_for_refinement(image: Image.Image, mask: Image.Image, max_refine_side: int):
	if max(image.size) <= max_refine_side:
		return image, mask

	scale = max_refine_side / float(max(image.size))
	new_size = (
		max(1, int(round(image.width * scale))),
		max(1, int(round(image.height * scale))),
	)
	return (
		image.resize(new_size, Image.Resampling.LANCZOS),
		mask.resize(new_size, Image.Resampling.LANCZOS),
	)


def build_trimap(mask: Image.Image, foreground_threshold: int, background_threshold: int, erosion_iterations: int) -> np.ndarray:
	mask_array = np.asarray(mask, dtype=np.float64) / 255.0
	foreground = mask_array >= (foreground_threshold / 255.0)
	background = mask_array <= (background_threshold / 255.0)

	foreground = keep_primary_component(keep_significant_components(ndimage.binary_fill_holes(foreground)))
	background = ndimage.binary_fill_holes(background)

	if erosion_iterations > 0:
		structure = ndimage.generate_binary_structure(2, 1)
		foreground = ndimage.binary_erosion(foreground, structure=structure, iterations=erosion_iterations)
		background = ndimage.binary_erosion(background, structure=structure, iterations=erosion_iterations)

	trimap = np.full(mask_array.shape, 0.5, dtype=np.float64)
	trimap[background] = 0.0
	trimap[foreground] = 1.0
	return trimap


def build_fallback_rgba(image: Image.Image, mask: Image.Image) -> Image.Image:
	mask_array = np.asarray(mask, dtype=np.uint8)
	foreground = keep_primary_component(keep_significant_components(ndimage.binary_fill_holes(mask_array >= 200)))
	if not foreground.any():
		foreground = keep_primary_component(keep_significant_components(mask_array >= 128))
	cleaned_mask = np.where(foreground, mask_array, 0).astype(np.uint8)
	alpha_image = Image.fromarray(cleaned_mask, mode="L").filter(ImageFilter.GaussianBlur(radius=0.8))
	result = image.convert("RGBA")
	result.putalpha(alpha_image)
	return result


def refine_cutout(
	image: Image.Image,
	mask: Image.Image,
	max_refine_side: int,
	foreground_threshold: int,
	background_threshold: int,
	trimap_erosion: int,
) -> Image.Image:
	working_image, working_mask = resize_for_refinement(image, mask, max_refine_side)
	try:
		trimap = build_trimap(working_mask, foreground_threshold, background_threshold, trimap_erosion)
		image_array = np.asarray(working_image, dtype=np.float64) / 255.0
		with warnings.catch_warnings():
			warnings.simplefilter("ignore", category=RuntimeWarning)
			alpha = np.clip(estimate_alpha_cf(image_array, trimap), 0.0, 1.0)

		try:
			with warnings.catch_warnings():
				warnings.simplefilter("ignore", category=RuntimeWarning)
				foreground = np.clip(estimate_foreground_ml(image_array, alpha), 0.0, 1.0)
		except Exception:
			foreground = image_array

		alpha_image = Image.fromarray((alpha * 255.0).astype(np.uint8), mode="L")
		foreground_image = Image.fromarray((foreground * 255.0).astype(np.uint8), mode="RGB")

		if working_image.size != image.size:
			alpha_image = alpha_image.resize(image.size, Image.Resampling.LANCZOS)
			foreground_image = foreground_image.resize(image.size, Image.Resampling.LANCZOS)

		result = foreground_image.convert("RGBA")
		result.putalpha(alpha_image)
		return result
	except Exception:
		return build_fallback_rgba(image, mask)


def main() -> int:
	args = build_parser().parse_args()
	input_path = Path(args.input_path).expanduser().resolve()
	output_path = Path(args.output_path).expanduser().resolve()
	model_names = normalize_models(args.models)

	if not input_path.exists():
		raise FileNotFoundError(f"Input image not found: {input_path}")

	model_name, session = create_session(model_names)
	input_bytes = input_path.read_bytes()
	mask_bytes = remove(
		input_bytes,
		session=session,
		force_return_bytes=True,
		only_mask=True,
		post_process_mask=True,
	)

	base_image = Image.open(io.BytesIO(input_bytes)).convert("RGB")
	mask_image = Image.open(io.BytesIO(mask_bytes)).convert("L")
	image = refine_cutout(
		base_image,
		mask_image,
		max_refine_side=args.max_refine_side,
		foreground_threshold=args.foreground_threshold,
		background_threshold=args.background_threshold,
		trimap_erosion=args.trimap_erosion,
	)
	output_path.parent.mkdir(parents=True, exist_ok=True)
	image.save(output_path, format="PNG", optimize=True)

	print(
		json.dumps(
			{
				"inputPath": str(input_path),
				"outputPath": str(output_path),
				"model": model_name,
				"refinedWith": "pymatting",
			}
		)
	)
	return 0


if __name__ == "__main__":
	try:
		raise SystemExit(main())
	except Exception as exc:  # pragma: no cover - surfaced to Node caller
		print(str(exc), file=sys.stderr)
		raise SystemExit(1)
