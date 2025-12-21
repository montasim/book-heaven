/*
  Warnings:

  - A unique constraint covering the columns `[username]` on the table `admins` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[phoneNumber]` on the table `admins` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "admins" ADD COLUMN     "bio" TEXT,
ADD COLUMN     "communicationEmails" BOOLEAN DEFAULT false,
ADD COLUMN     "displayItems" JSONB DEFAULT '["recents", "home", "applications", "desktop", "downloads", "documents"]',
ADD COLUMN     "dob" TIMESTAMP(3),
ADD COLUMN     "firstName" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "font" TEXT DEFAULT 'inter',
ADD COLUMN     "language" TEXT,
ADD COLUMN     "lastName" TEXT,
ADD COLUMN     "marketingEmails" BOOLEAN DEFAULT false,
ADD COLUMN     "mobileNotifications" BOOLEAN DEFAULT false,
ADD COLUMN     "notificationType" TEXT DEFAULT 'all',
ADD COLUMN     "phoneNumber" TEXT,
ADD COLUMN     "securityEmails" BOOLEAN DEFAULT true,
ADD COLUMN     "socialEmails" BOOLEAN DEFAULT false,
ADD COLUMN     "theme" TEXT DEFAULT 'light',
ADD COLUMN     "urls" JSONB DEFAULT '[]',
ADD COLUMN     "username" TEXT,
ALTER COLUMN "name" SET DEFAULT '';

-- CreateTable
CREATE TABLE "invites" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "invitedBy" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'admin',
    "desc" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usedAt" TIMESTAMP(3),

    CONSTRAINT "invites_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "invites_email_key" ON "invites"("email");

-- CreateIndex
CREATE UNIQUE INDEX "invites_token_key" ON "invites"("token");

-- CreateIndex
CREATE INDEX "invites_email_expiresAt_idx" ON "invites"("email", "expiresAt");

-- CreateIndex
CREATE INDEX "invites_token_idx" ON "invites"("token");

-- CreateIndex
CREATE UNIQUE INDEX "admins_username_key" ON "admins"("username");

-- CreateIndex
CREATE UNIQUE INDEX "admins_phoneNumber_key" ON "admins"("phoneNumber");
