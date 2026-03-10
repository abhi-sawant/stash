-- ============================================================
-- Stash App — Database Schema
-- Run this SQL in cPanel → phpMyAdmin to create all tables.
-- ============================================================

-- Users table
-- Stores each registered account.
CREATE TABLE `users` (
    `id`            INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    `email`         VARCHAR(255)    NOT NULL,
    `password_hash` VARCHAR(255)    NOT NULL,
    `created_at`    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- OTPs table
-- Stores one-time passwords for email verification.
-- OTPs expire after 10 minutes (controlled by OTP_EXPIRY in config.php).
CREATE TABLE `otps` (
    `id`         INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    `user_id`    INT UNSIGNED    NOT NULL,
    `otp`        VARCHAR(6)      NOT NULL,
    `expires_at` TIMESTAMP       NOT NULL,
    `used`       TINYINT(1)      NOT NULL DEFAULT 0,
    `created_at` TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_user_otp` (`user_id`, `otp`, `used`),
    CONSTRAINT `fk_otps_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Backups table
-- Stores the bookmark/collection data as JSON.
-- Only the 5 most recent backups per user are kept (pruned automatically by the API).
CREATE TABLE `backups` (
    `id`         INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    `user_id`    INT UNSIGNED    NOT NULL,
    `data`       LONGTEXT        NOT NULL,
    `size`       INT UNSIGNED    NOT NULL DEFAULT 0,
    `created_at` TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_user_created` (`user_id`, `created_at`),
    CONSTRAINT `fk_backups_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
