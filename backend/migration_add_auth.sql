-- Manual migration to add authentication fields to users table
-- Run this with: psql -U dnd_user -d dnd_character_sheet -f migration_add_auth.sql

-- Step 1: Add password_hash column (allow NULL temporarily)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);

-- Step 2: Update existing users with a temporary password
-- This is the hash for "TempPassword123!" - users will need to reset
UPDATE users
SET password_hash = '$2a$10$rBV2kIlRjVpSLFdQcGLKxe6GvWv8K8fGpKZc0TFHKwGUgBLxQoQ6u'
WHERE password_hash IS NULL;

-- Step 3: Update existing users to have valid emails if NULL
UPDATE users
SET email = LOWER(username) || '@temporary.local'
WHERE email IS NULL OR email = '';

-- Step 4: Make username unique (handle duplicates first if any)
-- Add a number suffix to any duplicate usernames
WITH duplicates AS (
  SELECT username,
         ROW_NUMBER() OVER (PARTITION BY username ORDER BY id) as rn
  FROM users
)
UPDATE users
SET username = users.username || '_' || duplicates.rn
FROM duplicates
WHERE users.username = duplicates.username
  AND duplicates.rn > 1;

-- Step 5: Make email unique (handle duplicates first if any)
WITH duplicates AS (
  SELECT email,
         ROW_NUMBER() OVER (PARTITION BY email ORDER BY id) as rn
  FROM users
)
UPDATE users
SET email = SUBSTRING(users.email FROM 1 FOR POSITION('@' IN users.email) - 1)
            || '_' || duplicates.rn
            || SUBSTRING(users.email FROM POSITION('@' IN users.email))
FROM duplicates
WHERE users.email = duplicates.email
  AND duplicates.rn > 1;

-- Step 6: Add NOT NULL constraints
ALTER TABLE users
ALTER COLUMN password_hash SET NOT NULL;

ALTER TABLE users
ALTER COLUMN email SET NOT NULL;

-- Step 7: Add UNIQUE constraints (drop first if they exist)
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_username_key;
ALTER TABLE users ADD CONSTRAINT users_username_key UNIQUE (username);

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_key;
ALTER TABLE users ADD CONSTRAINT users_email_key UNIQUE (email);

-- Verify the changes
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- Show current users (without password hashes for security)
SELECT id, username, email, is_dm, created_at
FROM users
ORDER BY id;
