const test = require('node:test');
const assert = require('node:assert/strict');
const { PROVINCES, normalizeProvince, deliveryFee } = require('../lib/delivery');

test('only Kandahar is free and province input is normalized', () => {
  assert.equal(PROVINCES.length, 34);
  assert.equal(normalizeProvince(' kandahar '), 'Kandahar');
  assert.equal(deliveryFee(normalizeProvince('KANDAHAR')), 0);
  assert.equal(deliveryFee(normalizeProvince('Kabul')), 150);
  assert.equal(normalizeProvince('Unknown'), null);
});
