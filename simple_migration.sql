-- Simple Migration: Admin to User with Role-Based System
-- This script migrates admin users to the unified User table

-- Step 1: Add missing columns to User table for admin fields
ALTER TABLE users
ADD COLUMN IF NOT EXISTS "firstName" TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS "lastName" TEXT,
ADD COLUMN IF NOT EXISTS "role" TEXT DEFAULT 'USER',
ADD COLUMN IF NOT EXISTS "bio" TEXT,
ADD COLUMN IF NOT EXISTS "communicationEmails" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "displayItems" JSONB DEFAULT '[\"recents\", \"home\", \"applications\", \"desktop\", \"downloads\", \"documents\"]',
ADD COLUMN IF NOT EXISTS "dob" TIMESTAMP,
ADD COLUMN IF NOT EXISTS "font" TEXT DEFAULT 'inter',
ADD COLUMN IF NOT EXISTS "language" TEXT,
ADD COLUMN IF NOT EXISTS "marketingEmails" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "mobileNotifications" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "notificationType" TEXT DEFAULT 'all',
ADD COLUMN IF NOT EXISTS "phoneNumber" TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS "securityEmails" BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS "socialEmails" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "theme" TEXT DEFAULT 'light',
ADD COLUMN IF NOT EXISTS "urls" JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS "username" TEXT UNIQUE;

-- Step 2: Migrate admin data to users table
INSERT INTO users (
    id, email, name, "firstName", "lastName", passwordHash, avatar, "role", "isActive",
    bio, "communicationEmails", "displayItems", dob, font, language, "marketingEmails",
    "mobileNotifications", "notificationType", "phoneNumber", "securityEmails",
    "socialEmails", theme, urls, username, createdAt, updatedAt
)
SELECT
    id, email, name, "firstName", "lastName", passwordHash, avatar, 'ADMIN' as role, true as "isActive",
    bio, "communicationEmails", "displayItems", dob, font, language, "marketingEmails",
    "mobileNotifications", "notificationType", "phoneNumber", "securityEmails",
    "socialEmails", theme, urls, username, createdAt, updatedAt
FROM admins
ON CONFLICT (id) DO NOTHING;

-- Step 3: Update book relationships to point to users instead of admins
UPDATE authors SET "entryById" = admins.id WHERE "entryById" IN (SELECT id FROM admins);
UPDATE publications SET "entryById" = admins.id WHERE "entryById" IN (SELECT id FROM admins);
UPDATE categories SET "entryById" = admins.id WHERE "entryById" IN (SELECT id FROM admins);
UPDATE books SET "entryById" = admins.id WHERE "entryById" IN (SELECT id FROM admins);

-- Step 4: Drop foreign key constraints and recreate them
-- (This will need to be done carefully based on your database)

-- Step 5: After successful migration, you can drop the admin table
-- DROP TABLE admins CASCADE;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "users_role_idx" ON users("role");
CREATE INDEX IF NOT EXISTS "users_phoneNumber_idx" ON users("phoneNumber");
CREATE INDEX IF NOT EXISTS "users_username_idx" ON users("username");

-- Update UserRole enum in the database
-- Note: This might need to be done manually in your database client
-- ALTER TYPE "UserRole" ADD VALUE 'SUPER_ADMIN' IF NOT EXISTS;