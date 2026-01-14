-- Migration: Add earnings column to daily_comments table
-- Description: Adds an earnings field to track daily earnings in euros

-- Add earnings column to existing daily_comments table
ALTER TABLE daily_comments ADD COLUMN IF NOT EXISTS earnings DECIMAL(10,2);

-- No data migration needed since this is a new optional field
