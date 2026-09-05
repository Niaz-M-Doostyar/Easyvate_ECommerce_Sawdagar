const CATEGORY_ICON_KEYS = new Set([
  'general',
  'marketplace',
  'auto-parts',
  'bathroom',
  'beverages',
  'clothing',
  'curd',
  'electronics',
  'food-groceries',
  'health-beauty',
  'home-garden',
  'jewelry',
  'juice',
  'kitchen',
  'medical',
  'milk',
  'tomato-paste',
  'phones',
  'shoes',
  'sports',
  'shape-outline',
  'storefront-outline',
  'food-apple-outline',
  'car-cog',
  'hanger',
  'cellphone',
  'sofa-outline',
  'shower',
  'cup-outline',
  'dumbbell',
  'silverware-fork-knife',
  'book-open-page-variant-outline',
  'palette-outline',
  'baby-face-outline',
  'medical-bag',
  'home-outline',
  'hammer-screwdriver',
  'watch-variant',
  'shoe-sneaker',
  'gamepad-variant-outline',
]);

function normalizeIconKey(value) {
  if (typeof value !== 'string') return null;
  const iconKey = value.trim();
  return CATEGORY_ICON_KEYS.has(iconKey) ? iconKey : null;
}

function normalizeImage(value) {
  if (typeof value !== 'string') return null;
  const image = value.trim();
  if (!image || image.length > 2048) return null;
  return image.startsWith('/') || /^https?:\/\//i.test(image) ? image : null;
}

module.exports = { CATEGORY_ICON_KEYS, normalizeIconKey, normalizeImage };
