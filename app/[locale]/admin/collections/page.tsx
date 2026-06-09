import {getTranslations} from "next-intl/server";

import AdminShell from "@/components/admin/AdminShell";

type AdminCollectionsPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export default async function AdminCollectionsPage({
  params
}: AdminCollectionsPageProps) {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: "admin"});

  return (
    <AdminShell title={t("collections")}>
      {/* TODO: Collection CRUD table and fragrance assignment workflow. */}
    </AdminShell>
  );
}
