"use client";

import {useLocale} from "next-intl";
import Image from "next/image";
import Link from "next/link";
import {useCallback, useEffect, useMemo, useRef, useState} from "react";

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

type CollectionRecommendation = {
  id: string;
  slug: string;
  code: string | null;
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  coverImage: string;
  offerPrice: string | null;
  combinedValue: string;
  discountPercent: number;
  products: {
    id: string;
    slug: string;
    nameEn: string;
    nameAr: string;
    image: {
      url: string;
      altEn: string;
      altAr: string;
    } | null;
    price: string | null;
  }[];
};

type SuggestedItem =
  | {
      kind: "collection";
      collection: CollectionRecommendation;
    }
  | {
      kind: "fragrance";
      fragrance: Recommendation;
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

function ArrowIcon({direction}: {direction: "left" | "right"}) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.35"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
    >
      {direction === "left" ? (
        <path d="M15 6l-6 6 6 6" />
      ) : (
        <path d="M9 6l6 6-6 6" />
      )}
    </svg>
  );
}

export default function CartClient() {
  const locale = useLocale();
  const isArabic = locale === "ar";
  const recommendationsCarouselRef = useRef<HTMLDivElement>(null);
  const [items, setItems] = useState<CartItem[]>(() =>
    typeof window === "undefined" ? [] : readCart()
  );
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [collections, setCollections] = useState<CollectionRecommendation[]>([]);

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
    if (quantity <= 0) {
      removeItem(variantId);
      return;
    }
    persist(
      items.map((item) =>
        item.variantId === variantId
          ? {...item, quantity}
          : item
      )
    );
  }

  function removeItem(variantId: string) {
    persist(items.filter((item) => item.variantId !== variantId));
  }

  function addRecommendation(recommendation: Recommendation) {
    const variant = recommendation.variants.find((item) => item.stock > 0) ??
      recommendation.variants[0];
    if (!variant) return;

    const name = isArabic ? recommendation.nameAr : recommendation.nameEn;
    const itemIndex = items.findIndex((item) => item.variantId === variant.id);
    const nextItems = [...items];

    if (itemIndex >= 0) {
      nextItems[itemIndex] = {
        ...nextItems[itemIndex],
        quantity: nextItems[itemIndex].quantity + 1
      };
    } else {
      nextItems.push({
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

    persist(nextItems);
  }

  const scrollRecommendations = useCallback((direction: "previous" | "next") => {
    const carousel = recommendationsCarouselRef.current;
    if (!carousel) return;

    const card = carousel.querySelector<HTMLElement>("[data-recommendation-card]");
    const scrollAmount = card ? card.offsetWidth + 24 : carousel.clientWidth;

    carousel.scrollBy({
      left: direction === "previous" ? -scrollAmount : scrollAmount,
      behavior: "smooth"
    });
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadRecommendations() {
      try {
        const [fragrancesResponse, collectionsResponse] = await Promise.all([
          fetch("/api/storefront/fragrances?featured=true&limit=8", {
            headers: {Accept: "application/json"}
          }),
          fetch("/api/storefront/collections", {
            headers: {Accept: "application/json"}
          })
        ]);

        if (isMounted && fragrancesResponse.ok) {
          const data = (await fragrancesResponse.json()) as Recommendation[];
          setRecommendations(data);
        }

        if (isMounted && collectionsResponse.ok) {
          const data = (await collectionsResponse.json()) as {
            collections: CollectionRecommendation[];
          };
          setCollections(data.collections);
        }
      } catch {
        // Recommendations are optional.
      }
    }

    loadRecommendations();

    return () => {
      isMounted = false;
    };
  }, []);

  const subtotal = items.reduce(
    (total, item) => total + Number(item.price) * item.quantity,
    0
  );
  const itemCount = items.reduce((total, item) => total + item.quantity, 0);
  const cartFragranceIds = new Set(items.map((item) => item.fragranceId));
  const matchingCollection = collections.find((collection) => {
    if (cartFragranceIds.size === 0) return false;

    const collectionFragranceIds = new Set(
      collection.products.map((product) => product.id)
    );

    return Array.from(cartFragranceIds).every((id) =>
      collectionFragranceIds.has(id)
    );
  });
  const suggestedFragrances = recommendations
    .filter((recommendation) => !cartFragranceIds.has(recommendation.id))
    .slice(0, matchingCollection ? 7 : 8);
  const suggested: SuggestedItem[] = [
    ...(matchingCollection
      ? [{kind: "collection" as const, collection: matchingCollection}]
      : []),
    ...suggestedFragrances.map((fragrance) => ({
      kind: "fragrance" as const,
      fragrance
    }))
  ];

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
            href={`/${locale}/fragrances`}
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
            <Link
              href={`/${locale}/checkout`}
              className="label-caps mt-8 flex min-h-12 w-full items-center justify-center border border-parchment bg-parchment px-8 text-surface-hi transition-colors hover:border-gold hover:bg-gold"
            >
              Checkout
            </Link>
            <Link
              href={`/${locale}/fragrances`}
              className="label-caps mt-4 flex min-h-11 w-full items-center justify-center border border-outline text-parchment transition-colors hover:border-gold hover:text-gold"
            >
              Continue Shopping
            </Link>
          </aside>
        </div>

        {suggested.length > 0 ? (
          <section className="mt-16 border-t border-outline/70 pt-8">
            <div className="mb-6 flex items-center justify-between gap-5">
              <div>
                <p className="label-caps text-gold">You might also like</p>
                <h2 className="mt-2 font-serif text-3xl leading-tight text-parchment">
                  Curated Additions
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label="Previous recommendation"
                  onClick={() => scrollRecommendations("previous")}
                  className="focus-gold flex h-11 w-11 items-center justify-center border border-gold/40 text-parchment transition-colors hover:border-gold hover:bg-gold/10"
                >
                  <ArrowIcon direction={isArabic ? "right" : "left"} />
                </button>
                <button
                  type="button"
                  aria-label="Next recommendation"
                  onClick={() => scrollRecommendations("next")}
                  className="focus-gold flex h-11 w-11 items-center justify-center border border-gold text-parchment transition-colors hover:bg-gold/10"
                >
                  <ArrowIcon direction={isArabic ? "left" : "right"} />
                </button>
              </div>
            </div>

            <div
              ref={recommendationsCarouselRef}
              className="no-scrollbar flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth pb-3"
            >
              {suggested.map((suggestion) => {
                if (suggestion.kind === "collection") {
                  const collection = suggestion.collection;
                  const name = isArabic ? collection.nameAr : collection.nameEn;
                  const description = isArabic
                    ? collection.descriptionAr
                    : collection.descriptionEn;
                  const price = Number(collection.offerPrice);

                  return (
                    <article
                      key={`collection-${collection.id}`}
                      data-recommendation-card
                      className="w-[68vw] shrink-0 snap-start border border-gold/55 bg-surface sm:w-[240px]"
                    >
                      <Link
                        href={`/${locale}/collections/${collection.slug}`}
                        className="relative block aspect-[3/4] overflow-hidden bg-surface-mid"
                      >
                        <Image
                          src={collection.coverImage}
                          alt={name}
                          fill
                          unoptimized
                          sizes="(min-width: 640px) 240px, 68vw"
                          className="object-cover transition-transform duration-700 hover:scale-[1.02]"
                        />
                        <span className="label-caps absolute left-3 top-3 bg-parchment px-3 py-2 text-surface-hi">
                          Collection
                        </span>
                        {collection.discountPercent > 0 ? (
                          <span className="label-caps absolute right-3 top-3 bg-gold px-3 py-2 text-surface-hi">
                            {collection.discountPercent}% off
                          </span>
                        ) : null}
                      </Link>
                      <div className="p-3 text-center">
                        <h3 className="font-serif text-xl leading-tight">
                          {name}
                        </h3>
                        <p className="mx-auto mt-2 line-clamp-2 min-h-10 text-xs leading-5 text-on-surface/70">
                          {description || "A limited bundle curated by Valentro."}
                        </p>
                        <p className="label-caps mt-3 text-on-surface/70">
                          {Number.isFinite(price) && price > 0
                            ? priceFormatter.format(price)
                            : "View collection"}
                        </p>
                        <Link
                          href={`/${locale}/collections/${collection.slug}`}
                          className="label-caps mt-3 flex min-h-9 items-center justify-center border border-parchment text-parchment transition-colors hover:border-gold hover:text-gold"
                        >
                          View
                        </Link>
                      </div>
                    </article>
                  );
                }

                const fragrance = suggestion.fragrance;
                const variant = fragrance.variants[0];
                const name = isArabic ? fragrance.nameAr : fragrance.nameEn;
                const imageAlt = fragrance.primaryImage
                  ? isArabic
                    ? fragrance.primaryImage.altAr
                    : fragrance.primaryImage.altEn
                  : name;

                return (
                  <article
                    key={`fragrance-${fragrance.id}`}
                    data-recommendation-card
                    className="w-[68vw] shrink-0 snap-start border border-outline/70 bg-surface sm:w-[240px]"
                  >
                    <Link
                      href={`/${locale}/fragrances/${fragrance.slug}`}
                      className="relative block aspect-[3/4] overflow-hidden bg-surface-mid"
                    >
                      {fragrance.primaryImage ? (
                        <Image
                          src={fragrance.primaryImage.url}
                          alt={imageAlt}
                          fill
                          sizes="(min-width: 640px) 240px, 68vw"
                          className="object-cover transition-transform duration-700 hover:scale-[1.02]"
                        />
                      ) : null}
                    </Link>
                    <div className="p-3 text-center">
                      <h3 className="font-serif text-xl leading-tight">
                        {name}
                      </h3>
                      <p className="label-caps mt-3 text-on-surface/70">
                        {variant ? priceFormatter.format(Number(variant.price)) : ""}
                      </p>
                      <button
                        type="button"
                        onClick={() => addRecommendation(fragrance)}
                        disabled={!variant}
                        className="label-caps mt-3 min-h-9 w-full border border-parchment text-parchment transition-colors hover:border-gold hover:text-gold disabled:cursor-not-allowed disabled:opacity-45"
                      >
                        Add
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
