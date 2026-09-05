export const CATEGORY_ICONS = [
  { key: "general", label: "General", asset: "/category-icons/general.png" },
  { key: "marketplace", label: "Marketplace", asset: "/category-icons/marketplace.png" },
  { key: "auto-parts", label: "Auto Parts", asset: "/category-icons/auto-parts.png" },
  { key: "bathroom", label: "Bathroom", asset: "/category-icons/bathroom.png" },
  { key: "beverages", label: "Beverages", asset: "/category-icons/beverages.png" },
  { key: "clothing", label: "Clothing", asset: "/category-icons/clothing.png" },
  { key: "curd", label: "Curd / Yogurt", asset: "/category-icons/curd.png" },
  { key: "electronics", label: "Electronics", asset: "/category-icons/electronics.png" },
  { key: "food-groceries", label: "Food & Groceries", asset: "/category-icons/food-groceries.png" },
  { key: "health-beauty", label: "Health & Beauty", asset: "/category-icons/health-beauty.png" },
  { key: "home-garden", label: "Home & Garden", asset: "/category-icons/home-garden.png" },
  { key: "jewelry", label: "Jewelry", asset: "/category-icons/jewelry.png" },
  { key: "juice", label: "Juice", asset: "/category-icons/juice.png" },
  { key: "kitchen", label: "Kitchen", asset: "/category-icons/kitchen.png" },
  { key: "medical", label: "Medical", asset: "/category-icons/medical.png" },
  { key: "milk", label: "Milk", asset: "/category-icons/milk.png" },
  { key: "tomato-paste", label: "Tomato Paste", asset: "/category-icons/tomato-paste.png" },
  { key: "phones", label: "Phones", asset: "/category-icons/phones.png" },
  { key: "shoes", label: "Shoes", asset: "/category-icons/shoes.png" },
  { key: "sports", label: "Sports", asset: "/category-icons/sports.png" },
];

const LEGACY_ALIASES = {
  "shape-outline": "general", "storefront-outline": "marketplace", "food-apple-outline": "food-groceries",
  "car-cog": "auto-parts", hanger: "clothing", cellphone: "electronics", "sofa-outline": "home-garden",
  shower: "bathroom", "cup-outline": "beverages", dumbbell: "sports", "silverware-fork-knife": "food-groceries",
  "book-open-page-variant-outline": "general", "palette-outline": "health-beauty", "baby-face-outline": "general",
  "medical-bag": "medical", "home-outline": "home-garden", "hammer-screwdriver": "general",
  "watch-variant": "jewelry", "shoe-sneaker": "shoes", "gamepad-variant-outline": "electronics",
};

export function getCategoryIcon(key) {
  const resolvedKey = LEGACY_ALIASES[key] || key;
  return CATEGORY_ICONS.find((item) => item.key === resolvedKey);
}
