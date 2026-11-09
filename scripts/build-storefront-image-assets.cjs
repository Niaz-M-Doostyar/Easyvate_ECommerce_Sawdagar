#!/usr/bin/env node
// Rebuild display copies of repository artwork. Source images remain untouched.
const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const sharp = require('../backend/node_modules/sharp');

const root = path.resolve(__dirname, '..');
const publicDir = path.join(root, 'website/public');
const manifest = {};
const recipe = 'storefront-static-lossless-v1';

async function main() {
  const categories = (await fs.readdir(path.join(publicDir, 'category-icons')))
    .filter((name) => /\.(png|jpe?g|webp)$/i.test(name)).sort()
    .map((name) => ({ src: `/category-icons/${name}`, widths: [80, 160, 280] }));
  const home = ['offer-essentials-20261006.jpg', 'offer-discover-20261006.jpg',
    'offer-latest-20261006.jpg', 'campaign-marketplace-20261006.jpg']
    .map((name) => ({ src: `/assets/img/home/${name}`, widths: [320, 560, 800, 1200] }));
  let sourceBytes = 0, outputBytes = 0, count = 0;
  for (const { src, widths } of [...categories, ...home]) {
    const original = await fs.readFile(path.join(publicDir, src));
    const metadata = await sharp(original).metadata();
    const originalWidth = metadata.autoOrient?.width || metadata.width;
    sourceBytes += original.length;
    const hash = crypto.createHash('sha256').update(original).update(recipe).digest('hex').slice(0, 12);
    const stem = path.parse(src).name;
    const folder = path.join(publicDir, 'image-cache', hash);
    await fs.mkdir(folder, { recursive: true });
    const seen = new Set();
    const variants = [];
    for (const width of widths) {
      const { data, info } = await sharp(original).rotate().resize({ width, withoutEnlargement: true })
        .webp({ lossless: true, effort: 4 }).toBuffer({ resolveWithObject: true });
      // Some already-compressed JPEG artwork is smaller than a lossless copy.
      // Keep its existing bytes and full detail as the larger responsive choice.
      if (data.length >= original.length) {
        await fs.unlink(path.join(folder, `${stem}-w${info.width}.webp`)).catch((error) => {
          if (error.code !== 'ENOENT') throw error;
        });
        if (!seen.has(originalWidth)) {
          seen.add(originalWidth);
          variants.push({ width: originalWidth, src });
        }
        continue;
      }
      if (seen.has(info.width)) continue;
      seen.add(info.width);
      const name = `${stem}-w${info.width}.webp`;
      await fs.writeFile(path.join(folder, name), data);
      variants.push({ width: info.width, src: `/image-cache/${hash}/${name}` });
      outputBytes += data.length; count++;
    }
    manifest[src] = variants.sort((a, b) => a.width - b.width);
    // Prove the generator never changed its input.
    if (!(await fs.readFile(path.join(publicDir, src))).equals(original)) throw new Error(`Source changed: ${src}`);
  }
  const manifestPath = path.join(root, 'website/src/data/staticImageVariants.json');
  await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(JSON.stringify({ sources: Object.keys(manifest).length, variants: count,
    sourceBytes, allVariantBytes: outputBytes, originalFilesUnchanged: true }, null, 2));
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
