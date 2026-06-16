import {getTranslations} from "next-intl/server";

import AdminShell from "@/components/admin/AdminShell";
import AdminCouponsClient from "@/components/admin/AdminCouponsClient";
import {prisma} from "@/lib/prisma";

type AdminCouponsPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export default async function AdminCouponsPage({params}: AdminCouponsPageProps) {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: "admin"});
  const [coupons, users] = await Promise.all([
    prisma.coupon.findMany({
      orderBy: [{createdAt: "desc"}],
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        _count: {
          select: {
            orders: true
          }
        }
      }
    }),
    prisma.user.findMany({
      where: {role: "CUSTOMER"},
      orderBy: [{createdAt: "desc"}],
      select: {
        id: true,
        name: true,
        email: true,
        orders: {
          select: {
            total: true
          }
        }
      }
    })
  ]);

  return (
    <AdminShell title={t("coupons")} fullWidth framed={false} showTitle={false}>
      <AdminCouponsClient
        locale={locale}
        coupons={coupons.map((coupon) => ({
          id: coupon.id,
          code: coupon.code,
          type: coupon.type,
          value: coupon.value.toString(),
          minOrderAmount: coupon.minOrderAmount?.toString() ?? null,
          maxUses: coupon.maxUses,
          usedCount: coupon.usedCount,
          isActive: coupon.isActive,
          startsAt: coupon.startsAt?.toISOString() ?? null,
          expiresAt: coupon.expiresAt?.toISOString() ?? null,
          audienceRule: coupon.audienceRule,
          audiencePercent: coupon.audiencePercent,
          applicableTo: coupon.applicableTo,
          createdAt: coupon.createdAt.toISOString(),
          orderCount: coupon._count.orders,
          users: coupon.users
        }))}
        customers={users.map((user) => ({
          id: user.id,
          name: user.name,
          email: user.email,
          orderCount: user.orders.length,
          totalSpent: user.orders.reduce((sum, order) => sum + Number(order.total), 0)
        }))}
      />
    </AdminShell>
  );
}
