ALTER TABLE `users`
  ADD COLUMN `customer_phone` VARCHAR(191) NULL,
  ADD COLUMN `phone_verified` BOOLEAN NOT NULL DEFAULT false;
CREATE UNIQUE INDEX `users_customer_phone_key` ON `users`(`customer_phone`);

CREATE TABLE `phone_registrations` (
  `purpose` VARCHAR(191) NOT NULL DEFAULT 'registration',
  `user_id` INTEGER NULL,
  `id` VARCHAR(191) NOT NULL,
  `phone` VARCHAR(191) NOT NULL,
  `full_name` VARCHAR(191) NOT NULL,
  `password` VARCHAR(191) NOT NULL,
  `code_hash` VARCHAR(191) NOT NULL,
  `expires_at` DATETIME(3) NOT NULL,
  `last_sent_at` DATETIME(3) NOT NULL,
  `attempts` INTEGER NOT NULL DEFAULT 0,
  `send_count` INTEGER NOT NULL DEFAULT 0,
  `window_start` DATETIME(3) NOT NULL,
  UNIQUE INDEX `phone_registrations_phone_key` (`phone`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `phone_otp_rates` (
  `id` VARCHAR(100) NOT NULL,
  `count` INTEGER NOT NULL,
  `expires_at` DATETIME(3) NOT NULL,
  INDEX `phone_otp_rates_expires_at_idx` (`expires_at`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
