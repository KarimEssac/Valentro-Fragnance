"use client";

import {useLocale, useTranslations} from "next-intl";
import Link from "next/link";

const HERO_IMAGE = "/magnito-hero.png";
const PRODUCT_SLUG = "magnito";

export default function HeroSection() {
  const t = useTranslations("hero");
  const locale = useLocale();
  const isRtl = locale === "ar";

  const collectionName = t("product.collection");
  const productName = t("product.name");
  const productTagline = t("product.tagline");

  return (
    <section
      data-hero-section
      className="relative min-h-[100svh] w-full overflow-hidden bg-bg md:h-screen md:min-h-[680px]"
    >
      {/* ---- Background image ---- */}
      <div className="absolute inset-0">
        {/* Full-bleed background photo */}
        <div
          className="absolute inset-0 bg-cover bg-[position:31%_center] bg-no-repeat sm:bg-[position:33%_center] md:bg-bottom"
          style={{backgroundImage: `url(${HERO_IMAGE})`}}
        />
        {/* Light overlays preserve the beige hero while keeping copy readable. */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-bg/10 to-bg/75 max-md:hidden" />
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/70 to-transparent md:from-bg/70 md:via-transparent md:to-bg/30" />
      </div>

      {/* ---- Foreground content ---- */}
      <div
        dir="ltr"
        className="absolute inset-0 z-10 mx-auto flex max-w-[1600px] items-center justify-center px-gutter py-24 md:items-end md:justify-end md:pb-[18vh] md:pl-gutter md:pr-2 md:pt-0 lg:pr-3 xl:pr-4"
      >
        <div
          dir={isRtl ? "rtl" : "ltr"}
          className="relative flex w-full max-w-[23rem] flex-col items-center p-5 text-center sm:max-w-[28rem] sm:p-6 md:w-[45%] md:max-w-none md:items-start md:p-0 md:text-left rtl:md:text-right lg:w-[36%] xl:w-[30%]"
        >
          {/* Cloud-looking backdrop glow behind the words (visible on all screen sizes to keep text readable against background photos) */}
          <div className="absolute -inset-x-10 -inset-y-8 md:-inset-x-16 md:-inset-y-12 bg-[radial-gradient(circle,rgba(247,238,223,0.95)_0%,rgba(247,238,223,0.55)_60%,transparent_100%)] blur-3xl pointer-events-none z-0" />

          <div className="relative flex w-full flex-col items-center md:items-start rtl:md:items-start">
            <p className="label-caps mb-3 w-full text-center text-gold md:mb-4 md:text-left rtl:md:text-right">
              {collectionName}
            </p>
            <h1 className="max-w-full text-center font-serif text-[clamp(2.4rem,14vw,4rem)] leading-[0.95] text-parchment md:text-left rtl:md:text-right md:text-5xl md:leading-tight md:whitespace-nowrap lg:text-6xl xl:text-7xl">
              {productName}
            </h1>
            <p className="mx-auto mt-4 max-w-[19rem] text-center font-sans text-sm font-normal leading-6 text-on-surface md:mx-0 md:max-w-md md:text-left rtl:md:text-right md:text-lg md:font-light md:leading-7">
              {productTagline}
            </p>

            {/* Shop Now CTA */}
            <div className="mt-6 flex w-full justify-center md:mt-8 md:justify-start rtl:md:justify-start">
              <Link
                href={`/${locale}/fragrances/${PRODUCT_SLUG}`}
                className="focus-gold inline-flex min-h-12 w-full items-center justify-center border border-parchment bg-parchment px-6 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-surface-hi transition-all duration-300 hover:bg-gold hover:border-gold hover:text-surface-hi hover:shadow-gold sm:w-auto sm:px-10 sm:py-4 sm:text-sm"
              >
                {t("shopNow")}
              </Link>
            </div>
          </div>
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
