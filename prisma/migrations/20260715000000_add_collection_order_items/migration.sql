ALTER TABLE "OrderItem"
  ALTER COLUMN "variantId" DROP NOT NULL;

ALTER TABLE "OrderItem"
  ADD COLUMN "collectionId" TEXT;

ALTER TABLE "OrderItem"
  ADD CONSTRAINT "OrderItem_collectionId_fkey"
  FOREIGN KEY ("collectionId") REFERENCES "Collection"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "OrderItem_collectionId_idx" ON "OrderItem"("collectionId");
