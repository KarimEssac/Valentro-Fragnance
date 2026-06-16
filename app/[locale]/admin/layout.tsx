import {notFound, redirect} from "next/navigation";
import {getTranslations} from "next-intl/server";
import {getServerSession} from "next-auth";
import type {Session} from "next-auth";
import type {ReactNode} from "react";

import AdminLayoutClient from "@/components/admin/AdminLayoutClient";
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
    {href: `/${locale}/admin`, label: t("dashboard"), icon: "dashboard"},
    {href: `/${locale}/admin/orders`, label: t("orders"), icon: "orders"},
    {href: `/${locale}/admin/fragrances`, label: t("fragrances"), icon: "fragrances"},
    {href: `/${locale}/admin/collections`, label: t("collections"), icon: "collections"},
    {href: `/${locale}/admin/coupons`, label: t("coupons"), icon: "coupons"},
    {href: `/${locale}/admin/announcements`, label: t("announcements"), icon: "announcements"}
  ];

  return (
    <AdminLayoutClient
      locale={locale}
      links={links}
      adminName={session.user.name ?? "Admin"}
    >
      {children}
    </AdminLayoutClient>
  );
}
