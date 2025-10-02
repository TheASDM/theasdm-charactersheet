-- AlterTable: Make email required and unique
-- AlterTable: Make username unique
-- AlterTable: Add passwordHash required field

-- First, update existing users to have unique usernames and valid emails
UPDATE users
SET email = username || '@temporary.local'
WHERE email IS NULL OR email = '';

-- Add temporary password hashes for existing users (they'll need to be reset)
-- Password hash for 'temppassword123'
ALTER TABLE users
ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);

UPDATE users
SET password_hash = '$2a$10$YourDefaultHashHere.placeholder.ForMigration'
WHERE password_hash IS NULL;

-- Now make the columns NOT NULL and add constraints
ALTER TABLE users
ALTER COLUMN email SET NOT NULL,
ALTER COLUMN username SET NOT NULL,
ALTER COLUMN password_hash SET NOT NULL;

-- Add unique constraints
ALTER TABLE users
ADD CONSTRAINT users_username_key UNIQUE (username);

ALTER TABLE users
ADD CONSTRAINT users_email_key UNIQUE (email);
