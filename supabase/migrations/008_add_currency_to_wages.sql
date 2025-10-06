-- Migration: Add currency column to wage_settings
-- Allows users to select their preferred currency

-- Add currency column with default value
ALTER TABLE wage_settings
ADD COLUMN IF NOT EXISTS currency VARCHAR(10) NOT NULL DEFAULT 'NIS';
