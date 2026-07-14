export type ProductDiscountType = "PERCENTAGE" | "FIXED";

type NumericValue = number | string | {toString(): string};
type DateValue = Date | string;

export type ProductDiscountConfig = {
  discountType: ProductDiscountType | null;
  discountValue: NumericValue | null;
  discountIsActive: boolean;
  discountStartsAt: DateValue | null;
  discountExpiresAt: DateValue | null;
};

export type ActiveProductDiscount = {
  type: ProductDiscountType;
  value: string;
  startsAt: string | null;
  expiresAt: string | null;
};

export type ProductPrice = {
  originalPrice: string;
  price: string;
  discountAmount: string;
  discount: ActiveProductDiscount | null;
};

function dateValue(value: DateValue | null) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function moneyInCents(value: NumericValue) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, Math.round(number * 100)) : 0;
}

function moneyFromCents(value: number) {
  return (value / 100).toFixed(2);
}

export function resolveActiveProductDiscount(
  config: ProductDiscountConfig,
  now = new Date()
): ActiveProductDiscount | null {
  if (!config.discountIsActive || !config.discountType || config.discountValue === null) {
    return null;
  }

  const value = Number(config.discountValue);
  if (!Number.isFinite(value) || value <= 0) return null;
  if (config.discountType === "PERCENTAGE" && value > 100) return null;

  const startsAt = dateValue(config.discountStartsAt);
  const expiresAt = dateValue(config.discountExpiresAt);
  if (startsAt && startsAt.getTime() > now.getTime()) return null;
  if (expiresAt && expiresAt.getTime() <= now.getTime()) return null;

  return {
    type: config.discountType,
    value: value.toFixed(2),
    startsAt: startsAt?.toISOString() ?? null,
    expiresAt: expiresAt?.toISOString() ?? null
  };
}

export function calculateProductPrice(
  basePrice: NumericValue,
  config: ProductDiscountConfig,
  now = new Date()
): ProductPrice {
  const originalCents = moneyInCents(basePrice);
  const discount = resolveActiveProductDiscount(config, now);

  if (!discount || originalCents === 0) {
    return {
      originalPrice: moneyFromCents(originalCents),
      price: moneyFromCents(originalCents),
      discountAmount: "0.00",
      discount: null
    };
  }

  const requestedDiscountCents =
    discount.type === "PERCENTAGE"
      ? Math.round(originalCents * (Number(discount.value) / 100))
      : moneyInCents(discount.value);
  const discountCents = Math.min(originalCents, requestedDiscountCents);

  return {
    originalPrice: moneyFromCents(originalCents),
    price: moneyFromCents(originalCents - discountCents),
    discountAmount: moneyFromCents(discountCents),
    discount
  };
}

export function productDiscountBadge(
  discount: ActiveProductDiscount,
  formatAmount: (amount: number) => string
) {
  return discount.type === "PERCENTAGE"
    ? `${Number(discount.value)}% off`
    : `${formatAmount(Number(discount.value))} off`;
}
