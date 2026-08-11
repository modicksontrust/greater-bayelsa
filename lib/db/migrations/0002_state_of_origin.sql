-- Add state of origin to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS state_of_origin text;
