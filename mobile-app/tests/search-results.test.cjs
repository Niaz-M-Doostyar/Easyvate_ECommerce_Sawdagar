const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const loader = import('data:text/javascript,' + encodeURIComponent(fs.readFileSync(path.join(__dirname, '../src/utils/searchResults.js'), 'utf8')));

test('search loads all matching pages beyond both ten and one hundred products', async () => {
  const { loadSearchResults } = await loader;
  const items = Array.from({ length: 237 }, (_, id) => ({ id }));
  const requested = [], snapshots = [];
  await loadSearchResults(async params => {
    requested.push(params);
    return { products: items.slice((params.page - 1) * params.limit, params.page * params.limit), total: 237, totalPages: 3 };
  }, 'watch', () => true, (products, total, hasMore) => snapshots.push({ products, total, hasMore }));
  assert.deepEqual(requested.map(p => p.page), [1, 2, 3]);
  assert(requested.every(p => p.q === 'watch' && p.limit === 100));
  assert.deepEqual(snapshots.map(s => s.products.length), [100, 200, 237]);
  assert.equal(snapshots[2].total, 237);
  assert.equal(snapshots[2].hasMore, false);
});

test('an old query cannot publish results after the customer changes the query', async () => {
  const { loadSearchResults } = await loader;
  let active = true, published = false;
  await loadSearchResults(async () => { active = false; return { products: [{ id: 1 }] }; }, 'old', () => active, () => { published = true; });
  assert.equal(published, false);
});

test('overlapping pages are deduplicated and request failures propagate for retry', async () => {
  const { loadSearchResults } = await loader;
  let final;
  await loadSearchResults(async ({ page }) => ({ products: page === 1 ? [{ id: 1 }] : [{ id: 1 }, { id: 2 }], totalPages: 2, total: 2 }), 'watch', () => true, products => { final = products; });
  assert.deepEqual(final.map(p => p.id), [1, 2]);
  await assert.rejects(loadSearchResults(async () => { throw Error('network'); }, 'watch', () => true, () => {}), /network/);
});
