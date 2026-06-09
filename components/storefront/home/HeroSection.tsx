"use client";

import Image from "next/image";
import {useLocale, useTranslations} from "next-intl";
import {useCallback, useEffect, useMemo, useState} from "react";

type SlideKey = "noir" | "oud";

type Slide = {
  key: SlideKey;
  collection: string;
  name: string;
  tagline: string;
  alt: string;
  imageUrl: string;
};

const slideKeys: SlideKey[] = ["noir", "oud"];

const slideImages: Record<SlideKey, string> = {
  noir: "https://placehold.co/300x500/131410/DEBC7E?text=Valentro",
  oud: "https://placehold.co/300x500/20201c/DEBC7E?text=Valentro"
};

function ChevronIcon({direction}: {direction: "left" | "right"}) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.25"
      className="h-10 w-10"
    >
      <path d={direction === "left" ? "M15 5 8 12l7 7" : "M9 5l7 7-7 7"} />
    </svg>
  );
}

function SmokeBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <svg
        className="smoke-stage h-full w-full opacity-80"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <defs>
          <filter
            id="valentro-smoke-filter"
            x="-20%"
            y="-20%"
            width="140%"
            height="140%"
          >
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.008 0.02"
              numOctaves="3"
              seed="17"
              result="noise"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale="34"
              xChannelSelector="R"
              yChannelSelector="G"
            />
            <feGaussianBlur stdDeviation="0.45" />
          </filter>
          <linearGradient id="smoke-gold" x1="0%" y1="20%" x2="100%" y2="80%">
            <stop offset="0%" stopColor="#DEBC7E" stopOpacity="0" />
            <stop offset="34%" stopColor="#DEBC7E" stopOpacity="0.28" />
            <stop offset="62%" stopColor="#e5e2dc" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#DEBC7E" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="smoke-ash" x1="10%" y1="90%" x2="90%" y2="10%">
            <stop offset="0%" stopColor="#e5e2dc" stopOpacity="0" />
            <stop offset="45%" stopColor="#e5e2dc" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#DEBC7E" stopOpacity="0.2" />
          </linearGradient>
        </defs>
        <g filter="url(#valentro-smoke-filter)">
          <g className="smoke-layer smoke-layer-a">
            <path
              className="smoke-path smoke-path-slow"
              d="M254 620C428 594 462 462 600 442c145-21 184 112 337 78 132-30 192-160 334-147"
              stroke="url(#smoke-gold)"
              strokeWidth="18"
              fill="none"
            />
            <path
              className="smoke-path"
              d="M468 784c-42-170 90-220 148-318 82-139 14-245 132-313 116-67 252-24 336 60"
              stroke="url(#smoke-ash)"
              strokeWidth="14"
              fill="none"
            />
          </g>
          <g className="smoke-layer smoke-layer-b">
            <path
              className="smoke-path smoke-path-fast"
              d="M380 350c134 35 206-42 308-72 155-46 318 10 402 134 54 80 53 163 146 198 70 27 135 2 190-35"
              stroke="url(#smoke-gold)"
              strokeWidth="12"
              fill="none"
            />
            <path
              className="smoke-path smoke-path-slow"
              d="M550 720c92-52 93-164 175-218 94-62 186 7 282-48 82-47 106-146 159-268"
              stroke="url(#smoke-ash)"
              strokeWidth="20"
              fill="none"
            />
          </g>
          <g className="smoke-layer smoke-layer-c">
            <path
              className="smoke-path"
              d="M142 532c172-52 282-30 365 44 113 101 193 87 297 28 128-72 201-204 351-178 72 13 119 57 157 104"
              stroke="url(#smoke-gold)"
              strokeWidth="10"
              fill="none"
            />
            <path
              className="smoke-path smoke-path-fast"
              d="M676 120c-80 104 14 185 44 292 37 132-28 232-101 300"
              stroke="url(#smoke-ash)"
              strokeWidth="13"
              fill="none"
            />
          </g>
        </g>
      </svg>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_55%_48%,rgba(222,188,126,0.08),rgba(0,0,0,0)_42%),linear-gradient(180deg,rgba(0,0,0,0.15),#000_94%)]" />
    </div>
  );
}

