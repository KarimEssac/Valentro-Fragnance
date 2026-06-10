"use client";

import {useLocale} from "next-intl";
import Image from "next/image";
import Link from "next/link";
import {useEffect, useMemo, useState} from "react";

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

function readCart() {
  try {
    return JSON.parse(
      window.localStorage.getItem("valentro-cart") ?? "[]"
    ) as CartItem[];
  } catch {
    return [];
  }
}

export default function CartClient() {
  const locale = useLocale();
  const [items, setItems] = useState<CartItem[]>(() =>
    typeof window === "undefined" ? [] : readCart()
  );

  const priceFormatter = useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        style: "currency",
        currency: "EGP",
        maximumFractionDigits: 0
      }),
    [locale]
  );

  function persist(nextItems: CartItem[]) {
    setItems(nextItems);
    window.localStorage.setItem("valentro-cart", JSON.stringify(nextItems));
    window.dispatchEvent(new Event("valentro-cart-updated"));
  }

  function updateQuantity(variantId: string, quantity: number) {
    persist(
      items.map((item) =>
        item.variantId === variantId
          ? {...item, quantity: Math.max(1, quantity)}
          : item
      )
    );
  }

  function removeItem(variantId: string) {
    persist(items.filter((item) => item.variantId !== variantId));
  }

  const subtotal = items.reduce(
    (total, item) => total + Number(item.price) * item.quantity,
    0
  );
  const itemCount = items.reduce((total, item) => total + item.quantity, 0);

  if (items.length === 0) {
    return (
      <main className="min-h-screen bg-bg px-gutter pb-24 pt-28 sm:pt-36 text-parchment lg:px-16">
        <section className="mx-auto max-w-container border border-outline bg-surface px-6 py-12 text-center">
          <p className="label-caps text-gold">Cart</p>
          <h1 className="mt-4 font-serif text-4xl leading-tight text-parchment sm:text-5xl">
            Your cart is empty
          </h1>
          <p className="mx-auto mt-5 max-w-md text-sm leading-6 text-on-surface/75">
            Add a fragrance from the collection to begin your order.
          </p>
          <Link
            href={`/${locale}`}
            className="label-caps mt-8 inline-flex min-h-11 items-center justify-center border border-parchment bg-parchment px-8 text-surface-hi transition-colors hover:border-gold hover:bg-gold"
          >
            Continue Shopping
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-bg px-gutter pb-24 pt-[96px] sm:pt-36 text-parchment lg:px-16">
      <div className="mx-auto max-w-container">
        <div className="hidden lg:flex mb-10 flex-col justify-between gap-4 border-b border-outline/60 pb-8 sm:flex-row sm:items-end">
          <div>
            <p className="label-caps text-gold">Cart</p>
            <h1 className="mt-3 font-serif text-4xl leading-tight text-parchment sm:text-6xl">
              Shopping Bag
            </h1>
          </div>
          <p className="text-sm text-on-surface/75">
            {itemCount} {itemCount === 1 ? "item" : "items"}
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_360px] lg:items-start lg:gap-10">
          <section className="space-y-3 lg:space-y-5">
            {items.map((item) => {
              const lineTotal = Number(item.price) * item.quantity;

              return (
                <article
                  key={item.variantId}
                  className="flex items-center gap-3 border border-outline/70 bg-surface p-3 lg:grid lg:grid-cols-[120px_1fr] lg:gap-5 lg:p-5"
                >
                  <Link
                    href={`/${locale}/fragrances/${item.slug}`}
                    className="relative h-16 w-14 shrink-0 overflow-hidden bg-surface-mid lg:aspect-[4/5] lg:h-auto lg:w-full"
                  >
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        sizes="(min-width: 1024px) 120px, 56px"
                        className="object-cover"
                      />
                    ) : null}
                  </Link>

                  <div className="flex flex-1 items-center justify-between gap-3 lg:flex-row lg:items-start lg:justify-between lg:gap-5">
                    <div className="flex flex-col min-w-0">
                      <Link
                        href={`/${locale}/fragrances/${item.slug}`}
                        className="truncate font-serif text-base leading-tight text-parchment transition-colors hover:text-gold lg:text-2xl lg:whitespace-normal"
                      >
                        {item.name}
                      </Link>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-on-surface/75 lg:hidden">
                        <span className="label-caps font-semibold text-gold">
                          {item.sizeML}ml
                        </span>
                        <span>•</span>
                        <span>{priceFormatter.format(Number(item.price))}</span>
                      </div>
                      <div className="hidden lg:block">
                        <p className="label-caps mt-2 text-gold">
                          {item.sizeML}ml
                        </p>
                        <p className="mt-4 text-sm text-on-surface/75">
                          {priceFormatter.format(Number(item.price))}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 lg:flex-col lg:items-end lg:gap-4">
                      <div className="hidden lg:block">
                        <p className="font-serif text-2xl text-parchment">
                          {priceFormatter.format(lineTotal)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 lg:flex-col lg:items-end">
                        <div className="flex h-8 items-center border border-outline bg-bg/50 lg:h-11">
                          <button
                            type="button"
                            aria-label="Decrease quantity"
                            onClick={() =>
                              updateQuantity(item.variantId, item.quantity - 1)
                            }
                            className="focus-gold h-full px-2.5 text-parchment hover:text-gold lg:px-4"
                          >
                            -
                          </button>
                          <span className="w-6 text-center text-xs text-parchment lg:w-10 lg:text-sm">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            aria-label="Increase quantity"
                            onClick={() =>
                              updateQuantity(item.variantId, item.quantity + 1)
                            }
                            className="focus-gold h-full px-2.5 text-parchment hover:text-gold lg:px-4"
                          >
                            +
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItem(item.variantId)}
                          className="label-caps text-[10px] text-on-surface/65 transition-colors hover:text-gold lg:text-xs"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>

          <aside className="border border-outline bg-surface p-6 lg:sticky lg:top-28">
            <h2 className="font-serif text-3xl leading-tight text-parchment">
              Order Summary
            </h2>
            <div className="mt-6 space-y-4 border-y border-outline/60 py-5 text-sm text-on-surface/75">
              <div className="flex justify-between gap-4">
                <span>Subtotal</span>
                <span className="text-parchment">
                  {priceFormatter.format(subtotal)}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span>Shipping</span>
                <span className="text-parchment">Calculated later</span>
              </div>
            </div>
            <div className="mt-5 flex justify-between gap-4 font-serif text-2xl text-parchment">
              <span>Total</span>
              <span>{priceFormatter.format(subtotal)}</span>
            </div>
            <button
              type="button"
              className="label-caps mt-8 flex min-h-12 w-full items-center justify-center border border-parchment bg-parchment px-8 text-surface-hi transition-colors hover:border-gold hover:bg-gold"
            >
              Checkout
            </button>
            <Link
              href={`/${locale}`}
              className="label-caps mt-4 flex min-h-11 w-full items-center justify-center border border-outline text-parchment transition-colors hover:border-gold hover:text-gold"
            >
              Continue Shopping
            </Link>
          </aside>
        </div>
      </div>
    </main>
  );
}
