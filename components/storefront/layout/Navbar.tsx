"use client";

import Link from "next/link";
import {usePathname} from "next/navigation";
import {useLocale, useTranslations} from "next-intl";
import {useEffect, useMemo, useState} from "react";

type NavKey = "collections" | "fragrances" | "atelier" | "story";

type NavLink = {
  key: NavKey;
  href: string;
};

type NavbarProps = {
  cartCount?: number;
};

const navLinks: NavLink[] = [
  {key: "collections", href: "/collections"},
  {key: "fragrances", href: "/fragrances"},
  {key: "atelier", href: "/atelier"},
  {key: "story", href: "/our-story"}
];

function BagIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-6 w-6"
    >
      <path d="M7 8h10l1 12H6L7 8Z" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      className="h-7 w-7"
    >
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="1.25"
      className="h-8 w-8"
    >
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

export default function Navbar({cartCount = 0}: NavbarProps) {
  const locale = useLocale();
  const t = useTranslations("nav");
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const isRtl = locale === "ar";

  useEffect(() => {
    function updateScrolled() {
      setScrolled(window.scrollY > 80);
    }

    updateScrolled();
    window.addEventListener("scroll", updateScrolled, {passive: true});
    return () => window.removeEventListener("scroll", updateScrolled);
  }, []);

  const activeKey = useMemo<NavKey>(() => {
    const pathWithoutLocale = pathname.replace(new RegExp(`^/${locale}`), "");
    const match = navLinks.find((link) =>
      pathWithoutLocale.startsWith(link.href)
    );
    return match?.key ?? "fragrances";
  }, [locale, pathname]);

  return (
    <header
      dir={isRtl ? "rtl" : "ltr"}
      className={`w-full border-b transition-all duration-300 ease-in-out ${
        scrolled
          ? "border-umber bg-surface/80 backdrop-blur-md"
          : "border-transparent bg-transparent"
      }`}
    >
      <nav className="mx-auto grid h-20 max-w-container grid-cols-[1fr_auto_1fr] items-center px-gutter lg:px-16">
        <Link
          href={`/${locale}`}
          className="font-serif text-2xl tracking-widest text-gold"
          aria-label="Valentro home"
        >
          VALENTRO
        </Link>

        <div className="hidden items-center gap-10 md:flex">
          {navLinks.map((link) => {
            const isActive = link.key === activeKey;

            return (
              <Link
                key={link.key}
                href={`/${locale}${link.href}`}
                className={`font-sans text-sm font-semibold uppercase tracking-[0.08em] text-parchment transition-colors duration-300 hover:text-gold ${
                  isActive
                    ? "underline decoration-gold decoration-2 underline-offset-4"
                    : ""
                }`}
              >
                {t(link.key)}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center justify-end gap-4">
          <Link
            href={`/${locale}/cart`}
            className="focus-gold relative text-gold transition-colors duration-300 hover:text-parchment"
            aria-label={t("cart")}
          >
            <BagIcon />
            <span className="absolute -end-2 -top-2 flex h-4 min-w-4 items-center justify-center bg-gold px-1 text-[10px] font-semibold leading-none text-bg">
              {cartCount}
            </span>
          </Link>
          <button
            type="button"
            aria-label={t("menu")}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(true)}
            className="focus-gold text-gold transition-colors duration-300 hover:text-parchment md:hidden"
          >
            <MenuIcon />
          </button>
        </div>
      </nav>

      <div
        className={`fixed inset-y-0 z-50 flex w-full flex-col bg-bg px-gutter py-8 transition-transform duration-300 ease-in-out md:hidden ${
          isRtl ? "left-0" : "right-0"
        } ${
          menuOpen
            ? "translate-x-0"
            : isRtl
              ? "-translate-x-full"
              : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="font-serif text-2xl tracking-widest text-gold">
            VALENTRO
          </span>
          <button
            type="button"
            aria-label={t("close")}
            onClick={() => setMenuOpen(false)}
            className="focus-gold text-gold"
          >
            <CloseIcon />
          </button>
        </div>
        <div className="mt-20 flex flex-col gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.key}
              href={`/${locale}${link.href}`}
              onClick={() => setMenuOpen(false)}
              className={`font-serif text-4xl text-parchment transition-colors duration-300 hover:text-gold ${
                link.key === activeKey ? "text-gold" : ""
              }`}
            >
              {t(link.key)}
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
}
