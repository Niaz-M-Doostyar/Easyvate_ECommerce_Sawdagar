const test = require('node:test');
const assert = require('node:assert/strict');
const { productToSlide, getProductSlides, setSliderPromotion, publicSliderWhere } = require('../lib/sliderPromotions');

const product = {
  id: 42, nameEn: 'Wrist watch', namePs: 'ساعت', nameDr: 'ساعت',
  descEn: '<p>New watch</p>', retailPrice: 1250,
  category: { nameEn: 'Accessories' }, images: [{ url: '/uploads/watch.jpg' }],
};

test('each slide links its product and uses its current first image and price', () => {
  const slide = productToSlide(product);
  assert.equal(slide.productId, 42);
  assert.equal(slide.primaryButtonHref, '/products/42');
  assert.equal(slide.image, '/uploads/watch.jpg');
  assert.equal(slide.priceValue, '؋1,250');
  assert.equal(slide.description, 'New watch');
  assert.equal(slide.titlePs, 'ساعت');
  assert.equal(productToSlide({ ...product, retailPrice: 1500 }).priceValue, '؋1,500');
});

test('public slides exclude unapproved, deleted, out-of-stock, unpriced and imageless products', async () => {
  let query;
  const db = { product: { findMany: async args => { query = args; return [product]; } } };
  const slides = await getProductSlides(db);
  assert.deepEqual(query.where, {
    isSliderPromoted: true, status: 'approved', isDeleted: false,
    stock: { gt: 0 }, retailPrice: { gt: 0 }, images: { some: { url: { not: '' } } },
  });
  assert.deepEqual(query.select.images.orderBy, { sortOrder: 'asc' });
  assert.equal(query.select.images.take, 1);
  assert.equal(query.select.wholesaleCost, undefined);
  assert.equal(slides.length, 1);
  assert.deepEqual(await getProductSlides({ product: { findMany: async () => [] } }), []);
});

test('promotion writes explicit state and validates eligibility atomically', async () => {
  const writes = [];
  const db = { product: { updateMany: async args => { writes.push(args); return { count: 1 }; } } };
  assert.deepEqual(await setSliderPromotion(db, 42, true), { id: 42, isSliderPromoted: true });
  await setSliderPromotion(db, 42, true);
  assert.deepEqual(writes[0], writes[1]);
  const { isSliderPromoted, ...eligibility } = publicSliderWhere;
  assert.deepEqual(writes[0].where, { ...eligibility, id: 42 });
  await setSliderPromotion(db, 42, false);
  assert.deepEqual(writes[2].where, { id: 42, isDeleted: false });
  assert.deepEqual(writes[2].data, { isSliderPromoted: false });
});

test('invalid input and unavailable products do not become promoted', async () => {
  const db = { product: { updateMany: async () => ({ count: 0 }) } };
  for (const [id, flag] of [[0, true], [-1, true], [1.5, true], [NaN, true], [42, 'true'], [42, undefined]]) {
    await assert.rejects(setSliderPromotion(db, id, flag), { status: 400 });
  }
  await assert.rejects(setSliderPromotion(db, 42, true), { status: 400 });
  await assert.rejects(setSliderPromotion(db, 999, false), { status: 404 });
});
