import {getTranslations} from "next-intl/server";

import AdminShell from "@/components/admin/AdminShell";

type AdminOrdersPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export default async function AdminOrdersPage({params}: AdminOrdersPageProps) {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: "admin"});

  return (
    <AdminShell title={t("orders")}>
      {/* TODO: Order list, status management, and order detail view. */}
    </AdminShell>
  );
}
