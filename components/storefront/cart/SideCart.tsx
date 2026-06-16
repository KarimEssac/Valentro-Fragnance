"use client";

import Image from "next/image";
import Link from "next/link";
import {useLocale} from "next-intl";
import {useEffect, useMemo, useState} from "react";
import {createPortal} from "react-dom";

type CartItem = {
  fragranceId: string;
  variantId: string;
  slug: string;
  name: string;
  image: string | null;
  sizeML: number;
  price: string;
  quantity: number;
};

type Recommendation = {
  id: string;
  slug: string;
  nameEn: string;
  nameAr: string;
  primaryImage: {
    url: string;
    altEn: string;
    altAr: string;
  } | null;
  variants: {
    id: string;
    sizeML: number;
    price: string;
    stock: number;
  }[];
};

type SideCartProps = {
  open: boolean;
  onClose: () => void;
};

function readCart() {
  try {
    return JSON.parse(
      window.localStorage.getItem("valentro-cart") ?? "[]"
    ) as CartItem[];
  } catch {
    return [];
  }
}

function persistCart(items: CartItem[]) {
  window.localStorage.setItem("valentro-cart", JSON.stringify(items));
  window.dispatchEvent(new Event("valentro-cart-updated"));
}

function CloseIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      className="h-6 w-6"
    >
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

