import {notFound, redirect} from "next/navigation";
import {getTranslations} from "next-intl/server";
import type {ReactNode} from "react";

import AdminLayoutClient from "@/components/admin/AdminLayoutClient";
import {getSessionIdentity} from "@/lib/admin-session";

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
  const admin = await getSessionIdentity();

  if (!admin?.id) {
    redirect(`/${locale}/login?callbackUrl=/${locale}/admin`);
  }

  if (admin.role !== "ADMIN") {
    notFound();
  }

  const t = await getTranslations({locale, namespace: "admin"});
  const links = [
    {href: `/${locale}/admin`, label: t("dashboard"), icon: "dashboard"},
    {href: `/${locale}/admin/orders`, label: t("orders"), icon: "orders"},
    {href: `/${locale}/admin/inventory`, label: t("fragrances"), icon: "fragrances"},
    {href: `/${locale}/admin/collections`, label: t("collections"), icon: "collections"},
    {href: `/${locale}/admin/coupons`, label: t("coupons"), icon: "coupons"},
    {href: `/${locale}/admin/announcements`, label: t("announcements"), icon: "announcements"},
    {href: `/${locale}/admin/community`, label: t("community"), icon: "community"},
    {href: `/${locale}/admin/email-templates`, label: "Email Templates", icon: "email"}
  ];

  return (
    <AdminLayoutClient
      locale={locale}
      links={links}
    >
      {children}
    </AdminLayoutClient>
  );
}
