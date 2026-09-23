import type {NextRequest} from "next/server";
import {NextResponse} from "next/server";
import {Prisma, PaymentMethod} from "@prisma/client";
import {getServerSession} from "next-auth";
import type {Session} from "next-auth";
import {createHash, randomBytes} from "crypto";
import {hash} from "bcryptjs";

import {authOptions} from "@/lib/auth";
import {calculateCartPricing} from "@/lib/cart-pricing";
import {selectBestCheckoutDiscount} from "@/lib/checkout-discounts";
import {
  automaticCouponSelect,
  automaticCouponWhere,
  couponCodeWhere,
  normalizeCouponCode,
  rankAutomaticCouponDiscounts
} from "@/lib/coupon-discounts";
import {validateCsrfToken, csrfCookieName} from "@/lib/csrf";
import {sendOrderPlacedEmails} from "@/lib/order-email";
import {prisma} from "@/lib/prisma";

type OrderItemInput = {
  variantId?: unknown;
  collectionId?: unknown;
  quantity: unknown;
};

type CheckoutPayload = {
  csrfToken?: unknown;
  email?: unknown;
  firstName?: unknown;
  lastName?: unknown;
  address?: unknown;
  apartment?: unknown;
  city?: unknown;
  governorate?: unknown;
  postalCode?: unknown;
  phone?: unknown;
  notes?: unknown;
  paymentMethod?: unknown;
  billingAddress?: unknown;
  couponCode?: unknown;
  items?: unknown;
};

const egyptGovernorates = new Set([
  "Alexandria",
  "Aswan",
  "Asyut",
  "Beheira",
  "Beni Suef",
  "Cairo",
  "Dakahlia",
  "Damietta",
  "Faiyum",
  "Gharbia",
  "Giza",
  "Ismailia",
  "Kafr El Sheikh",
  "Luxor",
  "Matruh",
  "Minya",
  "Monufia",
  "New Valley",
  "North Sinai",
  "Port Said",
  "Qalyubia",
  "Qena",
  "Red Sea",
  "Sharqia",
  "Sohag",
  "South Sinai",
  "Suez"
]);

