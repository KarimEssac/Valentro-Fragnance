"use client";

import Image from "next/image";
import Link from "next/link";
import {useLocale} from "next-intl";
import {useRouter} from "next/navigation";
import type {MouseEvent} from "react";
import {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {createPortal} from "react-dom";

import {
  cartOriginalSubtotal,
  cartSubtotal,
  cartUpdatedEvent,
  mergeCartPricing,
  readCartItems,
  requestCartPricing,
  writeCartItems,
  type CartItem
} from "@/lib/cart-items";
import {
  productDiscountBadge,
  type ActiveProductDiscount
} from "@/lib/product-discounts";
import {startProductImageTransition} from "@/lib/product-image-transition";

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
  discount?: ActiveProductDiscount | null;
  variants: {
    id: string;
    sizeML: number;
    price: string;
    originalPrice?: string;
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

type SideCartProps = {
  open: boolean;
  onClose: () => void;
};

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

export default function SideCart({open, onClose}: SideCartProps) {
  const locale = useLocale();
  const router = useRouter();
  const isArabic = locale === "ar";
  const [items, setItems] = useState<CartItem[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [collections, setCollections] = useState<CollectionRecommendation[]>([]);
  const [isClosing, setIsClosing] = useState(false);

  function navigateToFragrance(
    event: MouseEvent<HTMLAnchorElement>,
    slug: string,
    imageUrl: string | null,
    imageAlt: string
  ) {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      !imageUrl
    ) {
      return;
    }

    const anchor = event.currentTarget;
    let source = anchor.querySelector<HTMLElement>("[data-product-transition-source]");
    if (!source && anchor.hasAttribute("data-product-transition-source")) {
      source = anchor;
    }
    if (!source) {
      const article = anchor.closest("article");
      if (article) {
        source = article.querySelector<HTMLElement>("[data-product-transition-source]");
      }
    }
    if (!source) return;

    const href = `/${locale}/fragrances/${slug}`;
    const didStart = startProductImageTransition({
      slug,
      imageUrl,
      imageAlt,
      source,
      navigate: () => {
        requestClose();
        router.push(href);
      }
    });

    if (didStart) event.preventDefault();
  }
  const recommendationsCarouselRef = useRef<HTMLDivElement>(null);

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
      setItems(readCartItems());
    }

    syncCart();
    window.addEventListener("storage", syncCart);
    window.addEventListener(cartUpdatedEvent, syncCart);

    return () => {
      window.removeEventListener("storage", syncCart);
      window.removeEventListener(cartUpdatedEvent, syncCart);
    };
  }, []);

  useEffect(() => {
    if (!open) return;

    const controller = new AbortController();
    const storedItems = readCartItems();

    if (storedItems.length > 0) {
      requestCartPricing(storedItems, controller.signal)
        .then((pricing) => {
          setItems((current) => {
            const nextItems = mergeCartPricing(current, pricing);
            writeCartItems(nextItems, false);
            return nextItems;
          });
        })
        .catch((error) => {
          if (!(error instanceof Error && error.name === "AbortError")) {
            // Keep the last display snapshot; checkout verifies every price.
          }
        });
    }

    return () => controller.abort();
  }, [open]);

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
        const [fragrancesResponse, collectionsResponse] = await Promise.all([
          fetch("/api/storefront/fragrances?featured=true&limit=4", {
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
    writeCartItems(nextItems);
  }

  function addRecommendation(recommendation: Recommendation) {
    const variant = recommendation.variants.find((item) => item.stock > 0) ??
      recommendation.variants[0];
    if (!variant) return;

    const name = isArabic ? recommendation.nameAr : recommendation.nameEn;
    const existing = readCartItems();
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
        originalPrice: variant.originalPrice ?? variant.price,
        discount: recommendation.discount ?? null,
        quantity: 1
      });
    }

    setItems(existing);
    writeCartItems(existing);
  }

  const scrollRecommendations = useCallback((direction: "previous" | "next") => {
    const carousel = recommendationsCarouselRef.current;
    if (!carousel) return;

    const card = carousel.querySelector<HTMLElement>("[data-recommendation-card]");
    const scrollAmount = card ? card.offsetWidth + 16 : carousel.clientWidth;

    carousel.scrollBy({
      left: direction === "previous" ? -scrollAmount : scrollAmount,
      behavior: "smooth"
    });
  }, []);

  const subtotal = cartSubtotal(items);
  const originalSubtotal = cartOriginalSubtotal(items);
  const productSavings = Math.max(0, originalSubtotal - subtotal);
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
    .slice(0, matchingCollection ? 3 : 4);
  const suggested: SuggestedItem[] = [
    ...(matchingCollection
      ? [{kind: "collection" as const, collection: matchingCollection}]
      : []),
    ...suggestedFragrances.map((fragrance) => ({
      kind: "fragrance" as const,
      fragrance
    }))
  ];

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
                const originalLineTotal =
                  Number(item.originalPrice ?? item.price) * item.quantity;
                const hasProductDiscount = originalLineTotal > lineTotal + 0.001;
                const discountLabel = item.discount
                  ? productDiscountBadge(item.discount, (amount) =>
                      priceFormatter.format(amount)
                    )
                  : "Sale";

                return (
                  <article key={item.variantId} className="group flex gap-5">
                    <Link
                      href={`/${locale}/fragrances/${item.slug}`}
                      onClick={(event) =>
                        navigateToFragrance(event, item.slug, item.image, item.name)
                      }
                      data-product-image-transition-link
                      data-product-transition-source
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
                            onClick={(event) =>
                              navigateToFragrance(event, item.slug, item.image, item.name)
                            }
                            data-product-image-transition-link
                            className="font-serif text-xl leading-tight transition-colors hover:text-gold"
                          >
                            {item.name}
                          </Link>
                          <p className="label-caps mt-1 text-on-surface/65">
                            Eau de Parfum · {item.sizeML}ml
                          </p>
                          {hasProductDiscount ? (
                            <span className="label-caps mt-2 inline-flex border border-gold/55 bg-gold/10 px-2 py-1 text-[9px] text-gold">
                              {discountLabel}
                            </span>
                          ) : null}
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
                        <div className="text-right">
                          {hasProductDiscount ? (
                            <p className="text-xs text-on-surface/55 line-through">
                              {priceFormatter.format(originalLineTotal)}
                            </p>
                          ) : null}
                          <span className="font-serif text-xl">
                            {priceFormatter.format(lineTotal)}
                          </span>
                        </div>
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
              <div className="mb-4 flex items-center justify-between gap-4">
                <h3 className="label-caps text-gold">You might also like</h3>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    aria-label="Previous recommendation"
                    onClick={() => scrollRecommendations("previous")}
                    className="focus-gold flex h-9 w-9 items-center justify-center border border-gold/40 text-parchment transition-colors hover:border-gold hover:bg-gold/10"
                  >
                    <ArrowIcon direction={isArabic ? "right" : "left"} />
                  </button>
                  <button
                    type="button"
                    aria-label="Next recommendation"
                    onClick={() => scrollRecommendations("next")}
                    className="focus-gold flex h-9 w-9 items-center justify-center border border-gold text-parchment transition-colors hover:bg-gold/10"
                  >
                    <ArrowIcon direction={isArabic ? "left" : "right"} />
                  </button>
                </div>
              </div>

              <div
                ref={recommendationsCarouselRef}
                className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-2"
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
                        className="grid w-[184px] shrink-0 snap-start grid-rows-[104px_1fr_auto] border border-gold/55 bg-surface/70"
                      >
                        <Link
                          href={`/${locale}/collections/${collection.slug}`}
                          onClick={requestClose}
                          className="relative overflow-hidden bg-surface-mid"
                        >
                          <Image
                            src={collection.coverImage}
                            alt={name}
                            fill
                            unoptimized
                            sizes="184px"
                            className="object-cover"
                          />
                          <span className="label-caps absolute left-2 top-2 bg-parchment px-2 py-1 text-[9px] text-surface-hi">
                            Collection
                          </span>
                        </Link>
                        <div className="min-w-0 px-3 pb-2 pt-3">
                          <Link
                            href={`/${locale}/collections/${collection.slug}`}
                            onClick={requestClose}
                            className="line-clamp-2 font-serif text-base leading-tight transition-colors hover:text-gold"
                          >
                            {name}
                          </Link>
                          <p className="mt-2 line-clamp-2 text-xs leading-5 text-on-surface/65">
                            {description || "A limited bundle curated by Valentro."}
                          </p>
                          <p className="label-caps mt-2 text-on-surface/65">
                            {Number.isFinite(price) && price > 0
                              ? priceFormatter.format(price)
                              : "View collection"}
                          </p>
                        </div>
                        <Link
                          href={`/${locale}/collections/${collection.slug}`}
                          onClick={requestClose}
                          className="label-caps mx-3 mb-3 flex min-h-9 items-center justify-center border border-parchment px-3 text-parchment transition-colors hover:border-gold hover:text-gold"
                        >
                          View
                        </Link>
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
                      className="grid w-[184px] shrink-0 snap-start grid-rows-[104px_1fr_auto] border border-outline/45 bg-surface/70"
                    >
                      <Link
                        href={`/${locale}/fragrances/${fragrance.slug}`}
                        onClick={(event) =>
                          navigateToFragrance(
                            event,
                            fragrance.slug,
                            fragrance.primaryImage?.url ?? null,
                            imageAlt
                          )
                        }
                        data-product-image-transition-link
                        data-product-transition-source
                        className="relative overflow-hidden bg-surface-mid"
                      >
                        {fragrance.primaryImage ? (
                          <Image
                            src={fragrance.primaryImage.url}
                            alt={imageAlt}
                            fill
                            sizes="184px"
                            className="object-cover"
                          />
                        ) : null}
                      </Link>
                      <div className="min-w-0 px-3 pb-2 pt-3">
                        <Link
                          href={`/${locale}/fragrances/${fragrance.slug}`}
                          onClick={(event) =>
                            navigateToFragrance(
                              event,
                              fragrance.slug,
                              fragrance.primaryImage?.url ?? null,
                              imageAlt
                            )
                          }
                          data-product-image-transition-link
                          className="line-clamp-2 font-serif text-base leading-tight transition-colors hover:text-gold"
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
                        className="label-caps mx-3 mb-3 min-h-9 border border-parchment px-3 text-parchment transition-colors hover:border-gold hover:text-gold disabled:cursor-not-allowed disabled:opacity-45"
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
            {productSavings > 0 ? (
              <>
                <div className="flex items-center justify-between">
                  <span>Original subtotal</span>
                  <span className="line-through">
                    {priceFormatter.format(originalSubtotal)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-gold">
                  <span>Product discounts</span>
                  <span>-{priceFormatter.format(productSavings)}</span>
                </div>
              </>
            ) : null}
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
