import Link from "next/link";
import {getTranslations} from "next-intl/server";
import type {ReactNode} from "react";

type AdminLayoutProps = {
  children: ReactNode;
  params: Promise<{
    locale: string;
  }>;
};

export default async function AdminLayout({
  children,
  params
}: AdminLayoutProps) {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: "admin"});
  const links = [
    {href: `/${locale}/admin`, label: t("dashboard")},
    {href: `/${locale}/admin/announcements`, label: t("announcements")},
    {href: `/${locale}/admin/fragrances`, label: t("fragrances")},
    {href: `/${locale}/admin/collections`, label: t("collections")},
    {href: `/${locale}/admin/coupons`, label: t("coupons")},
    {href: `/${locale}/admin/orders`, label: t("orders")}
  ];

  return (
    <main className="min-h-screen bg-bg px-gutter py-10 text-on-surface lg:px-16">
      <div className="mx-auto grid max-w-container gap-10 lg:grid-cols-[260px_1fr]">
        <aside className="border border-umber bg-surface p-6">
          <Link href={`/${locale}`} className="font-serif text-2xl text-gold">
            VALENTRO
          </Link>
          <nav className="mt-10 flex flex-col gap-4">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="label-caps text-on-surface transition-colors duration-300 hover:text-gold"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </aside>
        <div>{children}</div>
      </div>
    </main>
  );
}
