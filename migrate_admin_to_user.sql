-- Migration: Remove Admin table and migrate to User table with role-based system
-- This script will migrate all admin users to the User table and drop the Admin table

-- Step 1: Migrate admin data to users table
INSERT INTO users (
    id,
    email,
    name,
    "firstName",
    "lastName",
    passwordHash,
    "role",
    "isActive",
    bio,
    "communicationEmails",
    "displayItems",
    dob,
    font,
    language,
    "marketingEmails",
    "mobileNotifications",
    "notificationType",
    "phoneNumber",
    "securityEmails",
    "socialEmails",
    theme,
    urls,
    username,
    createdAt,
    updatedAt
)
SELECT
    id,
    email,
    COALESCE(name, '') as name,
    COALESCE("firstName", '') as "firstName",
    "lastName",
    passwordHash,
    'ADMIN' as "role",
    true as "isActive",
    bio,
    "communicationEmails",
    "displayItems",
    dob,
    font,
    language,
    "marketingEmails",
    "mobileNotifications",
    "notificationType",
    "phoneNumber",
    "securityEmails",
    "socialEmails",
    theme,
    urls,
    username,
    createdAt,
    updatedAt
FROM admins
ON CONFLICT (id) DO UPDATE SET
    "role" = EXCLUDED."role",
    bio = EXCLUDED.bio,
    "communicationEmails" = EXCLUDED."communicationEmails",
    "displayItems" = EXCLUDED."displayItems",
    dob = EXCLUDED.dob,
    font = EXCLUDED.font,
    language = EXCLUDED.language,
    "marketingEmails" = EXCLUDED."marketingEmails",
    "mobileNotifications" = EXCLUDED."mobileNotifications",
    "notificationType" = EXCLUDED."notificationType",
    "phoneNumber" = EXCLUDED."phoneNumber",
    "securityEmails" = EXCLUDED."securityEmails",
    "socialEmails" = EXCLUDED."socialEmails",
    theme = EXCLUDED.theme,
    urls = EXCLUDED.urls,
    username = EXCLUDED.username;

-- Step 2: Update foreign key references in related tables
UPDATE authors SET "entryById" = admins.id WHERE "entryById" IN (SELECT id FROM admins);
UPDATE publications SET "entryById" = admins.id WHERE "entryById" IN (SELECT id FROM admins);
UPDATE categories SET "entryById" = admins.id WHERE "entryById" IN (SELECT id FROM admins);
UPDATE books SET "entryById" = admins.id WHERE "entryById" IN (SELECT id FROM admins);

-- Step 3: Drop the Admin table (this will also drop AdminOtp table)
DROP TABLE IF EXISTS admin_otps;
DROP TABLE IF EXISTS admins CASCADE;

-- Step 4: Clean up - make sure all users have required fields
UPDATE users SET
    name = COALESCE(name, ''),
    "firstName" = COALESCE("firstName", ''),
    "role" = COALESCE("role", 'USER')
WHERE name IS NULL OR "firstName" IS NULL OR "role" IS NULL;

-- Step 5: Create indexes for performance
CREATE INDEX IF NOT EXISTS "users_role_idx" ON users("role");
CREATE INDEX IF NOT EXISTS "users_phoneNumber_idx" ON users("phoneNumber") WHERE "phoneNumber" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "users_username_idx" ON users("username") WHERE "username" IS NOT NULL;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Migration completed successfully!';
    RAISE NOTICE 'Admin users have been migrated to the users table with ADMIN role.';
    RAISE NOTICE 'Admin table has been dropped.';
END $$;