export default function SideCart({open, onClose}: SideCartProps) {
  const locale = useLocale();
  const isArabic = locale === "ar";
  const [items, setItems] = useState<CartItem[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isClosing, setIsClosing] = useState(false);

  const isVisible = open || isClosing;

  const priceFormatter = useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        style: "currency",
        currency: "EGP",
        maximumFractionDigits: 0
      }),
    [locale]
  );

  useEffect(() => {
    function syncCart() {
      setItems(readCart());
    }

    syncCart();
    window.addEventListener("storage", syncCart);
    window.addEventListener("valentro-cart-updated", syncCart);

    return () => {
      window.removeEventListener("storage", syncCart);
      window.removeEventListener("valentro-cart-updated", syncCart);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    let isMounted = true;

    async function loadRecommendations() {
      try {
        const response = await fetch(
          "/api/storefront/fragrances?featured=true&limit=4",
          {headers: {Accept: "application/json"}}
        );
        if (!response.ok) return;

        const data = (await response.json()) as Recommendation[];
        if (isMounted) setRecommendations(data);
      } catch {
        // Recommendations are optional.
      }
    }

    loadRecommendations();

    return () => {
      isMounted = false;
    };
  }, []);

  function requestClose() {
    if (isClosing) return;
    setIsClosing(true);
    window.setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 260);
  }

  function updateQuantity(variantId: string, quantity: number) {
    const nextItems =
      quantity <= 0
        ? items.filter((item) => item.variantId !== variantId)
        : items.map((item) =>
            item.variantId === variantId ? {...item, quantity} : item
          );

    setItems(nextItems);
    persistCart(nextItems);
  }

  function addRecommendation(recommendation: Recommendation) {
    const variant = recommendation.variants.find((item) => item.stock > 0) ??
      recommendation.variants[0];
    if (!variant) return;

    const name = isArabic ? recommendation.nameAr : recommendation.nameEn;
    const existing = readCart();
    const itemIndex = existing.findIndex((item) => item.variantId === variant.id);

    if (itemIndex >= 0) {
      existing[itemIndex] = {
        ...existing[itemIndex],
        quantity: existing[itemIndex].quantity + 1
      };
    } else {
      existing.push({
        fragranceId: recommendation.id,
        variantId: variant.id,
        slug: recommendation.slug,
        name,
        image: recommendation.primaryImage?.url ?? null,
        sizeML: variant.sizeML,
        price: variant.price,
        quantity: 1
      });
    }

    setItems(existing);
    persistCart(existing);
  }

  const subtotal = items.reduce(
    (total, item) => total + Number(item.price) * item.quantity,
    0
  );
  const itemCount = items.reduce((total, item) => total + item.quantity, 0);
  const cartFragranceIds = new Set(items.map((item) => item.fragranceId));
  const suggested = recommendations
    .filter((recommendation) => !cartFragranceIds.has(recommendation.id))
    .slice(0, 3);

  if (!isVisible) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Shopping bag"
      className="fixed inset-0 z-[1100]"
    >
      <button
        type="button"
        aria-label="Close cart"
        onClick={requestClose}
        className="animate-cart-backdrop-in absolute inset-0 h-full w-full bg-parchment/35 backdrop-blur-sm"
      />
      <aside
        className={`fixed right-0 top-0 flex h-screen w-full max-w-[500px] flex-col border-l border-outline bg-surface-hi text-parchment shadow-[0_0_70px_rgba(47,36,27,0.28)] ${
          isClosing ? "animate-cart-drawer-out" : "animate-cart-drawer-in"
        }`}
      >
        <header className="flex shrink-0 items-start justify-between border-b border-outline/60 px-gutter py-6">
          <div>
            <h2 className="font-serif text-3xl leading-tight uppercase">
              Shopping Bag
            </h2>
            <p className="label-caps mt-2 text-on-surface/70">
              Complimentary shipping on orders over EGP 200
            </p>
          </div>
          <button
            type="button"
            aria-label="Close cart"
            onClick={requestClose}
            className="focus-gold text-on-surface transition-colors hover:text-gold"
          >
            <CloseIcon />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-gutter py-6">
          {items.length > 0 ? (
            <div className="space-y-7">
              {items.map((item) => {
                const lineTotal = Number(item.price) * item.quantity;

                return (
                  <article key={item.variantId} className="group flex gap-5">
                    <Link
                      href={`/${locale}/fragrances/${item.slug}`}
                      onClick={requestClose}
                      className="relative h-32 w-24 shrink-0 overflow-hidden bg-surface-mid"
                    >
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          sizes="96px"
                          className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                        />
                      ) : null}
                    </Link>

                    <div className="flex flex-1 flex-col py-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <Link
                            href={`/${locale}/fragrances/${item.slug}`}
                            onClick={requestClose}
                            className="font-serif text-xl leading-tight transition-colors hover:text-gold"
                          >
                            {item.name}
                          </Link>
                          <p className="label-caps mt-1 text-on-surface/65">
                            Eau de Parfum · {item.sizeML}ml
                          </p>
                        </div>
                        <button
                          type="button"
                          aria-label="Remove item"
                          onClick={() => updateQuantity(item.variantId, 0)}
                          className="text-on-surface/60 transition-colors hover:text-red-700"
                        >
                          ×
                        </button>
                      </div>

                      <div className="mt-auto flex items-end justify-between gap-4">
                        <div className="flex items-center border-b border-outline pb-1">
                          <button
                            type="button"
                            aria-label="Decrease quantity"
                            onClick={() =>
                              updateQuantity(item.variantId, item.quantity - 1)
                            }
                            className="focus-gold px-2 text-parchment hover:text-gold"
                          >
                            -
                          </button>
                          <span className="w-8 text-center text-sm">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            aria-label="Increase quantity"
                            onClick={() =>
                              updateQuantity(item.variantId, item.quantity + 1)
                            }
                            className="focus-gold px-2 text-parchment hover:text-gold"
                          >
                            +
                          </button>
                        </div>
                        <span className="font-serif text-xl">
                          {priceFormatter.format(lineTotal)}
                        </span>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="border border-outline/60 bg-surface px-5 py-8 text-center">
              <p className="label-caps text-gold">Cart</p>
              <h3 className="mt-3 font-serif text-3xl">Your bag is empty</h3>
              <p className="mx-auto mt-3 max-w-xs text-sm leading-6 text-on-surface/70">
                Add a fragrance from the collection to begin your order.
              </p>
            </div>
          )}

          {suggested.length > 0 ? (
            <section className="mt-8 border-t border-outline/60 pt-6">
              <h3 className="label-caps mb-4 text-gold">You might also like</h3>
              <div className="space-y-4">
                {suggested.map((fragrance) => {
                  const variant = fragrance.variants[0];
                  const name = isArabic ? fragrance.nameAr : fragrance.nameEn;
                  const imageAlt = fragrance.primaryImage
                    ? isArabic
                      ? fragrance.primaryImage.altAr
                      : fragrance.primaryImage.altEn
                    : name;

                  return (
                    <article
                      key={fragrance.id}
                      className="grid grid-cols-[72px_1fr_auto] items-center gap-4 border border-outline/45 bg-surface/70 p-3"
                    >
                      <Link
                        href={`/${locale}/fragrances/${fragrance.slug}`}
                        onClick={requestClose}
                        className="relative h-24 overflow-hidden bg-surface-mid"
                      >
                        {fragrance.primaryImage ? (
                          <Image
                            src={fragrance.primaryImage.url}
                            alt={imageAlt}
                            fill
                            sizes="72px"
                            className="object-cover"
                          />
                        ) : null}
                      </Link>
                      <div className="min-w-0">
                        <Link
                          href={`/${locale}/fragrances/${fragrance.slug}`}
                          onClick={requestClose}
                          className="font-serif text-lg leading-tight transition-colors hover:text-gold"
                        >
                          {name}
                        </Link>
                        <p className="label-caps mt-2 text-on-surface/65">
                          {variant ? priceFormatter.format(Number(variant.price)) : ""}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => addRecommendation(fragrance)}
                        disabled={!variant}
                        className="label-caps min-h-10 border border-parchment px-3 text-parchment transition-colors hover:border-gold hover:text-gold disabled:cursor-not-allowed disabled:opacity-45"
                      >
                        Add
                      </button>
                    </article>
                  );
                })}
              </div>
            </section>
          ) : null}
        </div>

        <footer className="shrink-0 border-t border-outline/60 bg-surface px-gutter py-6">
          <div className="space-y-4 text-sm text-on-surface/75">
            <div className="flex items-center justify-between">
              <span>Subtotal</span>
              <span className="font-serif text-lg text-parchment">
                {priceFormatter.format(subtotal)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Shipping</span>
              <span className="label-caps text-gold">Complimentary</span>
            </div>
            <div className="h-px bg-outline/60" />
            <div className="flex items-center justify-between text-parchment">
              <span className="font-serif text-xl uppercase">Estimated Total</span>
              <span className="font-serif text-xl">
                {priceFormatter.format(subtotal)}
              </span>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3">
            <Link
              href={`/${locale}/cart`}
              onClick={requestClose}
              className="label-caps flex min-h-12 w-full items-center justify-center border border-parchment text-parchment transition-colors hover:bg-surface-mid"
            >
              View Cart
            </Link>
            <Link
              href={`/${locale}/checkout`}
              onClick={requestClose}
              className="label-caps flex min-h-12 w-full items-center justify-center border border-parchment bg-parchment text-surface-hi transition-colors hover:border-gold hover:bg-gold"
            >
              Proceed To Checkout
            </Link>
          </div>
          <p className="label-caps mt-5 text-center text-[10px] text-on-surface/55">
            {itemCount} {itemCount === 1 ? "item" : "items"} · Secure checkout
            provided by Valentro.
          </p>
        </footer>
      </aside>
    </div>,
    document.body
  );
}
