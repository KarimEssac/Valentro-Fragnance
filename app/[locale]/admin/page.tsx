import {getTranslations} from "next-intl/server";

import AdminShell from "@/components/admin/AdminShell";

type AdminPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export default async function AdminPage({params}: AdminPageProps) {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: "admin"});

  return (
    <AdminShell title={t("dashboard")}>
      {/* TODO: Dashboard overview metrics, order status summary, and content alerts. */}
    </AdminShell>
  );
}
