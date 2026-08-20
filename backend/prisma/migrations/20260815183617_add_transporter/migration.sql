/*
  Warnings:

  - A unique constraint covering the columns `[buyerId,farmerId,transporterId]` on the table `Conversation` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "DeliveryStatus" AS ENUM ('PENDING', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'FAILED');

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'TRANSPORTER';

-- DropForeignKey
ALTER TABLE "Conversation" DROP CONSTRAINT "Conversation_farmerId_fkey";

-- DropIndex
DROP INDEX "Conversation_buyerId_farmerId_key";

-- AlterTable
ALTER TABLE "Conversation" ADD COLUMN     "transporterId" UUID,
ALTER COLUMN "farmerId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "deliveryAddress" TEXT,
ADD COLUMN     "deliveryStatus" "DeliveryStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "transporterId" UUID;

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "deliveryFee" DOUBLE PRECISION DEFAULT 0;

-- AlterTable
ALTER TABLE "Review" ADD COLUMN     "transporterId" UUID;

-- CreateTable
CREATE TABLE "TransporterProfile" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "vehicleType" TEXT NOT NULL,
    "vehicleCapacity" TEXT NOT NULL,
    "licensePlate" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "city" TEXT,
    "description" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "rating" DOUBLE PRECISION DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TransporterProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TransporterProfile_userId_key" ON "TransporterProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_buyerId_farmerId_transporterId_key" ON "Conversation"("buyerId", "farmerId", "transporterId");

-- AddForeignKey
ALTER TABLE "TransporterProfile" ADD CONSTRAINT "TransporterProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_transporterId_fkey" FOREIGN KEY ("transporterId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_transporterId_fkey" FOREIGN KEY ("transporterId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_farmerId_fkey" FOREIGN KEY ("farmerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_transporterId_fkey" FOREIGN KEY ("transporterId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
