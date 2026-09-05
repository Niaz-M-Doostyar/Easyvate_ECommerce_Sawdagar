ALTER TABLE `products`
  ADD COLUMN `is_slider_promoted` BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX `products_is_slider_promoted_idx` ON `products` (`is_slider_promoted`);
