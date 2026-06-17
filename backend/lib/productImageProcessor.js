const fs = require('fs');
const os = require('os');
const path = require('path');
const util = require('util');
const { execFile } = require('child_process');
const sharp = require('sharp');

const execFileAsync = util.promisify(execFile);

const uploadsRoot = path.join(__dirname, '..', 'uploads');
const processingScriptPath = path.join(__dirname, 'process_product_image.py');
const stylingScriptPath = path.join(__dirname, 'style_product_image.py');
const minLongestSide = Math.max(500, parseInt(process.env.PRODUCT_IMAGE_AI_MIN_LONGEST_SIDE || '500', 10));
const minPixelArea = Math.max(180000, parseInt(process.env.PRODUCT_IMAGE_AI_MIN_AREA || '180000', 10));
const maxCanvasSize = Math.max(1200, parseInt(process.env.PRODUCT_IMAGE_AI_CANVAS_SIZE || '1600', 10));

function isProductImageAiEnabled() {
	return process.env.PRODUCT_IMAGE_AI_ENABLED !== 'false';
}

function isProductImageStylingEnabled() {
	return process.env.PRODUCT_IMAGE_AI_STYLE_STAGE !== 'false';
}

function resolvePythonExecutable() {
	const configured = process.env.PRODUCT_IMAGE_AI_PYTHON;
	if (configured) {
		return configured;
	}

	const localRuntime = path.join(__dirname, '..', '.venv-product-image', 'bin', 'python');
	if (fs.existsSync(localRuntime)) {
		return localRuntime;
	}

	const workspaceRuntime = path.join(__dirname, '..', '..', '.venv', 'bin', 'python');
	if (fs.existsSync(workspaceRuntime)) {
		return workspaceRuntime;
	}

	return 'python3';
}

function buildModelOrder(options = {}) {
	const configuredModels = Array.isArray(options.models) && options.models.length > 0
		? options.models
		: String(process.env.PRODUCT_IMAGE_AI_MODELS || 'birefnet-general,isnet-general-use,birefnet-general-lite,u2netp').split(',');

	return [...new Set(configuredModels.map((model) => String(model).trim()).filter(Boolean))];
}

function buildStylePrompt(options = {}) {
	const configuredPrompt = options.stylePrompt || process.env.PRODUCT_IMAGE_AI_STYLE_PROMPT;
	return String(
		configuredPrompt
			|| 'single ecommerce product photo, keep the same product, clean commercial studio lighting, realistic materials, soft grounded shadow, white seamless backdrop'
	).trim();
}

function buildOriginalUploadResult(file, processingError) {
	return {
		url: `/uploads/${file.filename}`,
		filename: file.filename,
		processed: false,
		pipeline: 'original',
		originalFilename: file.originalname || file.filename || path.basename(file.path),
		processingError,
	};
}

function getSkipReason(metadata) {
	if (!metadata?.width || !metadata?.height) {
		return 'Image dimensions could not be read, so the original upload was kept.';
	}

	if (metadata.pages && metadata.pages > 1) {
		return 'Animated images are kept on the original upload path.';
	}

	if (metadata.format === 'gif') {
		return 'GIF uploads are kept on the original upload path.';
	}

	const longestSide = Math.max(metadata.width, metadata.height);
	const area = metadata.width * metadata.height;
	if (longestSide < minLongestSide || area < minPixelArea) {
		return `Low-resolution inputs are kept original to avoid degraded cleanup results (minimum ${minLongestSide}px longest side and ${minPixelArea} pixels).`;
	}

	return null;
}

async function runBackgroundRemoval(sourcePath, outputPath, options = {}) {
	const args = [
		processingScriptPath,
		path.resolve(sourcePath),
		path.resolve(outputPath),
		'--models',
		buildModelOrder(options).join(','),
	];

	try {
		const { stdout } = await execFileAsync(resolvePythonExecutable(), args, {
			env: {
				...process.env,
				HF_HUB_DISABLE_XET: process.env.HF_HUB_DISABLE_XET || '1',
				HF_HUB_DISABLE_PROGRESS_BARS: process.env.HF_HUB_DISABLE_PROGRESS_BARS || '1',
				TRANSFORMERS_NO_ADVISORY_WARNINGS: process.env.TRANSFORMERS_NO_ADVISORY_WARNINGS || '1',
			},
			maxBuffer: 50 * 1024 * 1024,
		});
		const lines = stdout.trim().split(/\r?\n/).filter(Boolean);
		return JSON.parse(lines[lines.length - 1] || '{}');
	} catch (error) {
		const message = error.stderr?.trim() || error.stdout?.trim() || error.message;
		throw new Error(message);
	}
}

