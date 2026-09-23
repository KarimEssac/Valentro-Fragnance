import type {OrderStatus} from "@prisma/client";

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

  const [orders, statusCounts] = await Promise.all([
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
              collectionId: true,
              sizeML: true,
              quantity: true,
              unitPrice: true,
              totalPrice: true
            }
          }
        }
      }),
      prisma.order.groupBy({
        by: ["status"],
        _count: {_all: true}
      })
    ]);

  const countsByStatus = new Map(
    statusCounts.map((entry) => [entry.status, entry._count._all])
  );
  const total = statusCounts.reduce(
    (sum, entry) => sum + entry._count._all,
    0
  );
  const pending = countsByStatus.get("PENDING") ?? 0;
  const processing = activeProcessingStatuses.reduce(
    (sum, status) => sum + (countsByStatus.get(status) ?? 0),
    0
  );
  const shipped = countsByStatus.get("SHIPPED") ?? 0;
  const delivered = countsByStatus.get("DELIVERED") ?? 0;

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
      subtotal: order.subtotal.toString(),
      discountAmount: order.discountAmount.toString(),
      status: order.status,
      paymentMethod: order.paymentMethod,
      instapayClaimedAt: order.instapayClaimedAt?.toISOString() ?? null,
      instapayVerifiedAt: order.instapayVerifiedAt?.toISOString() ?? null,
      paymentMethodChangedAt: order.paymentMethodChangedAt?.toISOString() ?? null,
      paymentMethodChangeReason: order.paymentMethodChangeReason,
      itemCount,
      itemsPreview,
      addressSnapshot: order.addressSnapshot,
      notes: order.notes,
      items: order.items.map((item) => ({
        fragranceName:
          locale === "ar" ? item.fragranceNameAr : item.fragranceNameEn,
        collectionId: item.collectionId,
        sizeML: item.sizeML,
        quantity: item.quantity,
        unitPrice: item.unitPrice.toString(),
        totalPrice: item.totalPrice.toString()
      }))
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