const deniedSpecialCharacters = /[<>{}[\]$;'"`|\\]/;
const namePattern = /^[\p{L}\s-]+$/u;
const addressPattern = /^[\p{L}\p{N}\s.,/-]+$/u;
const phonePattern = /^\+?[0-9\s-]{8,18}$/;
const postalPattern = /^[0-9-]{3,12}$/;

function asString(value: unknown) {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
}

function validateText(
  value: unknown,
  label: string,
  options: {
    max: number;
    min?: number;
    pattern?: RegExp;
    required?: boolean;
  }
) {
  const text = asString(value);

  if (!text) {
    if (options.required === false) return "";
    throw new Error(`${label} is required`);
  }

  if (text.length < (options.min ?? 1) || text.length > options.max) {
    throw new Error(`${label} has an invalid length`);
  }

  if (deniedSpecialCharacters.test(text)) {
    throw new Error(`${label} contains unsupported characters`);
  }

  if (options.pattern && !options.pattern.test(text)) {
    throw new Error(`${label} contains unsupported characters`);
  }

  return text;
}

function validateCheckoutPayload(payload: CheckoutPayload) {
  const email = validateText(payload.email, "Email", {
    max: 120,
    pattern: /^[^\s@<>"'`;]+@[^\s@<>"'`;]+\.[^\s@<>"'`;]+$/
  }).toLowerCase();
  const firstName = validateText(payload.firstName, "First name", {
    max: 40,
    min: 2,
    pattern: namePattern
  });
  const lastName = validateText(payload.lastName, "Last name", {
    max: 40,
    min: 2,
    pattern: namePattern
  });
  const address = validateText(payload.address, "Address", {
    max: 120,
    min: 5,
    pattern: addressPattern
  });
  const apartment = validateText(payload.apartment, "Apartment", {
    max: 80,
    pattern: addressPattern,
    required: false
  });
  const city = validateText(payload.city, "City", {
    max: 50,
    min: 2,
    pattern: namePattern
  });
  const governorate = validateText(payload.governorate, "Governorate", {
    max: 40,
    min: 2,
    pattern: namePattern
  });
  const postalCode = validateText(payload.postalCode, "Postal code", {
    max: 12,
    pattern: postalPattern,
    required: false
  });
  const phone = validateText(payload.phone, "Phone", {
    max: 18,
    min: 8,
    pattern: phonePattern
  });
  const notes = validateText(payload.notes, "Additional instructions", {
    max: 300,
    pattern: addressPattern,
    required: false
  });
  const rawCouponCode = asString(payload.couponCode);
  const couponCode = normalizeCouponCode(rawCouponCode);

  if (rawCouponCode && couponCode.length < 4) {
    throw new Error("Coupon code is invalid");
  }

  if (!egyptGovernorates.has(governorate)) {
    throw new Error("Governorate is not supported");
  }

  if (payload.paymentMethod !== "CASH_ON_DELIVERY" && payload.paymentMethod !== "INSTAPAY") {
    throw new Error("Selected payment method is not available yet");
  }

  if (payload.billingAddress !== "same") {
    throw new Error("Different billing address is not available yet");
  }

  if (!Array.isArray(payload.items) || payload.items.length < 1) {
    throw new Error("Your cart is empty");
  }

  if (payload.items.length > 20) {
    throw new Error("Too many cart items");
  }

  const items = payload.items.map((item) => {
    const orderItem = item as OrderItemInput;
    const quantity = Number(orderItem.quantity);

    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10) {
      throw new Error("Cart item quantity is invalid");
    }

    const collectionId = typeof orderItem.collectionId === "string"
      ? orderItem.collectionId.trim()
      : "";

    if (collectionId) {
      if (!/^[A-Za-z0-9_-]{8,64}$/.test(collectionId)) {
        throw new Error("Cart item is invalid");
      }

      return {kind: "collection" as const, collectionId, quantity};
    }

    const variantId = validateText(orderItem.variantId, "Cart item", {
      max: 64,
      min: 8,
      pattern: /^[A-Za-z0-9_-]+$/
    });

    return {kind: "fragrance" as const, variantId, quantity};
  });

  return {
    email,
    firstName,
    lastName,
    address,
    apartment,
    city,
    governorate,
    postalCode,
    phone,
    notes,
    couponCode,
    paymentMethod: payload.paymentMethod as PaymentMethod,
    items
  };
}

export async function POST(request: NextRequest) {
  const session = (await getServerSession(authOptions)) as Session | null;

  let payload: CheckoutPayload;

  try {
    payload = (await request.json()) as CheckoutPayload;
  } catch {
    return NextResponse.json({message: "Invalid checkout request"}, {status: 400});
  }

  if (
    !validateCsrfToken(
      asString(payload.csrfToken),
      request.cookies.get(csrfCookieName)?.value
    )
  ) {
    return NextResponse.json({message: "Invalid checkout token"}, {status: 403});
  }

  let checkout;

  try {
    checkout = validateCheckoutPayload(payload);
  } catch (error) {
    return NextResponse.json(
      {message: error instanceof Error ? error.message : "Invalid checkout details"},
      {status: 400}
    );
  }

  try {
    const claimToken = checkout.paymentMethod === PaymentMethod.INSTAPAY
      ? randomBytes(32).toString("hex")
      : null;
    const guestPasswordHash = session?.user?.id
      ? ""
      : await hash(randomBytes(32).toString("hex"), 12);

    const order = await prisma.$transaction(async (tx) => {
      const sessionUser = session?.user?.id
        ? await tx.user.findUnique({
            where: {id: session.user.id},
            select: {id: true}
          })
        : null;
      const customerId = sessionUser?.id ??
        (
          await tx.user.upsert({
            where: {email: checkout.email},
            update: {
              name: `${checkout.firstName} ${checkout.lastName}`.trim()
            },
            create: {
              email: checkout.email,
              name: `${checkout.firstName} ${checkout.lastName}`.trim(),
              passwordHash: guestPasswordHash
            },
            select: {id: true}
          })
        ).id;

      const pricingTime = new Date();
      const pricing = await calculateCartPricing(
        tx,
        checkout.items,
        {
          now: pricingTime,
          requireAll: true
        }
      );
      const subtotal = Number(pricing.originalSubtotal);
      let couponDiscount:
        | ReturnType<typeof rankAutomaticCouponDiscounts>[number]
        | undefined;
      let explicitCouponId: string | null = null;

      if (checkout.couponCode) {
        const explicitCoupon = await tx.coupon.findFirst({
          where: couponCodeWhere(checkout.couponCode, customerId, pricingTime),
          select: automaticCouponSelect
        });
        couponDiscount = explicitCoupon
          ? rankAutomaticCouponDiscounts([explicitCoupon], subtotal)[0]
          : undefined;

        if (!couponDiscount) {
          throw new Error("This coupon is invalid or unavailable for this order");
        }
        explicitCouponId = couponDiscount.coupon.id;
      }

      const automaticCoupons = await tx.coupon.findMany({
        where: automaticCouponWhere(customerId, pricingTime),
        select: automaticCouponSelect
      });
      let accountDiscounts = rankAutomaticCouponDiscounts(
        automaticCoupons,
        subtotal
      ).filter((candidate) => candidate.coupon.id !== explicitCouponId);
      let selectedDiscount = selectBestCheckoutDiscount({
        productDiscountAmount: Number(pricing.productDiscountAmount),
        couponDiscount,
        accountDiscounts
      });

      while (selectedDiscount && selectedDiscount.source !== "PRODUCT") {
        const eligibilityWhere =
          selectedDiscount.source === "COUPON"
            ? couponCodeWhere(checkout.couponCode, customerId, pricingTime)
            : automaticCouponWhere(customerId, pricingTime);
        const reservation = await tx.coupon.updateMany({
          where: {
            id: selectedDiscount.coupon.id,
            ...eligibilityWhere,
            ...(selectedDiscount.coupon.maxUses === null
              ? {}
              : {usedCount: {lt: selectedDiscount.coupon.maxUses}})
          },
          data: {usedCount: {increment: 1}}
        });

        if (reservation.count === 1) break;

        if (selectedDiscount.source === "COUPON") {
          couponDiscount = undefined;
        } else {
          const unavailableCouponId = selectedDiscount.coupon.id;
          accountDiscounts = accountDiscounts.filter(
            (candidate) => candidate.coupon.id !== unavailableCouponId
          );
        }

        selectedDiscount = selectBestCheckoutDiscount({
          productDiscountAmount: Number(pricing.productDiscountAmount),
          couponDiscount,
          accountDiscounts
        });
      }

      const orderItems = [];

      for (const line of pricing.lines) {
        const quantity = line.quantity;

        if (line.stock < quantity) {
          throw new Error(`${line.fragranceNameEn} is low on stock`);
        }

        for (const inventoryVariantId of line.inventoryVariantIds) {
          const stockUpdate = await tx.fragranceVariant.updateMany({
            where: {
              id: inventoryVariantId,
              stock: {gte: quantity}
            },
            data: {
              stock: {decrement: quantity}
            }
          });

          if (stockUpdate.count !== 1) {
            throw new Error(`${line.fragranceNameEn} is low on stock`);
          }
        }

        orderItems.push({
          variantId: line.kind === "fragrance" ? line.variantId : null,
          collectionId: line.collectionId,
          fragranceNameEn: line.fragranceNameEn,
          fragranceNameAr: line.fragranceNameAr,
          sizeML: line.sizeML,
          quantity,
          reservedVariantIds: line.inventoryVariantIds,
          unitPrice: new Prisma.Decimal(line.originalPrice),
          totalPrice: new Prisma.Decimal(line.originalLineTotal)
        });
      }

      const discountAmount = selectedDiscount?.discountAmount ?? 0;
      const total = Math.max(0, subtotal - discountAmount);
      const appliedCouponId =
        selectedDiscount && selectedDiscount.source !== "PRODUCT"
          ? selectedDiscount.coupon.id
          : null;

      return tx.order.create({
        data: {
          userId: customerId,
          paymentMethod: checkout.paymentMethod,
          instapayClaimTokenHash: claimToken
            ? createHash("sha256").update(claimToken).digest("hex")
            : null,
          subtotal: new Prisma.Decimal(subtotal.toFixed(2)),
          discountAmount: new Prisma.Decimal(discountAmount.toFixed(2)),
          total: new Prisma.Decimal(total.toFixed(2)),
          couponId: appliedCouponId,
          notes: checkout.notes || null,
          addressSnapshot: {
            email: checkout.email,
            firstName: checkout.firstName,
            lastName: checkout.lastName,
            address: checkout.address,
            apartment: checkout.apartment || null,
            city: checkout.city,
            governorate: checkout.governorate,
            postalCode: checkout.postalCode || null,
            phone: checkout.phone,
            country: "Egypt"
          },
          items: {
            create: orderItems
          }
        },
        select: {
          id: true,
          total: true
        }
      });
    });

    try {
      await sendOrderPlacedEmails(order.id, claimToken);
    } catch (error) {
      console.error(
        "Order was placed, but order emails could not be prepared:",
        error instanceof Error ? error.message : "Unknown email error"
      );
    }

    return NextResponse.json({
      message: "Order placed",
      orderId: order.id,
      total: order.total.toString(),
      claimToken
    });
  } catch (error) {
    return NextResponse.json(
      {message: error instanceof Error ? error.message : "Unable to place order"},
      {status: 409}
    );
  }
}