async function runProductStyling(sourcePath, outputPath, options = {}) {
	const styleSize = Math.max(384, parseInt(process.env.PRODUCT_IMAGE_AI_STYLE_SIZE || '384', 10));
	const styleSteps = Math.max(10, parseInt(process.env.PRODUCT_IMAGE_AI_STYLE_STEPS || '14', 10));
	const styleGuidance = Math.max(1, parseFloat(process.env.PRODUCT_IMAGE_AI_STYLE_GUIDANCE || '5.5'));
	const styleStrength = Math.min(0.95, Math.max(0.1, parseFloat(process.env.PRODUCT_IMAGE_AI_STYLE_STRENGTH || '0.62')));
	const args = [
		stylingScriptPath,
		path.resolve(sourcePath),
		path.resolve(outputPath),
		'--prompt',
		buildStylePrompt(options),
		'--size',
		String(styleSize),
		'--steps',
		String(styleSteps),
		'--guidance-scale',
		String(styleGuidance),
		'--strength',
		String(styleStrength),
	];

	const configuredSeed = options.styleSeed ?? process.env.PRODUCT_IMAGE_AI_STYLE_SEED;
	if (configuredSeed !== undefined && configuredSeed !== null && configuredSeed !== '') {
		args.push('--seed', String(configuredSeed));
	}

	try {
		const { stdout } = await execFileAsync(resolvePythonExecutable(), args, {
			env: process.env,
			maxBuffer: 10 * 1024 * 1024,
		});
		const lines = stdout.trim().split(/\r?\n/).filter(Boolean);
		return JSON.parse(lines[lines.length - 1] || '{}');
	} catch (error) {
		const message = error.stderr?.trim() || error.stdout?.trim() || error.message;
		throw new Error(message);
	}
}

async function createPrecomposedCatalogImage(sourcePath, outputPath) {
	const metadata = await sharp(sourcePath).metadata();
	const sourceSide = Math.max(metadata.width || 512, metadata.height || 512);
	const canvasSide = Math.max(1200, Math.min(maxCanvasSize, Math.ceil(sourceSide / 0.9)));
	const innerSide = Math.max(900, Math.round(canvasSide * 0.9));

	const prepared = await sharp(sourcePath)
		.flatten({ background: { r: 255, g: 255, b: 255 } })
		.resize({
			width: innerSide,
			height: innerSide,
			fit: 'inside',
			withoutEnlargement: false,
		})
		.normalize()
		.modulate({ brightness: 1.01, saturation: 1.01 })
		.sharpen({ sigma: 0.85 })
		.png()
		.toBuffer({ resolveWithObject: true });

	const left = Math.round((canvasSide - prepared.info.width) / 2);
	const top = Math.round((canvasSide - prepared.info.height) / 2);

	await sharp({
		create: {
			width: canvasSide,
			height: canvasSide,
			channels: 4,
			background: { r: 255, g: 255, b: 255, alpha: 1 },
		},
	})
		.composite([{ input: prepared.data, left, top }])
		.webp({ quality: 94 })
		.toFile(outputPath);
}

