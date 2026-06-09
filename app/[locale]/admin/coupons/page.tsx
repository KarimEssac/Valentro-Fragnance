import {getTranslations} from "next-intl/server";

import AdminShell from "@/components/admin/AdminShell";

type AdminCouponsPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export default async function AdminCouponsPage({params}: AdminCouponsPageProps) {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: "admin"});

  return (
    <AdminShell title={t("coupons")}>
      {/* TODO: Coupon create/edit table and specific-user assignment. */}
    </AdminShell>
  );
}
