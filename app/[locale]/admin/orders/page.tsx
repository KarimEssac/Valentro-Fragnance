import {OrderStatus} from "@prisma/client";

import AdminOrdersClient from "@/components/admin/AdminOrdersClient";
import type {AdminOrderRow} from "@/components/admin/AdminOrdersClient";
import {prisma} from "@/lib/prisma";

type AdminOrdersPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

const activeProcessingStatuses: OrderStatus[] = ["CONFIRMED", "PROCESSING"];

function shortOrderId(id: string) {
  return `#VAL-${id.slice(-6).toUpperCase()}`;
}

export default async function AdminOrdersPage({params}: AdminOrdersPageProps) {
  const {locale} = await params;

  const [orders, total, pending, processing, shipped, delivered] =
    await Promise.all([
      prisma.order.findMany({
        orderBy: {createdAt: "desc"},
        include: {
          user: {
            select: {
              name: true,
              email: true
            }
          },
          items: {
            select: {
              fragranceNameEn: true,
              fragranceNameAr: true,
              quantity: true
            }
          }
        }
      }),
      prisma.order.count(),
      prisma.order.count({where: {status: "PENDING"}}),
      prisma.order.count({where: {status: {in: activeProcessingStatuses}}}),
      prisma.order.count({where: {status: "SHIPPED"}}),
      prisma.order.count({where: {status: "DELIVERED"}})
    ]);

  const rows: AdminOrderRow[] = orders.map((order) => {
    const itemCount = order.items.reduce(
      (totalItems, item) => totalItems + item.quantity,
      0
    );
    const itemsPreview = order.items
      .map((item) =>
        locale === "ar" ? item.fragranceNameAr : item.fragranceNameEn
      )
      .join(", ");

    return {
      id: order.id,
      shortId: shortOrderId(order.id),
      createdAt: order.createdAt.toISOString(),
      customerName: order.user.name ?? order.user.email,
      customerEmail: order.user.email,
      total: order.total.toString(),
      status: order.status,
      itemCount,
      itemsPreview
    };
  });

  return (
    <AdminOrdersClient
      locale={locale}
      orders={rows}
      summary={{
        total,
        pending,
        processing,
        shipped,
        delivered
      }}
    />
  );
}
