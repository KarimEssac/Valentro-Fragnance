import type {Prisma} from "@prisma/client";

import {calculateProductPrice} from "@/lib/product-discounts";

export type CartPricingInput = {
  variantId: string;
  quantity: number;
};

type CartPricingClient = Pick<Prisma.TransactionClient, "fragranceVariant">;

export type ServerCartPricingLine = {
  fragranceId: string;
  fragranceNameEn: string;
  fragranceNameAr: string;
  variantId: string;
  sizeML: number;
  stock: number;
  quantity: number;
  originalPrice: string;
  price: string;
  originalLineTotal: string;
  lineTotal: string;
  productDiscountAmount: string;
  discount: ReturnType<typeof calculateProductPrice>["discount"];
};

export type ServerCartPricingQuote = {
  lines: ServerCartPricingLine[];
  unavailableVariantIds: string[];
  originalSubtotal: string;
  subtotal: string;
  productDiscountAmount: string;
};

export function cartPricingWithoutProductDiscounts(
  pricing: ServerCartPricingQuote
): ServerCartPricingQuote {
  return {
    ...pricing,
    lines: pricing.lines.map((line) => ({
      ...line,
      price: line.originalPrice,
      lineTotal: line.originalLineTotal,
      productDiscountAmount: "0.00",
      discount: null
    })),
    subtotal: pricing.originalSubtotal,
    productDiscountAmount: "0.00"
  };
}

function moneyFromCents(cents: number) {
  return (cents / 100).toFixed(2);
}

export function parseCartPricingItems(value: unknown): CartPricingInput[] {
  if (!Array.isArray(value)) throw new Error("Your cart is empty");
  if (value.length < 1) return [];
  if (value.length > 20) throw new Error("Too many cart items");

  const quantities = new Map<string, number>();

  for (const valueItem of value) {
    if (!valueItem || typeof valueItem !== "object" || Array.isArray(valueItem)) {
      throw new Error("Cart item is invalid");
    }

    const item = valueItem as {variantId?: unknown; quantity?: unknown};
    const variantId = typeof item.variantId === "string" ? item.variantId.trim() : "";
    const quantity = Number(item.quantity);

    if (!/^[A-Za-z0-9_-]{8,64}$/.test(variantId)) {
      throw new Error("Cart item is invalid");
    }
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10) {
      throw new Error("Cart item quantity is invalid");
    }

    const combinedQuantity = (quantities.get(variantId) ?? 0) + quantity;
    if (combinedQuantity > 10) throw new Error("Cart item quantity is invalid");
    quantities.set(variantId, combinedQuantity);
  }

  return Array.from(quantities, ([variantId, quantity]) => ({variantId, quantity}));
}

export async function calculateCartPricing(
  client: CartPricingClient,
  inputs: CartPricingInput[],
  options: {now?: Date; requireAll?: boolean} = {}
): Promise<ServerCartPricingQuote> {
  if (inputs.length === 0) {
    return {
      lines: [],
      unavailableVariantIds: [],
      originalSubtotal: "0.00",
      subtotal: "0.00",
      productDiscountAmount: "0.00"
    };
  }

  const quantities = new Map(inputs.map((item) => [item.variantId, item.quantity]));
  const variants = await client.fragranceVariant.findMany({
    where: {
      id: {in: Array.from(quantities.keys())},
      fragrance: {isPublished: true}
    },
    select: {
      id: true,
      fragranceId: true,
      sizeML: true,
      price: true,
      stock: true,
      fragrance: {
        select: {
          nameEn: true,
          nameAr: true,
          discountType: true,
          discountValue: true,
          discountIsActive: true,
          discountStartsAt: true,
          discountExpiresAt: true
        }
      }
    }
  });
  const availableIds = new Set(variants.map((variant) => variant.id));
  const unavailableVariantIds = inputs
    .map((item) => item.variantId)
    .filter((variantId) => !availableIds.has(variantId));

  if (options.requireAll && unavailableVariantIds.length > 0) {
    throw new Error("One or more cart items are no longer available");
  }

  const now = options.now ?? new Date();
  let originalSubtotalCents = 0;
  let subtotalCents = 0;

  const lines = variants.map((variant) => {
    const quantity = quantities.get(variant.id) ?? 0;
    const productPrice = calculateProductPrice(variant.price, variant.fragrance, now);
    const originalUnitCents = Math.round(Number(productPrice.originalPrice) * 100);
    const unitCents = Math.round(Number(productPrice.price) * 100);
    const originalLineCents = originalUnitCents * quantity;
    const lineCents = unitCents * quantity;

    originalSubtotalCents += originalLineCents;
    subtotalCents += lineCents;

    return {
      fragranceId: variant.fragranceId,
      fragranceNameEn: variant.fragrance.nameEn,
      fragranceNameAr: variant.fragrance.nameAr,
      variantId: variant.id,
      sizeML: variant.sizeML,
      stock: variant.stock,
      quantity,
      originalPrice: productPrice.originalPrice,
      price: productPrice.price,
      originalLineTotal: moneyFromCents(originalLineCents),
      lineTotal: moneyFromCents(lineCents),
      productDiscountAmount: moneyFromCents(originalLineCents - lineCents),
      discount: productPrice.discount
    };
  });

  return {
    lines,
    unavailableVariantIds,
    originalSubtotal: moneyFromCents(originalSubtotalCents),
    subtotal: moneyFromCents(subtotalCents),
    productDiscountAmount: moneyFromCents(originalSubtotalCents - subtotalCents)
  };
}
