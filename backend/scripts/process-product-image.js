const path = require('path');
const { processLocalProductImage } = require('../lib/productImageProcessor');

async function main() {
	const [, , inputArg, outputArg] = process.argv;

	if (!inputArg) {
		throw new Error('Usage: node ./scripts/process-product-image.js <input-image> [output-image]');
	}

	const inputPath = path.resolve(inputArg);
	const outputPath = outputArg
		? path.resolve(outputArg)
		: path.join(path.dirname(inputPath), `${path.parse(inputPath).name}-clean.webp`);

	const result = await processLocalProductImage(inputPath, outputPath);
	console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
	console.error(error.message || error);
	process.exit(1);
});
