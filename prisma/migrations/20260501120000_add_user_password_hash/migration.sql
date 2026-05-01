-- Add optional password credentials for email/password accounts.
ALTER TABLE "User" ADD COLUMN "passwordHash" TEXT;
