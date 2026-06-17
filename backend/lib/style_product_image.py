import argparse
import json
import math
import os
import random
from pathlib import Path

os.environ.setdefault("HF_HUB_DISABLE_XET", "1")
os.environ.setdefault("HF_HUB_DISABLE_PROGRESS_BARS", "1")
os.environ.setdefault("TRANSFORMERS_NO_ADVISORY_WARNINGS", "1")

import numpy as np
import safetensors.torch as sf
import torch
from diffusers import DPMSolverMultistepScheduler, StableDiffusionImg2ImgPipeline
from huggingface_hub import hf_hub_download, snapshot_download
from PIL import Image


DEFAULT_BASE_MODEL = os.getenv("PRODUCT_IMAGE_AI_STYLE_BASE_MODEL", "stablediffusionapi/realistic-vision-v51")
DEFAULT_ICLIGHT_REPO = os.getenv("PRODUCT_IMAGE_AI_STYLE_ICLIGHT_REPO", "lllyasviel/ic-light")
DEFAULT_ICLIGHT_FILE = os.getenv("PRODUCT_IMAGE_AI_STYLE_ICLIGHT_FILE", "iclight_sd15_fbc.safetensors")
DEFAULT_NEGATIVE_PROMPT = os.getenv(
	"PRODUCT_IMAGE_AI_STYLE_NEGATIVE_PROMPT",
	"lowres, blurry, distorted, duplicate object, extra object, text, watermark, logo, cluttered background, cropped, deformed",
)


def build_parser() -> argparse.ArgumentParser:
	parser = argparse.ArgumentParser(description="Stylize product cutouts with IC-Light.")
	parser.add_argument("input_path", help="RGBA cutout PNG path")
	parser.add_argument("output_path", help="Styled RGB output path")
	parser.add_argument("--prompt", required=True, help="Positive prompt for the product image")
	parser.add_argument("--negative-prompt", default=DEFAULT_NEGATIVE_PROMPT, help="Negative prompt")
	parser.add_argument("--size", type=int, default=512, help="Square working size in pixels")
	parser.add_argument("--steps", type=int, default=18, help="Inference steps")
	parser.add_argument("--guidance-scale", type=float, default=6.0, help="Classifier-free guidance scale")
	parser.add_argument("--strength", type=float, default=0.7, help="Img2Img denoise strength")
	parser.add_argument("--seed", type=int, default=None, help="Optional deterministic seed")
	return parser


def resolve_device():
	if torch.cuda.is_available():
		return torch.device("cuda"), torch.float16
	if getattr(torch.backends, "mps", None) and torch.backends.mps.is_available():
		return torch.device("mps"), torch.float16
	return torch.device("cpu"), torch.float32


def patch_unet(unet):
	original_conv = unet.conv_in
	extra_channels = 8
	new_conv = torch.nn.Conv2d(
		original_conv.in_channels + extra_channels,
		original_conv.out_channels,
		original_conv.kernel_size,
		original_conv.stride,
		original_conv.padding,
	)
	with torch.no_grad():
		new_conv.weight.zero_()
		new_conv.weight[:, : original_conv.in_channels].copy_(original_conv.weight)
		if original_conv.bias is not None and new_conv.bias is not None:
			new_conv.bias.copy_(original_conv.bias)
	unet.conv_in = new_conv

	base_forward = unet.forward

	def wrapped_forward(sample, timestep, encoder_hidden_states, cross_attention_kwargs=None, **kwargs):
		kwargs_map = dict(cross_attention_kwargs or {})
		concat_conds = kwargs_map.pop("concat_conds", None)
		if concat_conds is not None:
			if concat_conds.shape[0] != sample.shape[0]:
				concat_conds = concat_conds.expand(sample.shape[0], -1, -1, -1)
			concat_conds = concat_conds.to(device=sample.device, dtype=sample.dtype)
			sample = torch.cat([sample, concat_conds], dim=1)
		return base_forward(sample=sample, timestep=timestep, encoder_hidden_states=encoder_hidden_states, cross_attention_kwargs=kwargs_map, **kwargs)

	unet.forward = wrapped_forward


def merge_offset_weights(unet, weights_path: Path):
	offset_state = sf.load_file(str(weights_path))
	merged_state = {}
	for key, value in unet.state_dict().items():
		merged_state[key] = value + offset_state[key].to(dtype=value.dtype)
	unet.load_state_dict(merged_state, strict=True)


def fit_with_margin(image: Image.Image, size: int, margin_ratio: float = 0.14):
	max_width = max(1, int(round(size * (1.0 - margin_ratio * 2))))
	max_height = max(1, int(round(size * 0.76)))
	scaled = image.copy()
	scaled.thumbnail((max_width, max_height), Image.Resampling.LANCZOS)
	left = (size - scaled.width) // 2
	top = max(int(size * 0.12), size - scaled.height - int(size * 0.12))
	return scaled, left, top


