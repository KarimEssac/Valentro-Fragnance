"use client";

import {useLocale} from "next-intl";
import Image from "next/image";
import {useCallback, useEffect, useRef, useState} from "react";

type StorefrontTestimonial = {
  id: string;
  messageEn: string;
  messageAr: string;
  image: {
    url: string;
    altEn: string;
    altAr: string;
  };
  rating: number;
  position: number;
  fragrance: {
    slug: string;
    nameEn: string;
    nameAr: string;
  } | null;
};

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

function StarIcon({filled}: {filled: boolean}) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={`h-4 w-4 ${filled ? "fill-gold text-gold" : "text-gold/35"}`}
    >
      <path
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
        d="M12 3.75l2.49 5.04 5.56.81-4.03 3.92.95 5.54L12 16.45l-4.97 2.61.95-5.54L3.95 9.6l5.56-.81L12 3.75z"
      />
    </svg>
  );
}

export default function TestimonialsSection() {
  const locale = useLocale();
  const isArabic = locale === "ar";
  const carouselRef = useRef<HTMLDivElement>(null);
  const [testimonials, setTestimonials] = useState<StorefrontTestimonial[]>(
    []
  );
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading"
  );

  useEffect(() => {
    let isMounted = true;

    async function loadTestimonials() {
      try {
        const response = await fetch("/api/storefront/testimonials?limit=8", {
          headers: {Accept: "application/json"}
        });

        if (!response.ok) {
          throw new Error("Unable to load testimonials");
        }

        const data = (await response.json()) as StorefrontTestimonial[];
        if (isMounted) {
          setTestimonials(data);
          setStatus("ready");
        }
      } catch {
        if (isMounted) {
          setStatus("error");
        }
      }
    }

    loadTestimonials();

    return () => {
      isMounted = false;
    };
  }, []);

  const scrollCarousel = useCallback((direction: "previous" | "next") => {
    const carousel = carouselRef.current;
    if (!carousel) return;

    carousel.scrollBy({
      left:
        direction === "previous" ? -carousel.clientWidth : carousel.clientWidth,
      behavior: "smooth"
    });
  }, []);

  if (status === "error" || (status === "ready" && testimonials.length === 0)) {
    return null;
  }

  return (
    <section
      aria-label="Customer testimonials"
      className="bg-surface px-gutter py-20 text-parchment sm:py-24 lg:py-32"
    >
      <div className="mx-auto max-w-container">
        <div className="mb-8 flex items-center justify-end gap-3">
          <button
            type="button"
            aria-label="Previous testimonial"
            onClick={() => scrollCarousel("previous")}
            className="focus-gold flex h-12 w-12 items-center justify-center border border-gold/40 text-parchment transition-colors hover:border-gold hover:bg-gold/10"
          >
            <ArrowIcon direction={isArabic ? "right" : "left"} />
          </button>
          <button
            type="button"
            aria-label="Next testimonial"
            onClick={() => scrollCarousel("next")}
            className="focus-gold flex h-12 w-12 items-center justify-center border border-gold text-parchment transition-colors hover:bg-gold/10"
          >
            <ArrowIcon direction={isArabic ? "left" : "right"} />
          </button>
        </div>

        {status === "loading" ? (
          <div className="grid gap-10 md:grid-cols-12 md:items-center">
            <div className="hidden h-[420px] animate-pulse bg-surface-mid/60 md:col-span-5 md:block" />
            <div className="space-y-6 md:col-span-6 md:col-start-7">
              <div className="h-4 w-28 animate-pulse bg-surface-mid/60" />
              <div className="h-8 w-full animate-pulse bg-surface-mid/60" />
              <div className="h-8 w-4/5 animate-pulse bg-surface-mid/60" />
            </div>
          </div>
        ) : null}

        {status === "ready" ? (
          <div
            ref={carouselRef}
            className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto scroll-smooth"
          >
            {testimonials.map((testimonial, index) => {
              const message = isArabic
                ? testimonial.messageAr
                : testimonial.messageEn;
              const imageAlt = isArabic
                ? testimonial.image.altAr
                : testimonial.image.altEn;
              const isEven = index % 2 === 0;
              const rating = Math.max(1, Math.min(testimonial.rating, 5));
              const fragranceName = testimonial.fragrance
                ? isArabic
                  ? testimonial.fragrance.nameAr
                  : testimonial.fragrance.nameEn
                : "";

              return (
                <article
                  key={testimonial.id}
                  className="grid w-full shrink-0 snap-start md:grid-cols-12 md:items-center md:gap-6"
                >
                  <div
                    className={`relative hidden aspect-[4/5] overflow-hidden bg-surface-mid md:block md:col-span-5 lg:col-span-5 ${
                      isEven
                        ? "md:col-start-1"
                        : "md:col-start-8 md:order-2"
                    }`}
                  >
                    <Image
                      src={testimonial.image.url}
                      alt={imageAlt}
                      fill
                      sizes="(min-width: 1024px) 36vw, (min-width: 768px) 42vw"
                      className="object-cover object-center"
                    />
                    <div className="absolute inset-0 bg-parchment/5" />
                  </div>

                  <div
                    className={`flex min-h-[18rem] flex-col justify-center border-y border-outline/45 py-10 ${
                      isEven
                        ? "md:col-span-5 md:col-start-7"
                        : "md:col-span-5 md:col-start-2 md:order-1 md:items-end md:text-right"
                    }`}
                  >
                    <div
                      className="mb-5 flex gap-1"
                      aria-label={`${rating} out of 5 rating`}
                    >
                      {[1, 2, 3, 4, 5].map((value) => (
                        <StarIcon key={value} filled={value <= rating} />
                      ))}
                    </div>
                    <p className="font-serif text-3xl leading-tight text-parchment sm:text-4xl md:text-[2.5rem] md:leading-tight">
                      &ldquo;{message}&rdquo;
                    </p>
                    {testimonial.fragrance ? (
                      <>
                        <p className="label-caps mt-6 flex items-center gap-3 text-gold">
                          {isArabic
                            ? `لهذا العطر: ${fragranceName}`
                            : `For fragrance: ${fragranceName}`}
                          <span className="relative h-12 w-10 shrink-0 overflow-hidden bg-surface-mid md:hidden">
                            <Image
                              src={testimonial.image.url}
                              alt={imageAlt}
                              fill
                              sizes="40px"
                              className="object-cover object-center"
                            />
                          </span>
                        </p>
                        <a
                          href={`/${locale}/fragrances/${testimonial.fragrance.slug}`}
                          className="label-caps mt-6 inline-flex min-h-11 items-center justify-center border border-parchment bg-parchment px-6 text-surface-hi transition-colors hover:border-gold hover:bg-gold"
                        >
                          {isArabic ? "اشتر الآن" : "Buy Now"}
                        </a>
                      </>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        ) : null}
      </div>
    </section>
  );
}
