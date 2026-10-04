const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../src/utils/featuredLayout.js'), 'utf8');
const layout = import('data:text/javascript,' + encodeURIComponent(source));

test('featured products show three across normal phones with three placeholder rows', async () => {
  const { featuredLayout } = await layout;
  for (const width of [360, 375, 390, 393, 402, 430, 440]) {
    const result = featuredLayout(width);
    assert.equal(result.columns, 3, `${width}pt phone`);
    assert.equal(result.placeholderCount, 9);
    assert(result.cardWidth >= 104);
  }
  assert.equal(featuredLayout(320).columns, 2);
});

test('featured grid fits small windows, iPad sizes and accessibility text', async () => {
  const { featuredLayout } = await layout;
  for (const width of [280, 320, 360, 375, 390, 440, 568, 700, 744, 834, 1024, 1194, 1366]) {
    let previousColumns = Infinity;
    for (const scale of [1, 1.2, 1.3, 1.6, 2, 2.5, 3]) {
      const result = featuredLayout(width, scale);
      const occupiedWidth = result.columns * result.cardWidth + (result.columns - 1) * result.gap + result.gutter * 2;
      assert(Math.abs(occupiedWidth - result.width) < 0.001, `${width}pt at ${scale}x text exceeds its container`);
      assert.equal(result.placeholderCount, result.columns * 3);
      assert(result.cardWidth >= 104, `${width}pt at ${scale}x text produces a cramped tile`);
      assert(result.columns <= previousColumns, 'larger text must not add columns');
      const minimumCard = result.isTablet ? 140 * scale : Math.max(104 * scale, scale > 1.2 ? 140 : 104);
      assert(result.columns === 1 || result.cardWidth >= minimumCard);
      previousColumns = result.columns;
    }
  }
});

test('tablets add columns while Split View and large text reduce density', async () => {
  const { featuredLayout } = await layout;
  assert.equal(featuredLayout(744).columns, 4);
  assert.equal(featuredLayout(834).columns, 5);
  assert.equal(featuredLayout(1024).columns, 6);
  assert.equal(featuredLayout(1366).width, 1200);
  assert.equal(featuredLayout(1366).columns, 6);
  assert.equal(featuredLayout(390).isTablet, false);
  assert.equal(featuredLayout(375, 1.3).columns, 2);
  assert.equal(featuredLayout(375, 2).columns, 1);
  assert(featuredLayout(834, 3).columns < featuredLayout(834).columns);
});

test('transient empty window measurements remain finite', async () => {
  const { featuredLayout } = await layout;
  for (const width of [0, -10, NaN, undefined]) {
    const result = featuredLayout(width, NaN);
    assert.equal(result.columns, 1);
    assert.equal(result.cardWidth, 0);
    assert.equal(result.placeholderCount, 3);
  }
});
