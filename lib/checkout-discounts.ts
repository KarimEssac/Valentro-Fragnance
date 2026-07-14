import type {
  AutomaticCoupon,
  AutomaticCouponDiscount
} from "@/lib/coupon-discounts";

export type CheckoutDiscountSource = "PRODUCT" | "COUPON" | "ACCOUNT";

export type CheckoutDiscountSelection =
  | {
      source: "PRODUCT";
      discountAmount: number;
      coupon: null;
    }
  | {
      source: "COUPON" | "ACCOUNT";
      discountAmount: number;
      coupon: AutomaticCoupon;
    };

const sourcePriority: Record<CheckoutDiscountSource, number> = {
  PRODUCT: 0,
  COUPON: 1,
  ACCOUNT: 2
};

function roundedMoney(value: number) {
  return Math.round(value * 100) / 100;
}

export function selectBestCheckoutDiscount({
  productDiscountAmount,
  couponDiscount,
  accountDiscounts = []
}: {
  productDiscountAmount: number;
  couponDiscount?: AutomaticCouponDiscount;
  accountDiscounts?: AutomaticCouponDiscount[];
}): CheckoutDiscountSelection | null {
  const candidates: CheckoutDiscountSelection[] = [];
  const productAmount = roundedMoney(productDiscountAmount);

  if (Number.isFinite(productAmount) && productAmount > 0) {
    candidates.push({
      source: "PRODUCT",
      discountAmount: productAmount,
      coupon: null
    });
  }

  if (couponDiscount?.discountAmount) {
    candidates.push({
      source: "COUPON",
      discountAmount: roundedMoney(couponDiscount.discountAmount),
      coupon: couponDiscount.coupon
    });
  }

  accountDiscounts.forEach((discount) => {
    if (discount.discountAmount <= 0) return;
    candidates.push({
      source: "ACCOUNT",
      discountAmount: roundedMoney(discount.discountAmount),
      coupon: discount.coupon
    });
  });

  return candidates.sort(
    (a, b) =>
      b.discountAmount - a.discountAmount ||
      sourcePriority[a.source] - sourcePriority[b.source] ||
      (a.coupon?.code ?? "").localeCompare(b.coupon?.code ?? "") ||
      (a.coupon?.id ?? "").localeCompare(b.coupon?.id ?? "")
  )[0] ?? null;
}
