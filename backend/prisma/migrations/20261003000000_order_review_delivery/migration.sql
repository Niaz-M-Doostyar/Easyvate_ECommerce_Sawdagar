ALTER TABLE `orders` ADD COLUMN `delivery_fee` DOUBLE NOT NULL DEFAULT 0;
ALTER TABLE `orders` ADD COLUMN `confirm_after` DATETIME(3) NULL;
CREATE INDEX `orders_status_confirm_after_idx` ON `orders`(`status`, `confirm_after`);
