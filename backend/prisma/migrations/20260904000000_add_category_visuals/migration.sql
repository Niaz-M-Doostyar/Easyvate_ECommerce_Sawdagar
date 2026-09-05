ALTER TABLE `categories`
  ADD COLUMN `image` VARCHAR(2048) NULL,
  ADD COLUMN `icon_key` VARCHAR(191) NULL;

UPDATE `categories`
SET `icon_key` = CASE
  WHEN LOWER(CONCAT(`slug`, ' ', `name_en`)) REGEXP 'auto|car|motor|vehicle' THEN 'car-cog'
  WHEN LOWER(CONCAT(`slug`, ' ', `name_en`)) REGEXP 'bath|shower' THEN 'shower'
  WHEN LOWER(CONCAT(`slug`, ' ', `name_en`)) REGEXP 'beverage|drink|coffee|tea' THEN 'cup-outline'
  WHEN LOWER(CONCAT(`slug`, ' ', `name_en`)) REGEXP 'cloth|fashion|apparel' THEN 'hanger'
  WHEN LOWER(CONCAT(`slug`, ' ', `name_en`)) REGEXP 'electronic|phone|mobile' THEN 'cellphone'
  WHEN LOWER(CONCAT(`slug`, ' ', `name_en`)) REGEXP 'furniture|sofa' THEN 'sofa-outline'
  WHEN LOWER(CONCAT(`slug`, ' ', `name_en`)) REGEXP 'sport|fitness|gym' THEN 'dumbbell'
  WHEN LOWER(CONCAT(`slug`, ' ', `name_en`)) REGEXP 'food|grocery|fruit' THEN 'food-apple-outline'
  WHEN LOWER(CONCAT(`slug`, ' ', `name_en`)) REGEXP 'book|stationery' THEN 'book-open-page-variant-outline'
  WHEN LOWER(CONCAT(`slug`, ' ', `name_en`)) REGEXP 'beauty|cosmetic|art' THEN 'palette-outline'
  WHEN LOWER(CONCAT(`slug`, ' ', `name_en`)) REGEXP 'baby|kid|child' THEN 'baby-face-outline'
  WHEN LOWER(CONCAT(`slug`, ' ', `name_en`)) REGEXP 'health|medical|pharmacy' THEN 'medical-bag'
  WHEN LOWER(CONCAT(`slug`, ' ', `name_en`)) REGEXP 'home|garden' THEN 'home-outline'
  WHEN LOWER(CONCAT(`slug`, ' ', `name_en`)) REGEXP 'tool|hardware|construction' THEN 'hammer-screwdriver'
  WHEN LOWER(CONCAT(`slug`, ' ', `name_en`)) REGEXP 'watch|jewel' THEN 'watch-variant'
  WHEN LOWER(CONCAT(`slug`, ' ', `name_en`)) REGEXP 'shoe|footwear' THEN 'shoe-sneaker'
  WHEN LOWER(CONCAT(`slug`, ' ', `name_en`)) REGEXP 'game|gaming|toy' THEN 'gamepad-variant-outline'
  ELSE 'shape-outline'
END
WHERE `image` IS NULL AND `icon_key` IS NULL;
