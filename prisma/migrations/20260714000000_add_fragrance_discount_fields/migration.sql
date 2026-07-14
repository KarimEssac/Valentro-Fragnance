ALTER TABLE "Fragrance"
  ADD COLUMN "discountType" "CouponType",
  ADD COLUMN "discountValue" DECIMAL(10,2),
  ADD COLUMN "discountIsActive" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "discountStartsAt" TIMESTAMP(3),
  ADD COLUMN "discountExpiresAt" TIMESTAMP(3);

CREATE INDEX "Fragrance_discountIsActive_discountStartsAt_discountExpiresAt_idx"
  ON "Fragrance"("discountIsActive", "discountStartsAt", "discountExpiresAt");
