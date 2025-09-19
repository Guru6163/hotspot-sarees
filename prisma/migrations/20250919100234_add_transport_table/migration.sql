-- DropForeignKey
ALTER TABLE "public"."purchase_items" DROP CONSTRAINT "purchase_items_stockId_fkey";

-- AlterTable
ALTER TABLE "public"."stocks" ADD COLUMN     "profitAmount" DOUBLE PRECISION,
ADD COLUMN     "profitPercentage" DOUBLE PRECISION,
ADD COLUMN     "sellingPrice" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "public"."transports" (
    "id" TEXT NOT NULL,
    "inDate" TIMESTAMP(3) NOT NULL,
    "numberOfBundles" INTEGER NOT NULL,
    "freightCharges" DOUBLE PRECISION NOT NULL,
    "invoiceNo" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "gst" DOUBLE PRECISION NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "transports_invoiceNo_key" ON "public"."transports"("invoiceNo");

-- AddForeignKey
ALTER TABLE "public"."purchase_items" ADD CONSTRAINT "purchase_items_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "public"."stocks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