export default function HeroSection() {
  const t = useTranslations("hero");
  const locale = useLocale();
  const isRtl = locale === "ar";
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const slides = useMemo<Slide[]>(
    () =>
      slideKeys.map((key) => ({
        key,
        collection: t(`slides.${key}.collection`),
        name: t(`slides.${key}.name`),
        tagline: t(`slides.${key}.tagline`),
        alt: t(`slides.${key}.alt`),
        imageUrl: slideImages[key]
      })),
    [t]
  );

  const goToNext = useCallback(() => {
    setActiveIndex((current) => (current + 1) % slides.length);
  }, [slides.length]);

  const goToPrevious = useCallback(() => {
    setActiveIndex((current) => (current - 1 + slides.length) % slides.length);
  }, [slides.length]);

  useEffect(() => {
    if (isPaused) {
      return;
    }

    const intervalId = window.setInterval(goToNext, 6000);
    return () => window.clearInterval(intervalId);
  }, [goToNext, isPaused]);

  return (
    <section
      className="relative h-screen min-h-[680px] overflow-hidden bg-bg"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <SmokeBackdrop />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[1] flex items-center justify-center overflow-hidden px-gutter text-center font-serif text-[clamp(80px,12vw,160px)] leading-none text-[rgba(229,226,220,0.07)]"
      >
        VALENTRO
      </div>

      <button
        type="button"
        aria-label={t("previous")}
        onClick={goToPrevious}
        className="focus-gold absolute start-4 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center text-gold transition-colors duration-300 hover:text-parchment md:start-12"
      >
        <ChevronIcon direction={isRtl ? "right" : "left"} />
      </button>
      <button
        type="button"
        aria-label={t("next")}
        onClick={goToNext}
        className="focus-gold absolute end-4 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center text-gold transition-colors duration-300 hover:text-parchment md:end-12"
      >
        <ChevronIcon direction={isRtl ? "left" : "right"} />
      </button>

      <div className="relative z-10 mx-auto h-full max-w-container px-gutter lg:px-16">
        {slides.map((slide, index) => {
          const isActive = index === activeIndex;
          const slideOffset = index < activeIndex ? "-translate-x-8" : "translate-x-8";

          return (
            <article
              key={slide.key}
              aria-hidden={!isActive}
              className={`absolute inset-0 grid h-full grid-cols-1 content-center gap-10 px-gutter pb-24 pt-36 transition-all duration-300 ease-in-out md:grid-cols-12 md:gap-6 md:px-16 md:pb-20 md:pt-28 ${
                isActive
                  ? "translate-x-0 opacity-100"
                  : `pointer-events-none ${slideOffset} opacity-0`
              }`}
            >
              <div
                className={`relative z-10 max-w-xl self-center ${
                  isRtl
                    ? "text-right md:col-span-5 md:col-start-8"
                    : "text-left md:col-span-5 md:col-start-2"
                }`}
              >
                <p className="label-caps mb-5 text-gold">{slide.collection}</p>
                <h1 className="font-serif text-5xl leading-tight text-parchment md:text-7xl">
                  {slide.name}
                </h1>
                <p className="mt-5 max-w-md font-sans text-lg font-light leading-7 text-on-surface">
                  {slide.tagline}
                </p>
                <div
                  className={`mt-9 flex flex-wrap gap-4 ${
                    isRtl ? "justify-end" : "justify-start"
                  }`}
                >
                  <a
                    href={`/${locale}/fragrances/${slide.key === "noir" ? "noir-vanille" : "oud-imperial"}`}
                    className="focus-gold bg-gold px-8 py-3 text-sm font-semibold uppercase tracking-widest text-bg transition duration-300 hover:bg-parchment"
                  >
                    {t("discover")}
                  </a>
                  <button
                    type="button"
                    className="focus-gold border border-gold px-8 py-3 text-sm font-semibold uppercase tracking-widest text-gold transition duration-300 hover:bg-gold hover:text-bg"
                  >
                    {t("addToCart")}
                  </button>
                </div>
              </div>

              <div
                className={`relative z-10 flex items-center justify-center self-center ${
                  isRtl
                    ? "md:col-span-4 md:col-start-2"
                    : "md:col-span-4 md:col-start-8"
                }`}
              >
                <div className="animate-bottle-float relative">
                  <div className="absolute inset-x-8 bottom-4 h-10 bg-gold/20 blur-3xl" />
                  <Image
                    src={slide.imageUrl}
                    alt={slide.alt}
                    width={300}
                    height={500}
                    priority={index === 0}
                    unoptimized
                    className="relative h-[min(50vh,500px)] w-auto object-contain opacity-90 drop-shadow-[0_32px_60px_rgba(222,188,126,0.18)] md:h-[min(58vh,500px)]"
                  />
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <div
        aria-hidden="true"
        className="absolute bottom-8 left-1/2 z-20 h-[60px] w-px -translate-x-1/2 bg-gold/80 animate-scroll-pulse"
      />
    </section>
  );
}
