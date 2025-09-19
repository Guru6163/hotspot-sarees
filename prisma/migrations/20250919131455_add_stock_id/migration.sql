-- AlterTable
ALTER TABLE "stocks" ADD COLUMN "stockID" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "stocks_stockID_key" ON "stocks"("stockID");
