-- Migration Script: Update Subscriptions Table
-- Run this script to add missing columns and update plan_type enum

USE mobile_shop_saas;

-- Add amount column to subscriptions table
ALTER TABLE subscriptions ADD COLUMN amount DECIMAL(10, 2) NULL AFTER end_date;

-- Add payment_method column to subscriptions table
ALTER TABLE subscriptions ADD COLUMN payment_method VARCHAR(50) NULL AFTER amount;

-- Update plan_type enum to include new values
-- Note: MySQL doesn't support direct ENUM modification, so we need to recreate the column
-- First, create a backup of the table
CREATE TABLE subscriptions_backup AS SELECT * FROM subscriptions;

-- Drop the old column
ALTER TABLE subscriptions DROP COLUMN plan_type;

-- Add the new column with updated enum values
ALTER TABLE subscriptions ADD COLUMN plan_type ENUM('basic', 'standard', 'premium', 'monthly', 'quarterly', 'yearly', 'trial') DEFAULT 'basic' AFTER shop_id;

-- Restore data from backup
UPDATE subscriptions s
JOIN subscriptions_backup sb ON s.id = sb.id
SET s.plan_type = sb.plan_type;

-- Drop the backup table
DROP TABLE subscriptions_backup;

-- Verify the changes
DESCRIBE subscriptions;
