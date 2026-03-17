-- AlterTable
ALTER TABLE "User" ADD COLUMN     "notifyInvite" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notifySystem" BOOLEAN NOT NULL DEFAULT true;
