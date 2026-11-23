"use client";

import {useLocale} from "next-intl";
import {usePathname} from "next/navigation";
import {useEffect} from "react";

import Navbar from "@/components/storefront/layout/Navbar";
import SalesBar from "@/components/storefront/layout/SalesBar";
import {refreshCart} from "@/lib/cart-items";

export default function StorefrontHeader() {
  const locale = useLocale();
  const pathname = usePathname();
  const isHome = pathname === `/${locale}` || pathname === `/${locale}/`;
  const isPolicyPage = /^\/[^/]+\/(privacy-policy|refund-policy|terms-and-conditions)\/?$/.test(pathname);
  const background = isPolicyPage ? "bg-parchment-base" : "bg-bg";

  useEffect(() => {
    function refreshSavedCart() {
      void refreshCart().catch(() => {
        // Keep the saved cart if the inventory request fails.
      });
    }

    function handlePageShow(event: PageTransitionEvent) {
      if (event.persisted) refreshSavedCart();
    }

    refreshSavedCart();
    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, []);

  return (
    <header
      className={`storefront-header z-50 ${
        isHome ? "absolute inset-x-0 top-0" : `relative ${background}`
      }`}
    >
      <SalesBar />
      <Navbar key={pathname} cartCount={0} />
    </header>
  );
}
