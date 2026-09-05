const CATEGORY_ASSETS = {
  'auto-parts': require('../../assets/category-icons/auto-parts.png'),
  bathroom: require('../../assets/category-icons/bathroom.png'),
  beverages: require('../../assets/category-icons/beverages.png'),
  clothing: require('../../assets/category-icons/clothing.png'),
  curd: require('../../assets/category-icons/curd.png'),
  electronics: require('../../assets/category-icons/electronics.png'),
  'food-groceries': require('../../assets/category-icons/food-groceries.png'),
  'health-beauty': require('../../assets/category-icons/health-beauty.png'),
  'home-garden': require('../../assets/category-icons/home-garden.png'),
  jewelry: require('../../assets/category-icons/jewelry.png'),
  juice: require('../../assets/category-icons/juice.png'),
  kitchen: require('../../assets/category-icons/kitchen.png'),
  marketplace: require('../../assets/category-icons/marketplace.png'),
  medical: require('../../assets/category-icons/medical.png'),
  milk: require('../../assets/category-icons/milk.png'),
  'tomato-paste': require('../../assets/category-icons/tomato-paste.png'),
  phones: require('../../assets/category-icons/phones.png'),
  shoes: require('../../assets/category-icons/shoes.png'),
  sports: require('../../assets/category-icons/sports.png'),
  general: require('../../assets/category-icons/general.png'),
};

const LEGACY_ICON_ALIASES = {
  'shape-outline': 'general',
  'storefront-outline': 'marketplace',
  'food-apple-outline': 'food-groceries',
  'car-cog': 'auto-parts',
  hanger: 'clothing',
  cellphone: 'electronics',
  'sofa-outline': 'home-garden',
  shower: 'bathroom',
  'cup-outline': 'beverages',
  dumbbell: 'sports',
  'silverware-fork-knife': 'food-groceries',
  'book-open-page-variant-outline': 'general',
  'palette-outline': 'health-beauty',
  'baby-face-outline': 'general',
  'medical-bag': 'medical',
  'home-outline': 'home-garden',
  'hammer-screwdriver': 'general',
  'watch-variant': 'jewelry',
  'shoe-sneaker': 'shoes',
  'gamepad-variant-outline': 'electronics',
};

const EXACT_SLUG_ALIASES = {
  'auto-parts': 'auto-parts', bathroom: 'bathroom', baverages: 'beverages', beverages: 'beverages',
  clothing: 'clothing', curd: 'curd', electronics: 'electronics', food: 'food-groceries',
  health: 'health-beauty', home: 'home-garden', jewelry: 'jewelry', juice: 'juice', kitchen: 'kitchen',
  medical: 'medical', milk: 'milk', paste: 'tomato-paste', phones: 'phones', shoes: 'shoes', sports: 'sports',
};

const KEYWORD_ASSETS = [
  [['tomato paste', 'paste'], 'tomato-paste'],
  [['curd', 'yogurt', 'yoghurt'], 'curd'],
  [['juice'], 'juice'],
  [['milk', 'dairy'], 'milk'],
  [['auto', 'car', 'motor', 'vehicle'], 'auto-parts'],
  [['bath', 'shower'], 'bathroom'],
  [['beverage', 'drink', 'coffee', 'tea'], 'beverages'],
  [['cloth', 'fashion', 'apparel'], 'clothing'],
  [['phone', 'mobile'], 'phones'],
  [['electronic', 'camera', 'computer', 'laptop'], 'electronics'],
  [['kitchen', 'cookware'], 'kitchen'],
  [['jewel', 'watch', 'accessor'], 'jewelry'],
  [['medical', 'pharmacy'], 'medical'],
  [['health', 'beauty', 'cosmetic'], 'health-beauty'],
  [['home', 'garden', 'furniture', 'sofa'], 'home-garden'],
  [['shoe', 'footwear'], 'shoes'],
  [['sport', 'fitness', 'gym'], 'sports'],
  [['food', 'grocery', 'fruit'], 'food-groceries'],
  [['market', 'shop', 'store'], 'marketplace'],
];

export function getCategoryVisualKey(category) {
  const slug = String(category?.slug || '').trim().toLowerCase();
  const iconKey = String(category?.iconKey || '').trim();
  if (CATEGORY_ASSETS[iconKey]) return iconKey;
  if (EXACT_SLUG_ALIASES[slug]) return EXACT_SLUG_ALIASES[slug];

  const searchable = `${slug} ${category?.nameEn || ''} ${category?.name || ''}`.toLowerCase();
  const keywordMatch = KEYWORD_ASSETS.find(([keywords]) => keywords.some((keyword) => searchable.includes(keyword)));
  if (keywordMatch) return keywordMatch[1];

  return LEGACY_ICON_ALIASES[iconKey] || 'general';
}

export function getCategoryVisualSource(category) {
  return CATEGORY_ASSETS[getCategoryVisualKey(category)] || CATEGORY_ASSETS.general;
}
