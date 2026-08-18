-- AlterTable
ALTER TABLE "Guest" ADD COLUMN     "dietary" TEXT,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "party" JSONB,
ADD COLUMN     "phone" TEXT;
