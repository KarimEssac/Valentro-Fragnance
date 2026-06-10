"use client";

import Link from "next/link";
import {usePathname} from "next/navigation";
import {useLocale, useTranslations} from "next-intl";
import {useEffect, useMemo, useState} from "react";
import {createPortal} from "react-dom";

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

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const activeKey = useMemo<NavKey>(() => {
    const pathWithoutLocale = pathname.replace(new RegExp(`^/${locale}`), "");
    const match = navLinks.find((link) =>
      pathWithoutLocale.startsWith(link.href)
    );
    return match?.key ?? "fragrances";
  }, [locale, pathname]);

  const mobileMenu = menuOpen
    ? createPortal(
        <div
          dir={isRtl ? "rtl" : "ltr"}
          className="fixed inset-0 z-[1000] flex min-h-[100svh] w-screen flex-col overflow-y-auto bg-surface px-gutter py-6 shadow-[0_24px_80px_rgba(74,47,22,0.18)] md:hidden"
        >
          <div className="flex items-center justify-between">
            <span className="font-serif text-xl tracking-[0.14em] text-gold">
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
          <nav className="flex flex-1 flex-col items-center justify-center gap-6 pb-10 text-center">
            {navLinks.map((link) => (
              <Link
                key={link.key}
                href={`/${locale}${link.href}`}
                onClick={() => setMenuOpen(false)}
                className={`font-serif text-[clamp(2rem,11vw,3rem)] leading-tight text-parchment transition-colors duration-300 hover:text-gold ${
                  link.key === activeKey ? "text-gold" : ""
                }`}
              >
                {t(link.key)}
              </Link>
            ))}
          </nav>
        </div>,
        document.body
      )
    : null;

  return (
    <>
      <header
        dir={isRtl ? "rtl" : "ltr"}
        className={`w-full border-b transition-all duration-300 ease-in-out ${
          scrolled
            ? "border-umber bg-surface/80 backdrop-blur-md"
            : "border-outline/70 bg-bg/80 backdrop-blur-sm md:border-transparent md:bg-transparent md:backdrop-blur-0"
        }`}
      >
        <nav className="mx-auto grid h-16 max-w-container grid-cols-[1fr_auto] items-center px-gutter sm:h-[72px] md:h-20 md:grid-cols-[1fr_auto_1fr] lg:px-16">
          <Link
            href={`/${locale}`}
            className="font-serif text-xl tracking-[0.14em] text-gold sm:text-2xl sm:tracking-widest"
            aria-label="Valentro home"
          >
            VALENTRO
          </Link>

          <div className="hidden items-center gap-6 md:flex lg:gap-10">
            {navLinks.map((link) => {
              const isActive = link.key === activeKey;

              return (
                <Link
                  key={link.key}
                  href={`/${locale}${link.href}`}
                  className={`font-sans text-xs font-semibold uppercase tracking-[0.08em] text-parchment transition-colors duration-300 hover:text-gold lg:text-sm ${
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

          <div className="flex items-center justify-end gap-3 sm:gap-4">
            <Link
              href={`/${locale}/cart`}
              className="focus-gold relative text-gold transition-colors duration-300 hover:text-parchment"
              aria-label={t("cart")}
            >
              <BagIcon />
              <span className="absolute -end-2 -top-2 flex h-4 min-w-4 items-center justify-center bg-gold px-1 text-[10px] font-semibold leading-none text-parchment">
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
      </header>
      {mobileMenu}
    </>
  );
}
