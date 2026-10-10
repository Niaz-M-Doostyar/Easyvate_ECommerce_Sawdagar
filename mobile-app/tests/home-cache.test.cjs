const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const modulePromise = import('data:text/javascript,' + encodeURIComponent(fs.readFileSync(path.join(__dirname, '../src/services/homeCache.js'), 'utf8')));
function storage() {
  const values = new Map();
  return { values, getItem: async key => values.get(key) || null, setItem: async (key, value) => values.set(key, value) };
}
test('independent cached sections survive a partial refresh and expire after one day', async () => {
  const { readHomeCache, writeHomeCache } = await modulePromise;
  const store = storage();
  await writeHomeCache(store, 'site', { home: { hero: { slides: [{ image: '/uploads/slider.png' }] } } }, 100);
  await writeHomeCache(store, 'products', [{ id: 'old' }], 100);
  await writeHomeCache(store, 'products', [{ id: 'new' }], 200);
  const cached = await readHomeCache(store, 300);
  assert.equal(cached.products[0].id, 'new');
  assert.equal(cached.site.home.hero.slides[0].image, '/uploads/slider.png');
  assert.deepEqual(await readHomeCache(store, 86400300), {});
});
test('corrupt or inaccessible storage never blocks live requests', async () => {
  const { readHomeCache, writeHomeCache } = await modulePromise;
  const store = storage();
  store.values.set('sawdagar.public-home.v1.products', '{broken');
  store.values.set('sawdagar.public-home.v1.categories', JSON.stringify({ savedAt: 200, data: {} }));
  assert.deepEqual(await readHomeCache(store, 300), {});
  const unavailable = { getItem: async () => { throw Error('unavailable'); }, setItem: async () => { throw Error('full'); } };
  assert.deepEqual(await readHomeCache(unavailable), {});
  await writeHomeCache(unavailable, 'products', []);
});
