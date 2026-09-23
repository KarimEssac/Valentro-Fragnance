ALTER TYPE "PaymentMethod" ADD VALUE 'INSTAPAY';

ALTER TABLE "Order"
  ADD COLUMN "instapayClaimedAt" TIMESTAMP(3),
  ADD COLUMN "instapayVerifiedAt" TIMESTAMP(3),
  ADD COLUMN "instapayClaimTokenHash" TEXT,
  ADD COLUMN "paymentMethodChangedAt" TIMESTAMP(3),
  ADD COLUMN "paymentMethodChangeReason" TEXT;

ALTER TABLE "OrderItem" ADD COLUMN "reservedVariantIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

UPDATE "OrderItem"
SET "reservedVariantIds" = ARRAY["variantId"]
WHERE "variantId" IS NOT NULL;
