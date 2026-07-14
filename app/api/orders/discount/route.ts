import {NextResponse} from "next/server";
import type {NextRequest} from "next/server";
import {getServerSession} from "next-auth";
import type {Session} from "next-auth";

import {authOptions} from "@/lib/auth";
import {
  calculateCartPricing,
  cartPricingWithoutProductDiscounts,
  parseCartPricingItems,
  type ServerCartPricingQuote
} from "@/lib/cart-pricing";
import {
  selectBestCheckoutDiscount,
  type CheckoutDiscountSelection
} from "@/lib/checkout-discounts";
import {
  automaticCouponSelect,
  automaticCouponWhere,
  couponCodeWhere,
  normalizeCouponCode,
  rankAutomaticCouponDiscounts
} from "@/lib/coupon-discounts";
import {csrfCookieName, validateCsrfToken} from "@/lib/csrf";
import {prisma} from "@/lib/prisma";

type DiscountRequest = {
  csrfToken?: unknown;
  items?: unknown;
  email?: unknown;
  couponCode?: unknown;
};

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function discountResponse(
  pricing: ServerCartPricingQuote,
  selection: CheckoutDiscountSelection | null
) {
  const selectedPricing =
    selection?.source === "PRODUCT"
      ? pricing
      : cartPricingWithoutProductDiscounts(pricing);
  const subtotal = Number(selectedPricing.subtotal);
  const discount =
    selection && selection.source !== "PRODUCT"
      ? {
          code: selection.coupon.code,
          type: selection.coupon.type,
          value: selection.coupon.value.toString(),
          discountAmount: selection.discountAmount,
          source: selection.source
        }
      : null;
  const discountAmount = discount?.discountAmount ?? 0;

  return {
    discount,
    selection: selection
      ? {
          source: selection.source,
          discountAmount: selection.discountAmount,
          code: selection.coupon?.code ?? null
        }
      : null,
    pricing: selectedPricing,
    subtotal,
    total: Math.max(0, subtotal - discountAmount)
  };
}

export async function POST(request: NextRequest) {
  const session = (await getServerSession(authOptions)) as Session | null;
  let payload: DiscountRequest;

  try {
    payload = (await request.json()) as DiscountRequest;
  } catch {
    return NextResponse.json({message: "Invalid discount request"}, {status: 400});
  }

  if (
    !validateCsrfToken(
      text(payload.csrfToken),
      request.cookies.get(csrfCookieName)?.value
    )
  ) {
    return NextResponse.json({message: "Invalid checkout token"}, {status: 403});
  }

  let pricing;

  try {
    const items = parseCartPricingItems(payload.items);
    pricing = await calculateCartPricing(prisma, items, {requireAll: true});
  } catch (error) {
    return NextResponse.json(
      {message: error instanceof Error ? error.message : "Unable to price this cart"},
      {status: 400}
    );
  }

  const originalSubtotal = Number(pricing.originalSubtotal);

  if (originalSubtotal === 0) {
    return NextResponse.json(discountResponse(pricing, null));
  }

  const email = text(payload.email).toLowerCase();
  const emailIsValid =
    email.length <= 120 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const emailUser =
    !session?.user?.id && emailIsValid
      ? await prisma.user.findUnique({where: {email}, select: {id: true}})
      : null;
  const userId = session?.user?.id ?? emailUser?.id ?? null;
  const rawCouponCode = text(payload.couponCode);
  const couponCode = normalizeCouponCode(rawCouponCode);
  const accountCoupons = userId
    ? await prisma.coupon.findMany({
        where: automaticCouponWhere(userId),
        select: automaticCouponSelect
      })
    : [];
  let accountDiscounts = rankAutomaticCouponDiscounts(
    accountCoupons,
    originalSubtotal
  );
  let couponDiscount:
    | ReturnType<typeof rankAutomaticCouponDiscounts>[number]
    | undefined;
  let couponError = "";

  if (rawCouponCode && !couponCode) {
    couponError = "Coupon codes use 4 to 32 letters, numbers, dashes, or underscores";
  }

  if (couponCode) {
    const coupon = await prisma.coupon.findFirst({
      where: couponCodeWhere(couponCode, userId),
      select: automaticCouponSelect
    });
    couponDiscount = coupon
      ? rankAutomaticCouponDiscounts([coupon], originalSubtotal)[0]
      : undefined;

    if (!couponDiscount) {
      couponError = "This coupon is invalid or unavailable for this order";
    } else {
      const explicitCouponId = couponDiscount.coupon.id;
      accountDiscounts = accountDiscounts.filter(
        (candidate) => candidate.coupon.id !== explicitCouponId
      );
    }
  }

  const selection = selectBestCheckoutDiscount({
    productDiscountAmount: Number(pricing.productDiscountAmount),
    couponDiscount: couponError ? undefined : couponDiscount,
    accountDiscounts
  });
  const response = discountResponse(pricing, selection);

  if (couponError) {
    return NextResponse.json(
      {...response, message: couponError},
      {status: 400}
    );
  }

  return NextResponse.json(response);
}
