ALTER TABLE "Coupon"
ADD COLUMN "startsAt" TIMESTAMP(3),
ADD COLUMN "audienceRule" TEXT,
ADD COLUMN "audiencePercent" INTEGER,
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX "Coupon_startsAt_idx" ON "Coupon"("startsAt");
CREATE INDEX "Coupon_expiresAt_idx" ON "Coupon"("expiresAt");
