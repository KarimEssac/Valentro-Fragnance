"use client";

import {useLocale, useTranslations} from "next-intl";
import Link from "next/link";
import {useRouter} from "next/navigation";
import type {MouseEvent} from "react";
import {useCallback, useEffect, useMemo, useState} from "react";

import {startProductImageTransition} from "@/lib/product-image-transition";

/* ------------------------------------------------------------------ */
/*  Types & static data                                                */
/* ------------------------------------------------------------------ */

type SlideKey = "noir" | "oud";

type Slide = {
  key: SlideKey;
  collection: string;
  name: string;
  tagline: string;
  bgImage: string;
};

const slideKeys: SlideKey[] = ["noir", "oud"];

/**
 * Each slide maps to a full-bleed background image.
 * The perfume is already in the photo (left side), so we don't render
 * a separate product <Image>.  Replace these paths with per-fragrance
 * hero shots when available.
 */
const slideBgImages: Record<SlideKey, string> = {
  noir: "https://res.cloudinary.com/dpmmlk1zg/image/upload/v1781613528/valentro/site/hero-bg-light.webp",
  oud: "https://res.cloudinary.com/dpmmlk1zg/image/upload/v1781613528/valentro/site/hero-bg-light.webp" // TODO: replace with oud-specific hero image
};

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export default function HeroSection() {
  const t = useTranslations("hero");
  const locale = useLocale();
  const router = useRouter();
  const isRtl = locale === "ar";
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  function handleShopNow(
    event: MouseEvent<HTMLAnchorElement>,
    slug: string,
    imageUrl: string
  ) {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    const activeSlideElement = document.querySelector(
      `[data-hero-section] > div[aria-hidden="false"] [data-product-transition-source]`
    ) as HTMLElement | null;

    if (!activeSlideElement) return;

    const href = `/${locale}/fragrances/${slug}`;
    const didStart = startProductImageTransition({
      slug,
      imageUrl,
      imageAlt: "Hero Fragrance",
      source: activeSlideElement,
      navigate: () => router.push(href)
    });

    if (didStart) event.preventDefault();
  }

  /* Build slides --------------------------------------------------- */
  const slides = useMemo<Slide[]>(
    () =>
      slideKeys.map((key) => ({
        key,
        collection: t(`slides.${key}.collection`),
        name: t(`slides.${key}.name`),
        tagline: t(`slides.${key}.tagline`),
        bgImage: slideBgImages[key]
      })),
    [t]
  );

  /* Carousel navigation -------------------------------------------- */
  const goToNext = useCallback(() => {
    setActiveIndex((current) => (current + 1) % slides.length);
  }, [slides.length]);

  /* Auto-advance --------------------------------------------------- */
  useEffect(() => {
    if (isPaused) return;
    const id = window.setInterval(goToNext, 6000);
    return () => window.clearInterval(id);
  }, [goToNext, isPaused]);

  /* Render --------------------------------------------------------- */
  return (
    <section
      data-hero-section
      className="relative min-h-[100svh] w-full overflow-hidden bg-bg md:h-screen md:min-h-[680px]"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* ---- Background image slides ---- */}
      {slides.map((slide, index) => {
        const isActive = index === activeIndex;
        return (
          <div
            key={slide.key}
            aria-hidden={!isActive}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              isActive ? "opacity-100" : "opacity-0"
            }`}
          >
            {/* Full-bleed background photo */}
            <div
              data-product-transition-source
              className="absolute inset-0 bg-cover bg-[position:31%_center] bg-no-repeat sm:bg-[position:33%_center] md:bg-bottom"
              style={{backgroundImage: `url(${slide.bgImage})`}}
            />
            {/* Light overlays preserve the beige hero while keeping copy readable. */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-bg/10 to-bg/75 max-md:hidden" />
            <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/70 to-transparent md:from-bg/70 md:via-transparent md:to-bg/30" />
          </div>
        );
      })}



      {/* ---- Foreground content ---- */}
      <div
        dir="ltr"
        className="absolute inset-0 z-10 mx-auto flex max-w-[1600px] items-center justify-center px-gutter py-24 md:items-end md:justify-end md:pb-[18vh] md:pl-gutter md:pr-2 md:pt-0 lg:pr-3 xl:pr-4"
      >
        <div
          dir={isRtl ? "rtl" : "ltr"}
          className="relative flex w-full max-w-[23rem] flex-col items-center p-5 text-center sm:max-w-[28rem] sm:p-6 md:w-[45%] md:max-w-none md:items-start md:p-0 md:text-left lg:w-[36%] xl:w-[30%]"
        >
          {/* Cloud-looking backdrop glow behind the words (visible on all screen sizes to keep text readable against background photos) */}
          <div className="absolute -inset-x-10 -inset-y-8 md:-inset-x-16 md:-inset-y-12 bg-[radial-gradient(circle,rgba(247,238,223,0.95)_0%,rgba(247,238,223,0.55)_60%,transparent_100%)] blur-3xl pointer-events-none z-0" />

          {slides.map((slide, index) => {
            const isActive = index === activeIndex;
            return (
              <div
                key={slide.key}
                aria-hidden={!isActive}
                className={`flex w-full flex-col items-center md:items-start transition-all duration-700 ease-in-out ${
                  isActive
                    ? "relative translate-y-0 opacity-100"
                    : "pointer-events-none absolute translate-y-6 opacity-0"
                }`}
              >
                <p className="label-caps mb-3 w-full text-center text-gold md:mb-4 md:text-left">{slide.collection}</p>
                <h1 className="max-w-full text-center font-serif text-[clamp(2.4rem,14vw,4rem)] leading-[0.95] text-parchment md:text-left md:text-5xl md:leading-tight md:whitespace-nowrap lg:text-6xl xl:text-7xl">
                  {slide.name}
                </h1>
                <p className="mx-auto mt-4 max-w-[19rem] text-center font-sans text-sm font-normal leading-6 text-on-surface md:mx-0 md:max-w-md md:text-left md:text-lg md:font-light md:leading-7">
                  {slide.tagline}
                </p>

                {/* Shop Now CTA */}
                <div className="mt-6 flex w-full justify-center md:mt-8 md:justify-start">
                  <Link
                    href={`/${locale}/fragrances/${slide.key === "noir" ? "noir-vanille" : "oud-imperial"}`}
                    onClick={(event) =>
                      handleShopNow(
                        event,
                        slide.key === "noir" ? "noir-vanille" : "oud-imperial",
                        slide.bgImage
                      )
                    }
                    data-product-image-transition-link
                    className="focus-gold inline-flex min-h-12 w-full items-center justify-center border border-parchment bg-parchment px-6 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-surface-hi transition-all duration-300 hover:bg-gold hover:border-gold hover:text-surface-hi hover:shadow-gold sm:w-auto sm:px-10 sm:py-4 sm:text-sm"
                  >
                    {t("shopNow")}
                  </Link>
                </div>
              </div>
            );
          })}

        </div>
      </div>

      {/* Scroll indicator */}
      <div
        aria-hidden="true"
        className="absolute bottom-8 left-1/2 z-20 hidden h-[60px] w-px -translate-x-1/2 bg-gold/80 animate-scroll-pulse md:block"
      />
    </section>
  );
}
