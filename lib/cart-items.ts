import type {ActiveProductDiscount} from "@/lib/product-discounts";

export const cartStorageKey = "valentro-cart";
export const cartUpdatedEvent = "valentro-cart-updated";
export const cartAddedEvent = "valentro-cart-added";
export const maxCartItemQuantity = 10;
export const maxCartLines = 20;

export type CartAddedDetail = {name: string};

export function notifyCartAdded(name: string) {
  window.dispatchEvent(new CustomEvent<CartAddedDetail>(cartAddedEvent, {detail: {name}}));
}

export type CartItemType = "fragrance" | "collection";
export type CartInventoryVariant = {id: string; stock: number};

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
  inventory?: CartInventoryVariant[];
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
  stock: number;
  productDiscountAmount: string;
  discount: ActiveProductDiscount | null;
  inventory?: CartInventoryVariant[];
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
    (item.inventory === undefined ||
      (Array.isArray(item.inventory) && item.inventory.every((variant) =>
        variant && typeof variant.id === "string" && Number.isInteger(variant.stock)
      ))) &&
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

function writeCartItems(items: CartItem[]) {
  window.localStorage.setItem(cartStorageKey, JSON.stringify(items));
  window.dispatchEvent(new Event(cartUpdatedEvent));
}

function cartQuantityLimit(
  items: CartItem[],
  variantId: string,
  inventory: CartInventoryVariant[]
) {
  let limit = maxCartItemQuantity;

  for (const variant of inventory) {
    const alreadyUsed = items.reduce((total, item) => {
      if (item.variantId === variantId) return total;
      const usesVariant = item.variantId === variant.id ||
        item.inventory?.some(({id}) => id === variant.id);
      return usesVariant ? total + Number(item.quantity) : total;
    }, 0);
    limit = Math.min(limit, variant.stock - alreadyUsed);
  }

  return Math.max(0, limit);
}

export function cartQuantityRemaining(
  items: CartItem[],
  variantId: string,
  inventory: CartInventoryVariant[]
) {
  const existing = items.find((item) => item.variantId === variantId);
  if (!existing && items.length >= maxCartLines) return 0;

  return Math.max(
    0,
    cartQuantityLimit(items, variantId, inventory) - Number(existing?.quantity ?? 0)
  );
}

export function addCartItem(item: CartItem & {inventory: CartInventoryVariant[]}) {
  const items = readCartItems();
  const quantity = Math.min(
    item.quantity,
    cartQuantityRemaining(items, item.variantId, item.inventory)
  );
  if (quantity < 1) return false;

  const index = items.findIndex(({variantId}) => variantId === item.variantId);
  if (index === -1) {
    items.push({...item, quantity});
  } else {
    items[index] = {...item, quantity: Number(items[index].quantity) + quantity};
  }

  writeCartItems(items);
  return true;
}

export function changeCartQuantity(variantId: string, change: -1 | 1 | "remove") {
  const items = readCartItems();
  const index = items.findIndex((item) => item.variantId === variantId);
  if (index === -1) return;

  const item = items[index];
  const quantity = change === "remove" ? 0 : Number(item.quantity) + change;
  if (
    change === 1 &&
    (!item.inventory?.length || quantity > cartQuantityLimit(items, variantId, item.inventory))
  ) return;

  if (quantity < 1) {
    items.splice(index, 1);
  } else {
    items[index] = {...item, quantity};
  }
  writeCartItems(items);
}

export function applyCartPricing(
  pricing: Pick<CartPricingQuote, "lines" | "unavailableVariantIds">,
  reconcileInventory = false
) {
  const items = readCartItems();
  const byVariantId = new Map(pricing.lines.map((line) => [line.variantId, line]));
  const unavailableVariantIds = new Set(pricing.unavailableVariantIds);
  const nextItems: CartItem[] = [];
  // Items added while the request was running can already use some of the stock.
  const allocatedItems = items.filter((item) =>
    !byVariantId.has(item.variantId) && !unavailableVariantIds.has(item.variantId)
  );

  for (const item of items) {
    if (unavailableVariantIds.has(item.variantId)) continue;
    const line = byVariantId.get(item.variantId);
    if (!line) {
      nextItems.push(item);
      continue;
    }

    const inventory = reconcileInventory
      ? line.inventory ?? [{id: line.variantId, stock: line.stock}]
      : item.inventory;
    const quantity = inventory && reconcileInventory
      ? Math.min(item.quantity, cartQuantityLimit(allocatedItems, item.variantId, inventory))
      : item.quantity;
    if (quantity < 1) continue;

    const nextItem = {
      ...item,
      quantity,
      price: line.price,
      originalPrice: line.originalPrice,
      discount: line.discount,
      ...(inventory ? {inventory} : {}),
      ...(line.kind ? {itemType: line.kind} : {}),
      ...(line.collectionId ? {collectionId: line.collectionId} : {})
    };
    allocatedItems.push(nextItem);
    nextItems.push(nextItem);
  }

  if (JSON.stringify(nextItems) !== JSON.stringify(items)) writeCartItems(nextItems);
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

let cartRefresh: Promise<void> | null = null;

export function refreshCart() {
  if (cartRefresh) return cartRefresh;

  const items = readCartItems();
  const requests: Promise<CartPricingQuote>[] = [];
  // Request unit prices and inventory even if a saved quantity exceeds the checkout limit.
  for (let start = 0; start < items.length; start += maxCartLines) {
    requests.push(requestCartPricing(
      items.slice(start, start + maxCartLines).map((item) => ({...item, quantity: 1}))
    ));
  }
  if (!requests.length) return Promise.resolve();

  cartRefresh = Promise.all(requests)
    .then((quotes) => applyCartPricing({
      lines: quotes.flatMap((quote) => quote.lines),
      unavailableVariantIds: quotes.flatMap((quote) => quote.unavailableVariantIds)
    }, true))
    .finally(() => {
      cartRefresh = null;
    });

  return cartRefresh;
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
