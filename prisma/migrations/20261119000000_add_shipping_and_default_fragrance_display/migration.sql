ALTER TABLE "Fragrance" ALTER COLUMN "isPublished" SET DEFAULT true;
UPDATE "Fragrance" SET "isPublished" = true WHERE "isPublished" = false;

ALTER TABLE "Order" ADD COLUMN "shippingAmount" DECIMAL(10,2) NOT NULL DEFAULT 0;
