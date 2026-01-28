USE myappdb;
SELECT NOW();

-- Add new columns to carousel_insights table for the new dropdown structure
ALTER TABLE carousel_insights 
ADD COLUMN IF NOT EXISTS date DATE,
ADD COLUMN IF NOT EXISTS subtitle VARCHAR(255),
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS dropdowns JSON;

-- Verify the table structure
DESCRIBE carousel_insights;
