import type {Prisma} from "@prisma/client";

import {collectionCartKey} from "@/lib/cart-items";
import {calculateProductPrice} from "@/lib/product-discounts";

export type CartPricingInput =
  | {
      kind: "fragrance";
      variantId: string;
      quantity: number;
    }
  | {
      kind: "collection";
      collectionId: string;
      quantity: number;
    };

type CartPricingLineKind = "fragrance" | "collection";

type CartPricingRequestItem = {
  variantId?: unknown;
  collectionId?: unknown;
  quantity: number;
};

type CartPricingClient = Pick<Prisma.TransactionClient, "fragranceVariant" | "collection">;

export type ServerCartPricingLine = {
  kind: CartPricingLineKind;
  fragranceId: string;
  fragranceNameEn: string;
  fragranceNameAr: string;
  variantId: string;
  collectionId: string | null;
  sizeML: number;
  stock: number;
  quantity: number;
  originalPrice: string;
  price: string;
  originalLineTotal: string;
  lineTotal: string;
  productDiscountAmount: string;
  discount: ReturnType<typeof calculateProductPrice>["discount"];
  inventoryVariantIds: string[];
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

    const item = valueItem as CartPricingRequestItem;
    const quantity = Number(item.quantity);

    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10) {
      throw new Error("Cart item is invalid");
    }

    if (typeof item.collectionId === "string" && item.collectionId.trim()) {
      const collectionId = item.collectionId.trim();
      if (!/^[A-Za-z0-9_-]{8,64}$/.test(collectionId)) {
        throw new Error("Cart item is invalid");
      }

      const key = `collection:${collectionId}`;
      const combinedQuantity = (quantities.get(key) ?? 0) + quantity;
      if (combinedQuantity > 10) throw new Error("Cart item quantity is invalid");
      quantities.set(key, combinedQuantity);
      continue;
    }

    const variantId = typeof item.variantId === "string" ? item.variantId.trim() : "";
    if (!/^[A-Za-z0-9_-]{8,64}$/.test(variantId)) {
      throw new Error("Cart item is invalid");
    }

    const combinedQuantity = (quantities.get(variantId) ?? 0) + quantity;
    if (combinedQuantity > 10) throw new Error("Cart item quantity is invalid");
    quantities.set(variantId, combinedQuantity);
  }

  return Array.from(quantities, ([key, quantity]) =>
    key.startsWith("collection:")
      ? {kind: "collection" as const, collectionId: key.slice("collection:".length), quantity}
      : {kind: "fragrance" as const, variantId: key, quantity}
  );
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

  const variantQuantities = new Map(
    inputs
      .filter((item): item is Extract<CartPricingInput, {kind: "fragrance"}> => item.kind === "fragrance")
      .map((item) => [item.variantId, item.quantity])
  );
  const collectionQuantities = new Map(
    inputs
      .filter((item): item is Extract<CartPricingInput, {kind: "collection"}> => item.kind === "collection")
      .map((item) => [item.collectionId, item.quantity])
  );
  const variants = await client.fragranceVariant.findMany({
    where: {
      id: {in: Array.from(variantQuantities.keys())},
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
  const collections = await client.collection.findMany({
    where: {
      id: {in: Array.from(collectionQuantities.keys())},
      isOffer: true,
      isPublished: true
    },
    select: {
      id: true,
      slug: true,
      nameEn: true,
      nameAr: true,
      offerPrice: true,
      fragrances: {
        select: {
          fragrance: {
            select: {
              isPublished: true,
              variants: {
                orderBy: {price: "asc"},
                take: 1,
                select: {id: true, price: true, stock: true}
              }
            }
          }
        }
      }
    }
  });
  const availableCollectionIds = new Set(
    collections
      .filter((collection) => collection.offerPrice && collection.fragrances.length > 0)
      .filter((collection) =>
        collection.fragrances.every(
          ({fragrance}) => fragrance.isPublished && fragrance.variants[0]
        )
      )
      .map((collection) => collection.id)
  );
  const unavailableVariantIds = [
    ...Array.from(variantQuantities.keys()).filter((variantId) => !availableIds.has(variantId)),
    ...Array.from(collectionQuantities.keys())
      .filter((collectionId) => !availableCollectionIds.has(collectionId))
      .map(collectionCartKey)
  ];

  if (options.requireAll && unavailableVariantIds.length > 0) {
    throw new Error("One or more cart items are no longer available");
  }

  const now = options.now ?? new Date();
  let originalSubtotalCents = 0;
  let subtotalCents = 0;

  const variantLines = variants.map((variant) => {
    const quantity = variantQuantities.get(variant.id) ?? 0;
    const productPrice = calculateProductPrice(variant.price, variant.fragrance, now);
    const originalUnitCents = Math.round(Number(productPrice.originalPrice) * 100);
    const unitCents = Math.round(Number(productPrice.price) * 100);
    const originalLineCents = originalUnitCents * quantity;
    const lineCents = unitCents * quantity;

    originalSubtotalCents += originalLineCents;
    subtotalCents += lineCents;

    return {
      kind: "fragrance" as const,
      fragranceId: variant.fragranceId,
      fragranceNameEn: variant.fragrance.nameEn,
      fragranceNameAr: variant.fragrance.nameAr,
      variantId: variant.id,
      collectionId: null,
      sizeML: variant.sizeML,
      stock: variant.stock,
      quantity,
      originalPrice: productPrice.originalPrice,
      price: productPrice.price,
      originalLineTotal: moneyFromCents(originalLineCents),
      lineTotal: moneyFromCents(lineCents),
      productDiscountAmount: moneyFromCents(originalLineCents - lineCents),
      discount: productPrice.discount,
      inventoryVariantIds: [variant.id]
    };
  });

  const collectionLines = collections.flatMap((collection) => {
    const quantity = collectionQuantities.get(collection.id) ?? 0;
    const memberVariants = collection.fragrances
      .map(({fragrance}) => fragrance.variants[0])
      .filter((variant): variant is NonNullable<typeof variant> => Boolean(variant));

    if (
      !collection.offerPrice ||
      memberVariants.length !== collection.fragrances.length ||
      memberVariants.length === 0
    ) {
      return [];
    }

    const originalUnitCents = Math.round(
      memberVariants.reduce((sum, variant) => sum + Number(variant.price), 0) * 100
    );
    const unitCents = Math.round(Number(collection.offerPrice) * 100);
    const originalLineCents = originalUnitCents * quantity;
    const lineCents = unitCents * quantity;

    originalSubtotalCents += originalLineCents;
    subtotalCents += lineCents;

    return [{
      kind: "collection" as const,
      fragranceId: collection.id,
      fragranceNameEn: collection.nameEn,
      fragranceNameAr: collection.nameAr,
      variantId: collectionCartKey(collection.id),
      collectionId: collection.id,
      sizeML: 0,
      stock: Math.min(...memberVariants.map((variant) => variant.stock)),
      quantity,
      originalPrice: moneyFromCents(originalUnitCents),
      price: moneyFromCents(unitCents),
      originalLineTotal: moneyFromCents(originalLineCents),
      lineTotal: moneyFromCents(lineCents),
      productDiscountAmount: moneyFromCents(Math.max(0, originalLineCents - lineCents)),
      discount: null,
      inventoryVariantIds: memberVariants.map((variant) => variant.id)
    }];
  });

  const lines = [...variantLines, ...collectionLines];

  return {
    lines,
    unavailableVariantIds,
    originalSubtotal: moneyFromCents(originalSubtotalCents),
    subtotal: moneyFromCents(subtotalCents),
    productDiscountAmount: moneyFromCents(Math.max(0, originalSubtotalCents - subtotalCents))
  };
}
