const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../src/utils/responsiveLayout.js'), 'utf8');
const layout = import('data:text/javascript,' + encodeURIComponent(source));

test('catalog tiles fit narrow phones, tablets, landscape and large text', async () => {
  const { responsiveLayout } = await layout;
  for (const width of [320, 375, 390, 440, 568, 700, 744, 834, 1024, 1194, 1366]) {
    for (const scale of [1, 1.3, 1.6, 2]) {
      const result = responsiveLayout(width, scale);
      assert(result.cardWidth >= 140, `${width}pt at ${scale}x text produces a cramped card`);
      assert(result.columns * (result.cardWidth + 12) + result.gutter * 2 <= Math.min(width, 1200) + 0.01);
    }
  }
});

test('large text reduces grid density and Split View uses its actual window width', async () => {
  const { responsiveLayout } = await layout;
  assert(responsiveLayout(834, 2).columns < responsiveLayout(834, 1).columns);
  assert.equal(responsiveLayout(390).isTablet, false);
  assert.equal(responsiveLayout(834).isTablet, true);
  assert(responsiveLayout(1194).columns > responsiveLayout(390).columns);
  assert.equal(responsiveLayout(1366).width, 1200);
});