async function createCatalogImage(cutoutPath, outputPath, options = {}) {
	if (options.precomposed) {
		return createPrecomposedCatalogImage(cutoutPath, outputPath);
	}

	const trimmed = await sharp(cutoutPath)
		.trim()
		.png()
		.toBuffer({ resolveWithObject: true });

	const productSide = Math.max(trimmed.info.width, trimmed.info.height);
	const canvasSide = Math.max(1200, Math.min(maxCanvasSize, Math.ceil(productSide / 0.78)));
	const innerSide = Math.max(900, Math.round(canvasSide * 0.78));

	const product = await sharp(trimmed.data)
		.resize({
			width: innerSide,
			height: innerSide,
			fit: 'inside',
			withoutEnlargement: false,
		})
		.normalize()
		.modulate({ brightness: 1.01, saturation: 1.02 })
		.sharpen({ sigma: 1.15 })
		.png()
		.toBuffer({ resolveWithObject: true });

	const productLeft = Math.round((canvasSide - product.info.width) / 2);
	const productTop = Math.round((canvasSide - product.info.height) / 2);
	const shadowAlpha = await sharp(product.data)
		.extractChannel('alpha')
		.blur(Math.max(10, Math.round(canvasSide * 0.012)))
		.linear(0.32, 0)
		.toBuffer();

	const shadow = await sharp({
		create: {
			width: product.info.width,
			height: product.info.height,
			channels: 3,
			background: { r: 0, g: 0, b: 0 },
		},
	})
		.joinChannel(shadowAlpha)
		.png()
		.toBuffer();

	const shadowLeft = productLeft;
	const shadowTop = Math.min(canvasSide - product.info.height, productTop + Math.max(12, Math.round(product.info.height * 0.03)));

	await sharp({
		create: {
			width: canvasSide,
			height: canvasSide,
			channels: 4,
			background: { r: 255, g: 255, b: 255, alpha: 1 },
		},
	})
		.composite([
			{ input: shadow, left: shadowLeft, top: shadowTop },
			{ input: product.data, left: productLeft, top: productTop },
		])
		.webp({ quality: 94 })
		.toFile(outputPath);
}

async function processLocalProductImage(sourcePath, outputPath, options = {}) {
	if (!isProductImageAiEnabled()) {
		throw new Error('Product image cleanup is disabled.');
	}

	const metadata = await sharp(sourcePath).metadata();
	const skipReason = getSkipReason(metadata);
	if (skipReason) {
		return {
			skipped: true,
			reason: skipReason,
			metadata,
		};
	}

	const temporaryCutoutPath = path.join(os.tmpdir(), `${path.parse(outputPath).name}-${Date.now()}-cutout.png`);
	const temporaryStyledPath = path.join(os.tmpdir(), `${path.parse(outputPath).name}-${Date.now()}-styled.png`);

	try {
		const backgroundRemoval = await runBackgroundRemoval(sourcePath, temporaryCutoutPath, options);
		let selectedSourcePath = temporaryCutoutPath;
		let styleResult = null;

		if (isProductImageStylingEnabled()) {
			try {
				styleResult = await runProductStyling(temporaryCutoutPath, temporaryStyledPath, options);
				if (styleResult?.outputPath) {
					selectedSourcePath = temporaryStyledPath;
				}
			} catch (error) {
				styleResult = {
					skipped: true,
					reason: error.message,
				};
			}
		}

		await fs.promises.mkdir(path.dirname(outputPath), { recursive: true });
		await createCatalogImage(selectedSourcePath, outputPath, { precomposed: selectedSourcePath === temporaryStyledPath });

		return {
			outputPath,
			model: backgroundRemoval.model || buildModelOrder(options)[0],
			styleModel: styleResult?.model || null,
			styleReason: styleResult?.reason || null,
			metadata,
			provider: styleResult?.provider ? `rembg+${styleResult.provider}` : 'rembg',
		};
	} finally {
		await fs.promises.unlink(temporaryCutoutPath).catch(() => {});
		await fs.promises.unlink(temporaryStyledPath).catch(() => {});
	}
}

async function processSupplierUpload(file, options = {}) {
	if (!file?.path) {
		throw new Error('File path is required for product image processing.');
	}

	const outputFilename = `${path.parse(file.filename).name}-clean.webp`;
	const outputPath = path.join(uploadsRoot, outputFilename);

	try {
		const result = await processLocalProductImage(file.path, outputPath, options);
		if (result.skipped) {
			return buildOriginalUploadResult(file, result.reason);
		}

		await fs.promises.unlink(file.path).catch(() => {});

		return {
			url: `/uploads/${outputFilename}`,
			filename: outputFilename,
			processed: true,
			pipeline: result.styleModel
				? `rembg:${result.model}+pymatting+${result.styleModel}+sharp`
				: `rembg:${result.model}+pymatting+sharp`,
			originalFilename: file.originalname || file.filename || path.basename(file.path),
			model: result.model,
			styleModel: result.styleModel,
			provider: result.provider,
		};
	} catch (error) {
		return buildOriginalUploadResult(file, error.message);
	}
}

module.exports = {
	buildOriginalUploadResult,
	isProductImageAiEnabled,
	isProductImageStylingEnabled,
	processCatalogUpload: processSupplierUpload,
	processLocalProductImage,
	processSupplierUpload,
	resolvePythonExecutable,
};
