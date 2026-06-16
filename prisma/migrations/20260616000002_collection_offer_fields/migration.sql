ALTER TABLE "Collection"
  ADD COLUMN "code" TEXT,
  ADD COLUMN "offerPrice" DECIMAL(10,2),
  ADD COLUMN "isOffer" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE UNIQUE INDEX "Collection_code_key" ON "Collection"("code");
CREATE INDEX "Collection_isOffer_isPublished_position_idx" ON "Collection"("isOffer", "isPublished", "position");
