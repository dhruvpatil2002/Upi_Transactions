/*
  Warnings:

  - The primary key for the `bank_accounts` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `bank_accounts` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to alter the column `balance` on the `bank_accounts` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(12,2)`.
  - The primary key for the `transactions` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `transactions` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to alter the column `amount` on the `transactions` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(12,2)`.
  - The `status` column on the `transactions` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `pinHash` to the `bank_accounts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `bank_accounts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `transactions` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `fromAccountId` on the `transactions` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `toAccountId` on the `transactions` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('SEND', 'RECEIVE_REQUEST');

-- DropForeignKey
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_fromAccountId_fkey";

-- DropForeignKey
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_toAccountId_fkey";

-- DropIndex
DROP INDEX "bank_accounts_upiId_idx";

-- DropIndex
DROP INDEX "transactions_createdAt_status_idx";

-- DropIndex
DROP INDEX "transactions_status_idx";

-- DropIndex
DROP INDEX "transactions_utr_idx";

-- AlterTable
ALTER TABLE "bank_accounts" DROP CONSTRAINT "bank_accounts_pkey",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "pinHash" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ALTER COLUMN "balance" SET DATA TYPE DECIMAL(12,2),
ADD CONSTRAINT "bank_accounts_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_pkey",
ADD COLUMN     "type" "TransactionType" NOT NULL DEFAULT 'SEND',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "fromAccountId",
ADD COLUMN     "fromAccountId" INTEGER NOT NULL,
DROP COLUMN "toAccountId",
ADD COLUMN     "toAccountId" INTEGER NOT NULL,
ALTER COLUMN "amount" SET DATA TYPE DECIMAL(12,2),
DROP COLUMN "status",
ADD COLUMN     "status" "TransactionStatus" NOT NULL DEFAULT 'PENDING',
ADD CONSTRAINT "transactions_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "refreshToken" TEXT;

-- CreateIndex
CREATE INDEX "transactions_fromAccountId_idx" ON "transactions"("fromAccountId");

-- CreateIndex
CREATE INDEX "transactions_toAccountId_idx" ON "transactions"("toAccountId");

-- CreateIndex
CREATE INDEX "transactions_status_createdAt_idx" ON "transactions"("status", "createdAt" DESC);

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_fromAccountId_fkey" FOREIGN KEY ("fromAccountId") REFERENCES "bank_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_toAccountId_fkey" FOREIGN KEY ("toAccountId") REFERENCES "bank_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
