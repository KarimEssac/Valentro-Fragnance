CREATE INDEX IF NOT EXISTS "User_role_createdAt_idx"
ON "User"("role", "createdAt");

CREATE INDEX IF NOT EXISTS "Announcement_createdAt_idx"
ON "Announcement"("createdAt");

CREATE INDEX IF NOT EXISTS "Collection_isOffer_position_createdAt_idx"
ON "Collection"("isOffer", "position", "createdAt");

CREATE INDEX IF NOT EXISTS "Fragrance_position_createdAt_idx"
ON "Fragrance"("position", "createdAt");

CREATE INDEX IF NOT EXISTS "Review_createdAt_idx"
ON "Review"("createdAt");

CREATE INDEX IF NOT EXISTS "FragranceVariant_stock_idx"
ON "FragranceVariant"("stock");

CREATE INDEX IF NOT EXISTS "Coupon_createdAt_idx"
ON "Coupon"("createdAt");

CREATE INDEX IF NOT EXISTS "Order_createdAt_idx"
ON "Order"("createdAt");

CREATE INDEX IF NOT EXISTS "Order_status_createdAt_idx"
ON "Order"("status", "createdAt");
