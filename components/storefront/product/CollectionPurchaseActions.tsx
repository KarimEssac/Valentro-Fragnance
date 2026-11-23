"use client";

import {useRouter} from "next/navigation";
import {useState} from "react";

import {useCartItems} from "@/components/storefront/cart/useCartItems";
import {
  addCartItem,
  cartQuantityRemaining,
  collectionCartKey,
  notifyCartAdded,
  type CartInventoryVariant
} from "@/lib/cart-items";

function ArrowIcon({direction}: {direction: "left" | "right"}) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
    >
      {direction === "left" ? (
        <path d="M15 6l-6 6 6 6" />
      ) : (
        <path d="M9 6l6 6-6 6" />
      )}
    </svg>
  );
}

type CollectionPurchaseActionsProps = {
  locale: string;
  id: string;
  slug: string;
  nameEn: string;
  nameAr: string;
  image: string;
  offerPrice: string | null;
  combinedValue: string;
  isAvailable: boolean;
  inventory: CartInventoryVariant[];
};

export default function CollectionPurchaseActions({
  locale,
  id,
  slug,
  nameEn,
  nameAr,
  image,
  offerPrice,
  combinedValue,
  isAvailable,
  inventory
}: CollectionPurchaseActionsProps) {
  const router = useRouter();
  const isArabic = locale === "ar";
  const cartItems = useCartItems();
  const [requestedQuantity, setRequestedQuantity] = useState(1);
  const collectionPrice = offerPrice ?? "0";
  const itemKey = collectionCartKey(id);
  const quantityRemaining = isAvailable ? cartQuantityRemaining(cartItems, itemKey, inventory) : 0;
  const quantity = Math.min(requestedQuantity, quantityRemaining);
  const canPurchase = Boolean(offerPrice) && quantity > 0;

  function performAddToCart() {
    if (!canPurchase) return false;

    const added = addCartItem({
      fragranceId: id,
      variantId: itemKey,
      itemType: "collection",
      collectionId: id,
      slug,
      name: isArabic ? nameAr : nameEn,
      image,
      sizeML: 0,
      price: collectionPrice,
      originalPrice: combinedValue,
      discount: null,
      quantity,
      inventory
    });
    if (added) setRequestedQuantity(1);
    return added;
  }

  function addToCart() {
    if (performAddToCart()) {
      notifyCartAdded(isArabic ? nameAr : nameEn);
    }
  }

  function buyNow() {
    if (performAddToCart()) {
      router.push(`/${locale}/checkout`);
    }
  }

  return (
    <div className="mb-5 flex flex-col gap-4">
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="flex min-h-12 items-center border border-outline">
          <button
            type="button"
            aria-label="Decrease quantity"
            onClick={() => setRequestedQuantity(quantity - 1)}
            disabled={quantity <= 1}
            className="focus-gold h-12 px-4 text-parchment hover:text-gold disabled:cursor-not-allowed disabled:opacity-40"
          >
            -
          </button>
          <span className="w-10 text-center text-sm text-parchment">{quantity}</span>
          <button
            type="button"
            aria-label="Increase quantity"
            onClick={() => setRequestedQuantity(quantity + 1)}
            disabled={!canPurchase || quantity >= quantityRemaining}
            className="focus-gold h-12 px-4 text-parchment hover:text-gold disabled:cursor-not-allowed disabled:opacity-40"
          >
            +
          </button>
        </div>
        <button
          type="button"
          onClick={addToCart}
          disabled={!canPurchase}
          className="label-caps focus-gold inline-flex min-h-12 flex-1 items-center justify-center gap-3 border border-outline px-8 text-parchment transition-colors hover:border-gold hover:text-gold disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isArabic ? "إضافة إلى السلة" : "Add to Cart"}
        </button>
      </div>
      <button
        type="button"
        onClick={buyNow}
        disabled={!canPurchase}
        className="label-caps focus-gold inline-flex min-h-12 w-full items-center justify-center gap-3 border border-parchment bg-parchment px-8 text-surface-hi transition-colors hover:border-gold hover:bg-gold disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isArabic ? "شراء الآن" : "Buy Now"}
        <ArrowIcon direction={isArabic ? "left" : "right"} />
      </button>
      <p className="label-caps flex items-center gap-2 text-on-surface/70">
        <span className="h-2 w-2 bg-gold" />
        {isAvailable
          ? isArabic
            ? "متاح - جاهز للشحن الفوري"
            : "In Stock - Ready for immediate dispatch"
          : isArabic
            ? "غير متاح حاليًا"
            : "Currently out of stock"}
      </p>
    </div>
  );
}
