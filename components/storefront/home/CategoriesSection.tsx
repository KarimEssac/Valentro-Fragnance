"use client";

import {useLocale} from "next-intl";
import Image from "next/image";
import {useCallback, useRef} from "react";

type Category = {
  title: string;
  gender: "HER" | "HIM" | "UNISEX";
  image: string;
  alt: string;
  offset?: boolean;
};

const categories: Category[] = [
  {
    title: "For Her",
    gender: "HER",
    image: "https://res.cloudinary.com/dpmmlk1zg/image/upload/v1781613530/valentro/fragrances/emporio-armani.webp",
    alt: "Warm vanilla fragrance ingredients for her"
  },
  {
    title: "For Him",
    gender: "HIM",
    image: "https://res.cloudinary.com/dpmmlk1zg/image/upload/v1781613536/valentro/fragrances/valentino-uomo.webp",
    alt: "Aromatic woody fragrance ingredients for him",
    offset: true
  },
  {
    title: "Unisex",
    gender: "UNISEX",
    image: "https://res.cloudinary.com/dpmmlk1zg/image/upload/v1781613535/valentro/fragrances/ultra-male.webp",
    alt: "Balanced aromatic gourmand fragrance ingredients"
  }
];

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

export default function CategoriesSection() {
  const locale = useLocale();
  const carouselRef = useRef<HTMLDivElement>(null);
  const isArabic = locale === "ar";

  const scrollCarousel = useCallback((direction: "previous" | "next") => {
    const carousel = carouselRef.current;
    if (!carousel) return;

    const card = carousel.querySelector<HTMLElement>("[data-category-card]");
    const scrollAmount = card ? card.offsetWidth + 24 : carousel.clientWidth;

    carousel.scrollBy({
      left: direction === "previous" ? -scrollAmount : scrollAmount,
      behavior: "smooth"
    });
  }, []);

  return (
    <section className="bg-surface px-gutter py-20 text-parchment sm:py-24 lg:py-32">
      <div className="mx-auto max-w-container">
        <header className="mx-auto mb-10 max-w-2xl text-center sm:mb-16">
          <h2 className="font-serif text-4xl leading-tight text-parchment sm:text-6xl">
            Categories
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-on-surface/75 sm:text-lg">
            Discover signature scents by mood, wearer, and character.
          </p>
        </header>

        <div className="mb-8 flex items-center justify-center gap-3 md:hidden">
          <button
            type="button"
            aria-label="Previous category"
            onClick={() => scrollCarousel("previous")}
            className="focus-gold flex h-11 w-11 items-center justify-center border border-gold/40 text-xl text-parchment transition-colors hover:border-gold hover:bg-gold/10"
          >
            <ArrowIcon direction={isArabic ? "right" : "left"} />
          </button>
          <button
            type="button"
            aria-label="Next category"
            onClick={() => scrollCarousel("next")}
            className="focus-gold flex h-11 w-11 items-center justify-center border border-gold text-xl text-parchment transition-colors hover:bg-gold/10"
          >
            <ArrowIcon direction={isArabic ? "left" : "right"} />
          </button>
        </div>

        <div
          ref={carouselRef}
          className="no-scrollbar flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth pb-8 md:grid md:grid-cols-3 md:gap-6 md:overflow-visible md:pb-0 lg:gap-8"
        >
          {categories.map((category) => (
            <a
              key={category.title}
              href={`/${locale}/fragrances?gender=${category.gender}`}
              data-category-card
              className={`group block w-[82vw] shrink-0 snap-center sm:w-[420px] md:w-auto ${
                category.offset ? "md:mt-16" : ""
              }`}
            >
              <div className="img-shimmer relative mb-6 aspect-[3/4] overflow-hidden bg-surface-mid/40">
                <Image
                  src={category.image}
                  alt={category.alt}
                  fill
                  sizes="(min-width: 1024px) 31vw, (min-width: 768px) 33vw, 100vw"
                  className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.02]"
                  onLoad={(event) => {
                    event.currentTarget.dataset.loaded = "true";
                  }}
                />
                <div className="absolute inset-0 bg-parchment/5 transition-colors duration-500 group-hover:bg-transparent" />
              </div>

              <div className="text-center">
                <h3 className="font-serif text-3xl leading-10 text-parchment transition-colors duration-300 group-hover:text-gold">
                  {category.title}
                </h3>
                <span className="label-caps mt-3 inline-block border-b border-transparent pb-1 text-on-surface/75 transition-colors duration-300 group-hover:border-gold group-hover:text-parchment">
                  Explore Collection
                </span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
