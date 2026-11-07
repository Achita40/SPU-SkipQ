/*
  Warnings:

  - A unique constraint covering the columns `[username]` on the table `Merchant` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `username` to the `Merchant` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Merchant_email_key";

-- AlterTable
ALTER TABLE "Merchant" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "username" TEXT NOT NULL,
ALTER COLUMN "email" DROP NOT NULL,
ALTER COLUMN "isOpen" SET DEFAULT true;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "studentId" TEXT;

-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "phone" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Merchant_username_key" ON "Merchant"("username");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE SET NULL ON UPDATE CASCADE;