def prepare_foreground_canvas(image: Image.Image, size: int) -> Image.Image:
	image_rgba = image.convert("RGBA")
	alpha = np.asarray(image_rgba.getchannel("A"), dtype=np.float32) / 255.0
	if not np.any(alpha > 0.02):
		raise RuntimeError("Foreground alpha channel is empty, so IC-Light styling cannot run.")

	coords = np.argwhere(alpha > 0.02)
	min_y, min_x = coords.min(axis=0)
	max_y, max_x = coords.max(axis=0)
	cropped = image_rgba.crop((int(min_x), int(min_y), int(max_x) + 1, int(max_y) + 1))
	scaled, left, top = fit_with_margin(cropped, size)

	canvas = Image.new("RGBA", (size, size), (127, 127, 127, 255))
	canvas.paste(scaled, (left, top), scaled)
	return canvas.convert("RGB")


def build_studio_background(size: int) -> Image.Image:
	y_coords = np.linspace(0.0, 1.0, size, dtype=np.float32)[:, None]
	x_coords = np.linspace(-1.0, 1.0, size, dtype=np.float32)[None, :]
	base = 252.0 - y_coords * 10.0
	floor_glow = np.exp(-(((x_coords / 0.78) ** 2) + (((y_coords - 0.82) / 0.16) ** 2)) * 4.0) * 14.0
	center_light = np.exp(-(((x_coords / 0.55) ** 2) + (((y_coords - 0.28) / 0.42) ** 2)) * 2.2) * 4.0
	background = np.clip(base - floor_glow + center_light, 236.0, 255.0)
	background_rgb = np.repeat(background[:, :, None], 3, axis=2).astype(np.uint8)
	return Image.fromarray(background_rgb, mode="RGB")


def prepare_concat_conditions(pipe, foreground: Image.Image, background: Image.Image, model_dtype: torch.dtype):
	fg_array = np.asarray(foreground, dtype=np.float32) / 255.0
	bg_array = np.asarray(background, dtype=np.float32) / 255.0
	stack = np.stack([fg_array, bg_array], axis=0)
	tensor = torch.from_numpy(stack).permute(0, 3, 1, 2)
	tensor = tensor.to(device=pipe.device, dtype=model_dtype)
	latents = pipe.vae.encode(tensor).latent_dist.mode() * pipe.vae.config.scaling_factor
	concat_conds = torch.cat([latents[0:1], latents[1:2]], dim=1)
	return concat_conds


def resolve_base_model_snapshot() -> str:
	return snapshot_download(
		repo_id=DEFAULT_BASE_MODEL,
		max_workers=1,
	)


def load_pipeline(device: torch.device, model_dtype: torch.dtype):
	base_model_path = resolve_base_model_snapshot()
	pipe = StableDiffusionImg2ImgPipeline.from_pretrained(
		base_model_path,
		torch_dtype=model_dtype,
		local_files_only=True,
		safety_checker=None,
		requires_safety_checker=False,
	)
	pipe.scheduler = DPMSolverMultistepScheduler.from_config(pipe.scheduler.config)
	patch_unet(pipe.unet)
	weights_path = Path(hf_hub_download(repo_id=DEFAULT_ICLIGHT_REPO, filename=DEFAULT_ICLIGHT_FILE))
	merge_offset_weights(pipe.unet, weights_path)
	pipe = pipe.to(device)
	pipe.enable_attention_slicing()
	pipe.enable_vae_slicing()
	pipe.set_progress_bar_config(disable=True)
	return pipe


def save_output(image: Image.Image, output_path: Path):
	output_path.parent.mkdir(parents=True, exist_ok=True)
	image.save(output_path, format="PNG", optimize=True)


def main() -> int:
	args = build_parser().parse_args()
	input_path = Path(args.input_path).expanduser().resolve()
	output_path = Path(args.output_path).expanduser().resolve()
	if not input_path.exists():
		raise FileNotFoundError(f"Input image not found: {input_path}")

	device, model_dtype = resolve_device()
	pipe = load_pipeline(device, model_dtype)

	size = max(384, int(math.ceil(args.size / 64.0) * 64))
	strength = min(0.95, max(0.1, args.strength))
	steps = max(10, args.steps)
	seed = args.seed if args.seed is not None else random.randint(1, 2**31 - 1)
	generator = torch.Generator(device="cpu").manual_seed(seed)

	foreground_rgba = Image.open(input_path).convert("RGBA")
	foreground_canvas = prepare_foreground_canvas(foreground_rgba, size)
	background_canvas = build_studio_background(size)
	concat_conds = prepare_concat_conditions(pipe, foreground_canvas, background_canvas, model_dtype)

	with torch.inference_mode():
		result = pipe(
			prompt=args.prompt,
			negative_prompt=args.negative_prompt,
			image=background_canvas,
			strength=strength,
			num_inference_steps=steps,
			guidance_scale=args.guidance_scale,
			generator=generator,
			cross_attention_kwargs={"concat_conds": concat_conds},
		).images[0]

	save_output(result, output_path)
	print(
		json.dumps(
			{
				"outputPath": str(output_path),
				"model": "iclight-fbc",
				"provider": "iclight",
				"device": device.type,
				"seed": seed,
			}
		)
	)
	return 0


if __name__ == "__main__":
	raise SystemExit(main())