"use client";

import Image from "next/image";
import Link from "next/link";
import {usePathname} from "next/navigation";
import {useState} from "react";

type AdminNavLink = {
  href: string;
  label: string;
  icon: string;
};

type AdminLayoutClientProps = {
  children: React.ReactNode;
  locale: string;
  adminName: string;
  links: AdminNavLink[];
};

function Icon({name}: {name: string}) {
  const paths: Record<string, React.ReactNode> = {
    dashboard: (
      <>
        <path d="M4 13h7V4H4v9Z" />
        <path d="M13 20h7V4h-7v16Z" />
        <path d="M4 20h7v-5H4v5Z" />
      </>
    ),
    orders: (
      <>
        <path d="M6 7h12l1 13H5L6 7Z" />
        <path d="M9 7a3 3 0 0 1 6 0" />
      </>
    ),
    fragrances: (
      <>
        <path d="M9 3h6v4H9V3Z" />
        <path d="M7 9h10v11H7V9Z" />
        <path d="M10 13h4" />
      </>
    ),
    collections: (
      <>
        <path d="M4 7h16" />
        <path d="M6 4h12v16H6V4Z" />
        <path d="M9 11h6M9 15h6" />
      </>
    ),
    coupons: (
      <>
        <path d="M4 8a2 2 0 0 0 0 4 2 2 0 0 1 0 4v2h16v-2a2 2 0 0 1 0-4 2 2 0 0 0 0-4V6H4v2Z" />
        <path d="M9 9h.01M15 15h.01M15 9l-6 6" />
      </>
    ),
    announcements: (
      <>
        <path d="M4 10v4h3l8 4V6l-8 4H4Z" />
        <path d="M18 9a4 4 0 0 1 0 6" />
      </>
    ),
    community: (
      <>
        <path d="M16 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
        <path d="M8 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
        <path d="M3 20a5 5 0 0 1 10 0" />
        <path d="M12 18a5 5 0 0 1 9 2" />
      </>
    )
  };

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
    >
      {paths[name] ?? paths.dashboard}
    </svg>
  );
}

function AdminSidebar({
  locale,
  links,
  adminName,
  onNavigate
}: {
  locale: string;
  links: AdminNavLink[];
  adminName: string;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full flex-col justify-between border-r border-outline/70 bg-surface-hi">
      <div className="px-6 py-8">
        <Link
          href={`/${locale}`}
          onClick={onNavigate}
          className="font-serif text-3xl tracking-[0.14em] text-parchment transition-colors hover:text-gold"
        >
          VALENTRO
        </Link>
        <nav className="mt-12 space-y-3">
          {links.map((link) => {
            const isActive = pathname === link.href;

            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={onNavigate}
                className={`flex items-center gap-4 py-2 transition-colors duration-300 ${
                  isActive
                    ? "border-l-2 border-gold pl-3 text-gold"
                    : "text-on-surface/75 hover:text-gold"
                }`}
              >
                <Icon name={link.icon} />
                <span className="label-caps tracking-[0.15em]">
                  {link.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-outline/70 px-6 py-8">
        <div className="flex items-center gap-3">
          <div className="relative h-11 w-11 overflow-hidden border border-outline/70 bg-surface">
            <Image
              src="https://res.cloudinary.com/dpmmlk1zg/image/upload/v1781613530/valentro/fragrances/emporio-armani.webp"
              alt="Valentro admin"
              fill
              sizes="44px"
              className="object-cover"
            />
          </div>
          <div>
            <p className="label-caps text-parchment">
              {adminName || "Admin"}
            </p>
            <p className="text-[10px] uppercase tracking-[0.16em] text-gold">
              Atelier Admin
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default function AdminLayoutClient({
  children,
  locale,
  adminName,
  links
}: AdminLayoutClientProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <main className="min-h-screen bg-surface-hi text-parchment">
      <div className="lg:hidden">
        <div className="fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between border-b border-outline/70 bg-surface-hi px-gutter">
          <button
            type="button"
            aria-label="Open admin navigation"
            aria-expanded={sidebarOpen}
            onClick={() => setSidebarOpen(true)}
            className="focus-gold flex h-10 w-10 items-center justify-center text-gold"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              className="h-6 w-6"
            >
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
          <Link
            href={`/${locale}`}
            className="font-serif text-lg tracking-[0.14em] text-gold"
          >
            VALENTRO
          </Link>
          <div className="h-10 w-10" />
        </div>

        {sidebarOpen ? (
          <div className="fixed inset-0 z-[1000]">
            <button
              type="button"
              aria-label="Close admin navigation"
              onClick={() => setSidebarOpen(false)}
              className="absolute inset-0 h-full w-full bg-parchment/30"
            />
            <div className="relative h-full w-[min(280px,86vw)] shadow-[24px_0_70px_rgba(74,47,22,0.2)]">
              <AdminSidebar
                locale={locale}
                links={links}
                adminName={adminName}
                onNavigate={() => setSidebarOpen(false)}
              />
            </div>
          </div>
        ) : null}
      </div>

      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:block lg:w-64">
        <AdminSidebar locale={locale} links={links} adminName={adminName} />
      </div>

      <div className="min-h-screen pt-16 lg:ml-64 lg:pt-0">{children}</div>
    </main>
  );
}
