UPDATE `categories`
SET `icon_key` = CASE
  WHEN LOWER(`slug`) = 'auto-parts' THEN 'auto-parts'
  WHEN LOWER(`slug`) = 'bathroom' THEN 'bathroom'
  WHEN LOWER(`slug`) IN ('baverages', 'beverages') THEN 'beverages'
  WHEN LOWER(`slug`) = 'clothing' THEN 'clothing'
  WHEN LOWER(`slug`) = 'curd' THEN 'curd'
  WHEN LOWER(`slug`) = 'electronics' THEN 'electronics'
  WHEN LOWER(`slug`) = 'food' THEN 'food-groceries'
  WHEN LOWER(`slug`) = 'health' THEN 'health-beauty'
  WHEN LOWER(`slug`) = 'home' THEN 'home-garden'
  WHEN LOWER(`slug`) = 'jewelry' THEN 'jewelry'
  WHEN LOWER(`slug`) = 'juice' THEN 'juice'
  WHEN LOWER(`slug`) = 'kitchen' THEN 'kitchen'
  WHEN LOWER(`slug`) = 'medical' THEN 'medical'
  WHEN LOWER(`slug`) = 'milk' THEN 'milk'
  WHEN LOWER(`slug`) = 'paste' THEN 'tomato-paste'
  WHEN LOWER(`slug`) = 'phones' THEN 'phones'
  WHEN LOWER(`slug`) = 'shoes' THEN 'shoes'
  WHEN LOWER(`slug`) = 'sports' THEN 'sports'
  ELSE `icon_key`
END
WHERE `image` IS NULL;
