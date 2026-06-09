import {getTranslations} from "next-intl/server";

import AdminShell from "@/components/admin/AdminShell";

type AdminAnnouncementsPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export default async function AdminAnnouncementsPage({
  params
}: AdminAnnouncementsPageProps) {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: "admin"});

  return (
    <AdminShell title={t("announcements")}>
      {/* TODO: Announcement create/edit table and active-offer controls. */}
    </AdminShell>
  );
}
