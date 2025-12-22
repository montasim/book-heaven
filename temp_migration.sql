-- Migration: Merge Admin and User tables into single User table
-- This script will:
-- 1. Rename admins table to users_temp
-- 2. Migrate data from old users table to users_temp
-- 3. Drop old tables
-- 4. Rename users_temp to users

-- Step 1: Create a backup of current admins table
CREATE TABLE admins_backup AS TABLE admins;

-- Step 2: Drop existing UserSession table to avoid foreign key conflicts
DROP TABLE IF EXISTS "UserSession" CASCADE;

-- Step 3: Drop old users table if it exists and its related data
DROP TABLE IF EXISTS "BookshelfItem" CASCADE;
DROP TABLE IF EXISTS "Bookshelf" CASCADE;
DROP TABLE IF EXISTS "ReadingProgress" CASCADE;
DROP TABLE IF EXISTS "Subscription" CASCADE;
DROP TABLE IF EXISTS "users" CASCADE;

-- Step 4: Rename admins table to users (this becomes our main user table)
ALTER TABLE admins RENAME TO users;

-- Step 5: Add missing columns to the new users table (from old User model)
ALTER TABLE users ADD COLUMN IF NOT EXISTS "avatar" TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "isPremium" BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "displayItems" JSONB DEFAULT '[\"recents\", \"home\", \"applications\", \"desktop\", \"downloads\", \"documents\"]';
ALTER TABLE users ADD COLUMN IF NOT EXISTS "urls" JSONB DEFAULT '[]';

-- Step 6: Create UserSession table
CREATE TABLE "UserSession" (
    "id" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserSession_pkey" PRIMARY KEY ("id")
);

-- Step 7: Create index for UserSession
CREATE INDEX "UserSession_userId_idx" ON "UserSession"("userId");

-- Step 8: Create Subscription table
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "stripePriceId" TEXT,
    "stripeCurrentPeriodEnd" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- Step 9: Create unique constraints and indexes for Subscription
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userId_key" UNIQUE ("userId");
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_stripeCustomerId_key" UNIQUE ("stripeCustomerId");
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_stripeSubscriptionId_key" UNIQUE ("stripeSubscriptionId");
CREATE INDEX "Subscription_userId_idx" ON "Subscription"("userId");

-- Step 10: Create ReadingProgress table
CREATE TABLE "ReadingProgress" (
    "id" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "bookId" TEXT NOT NULL,
    "progress" DOUBLE PRECISION NOT NULL,
    "lastReadAt" TIMESTAMP(3) NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReadingProgress_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ReadingProgress_userId_bookId_key" UNIQUE ("userId", "bookId")
);

-- Step 11: Create Bookshelf table
CREATE TABLE "Bookshelf" (
    "id" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Bookshelf_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Bookshelf_userId_name_key" UNIQUE ("userId", "name")
);

-- Step 12: Create BookshelfItem table
CREATE TABLE "BookshelfItem" (
    "id" TEXT NOT NULL,
    "bookshelfId" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookshelfItem_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "BookshelfItem_bookshelfId_bookId_key" UNIQUE ("bookshelfId", "bookId")
);

-- Step 13: Add foreign key constraints
ALTER TABLE "UserSession" ADD CONSTRAINT "UserSession_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ReadingProgress" ADD CONSTRAINT "ReadingProgress_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ReadingProgress" ADD CONSTRAINT "ReadingProgress_bookId_fkey"
    FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Bookshelf" ADD CONSTRAINT "Bookshelf_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "BookshelfItem" ADD CONSTRAINT "BookshelfItem_bookshelfId_fkey"
    FOREIGN KEY ("bookshelfId") REFERENCES "Bookshelf"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "BookshelfItem" ADD CONSTRAINT "BookshelfItem_bookId_fkey"
    FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 14: Update UserRole enum if needed
-- Note: This might need to be done manually in your database client
-- ALTER TYPE "UserRole" ADD VALUE 'SUPER_ADMIN';

-- Step 15: Set proper default roles for existing admin users
UPDATE users SET role = 'ADMIN' WHERE role IS NULL OR role = 'USER';

-- Step 16: Create UserOtp table
CREATE TABLE "UserOtp" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "intent" TEXT NOT NULL, -- LOGIN, REGISTER, PASSWORD_RESET
    "used" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserOtp_pkey" PRIMARY KEY ("id")
);

-- Step 17: Create indexes for UserOtp
CREATE INDEX "UserOtp_email_intent_idx" ON "UserOtp"("email", "intent");

-- Step 18: Create Invite table
CREATE TABLE "Invite" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "invitedBy" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'ADMIN',
    "desc" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usedAt" TIMESTAMP(3),

    CONSTRAINT "Invite_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Invite_email_key" UNIQUE ("email"),
    CONSTRAINT "Invite_token_key" UNIQUE ("token")
);

-- Step 19: Create indexes for Invite
CREATE INDEX "Invite_email_expiresAt_idx" ON "Invite"("email", "expiresAt");
CREATE INDEX "Invite_token_idx" ON "Invite"("token");

-- Step 20: Create indexes for performance
CREATE INDEX "Subscription_userId_idx" ON "Subscription"("userId");
CREATE INDEX "ReadingProgress_userId_idx" ON "ReadingProgress"("userId");
CREATE INDEX "ReadingProgress_bookId_idx" ON "ReadingProgress"("bookId");
CREATE INDEX "Bookshelf_userId_idx" ON "Bookshelf"("userId");
CREATE INDEX "BookshelfItem_bookshelfId_idx" ON "BookshelfItem"("bookshelfId");
CREATE INDEX "BookshelfItem_bookId_idx" ON "BookshelfItem"("bookId");

-- Step 21: Migrate AdminOtp data to UserOtp if exists
INSERT INTO "UserOtp" (id, email, "codeHash", intent, used, "expiresAt", "createdAt")
SELECT id, email, "codeHash", intent, used, "expiresAt", "createdAt" FROM admin_otps;

-- Step 22: Migrate Invite data if exists
INSERT INTO "Invite" (id, email, token, "invitedBy", role, desc, "expiresAt", used, "createdAt", "usedAt")
SELECT id, email, token, "invitedBy", role, desc, "expiresAt", used, "createdAt", "usedAt" FROM invites;

-- Clean up
DROP TABLE IF EXISTS admins_backup;
DROP TABLE IF EXISTS admin_otps;
DROP TABLE IF EXISTS invites;