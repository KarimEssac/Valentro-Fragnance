import Link from "next/link";
import {notFound, redirect} from "next/navigation";
import {getTranslations} from "next-intl/server";
import {getServerSession} from "next-auth";
import type {Session} from "next-auth";
import type {ReactNode} from "react";

import {authOptions} from "@/lib/auth";

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
  const session = (await getServerSession(authOptions)) as Session | null;

  if (!session?.user?.id) {
    redirect(`/${locale}/login?callbackUrl=/${locale}/admin`);
  }

  if (session.user.role !== "ADMIN") {
    notFound();
  }

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
    <main className="min-h-screen bg-bg px-gutter py-6 text-on-surface sm:py-10 lg:px-16">
      <div className="mx-auto grid max-w-container gap-6 lg:grid-cols-[260px_1fr] lg:gap-10">
        <aside className="border border-umber bg-surface p-5 sm:p-6">
          <Link href={`/${locale}`} className="font-serif text-2xl text-gold">
            VALENTRO
          </Link>
          <nav className="mt-6 flex flex-wrap gap-3 sm:mt-10 lg:flex-col lg:gap-4">
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
