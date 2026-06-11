"use client";

import Link from "next/link";
import {usePathname} from "next/navigation";
import {signOut} from "next-auth/react";
import {useLocale, useTranslations} from "next-intl";
import {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {createPortal} from "react-dom";

type NavKey = "collections" | "fragrances" | "atelier" | "story";

type NavLink = {
  key: NavKey;
  href: string;
};

type NavbarProps = {
  cartCount?: number;
};

type StoredCartItem = {
  quantity?: number;
};

type SessionResponse = {
  user?: {
    role?: string;
  };
};

const navLinks: NavLink[] = [
  {key: "collections", href: "/"},
  {key: "fragrances", href: "/fragrances"},
  {key: "atelier", href: "/atelier"},
  {key: "story", href: "/our-story"}
];

function localizedHref(locale: string, href: string) {
  return href === "/" ? `/${locale}` : `/${locale}${href}`;
}

function BagIcon({className = "h-6 w-6"}: {className?: string}) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M7 8h10l1 12H6L7 8Z" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </svg>
  );
}

function CartIconWithCount({
  count,
  iconClassName = "h-7 w-7",
  countClassName = "top-[60%] text-[10px]"
}: {
  count: number;
  iconClassName?: string;
  countClassName?: string;
}) {
  return (
    <span className="relative inline-flex items-center justify-center">
      <BagIcon className={iconClassName} />
      <span
        className={`absolute left-1/2 -translate-x-1/2 -translate-y-1/2 font-semibold leading-none text-gold ${countClassName}`}
      >
        {count}
      </span>
    </span>
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
  const [showMini, setShowMini] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [localCartCount, setLocalCartCount] = useState(cartCount);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const isRtl = locale === "ar";
  const fullNavRef = useRef<HTMLElement>(null);

  /* ---- Show mini navbar once the full navbar scrolls out of view ---- */
  useEffect(() => {
    function handleScroll() {
      if (!fullNavRef.current) return;
      const rect = fullNavRef.current.getBoundingClientRect();
      // Show mini bar when the bottom of the full navbar goes above the viewport
      setShowMini(rect.bottom < 0);
    }

    handleScroll();
    window.addEventListener("scroll", handleScroll, {passive: true});
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  useEffect(() => {
    function readCartCount() {
      try {
        const cart = JSON.parse(
          window.localStorage.getItem("valentro-cart") ?? "[]"
        ) as StoredCartItem[];
        setLocalCartCount(
          cart.reduce((total, item) => total + Number(item.quantity ?? 0), 0)
        );
      } catch {
        setLocalCartCount(cartCount);
      }
    }

    readCartCount();
    window.addEventListener("storage", readCartCount);
    window.addEventListener("valentro-cart-updated", readCartCount);

    return () => {
      window.removeEventListener("storage", readCartCount);
      window.removeEventListener("valentro-cart-updated", readCartCount);
    };
  }, [cartCount]);

  useEffect(() => {
    let isMounted = true;

    async function loadSession() {
      try {
        const response = await fetch("/api/auth/session", {
          headers: {Accept: "application/json"}
        });
        const data = (await response.json()) as SessionResponse;

        if (isMounted) {
          setIsSignedIn(Boolean(data.user));
          setIsAdmin(data.user?.role === "ADMIN");
        }
      } catch {
        if (isMounted) {
          setIsSignedIn(false);
          setIsAdmin(false);
        }
      }
    }

    loadSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const scrollToTop = useCallback(() => {
    window.scrollTo({top: 0, behavior: "smooth"});
  }, []);

  const handleLogout = useCallback(() => {
    setMenuOpen(false);
    signOut({callbackUrl: pathname});
  }, [pathname]);

  const activeKey = useMemo<NavKey | null>(() => {
    const pathWithoutLocale =
      pathname.replace(new RegExp(`^/${locale}`), "") || "/";

    if (pathWithoutLocale === "/") {
      return "collections";
    }

    const match = navLinks.find(
      (link) => link.href !== "/" && pathWithoutLocale.startsWith(link.href)
    );

    return match?.key ?? null;
  }, [locale, pathname]);

  /* ---- Mobile full-screen menu ---- */
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
                href={localizedHref(locale, link.href)}
                onClick={() => setMenuOpen(false)}
                className={`font-serif text-[clamp(2rem,11vw,3rem)] leading-tight text-parchment transition-colors duration-300 hover:text-gold ${
                  link.key === activeKey ? "text-gold" : ""
                }`}
              >
                {t(link.key)}
              </Link>
            ))}
            {isAdmin ? (
              <Link
                href={`/${locale}/admin`}
                onClick={() => setMenuOpen(false)}
                className="font-serif text-[clamp(2rem,11vw,3rem)] leading-tight text-gold transition-colors duration-300 hover:text-parchment"
              >
                Admin Dashboard
              </Link>
            ) : null}
            {isSignedIn && !isAdmin ? (
              <button
                type="button"
                onClick={handleLogout}
                className="font-serif text-[clamp(2rem,11vw,3rem)] leading-tight text-parchment transition-colors duration-300 hover:text-gold"
              >
                Log Out
              </button>
            ) : null}
          </nav>
        </div>,
        document.body
      )
    : null;

  return (
    <>
      {/* ================================================================ */}
      {/* FULL NAVBAR — normal document flow, NOT sticky/fixed             */}
      {/* ================================================================ */}
      <header
        ref={fullNavRef}
        dir={isRtl ? "rtl" : "ltr"}
        className="w-full bg-transparent"
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
                  href={localizedHref(locale, link.href)}
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
            {isAdmin ? (
              <Link
                href={`/${locale}/admin`}
                className="font-sans text-xs font-semibold uppercase tracking-[0.08em] text-gold transition-colors duration-300 hover:text-parchment lg:text-sm"
              >
                Admin Dashboard
              </Link>
            ) : null}
            {isSignedIn && !isAdmin ? (
              <button
                type="button"
                onClick={handleLogout}
                className="font-sans text-xs font-semibold uppercase tracking-[0.08em] text-parchment transition-colors duration-300 hover:text-gold lg:text-sm"
              >
                Log Out
              </button>
            ) : null}
          </div>

          <div className="flex items-center justify-end gap-3 sm:gap-4">
            <Link
              href={`/${locale}/cart`}
              className="focus-gold relative text-gold transition-colors duration-300 hover:text-parchment"
              aria-label={t("cart")}
            >
              <CartIconWithCount count={localCartCount} />
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

      {/* ================================================================ */}
      {/* MINI NAVBAR — fixed, slides in when full navbar leaves viewport  */}
      {/* ================================================================ */}
      <div
        dir={isRtl ? "rtl" : "ltr"}
        className={`fixed inset-x-0 top-0 z-50 flex justify-center px-4 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          showMini
            ? "pointer-events-auto translate-y-3 opacity-100"
            : "pointer-events-none -translate-y-full opacity-0"
        }`}
      >
        <div className="flex h-11 items-center justify-between gap-4 rounded-full border border-outline/45 bg-surface px-4 shadow-[0_6px_24px_rgba(74,47,22,0.14)] backdrop-blur-sm sm:h-12 sm:gap-5 sm:px-5">
          {/* Hamburger — mobile only */}
          <button
            type="button"
            aria-label={t("menu")}
            onClick={() => setMenuOpen(true)}
            className="focus-gold text-gold transition-colors duration-300 hover:text-parchment md:hidden"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.25"
              strokeLinecap="round"
              className="h-5 w-5"
            >
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>


          {/* VALENTRO title — scrolls to top */}
          <button
            type="button"
            onClick={scrollToTop}
            className="focus-gold font-serif text-base tracking-[0.14em] text-gold transition-colors duration-300 hover:text-parchment sm:text-lg"
          >
            VALENTRO
          </button>

          {/* Cart icon */}
          <Link
            href={`/${locale}/cart`}
            className="focus-gold relative text-gold transition-colors duration-300 hover:text-parchment"
            aria-label={t("cart")}
          >
            <CartIconWithCount
              count={localCartCount}
              iconClassName="h-6 w-6"
              countClassName="top-[60%] text-[9px]"
            />
          </Link>
        </div>
      </div>

      {mobileMenu}
    </>
  );
}
