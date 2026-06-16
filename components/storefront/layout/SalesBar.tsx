"use client";

import {useEffect, useState} from "react";
import {useLocale} from "next-intl";
import Link from "next/link";

type ActiveAnnouncement = {
  id: string;
  textEn: string;
  textAr: string;
  linkUrl?: string | null;
};

export default function SalesBar() {
  const locale = useLocale();
  const [sale, setSale] = useState<ActiveAnnouncement | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    async function fetchSalesLine() {
      try {
        const res = await fetch("/api/storefront/announcements/active", {
          cache: "no-store"
        });
        if (!res.ok) return;
        const data = (await res.json()) as ActiveAnnouncement | null;

        if (data) {
          setSale(data);
          setDismissed(
            sessionStorage.getItem(`valentro-sales-dismissed-${data.id}`) ===
              "true"
          );
        }
      } catch {
        // Silently fail - sales bar is non-critical.
      }
    }

    fetchSalesLine();
  }, []);

  if (!sale || dismissed) return null;

  const text = locale === "ar" ? sale.textAr : sale.textEn;
  const dismissalKey = `valentro-sales-dismissed-${sale.id}`;

  function dismiss() {
    sessionStorage.setItem(dismissalKey, "true");
    setDismissed(true);
  }

  const content = (
    <p className="label-caps mx-auto max-w-container text-[10px] leading-4 tracking-[0.12em] text-gold sm:text-[11px] sm:tracking-[0.15em] hover:text-gold-muted transition-colors">
      {text}
    </p>
  );

  return (
    <div className="relative z-[60] w-full border-b border-outline bg-surface px-12 py-2 text-center sm:px-gutter">
      {sale.linkUrl ? (
        <Link href={sale.linkUrl} className="block focus-gold">
          {content}
        </Link>
      ) : (
        content
      )}
      <button
        type="button"
        aria-label="Dismiss sale announcement"
        onClick={dismiss}
        className="focus-gold absolute end-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center text-gold transition-colors duration-300 hover:text-parchment sm:end-4"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1.5"
        >
          <path d="M6 6l12 12M18 6 6 18" />
        </svg>
      </button>
    </div>
  );
}
