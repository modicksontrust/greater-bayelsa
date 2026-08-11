-- Add secondary/tertiary phone numbers and bank payout details to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone2 text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone3 text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS bank_name text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS bank_account_name text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS bank_account_number text;
