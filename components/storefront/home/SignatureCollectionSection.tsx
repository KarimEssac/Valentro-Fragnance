"use client";

import {useLocale} from "next-intl";
import Image from "next/image";
import Link from "next/link";
import {useRouter} from "next/navigation";
import type {MouseEvent} from "react";
import {useCallback, useEffect, useMemo, useRef, useState} from "react";

import {productDiscountBadge} from "@/lib/product-discounts";
import type {ActiveProductDiscount} from "@/lib/product-discounts";
import {startProductImageTransition} from "@/lib/product-image-transition";
import type {StorefrontFragrance} from "@/lib/storefront-data";

function formatScentProfile(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function SignatureCollectionSection({
  initialFragrances
}: {
  initialFragrances?: StorefrontFragrance[];
}) {
  const locale = useLocale();
  const router = useRouter();
  const isArabic = locale === "ar";
  const carouselRef = useRef<HTMLDivElement>(null);
  const [fragrances, setFragrances] = useState<StorefrontFragrance[]>(
    initialFragrances ?? []
  );
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    initialFragrances ? "ready" : "loading"
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

  useEffect(() => {
    if (initialFragrances) return;

    let isMounted = true;

    async function loadFragrances() {
      try {
        const response = await fetch(
          "/api/storefront/fragrances?collection=signature-line&limit=8",
          {headers: {Accept: "application/json"}}
        );

        if (!response.ok) {
          throw new Error("Unable to load fragrances");
        }

        const data = (await response.json()) as StorefrontFragrance[];
        if (isMounted) {
          setFragrances(data);
          setStatus("ready");
        }
      } catch {
        if (isMounted) {
          setStatus("error");
        }
      }
    }

    loadFragrances();

    return () => {
      isMounted = false;
    };
  }, [initialFragrances]);

  const scrollCarousel = useCallback((direction: "previous" | "next") => {
    const carousel = carouselRef.current;
    if (!carousel) return;

    const card = carousel.querySelector<HTMLElement>("[data-card]");
    const scrollAmount = card ? card.offsetWidth + 24 : carousel.clientWidth;
    carousel.scrollBy({
      left: direction === "previous" ? -scrollAmount : scrollAmount,
      behavior: "smooth"
    });
  }, []);

  function formatPriceRange(range: StorefrontFragrance["priceRange"]) {
    const min = range.min === null ? Number.NaN : Number(range.min);
    const max = range.max === null ? Number.NaN : Number(range.max);

    if (!Number.isFinite(min)) return "";
    if (!Number.isFinite(max) || min === max) return priceFormatter.format(min);

    return `${priceFormatter.format(min)} - ${priceFormatter.format(max)}`;
  }

  function formatDiscountBadge(discount: ActiveProductDiscount) {
    return productDiscountBadge(discount, (amount) => priceFormatter.format(amount));
  }

  function navigateToProduct(
    event: MouseEvent<HTMLAnchorElement>,
    fragrance: StorefrontFragrance,
    imageAlt: string
  ) {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      !fragrance.primaryImage
    ) {
      return;
    }

    const source = event.currentTarget.querySelector<HTMLElement>(
      "[data-product-transition-source]"
    );
    if (!source) return;

    const href = `/${locale}/fragrances/${fragrance.slug}`;
    const didStart = startProductImageTransition({
      slug: fragrance.slug,
      imageUrl: fragrance.primaryImage.url,
      imageAlt,
      source,
      navigate: () => router.push(href)
    });

    if (didStart) event.preventDefault();
  }

  return (
    <section className="bg-surface px-gutter pb-12 pt-20 text-parchment sm:pb-14 sm:pt-24 lg:pb-16 lg:pt-32">
      <div className="mx-auto max-w-container">
        <div className="mb-10 flex items-end justify-between gap-6 sm:mb-14">
          <h2 className="font-serif text-3xl leading-tight text-parchment sm:text-5xl">
            The Signature Collection
          </h2>

          <div className="hidden items-center gap-3 md:flex">
            <button
              type="button"
              aria-label="Previous fragrances"
              onClick={() => scrollCarousel("previous")}
              className="focus-gold flex h-12 w-12 items-center justify-center border border-gold/40 text-xl text-parchment transition-colors hover:border-gold hover:bg-gold/10"
            >
              {isArabic ? "\u2192" : "\u2190"}
            </button>
            <button
              type="button"
              aria-label="Next fragrances"
              onClick={() => scrollCarousel("next")}
              className="focus-gold flex h-12 w-12 items-center justify-center border border-gold text-xl text-parchment transition-colors hover:bg-gold/10"
            >
              {isArabic ? "\u2190" : "\u2192"}
            </button>
          </div>
        </div>

        {status === "loading" ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((item) => (
              <div key={item} className="animate-pulse">
                <div className="aspect-[3/4] bg-surface-mid/50" />
                <div className="mx-auto mt-6 h-3 w-24 bg-surface-mid/60" />
                <div className="mx-auto mt-4 h-7 w-44 bg-surface-mid/60" />
              </div>
            ))}
          </div>
        ) : null}

        {status === "error" ? (
          <div className="border border-outline/70 bg-surface px-5 py-6 text-sm text-on-surface">
            The collection could not be loaded right now.
          </div>
        ) : null}

        {status === "ready" && fragrances.length === 0 ? (
          <div className="border border-outline/70 bg-surface px-5 py-6 text-sm text-on-surface">
            No fragrances are published for this collection yet.
          </div>
        ) : null}

        {status === "ready" && fragrances.length > 0 ? (
          <div
            ref={carouselRef}
            className="no-scrollbar flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth pb-8"
          >
            {fragrances.map((fragrance) => {
              const name = isArabic ? fragrance.nameAr : fragrance.nameEn;
              const tagline = isArabic
                ? fragrance.taglineAr
                : fragrance.taglineEn;
              const imageAlt = fragrance.primaryImage
                ? isArabic
                  ? fragrance.primaryImage.altAr
                  : fragrance.primaryImage.altEn
                : name;

              return (
                <Link
                  key={fragrance.id}
                  href={`/${locale}/fragrances/${fragrance.slug}`}
                  onClick={(event) =>
                    navigateToProduct(event, fragrance, imageAlt)
                  }
                  data-product-image-transition-link
                  data-card
                  className="group w-[82vw] shrink-0 snap-start sm:w-[360px] lg:w-[calc((100%_-_3rem)/3)]"
                >
                  <div
                    data-product-transition-source
                    className="img-shimmer relative mb-6 flex aspect-[3/4] items-center justify-center overflow-hidden border border-outline bg-surface-mid/40"
                  >
                    {fragrance.primaryImage ? (
                      <Image
                        src={fragrance.primaryImage.url}
                        alt={imageAlt}
                        fill
                        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 360px, 82vw"
                        className="relative z-10 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02]"
                        onLoad={(event) => {
                          event.currentTarget.dataset.loaded = "true";
                        }}
                        onError={(event) => {
                          event.currentTarget.style.display = "none";
                        }}
                      />
                    ) : null}
                    <div className="absolute inset-0 z-0 flex items-center justify-center bg-[radial-gradient(circle_at_center,rgba(255,248,236,0.9),rgba(227,210,186,0.62))] px-8 text-center font-serif text-3xl leading-tight text-parchment/70">
                      {name}
                    </div>
                    <div className="absolute inset-0 z-20 bg-gradient-to-t from-parchment/35 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                    {fragrance.discount ? (
                      <span className="label-caps absolute right-3 top-3 z-30 bg-gold px-3 py-2 text-surface-hi">
                        {formatDiscountBadge(fragrance.discount)}
                      </span>
                    ) : null}
                  </div>

                  <div className="flex flex-col items-center text-center">
                    <span className="label-caps mb-2 text-gold">
                      {formatScentProfile(fragrance.scentProfile)}
                    </span>
                    <h3 className="font-serif text-3xl leading-10 text-parchment">
                      {name}
                    </h3>
                    <p className="mt-2 min-h-12 max-w-[20rem] text-sm leading-6 text-on-surface/75">
                      {tagline}
                    </p>
                    {fragrance.discount ? (
                      <div className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm">
                        <span className="text-on-surface/55 line-through decoration-on-surface/55">
                          {formatPriceRange(fragrance.originalPriceRange)}
                        </span>
                        <span className="font-semibold text-gold">
                          {formatPriceRange(fragrance.priceRange)}
                        </span>
                      </div>
                    ) : (
                      <p className="mt-3 text-sm text-on-surface/80">
                        {formatPriceRange(fragrance.priceRange)}
                      </p>
                    )}
                    <span className="label-caps mt-5 border-b border-parchment pb-1 text-parchment transition-colors duration-300 group-hover:border-gold group-hover:text-gold">
                      Explore Note Profile
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : null}
      </div>
    </section>
  );
}
