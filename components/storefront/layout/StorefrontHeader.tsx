"use client";

import {useLocale} from "next-intl";
import {usePathname} from "next/navigation";

import Navbar from "@/components/storefront/layout/Navbar";
import SalesBar from "@/components/storefront/layout/SalesBar";

export default function StorefrontHeader() {
  const locale = useLocale();
  const pathname = usePathname();
  const isHome = pathname === `/${locale}` || pathname === `/${locale}/`;
  const isPolicyPage = /^\/[^/]+\/(privacy-policy|refund-policy|terms-and-conditions)\/?$/.test(pathname);
  const background = isPolicyPage ? "bg-parchment-base" : "bg-bg";

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
