-- =============================================================================
-- PassMaster Database Schema (MySQL 8.0+)
-- Arquitectura de Seguridad, Transaccionalidad y Unicidad de Tickets
-- =============================================================================

CREATE DATABASE IF NOT EXISTS `passmaster_db`
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `passmaster_db`;

-- Desactivar llaves foráneas temporalmente para asegurar creación limpia
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `check_in_logs`;
DROP TABLE IF EXISTS `tickets`;
DROP TABLE IF EXISTS `orders`;
DROP TABLE IF EXISTS `ticket_tiers`;
DROP TABLE IF EXISTS `events`;
DROP TABLE IF EXISTS `users`;

SET FOREIGN_KEY_CHECKS = 1;

-- 1. Tabla de Usuarios y Roles
CREATE TABLE `users` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(120) NOT NULL,
  `email` VARCHAR(180) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` ENUM('ADMIN', 'STAFF', 'CUSTOMER') NOT NULL DEFAULT 'CUSTOMER',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_users_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Tabla de Eventos
CREATE TABLE `events` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(200) NOT NULL,
  `description` TEXT,
  `location` VARCHAR(255) NOT NULL,
  `event_date` DATETIME NOT NULL,
  `banner_url` VARCHAR(500) NULL,
  `max_capacity` INT UNSIGNED NOT NULL DEFAULT 100,
  `status` ENUM('DRAFT', 'PUBLISHED', 'FINISHED', 'CANCELLED') NOT NULL DEFAULT 'PUBLISHED',
  `created_by` INT UNSIGNED NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_events_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
  INDEX `idx_events_status_date` (`status`, `event_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Tabla de Tipos de Entradas / Localidades (Ticket Tiers)
CREATE TABLE `ticket_tiers` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `event_id` INT UNSIGNED NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `description` VARCHAR(255) NULL,
  `price` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `total_quantity` INT UNSIGNED NOT NULL,
  `available_quantity` INT UNSIGNED NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_tiers_event` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE,
  INDEX `idx_tiers_event_available` (`event_id`, `available_quantity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Tabla de Órdenes de Compra
CREATE TABLE `orders` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `order_number` VARCHAR(64) NOT NULL UNIQUE,
  `user_id` INT UNSIGNED NOT NULL,
  `total_amount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `payment_gateway` ENUM('STRIPE', 'MOCK_SANDBOX') NOT NULL DEFAULT 'MOCK_SANDBOX',
  `payment_intent_id` VARCHAR(150) NULL,
  `payment_status` ENUM('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED') NOT NULL DEFAULT 'PENDING',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_orders_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
  INDEX `idx_orders_status` (`payment_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Tabla de Boletos Individuales (Tickets)
CREATE TABLE `tickets` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `order_id` INT UNSIGNED NOT NULL,
  `ticket_tier_id` INT UNSIGNED NOT NULL,
  `ticket_code` VARCHAR(64) NOT NULL UNIQUE, -- Identificador único alfanumérico/UUID
  `qr_signature` VARCHAR(128) NOT NULL UNIQUE, -- Hash HMAC verificable criptográficamente
  `status` ENUM('ACTIVE', 'CHECKED_IN', 'CANCELLED') NOT NULL DEFAULT 'ACTIVE',
  `checked_in_at` DATETIME NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_tickets_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_tickets_tier` FOREIGN KEY (`ticket_tier_id`) REFERENCES `ticket_tiers` (`id`) ON DELETE RESTRICT,
  INDEX `idx_tickets_code` (`ticket_code`),
  INDEX `idx_tickets_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Tabla de Auditoría de Validación (Check-in Logs)
CREATE TABLE `check_in_logs` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `ticket_id` INT UNSIGNED NOT NULL,
  `scanned_by_user_id` INT UNSIGNED NOT NULL,
  `scan_timestamp` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `result` ENUM('SUCCESS', 'ALREADY_USED', 'INVALID', 'CANCELLED') NOT NULL,
  `device_info` VARCHAR(255) NULL,
  CONSTRAINT `fk_checkin_ticket` FOREIGN KEY (`ticket_id`) REFERENCES `tickets` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_checkin_staff` FOREIGN KEY (`scanned_by_user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
  INDEX `idx_checkin_ticket_scan` (`ticket_id`, `scan_timestamp`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
