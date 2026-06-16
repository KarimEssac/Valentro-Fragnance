"use client";

import Link from "next/link";
import {usePathname} from "next/navigation";
import {signOut} from "next-auth/react";
import {useLocale, useTranslations} from "next-intl";
import type {MouseEvent} from "react";
import {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {createPortal} from "react-dom";

import SideCart from "@/components/storefront/cart/SideCart";

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
  iconClassName = "h-6 w-6",
  countClassName = "top-[60%] text-[9px]"
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
      className="h-5 w-5"
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
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuClosing, setMenuClosing] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [localCartCount, setLocalCartCount] = useState(cartCount);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [visible, setVisible] = useState(true);
  const isRtl = locale === "ar";
  const drawerRef = useRef<HTMLElement>(null);
  const navRef = useRef<HTMLDivElement>(null);

  const closeMenu = useCallback(() => {
    if (!menuOpen || menuClosing) return;
    const isDesktop = window.matchMedia("(min-width: 768px)").matches;

    if (!isDesktop) {
      setMenuOpen(false);
      setMenuClosing(false);
      return;
    }

    setMenuClosing(true);
    window.setTimeout(() => {
      setMenuOpen(false);
      setMenuClosing(false);
    }, 240);
  }, [menuClosing, menuOpen]);

  useEffect(() => {
    if (!menuOpen) {
      document.body.style.overflow = "";
      return;
    }

    const mobileQuery = window.matchMedia("(max-width: 767px)");

    function syncScrollLock() {
      document.body.style.overflow = mobileQuery.matches ? "hidden" : "";
    }

    syncScrollLock();
    mobileQuery.addEventListener("change", syncScrollLock);

    return () => {
      mobileQuery.removeEventListener("change", syncScrollLock);
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) return;

    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node;
      const isDesktop = window.matchMedia("(min-width: 768px)").matches;

      if (!isDesktop) return;
      if (drawerRef.current?.contains(target)) return;
      if (navRef.current?.contains(target)) return;

      closeMenu();
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [closeMenu, menuOpen]);

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

  useEffect(() => {
    let prevScrollY = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Show if scrolling up OR at the top of the page (offset <= 50)
      if (currentScrollY <= 50) {
        setVisible(true);
      } else if (currentScrollY < prevScrollY) {
        setVisible(true);
      } else {
        setVisible(false);
      }

      prevScrollY = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, {passive: true});
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const handleLogout = useCallback(() => {
    closeMenu();
    signOut({callbackUrl: pathname});
  }, [closeMenu, pathname]);

  const handleBrandClick = useCallback(
    (event: MouseEvent<HTMLAnchorElement>) => {
      const homePath = `/${locale}`;

      if (pathname === homePath || pathname === `${homePath}/`) {
        event.preventDefault();
        closeMenu();
        document
          .getElementById("hero")
          ?.scrollIntoView({behavior: "smooth", block: "start"});
      } else {
        closeMenu();
      }
    },
    [closeMenu, locale, pathname]
  );

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

  const menu = menuOpen || menuClosing
    ? createPortal(
        <>
          <div
            dir={isRtl ? "rtl" : "ltr"}
            className="fixed inset-0 z-[1000] flex min-h-[100svh] w-screen flex-col overflow-y-auto bg-surface px-gutter py-6 shadow-[0_24px_80px_rgba(74,47,22,0.18)] md:hidden"
          >
            <div className="flex items-center justify-between">
              <Link
                href={`/${locale}#hero`}
                onClick={handleBrandClick}
                className="focus-gold font-serif text-xl tracking-[0.14em] text-gold transition-colors hover:text-parchment"
                aria-label="Valentro home"
              >
                VALENTRO
              </Link>
              <button
                type="button"
                aria-label={t("close")}
                onClick={closeMenu}
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
                  onClick={closeMenu}
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
                  onClick={closeMenu}
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
          </div>

          <aside
            ref={drawerRef}
            dir={isRtl ? "rtl" : "ltr"}
            aria-label="Main navigation"
            className={`fixed bottom-0 left-0 top-0 z-[1000] hidden w-[min(360px,calc(100vw-3rem))] flex-col border-r border-outline bg-surface-hi px-8 py-8 shadow-[24px_0_70px_rgba(74,47,22,0.22)] md:flex ${
              menuClosing ? "animate-sidebar-drawer-out" : "animate-sidebar-drawer-in"
            }`}
          >
            <div className="flex items-center justify-between">
              <Link
                href={`/${locale}#hero`}
                onClick={handleBrandClick}
                className="focus-gold font-serif text-xl tracking-[0.14em] text-gold transition-colors hover:text-parchment"
                aria-label="Valentro home"
              >
                VALENTRO
              </Link>
              <button
                type="button"
                aria-label={t("close")}
                onClick={closeMenu}
                className="focus-gold text-gold transition-colors hover:text-parchment"
              >
                <CloseIcon />
              </button>
            </div>

            <nav className="mt-16 flex flex-col gap-5">
              {navLinks.map((link) => (
                <Link
                  key={link.key}
                  href={localizedHref(locale, link.href)}
                  onClick={closeMenu}
                  className={`font-serif text-4xl leading-tight transition-colors duration-300 hover:text-gold ${
                    link.key === activeKey ? "text-gold" : "text-parchment"
                  }`}
                >
                  {t(link.key)}
                </Link>
              ))}
            </nav>

            <div className="mt-auto border-t border-outline/70 pt-6">
              {isAdmin ? (
                <Link
                  href={`/${locale}/admin`}
                  onClick={closeMenu}
                  className="label-caps block text-gold transition-colors duration-300 hover:text-parchment"
                >
                  Admin Dashboard
                </Link>
              ) : null}
              {isSignedIn && !isAdmin ? (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="label-caps text-parchment transition-colors duration-300 hover:text-gold"
                >
                  Log Out
                </button>
              ) : null}
            </div>
          </aside>
        </>,
        document.body
      )
    : null;

  return (
    <>
      <div
        dir={isRtl ? "rtl" : "ltr"}
        className={`fixed inset-x-0 top-11 z-50 flex justify-center px-4 sm:top-12 transition-transform duration-300 ease-in-out ${
          visible ? "translate-y-0" : "-translate-y-[calc(100%+3rem)]"
        }`}
      >
        <div
          ref={navRef}
          className="flex h-11 max-w-[calc(100vw-2rem)] items-center justify-between gap-4 rounded-full border border-outline/55 bg-surface-hi px-4 shadow-[0_8px_28px_rgba(74,47,22,0.16)] sm:h-12 sm:gap-5 sm:px-5"
        >
          <button
            type="button"
            aria-label={t("menu")}
            aria-expanded={menuOpen}
            onClick={() => {
              setMenuClosing(false);
              setMenuOpen(true);
            }}
            className="focus-gold text-gold transition-colors duration-300 hover:text-parchment"
          >
            <MenuIcon />
          </button>

          <Link
            href={`/${locale}#hero`}
            onClick={handleBrandClick}
            className="focus-gold shrink-0 font-serif text-base tracking-[0.14em] text-gold transition-colors duration-300 hover:text-parchment sm:text-lg"
            aria-label="Valentro home"
          >
            VALENTRO
          </Link>

          <button
            type="button"
            onClick={() => setCartOpen(true)}
            className="focus-gold relative text-gold transition-colors duration-300 hover:text-parchment"
            aria-label={t("cart")}
          >
            <CartIconWithCount count={localCartCount} />
          </button>
        </div>
      </div>

      <div aria-hidden="true" className="h-24" />

      {menu}
      <SideCart open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}
