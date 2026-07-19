"use client";

import {useRouter} from "next/navigation";
import {useState} from "react";

import {
  collectionCartKey,
  readCartItems,
  writeCartItems,
  type CartItem
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
  isAvailable
}: CollectionPurchaseActionsProps) {
  const router = useRouter();
  const isArabic = locale === "ar";
  const [quantity, setQuantity] = useState(1);
  const [cartStatus, setCartStatus] = useState("");
  const collectionPrice = offerPrice ?? "0";
  const itemKey = collectionCartKey(id);

  function performAddToCart() {
    if (!offerPrice || !isAvailable) return false;

    const item: CartItem = {
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
      quantity
    };
    const existing = readCartItems();
    const itemIndex = existing.findIndex((cartItem) => cartItem.variantId === itemKey);

    if (itemIndex >= 0) {
      existing[itemIndex] = {
        ...existing[itemIndex],
        ...item,
        quantity: existing[itemIndex].quantity + quantity
      };
    } else {
      existing.push(item);
    }

    writeCartItems(existing);
    return true;
  }

  function addToCart() {
    if (performAddToCart()) {
      setCartStatus(isArabic ? "تمت الإضافة إلى السلة" : "Added to cart");
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
            onClick={() => setQuantity((value) => Math.max(1, value - 1))}
            className="focus-gold h-12 px-4 text-parchment hover:text-gold"
          >
            -
          </button>
          <span className="w-10 text-center text-sm text-parchment">{quantity}</span>
          <button
            type="button"
            aria-label="Increase quantity"
            onClick={() => setQuantity((value) => Math.min(10, value + 1))}
            className="focus-gold h-12 px-4 text-parchment hover:text-gold"
          >
            +
          </button>
        </div>
        <button
          type="button"
          onClick={addToCart}
          disabled={!offerPrice || !isAvailable}
          className="label-caps focus-gold inline-flex min-h-12 flex-1 items-center justify-center gap-3 border border-outline px-8 text-parchment transition-colors hover:border-gold hover:text-gold disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isArabic ? "إضافة إلى السلة" : "Add to Cart"}
        </button>
      </div>
      <button
        type="button"
        onClick={buyNow}
        disabled={!offerPrice || !isAvailable}
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
      {cartStatus ? <p className="text-sm text-gold">{cartStatus}</p> : null}
    </div>
  );
}
