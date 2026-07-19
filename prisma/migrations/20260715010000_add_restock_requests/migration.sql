CREATE TABLE "RestockRequest" (
  "id" TEXT NOT NULL,
  "variantId" TEXT NOT NULL,
  "userId" TEXT,
  "email" TEXT NOT NULL,
  "locale" TEXT NOT NULL DEFAULT 'en',
  "requestCount" INTEGER NOT NULL DEFAULT 1,
  "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "notifiedAt" TIMESTAMP(3),
  "notificationCount" INTEGER NOT NULL DEFAULT 0,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "RestockRequest_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RestockRequest_variantId_email_key"
  ON "RestockRequest"("variantId", "email");

CREATE INDEX "RestockRequest_variantId_notifiedAt_idx"
  ON "RestockRequest"("variantId", "notifiedAt");

CREATE INDEX "RestockRequest_userId_idx"
  ON "RestockRequest"("userId");

CREATE INDEX "RestockRequest_requestedAt_idx"
  ON "RestockRequest"("requestedAt");

ALTER TABLE "RestockRequest"
  ADD CONSTRAINT "RestockRequest_variantId_fkey"
  FOREIGN KEY ("variantId") REFERENCES "FragranceVariant"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RestockRequest"
  ADD CONSTRAINT "RestockRequest_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
