"use client";

import {useLocale} from "next-intl";
import Image from "next/image";
import {useCallback, useEffect, useMemo, useRef, useState} from "react";

type StorefrontFragrance = {
  id: string;
  slug: string;
  nameEn: string;
  nameAr: string;
  taglineEn: string;
  taglineAr: string;
  scentProfile: string;
  primaryImage: {
    url: string;
    altEn: string;
    altAr: string;
  } | null;
  priceRange: {
    min: string | null;
    max: string | null;
  };
};

function formatScentProfile(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function SignatureCollectionSection() {
  const locale = useLocale();
  const isArabic = locale === "ar";
  const carouselRef = useRef<HTMLDivElement>(null);
  const [fragrances, setFragrances] = useState<StorefrontFragrance[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading"
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
  }, []);

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

  function formatPriceRange(fragrance: StorefrontFragrance) {
    const min = Number(fragrance.priceRange.min);
    const max = Number(fragrance.priceRange.max);

    if (!Number.isFinite(min)) return "";
    if (!Number.isFinite(max) || min === max) return priceFormatter.format(min);

    return `${priceFormatter.format(min)} - ${priceFormatter.format(max)}`;
  }

  return (
    <section className="bg-bg px-gutter py-20 text-parchment sm:py-24 lg:py-32">
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
              {isArabic ? "→" : "←"}
            </button>
            <button
              type="button"
              aria-label="Next fragrances"
              onClick={() => scrollCarousel("next")}
              className="focus-gold flex h-12 w-12 items-center justify-center border border-gold text-xl text-parchment transition-colors hover:bg-gold/10"
            >
              {isArabic ? "←" : "→"}
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
                <a
                  key={fragrance.id}
                  href={`/${locale}/fragrances/${fragrance.slug}`}
                  data-card
                  className="group w-[82vw] shrink-0 snap-start sm:w-[360px] lg:w-[400px]"
                >
                  <div className="relative mb-6 flex aspect-[3/4] items-center justify-center overflow-hidden border border-outline bg-surface">
                    {fragrance.primaryImage ? (
                      <Image
                        src={fragrance.primaryImage.url}
                        alt={imageAlt}
                        fill
                        sizes="(min-width: 1024px) 400px, (min-width: 640px) 360px, 82vw"
                        className="relative z-10 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02]"
                        onError={(event) => {
                          event.currentTarget.style.display = "none";
                        }}
                      />
                    ) : null}
                    <div className="absolute inset-0 z-0 flex items-center justify-center bg-[radial-gradient(circle_at_center,rgba(255,248,236,0.9),rgba(227,210,186,0.62))] px-8 text-center font-serif text-3xl leading-tight text-parchment/70">
                      {name}
                    </div>
                    <div className="absolute inset-0 z-20 bg-gradient-to-t from-parchment/35 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
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
                    <p className="mt-3 text-sm text-on-surface/80">
                      {formatPriceRange(fragrance)}
                    </p>
                    <span className="label-caps mt-5 border-b border-parchment pb-1 text-parchment transition-colors duration-300 group-hover:border-gold group-hover:text-gold">
                      Explore Note Profile
                    </span>
                  </div>
                </a>
              );
            })}
          </div>
        ) : null}
      </div>
    </section>
  );
}
