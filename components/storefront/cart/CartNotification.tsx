"use client";

import {useLocale} from "next-intl";
import {useEffect, useState} from "react";

import {cartAddedEvent, type CartAddedDetail} from "@/lib/cart-items";

export default function CartNotification() {
  const isArabic = useLocale() === "ar";
  const [notification, setNotification] = useState<(CartAddedDetail & {id: number}) | null>(null);

  useEffect(() => {
    let id = 0;
    function onCartAdded(event: Event) {
      const {name} = (event as CustomEvent<CartAddedDetail>).detail;
      setNotification({id: ++id, name});
    }

    window.addEventListener(cartAddedEvent, onCartAdded);
    return () => window.removeEventListener(cartAddedEvent, onCartAdded);
  }, []);

  useEffect(() => {
    if (!notification) return;
    const timeout = window.setTimeout(() => setNotification(null), 6000);
    return () => window.clearTimeout(timeout);
  }, [notification]);

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[1100] w-[360px] max-w-[calc(100vw-2rem)] sm:right-6 sm:top-6">
      <div role="status" aria-live="polite" aria-atomic="true">
        {notification ? (
          <div
            key={notification.id}
            dir={isArabic ? "rtl" : "ltr"}
            className="animate-cart-drawer-in pointer-events-auto flex items-start gap-3 border border-surface-hi/15 bg-umber p-5 text-surface-hi shadow-[0_16px_48px_rgba(47,36,27,0.25)] motion-reduce:animate-none"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 h-6 w-6 shrink-0">
              <circle cx="12" cy="12" r="9" />
              <path d="m8 12 2.5 2.5L16 9" />
            </svg>
            <div className="min-w-0 flex-1">
              <p className="label-caps leading-5">{isArabic ? "تمت الإضافة إلى السلة" : "Added to cart"}</p>
              <p className="mt-1 break-words text-sm leading-6 text-surface-hi/80">{notification.name}</p>
            </div>
            <button
              type="button"
              aria-label={isArabic ? "إغلاق الإشعار" : "Dismiss notification"}
              onClick={() => setNotification(null)}
              className="-me-2 -mt-2 flex h-9 w-9 shrink-0 items-center justify-center text-surface-hi/70 transition-colors hover:text-surface-hi focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-surface-hi"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="h-4 w-4">
                <path d="m6 6 12 12M18 6 6 18" />
              </svg>
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
