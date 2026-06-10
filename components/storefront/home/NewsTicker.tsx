"use client";

import {useEffect, useMemo, useState} from "react";
import {useLocale} from "next-intl";

type ActiveSalesLine = {
  id: string;
  textEn: string;
  textAr: string;
};

export default function NewsTicker() {
  const locale = useLocale();
  const [sale, setSale] = useState<ActiveSalesLine | null>(null);

  useEffect(() => {
    async function fetchSalesLine() {
      try {
        const res = await fetch("/api/storefront/sales/active", {
          cache: "no-store"
        });
        if (!res.ok) return;
        setSale((await res.json()) as ActiveSalesLine | null);
      } catch {
        // Silently fail - ticker is non-critical.
      }
    }

    fetchSalesLine();
  }, []);

  const text = sale ? (locale === "ar" ? sale.textAr : sale.textEn) : null;
  const repeatedItems = useMemo(
    () => (text ? Array.from({length: 12}, () => text) : []),
    [text]
  );

  if (!text) return null;

  return (
    <section
      aria-label="Valentro sales news"
      className="overflow-hidden border-y border-umber bg-umber text-surface-hi"
    >
      <div className="marquee-track flex min-h-20 w-max items-center gap-10 py-6 sm:min-h-24 sm:gap-16 sm:py-7 lg:gap-20">
        {repeatedItems.map((item, index) => (
          <div
            key={`${item}-${index}`}
            className="flex items-center gap-10 sm:gap-16 lg:gap-20"
          >
            <span className="whitespace-nowrap font-serif text-2xl leading-none tracking-normal text-surface-hi sm:text-4xl lg:text-5xl">
              {item}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
