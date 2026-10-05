const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../src/utils/productPagination.js'), 'utf8');
const helpers = import('data:text/javascript,' + encodeURIComponent(source));
const products = (count, start = 1) => Array.from({ length: count }, (_, index) => ({ id: start + index }));

test('metadata ends a final full page without an extra request', async () => {
  const { readProductPage } = await helpers;
  assert.equal(readProductPage({ products: products(50), pagination: { page: 1, limit: 50, total: 100, totalPages: 2 } }, 1, 50).hasMore, true);
  const final = readProductPage({ products: products(50, 51), pagination: { page: 2, limit: 50, total: 100, totalPages: 2 } }, 2, 50);
  assert.equal(final.page, 2);
  assert.equal(final.products.length, 50);
  assert.equal(final.hasMore, false);
});

test('automatic traversal reaches all 960 products with no collection cap', async () => {
  const { readProductPage, appendProducts } = await helpers;
  const catalog = products(960);
  const limit = 50;
  const totalPages = Math.ceil(catalog.length / limit);
  let collected = [];
  let nextPage = 1;
  let requests = 0;
  while (true) {
    assert(requests < totalPages, 'pagination must terminate');
    const result = readProductPage({
      products: catalog.slice((nextPage - 1) * limit, nextPage * limit),
      pagination: { page: nextPage, limit, total: catalog.length, totalPages },
    }, nextPage, limit);
    requests += 1;
    collected = appendProducts(collected, result.products);
    if (!result.hasMore) break;
    nextPage = result.page + 1;
  }
  assert.equal(requests, 20);
  assert.deepEqual(collected.map(product => product.id), catalog.map(product => product.id));
});

test('numeric-string metadata and top-level totals are supported', async () => {
  const { readProductPage } = await helpers;
  assert.equal(readProductPage({ products: products(50), pagination: { page: '2', limit: '50', totalPages: '3', total: '150' } }, 2, 50).hasMore, true);
  assert.equal(readProductPage({ products: products(50), pagination: { page: '3', limit: '50', total: '150' } }, 3, 50).hasMore, false);
  assert.equal(readProductPage({ products: products(50), totalPages: '2' }, 2, 50).hasMore, false);
  assert.equal(readProductPage({ products: products(25), total: '75', pagination: { limit: '25' } }, 2, 50).hasMore, true);
  assert.equal(readProductPage({ products: products(25), total: '75', pagination: { limit: '25' } }, 3, 50).hasMore, false);
});

test('array-only and products-only responses use the short-page boundary', async () => {
  const { readProductPage } = await helpers;
  assert.equal(readProductPage(products(50), 1, 50).hasMore, true);
  assert.equal(readProductPage(products(49), 2, 50).hasMore, false);
  assert.equal(readProductPage({ products: products(50) }, 2, 50).hasMore, true);
  assert.equal(readProductPage({ products: products(1) }, 3, 50).hasMore, false);
  assert.equal(readProductPage(products(100), 1, 1000).hasMore, true, 'fallback follows the API limit cap');
});

test('empty or unusable pages always stop even when metadata promises more', async () => {
  const { readProductPage } = await helpers;
  for (const response of [null, undefined, {}, [], { products: [] }, { products: 'invalid' }, {
    products: [null, {}, { id: '' }, { id: NaN }, { id: Infinity }, { id: true }, { id: {} }],
    pagination: { page: 2, totalPages: 999 },
  }]) {
    assert.deepEqual(readProductPage(response, 2, 50), { products: [], page: 2, hasMore: false });
  }
});

test('bad metadata cannot regress the requested page or produce unsafe continuation', async () => {
  const { readProductPage } = await helpers;
  for (const invalid of [0, -1, 1.5, NaN, Infinity, '', 'NaN', 'Infinity', null, true, {}, Number.MAX_SAFE_INTEGER + 1]) {
    const result = readProductPage({ products: products(50), pagination: { page: invalid, limit: invalid, total: invalid, totalPages: invalid } }, 3, 50);
    assert.equal(result.page, 3);
    assert.equal(result.hasMore, invalid === 0 ? false : true, 'zero total is a valid exhausted catalog');
  }
  assert.equal(readProductPage({ products: products(50), pagination: { page: '1' } }, 3, 50).page, 3);
  assert.equal(readProductPage(products(50), Number.MAX_SAFE_INTEGER, 50).hasMore, false);
  const inconsistent = readProductPage({ products: [], pagination: { page: '2', totalPages: '20' } }, 2, 50);
  assert.equal(inconsistent.hasMore, false);
});

test('duplicates refresh data in place and numeric/string IDs share identity', async () => {
  const { appendProducts, readProductPage } = await helpers;
  const first = { id: 1, retailPrice: 100 };
  const second = { id: 2, retailPrice: 200 };
  const fresh = { id: '1', retailPrice: 90 };
  const third = { id: 3, retailPrice: 300 };
  const current = [first, second];
  const incoming = [fresh, third, { id: '3', retailPrice: 250 }];
  const result = appendProducts(current, incoming);
  assert.deepEqual(result.map(product => String(product.id)), ['1', '2', '3']);
  assert.equal(result[0], fresh);
  assert.equal(result[1], second);
  assert.equal(result[2].retailPrice, 250);
  assert.deepEqual(current, [first, second], 'input collections are not mutated');
  assert.equal(incoming.length, 3);
  assert.deepEqual(appendProducts(null, [null, {}, fresh]), [fresh]);
  assert.deepEqual(appendProducts([first, fresh, second], undefined), [fresh, second]);
  assert.equal(readProductPage(Array(50).fill(first), 1, 50).hasMore, false, 'duplicate-only malformed pages cannot fake a full page');
});
