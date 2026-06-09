import {getTranslations} from "next-intl/server";

import AdminShell from "@/components/admin/AdminShell";

type AdminFragrancesPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export default async function AdminFragrancesPage({
  params
}: AdminFragrancesPageProps) {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: "admin"});

  return (
    <AdminShell title={t("fragrances")}>
      {/* TODO: Fragrance CRUD table, variant editor, ingredients, and images. */}
    </AdminShell>
  );
}
