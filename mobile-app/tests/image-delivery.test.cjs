const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const config = import('data:text/javascript,' + encodeURIComponent(fs.readFileSync(path.join(__dirname, '../src/config.js'), 'utf8')));
test('display images request lossless variants while retaining original fallbacks', async () => {
 const { buildImageUriCandidates } = await config;
 const urls = buildImageUriCandidates('/uploads/new-product.png', { width: 800 });
 const url = new URL(urls[0]);
 assert.equal(url.pathname, '/api/image');
 assert.equal(url.searchParams.get('src'), '/uploads/new-product.png');
 assert.equal(url.searchParams.get('lossless'), '1');
 assert.equal(urls[1], 'https://sawdagar.com/uploads/new-product.png');
});
test('full-size viewing requests the original without resizing or recompression', async () => {
 const { buildImageUriCandidates } = await config;
 assert.deepEqual(buildImageUriCandidates('/uploads/original.png'), ['https://sawdagar.com/uploads/original.png']);
});
