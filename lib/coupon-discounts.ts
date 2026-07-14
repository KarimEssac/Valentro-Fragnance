import {CouponApplicability, CouponType, Prisma} from "@prisma/client";

export const automaticCouponSelect = {
  id: true,
  code: true,
  type: true,
  value: true,
  minOrderAmount: true,
  maxUses: true,
  usedCount: true
} satisfies Prisma.CouponSelect;

export type AutomaticCoupon = Prisma.CouponGetPayload<{
  select: typeof automaticCouponSelect;
}>;

export type AutomaticCouponDiscount = {
  coupon: AutomaticCoupon;
  discountAmount: number;
};

export function automaticCouponWhere(
  userId: string,
  now = new Date()
): Prisma.CouponWhereInput {
  return {
    isActive: true,
    applicableTo: CouponApplicability.SPECIFIC_USERS,
    users: {some: {id: userId}},
    AND: [
      {OR: [{startsAt: null}, {startsAt: {lte: now}}]},
      {OR: [{expiresAt: null}, {expiresAt: {gte: now}}]}
    ]
  };
}

export function normalizeCouponCode(value: unknown) {
  if (typeof value !== "string") return "";
  const code = value.trim().toUpperCase();
  return /^[A-Z0-9_-]{4,32}$/.test(code) ? code : "";
}

export function couponCodeWhere(
  code: string,
  userId: string | null,
  now = new Date()
): Prisma.CouponWhereInput {
  const audiences: Prisma.CouponWhereInput[] = [
    {applicableTo: CouponApplicability.ALL}
  ];

  if (userId) {
    audiences.push({
      applicableTo: CouponApplicability.SPECIFIC_USERS,
      users: {some: {id: userId}}
    });
  }

  return {
    code,
    isActive: true,
    AND: [
      {OR: [{startsAt: null}, {startsAt: {lte: now}}]},
      {OR: [{expiresAt: null}, {expiresAt: {gte: now}}]},
      {OR: audiences}
    ]
  };
}

export function rankAutomaticCouponDiscounts(
  coupons: AutomaticCoupon[],
  subtotal: number
): AutomaticCouponDiscount[] {
  const subtotalInCents = Math.round(subtotal * 100);

  return coupons
    .filter((coupon) => {
      const meetsMinimum =
        coupon.minOrderAmount === null ||
        subtotalInCents >= Math.round(Number(coupon.minOrderAmount) * 100);
      const hasUsesRemaining =
        coupon.maxUses === null || coupon.usedCount < coupon.maxUses;
      return meetsMinimum && hasUsesRemaining;
    })
    .map((coupon) => {
      const rawDiscount =
        coupon.type === CouponType.PERCENTAGE
          ? subtotal * (Number(coupon.value) / 100)
          : Number(coupon.value);

      return {
        coupon,
        discountAmount: Math.min(subtotal, Math.round(rawDiscount * 100) / 100)
      };
    })
    .filter((candidate) => candidate.discountAmount > 0)
    .sort(
      (a, b) =>
        b.discountAmount - a.discountAmount ||
        a.coupon.code.localeCompare(b.coupon.code) ||
        a.coupon.id.localeCompare(b.coupon.id)
    );
}
