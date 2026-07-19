import type {ActiveProductDiscount} from "@/lib/product-discounts";

export const cartStorageKey = "valentro-cart";
export const cartUpdatedEvent = "valentro-cart-updated";

export type CartItemType = "fragrance" | "collection";

export function collectionCartKey(collectionId: string) {
  return `collection:${collectionId}`;
}

export type CartItem = {
  fragranceId: string;
  variantId: string;
  itemType?: CartItemType;
  collectionId?: string;
  slug: string;
  name: string;
  image: string | null;
  sizeML: number;
  /** Current product price. This is a display snapshot and is never trusted at checkout. */
  price: string;
  /** Price before the active product discount. Older saved carts may not have this field. */
  originalPrice?: string | null;
  discount?: ActiveProductDiscount | null;
  quantity: number;
};

export type CartPricingLine = {
  variantId: string;
  kind?: CartItemType;
  collectionId?: string | null;
  quantity: number;
  originalPrice: string;
  price: string;
  originalLineTotal: string;
  lineTotal: string;
  productDiscountAmount: string;
  discount: ActiveProductDiscount | null;
};

type CartPricingRequestItem = Pick<
  CartItem,
  "variantId" | "quantity" | "itemType" | "collectionId"
>;

export type CartPricingQuote = {
  lines: CartPricingLine[];
  unavailableVariantIds: string[];
  originalSubtotal: string;
  subtotal: string;
  productDiscountAmount: string;
};

function isCartItem(value: unknown): value is CartItem {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;

  const item = value as Partial<CartItem>;
  const itemType = item.itemType ?? "fragrance";
  return (
    typeof item.fragranceId === "string" &&
    typeof item.variantId === "string" &&
    (itemType === "fragrance" ||
      (itemType === "collection" &&
        typeof item.collectionId === "string" &&
        item.variantId === collectionCartKey(item.collectionId))) &&
    typeof item.slug === "string" &&
    typeof item.name === "string" &&
    (typeof item.image === "string" || item.image === null) &&
    Number.isFinite(Number(item.sizeML)) &&
    typeof item.price === "string" &&
    Number.isFinite(Number(item.price)) &&
    Number.isInteger(Number(item.quantity)) &&
    Number(item.quantity) > 0
  );
}

export function readCartItems(): CartItem[] {
  if (typeof window === "undefined") return [];

  try {
    const stored = JSON.parse(window.localStorage.getItem(cartStorageKey) ?? "[]") as unknown;
    return Array.isArray(stored) ? stored.filter(isCartItem) : [];
  } catch {
    return [];
  }
}

export function writeCartItems(items: CartItem[], notify = true) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(cartStorageKey, JSON.stringify(items));
  if (notify) window.dispatchEvent(new Event(cartUpdatedEvent));
}

export function mergeCartPricing(
  items: CartItem[],
  pricing: Pick<CartPricingQuote, "lines">
) {
  const byVariantId = new Map(pricing.lines.map((line) => [line.variantId, line]));

  return items.map((item) => {
    const line = byVariantId.get(item.variantId);
    if (!line) return item;

    return {
      ...item,
      price: line.price,
      originalPrice: line.originalPrice,
      discount: line.discount,
      ...(line.kind ? {itemType: line.kind} : {}),
      ...(line.collectionId ? {collectionId: line.collectionId} : {})
    };
  });
}

export function cartPricingRequestItems(items: CartPricingRequestItem[]) {
  return items.map((item) =>
    item.itemType === "collection" && item.collectionId
      ? {collectionId: item.collectionId, quantity: item.quantity}
      : {variantId: item.variantId, quantity: item.quantity}
  );
}

export async function requestCartPricing(
  items: CartPricingRequestItem[],
  signal?: AbortSignal
) {
  const response = await fetch("/api/storefront/cart-pricing", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    body: JSON.stringify({
      items: cartPricingRequestItems(items)
    }),
    signal
  });
  const data = (await response.json()) as CartPricingQuote & {message?: string};

  if (!response.ok) {
    throw new Error(data.message ?? "Unable to refresh cart prices");
  }

  return data;
}

export function cartSubtotal(items: CartItem[]) {
  return items.reduce(
    (total, item) => total + Number(item.price) * item.quantity,
    0
  );
}

export function cartOriginalSubtotal(items: CartItem[]) {
  return items.reduce(
    (total, item) =>
      total + Number(item.originalPrice ?? item.price) * item.quantity,
    0
  );
}
