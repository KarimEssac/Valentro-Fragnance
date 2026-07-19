ALTER TABLE "FragranceIngredient"
  ADD COLUMN "category" TEXT NOT NULL DEFAULT 'Base & Accent Notes';

UPDATE "FragranceIngredient"
SET "category" = CASE
  WHEN LOWER("nameEn") LIKE '%bergamot%'
    OR LOWER("nameEn") LIKE '%mandarin%'
    OR LOWER("nameEn") LIKE '%citron%'
    OR LOWER("nameEn") LIKE '%grapefruit%'
    OR LOWER("nameEn") LIKE '%lemon%'
    OR LOWER("nameEn") LIKE '%orange%'
  THEN 'Citrus & Fresh'
  WHEN LOWER("nameEn") LIKE '%vanilla%'
  THEN 'Sweet & Gourmand'
  WHEN LOWER("nameEn") LIKE '%jasmine%'
  THEN 'Herbal & Floral'
  WHEN LOWER("nameEn") LIKE '%oud%'
    OR LOWER("nameEn") LIKE '%wood%'
  THEN 'Woody & Earthy'
  WHEN LOWER("nameEn") LIKE '%saffron%'
  THEN 'Spicy & Aromatic'
  WHEN LOWER("nameEn") LIKE '%musk%'
    OR LOWER("nameEn") LIKE '%amber%'
    OR LOWER("nameEn") LIKE '%labdanum%'
  THEN 'Base & Accent Notes'
  ELSE 'Base & Accent Notes'
END;

CREATE INDEX "FragranceIngredient_category_idx"
  ON "FragranceIngredient"("category");
