-- AlterTable
ALTER TABLE "GmailSale" ADD COLUMN "gmailPasswordEncrypted" TEXT;
ALTER TABLE "GmailSale" ADD COLUMN "rejectionReason" TEXT;
ALTER TABLE "GmailSale" ADD COLUMN "suggestedPrice" INTEGER;
ALTER TABLE "GmailSale" ADD COLUMN "verificationData" TEXT;
ALTER TABLE "GmailSale" ADD COLUMN "verifiedAt" DATETIME;
ALTER TABLE "GmailSale" ADD COLUMN "verifiedBy" TEXT;
