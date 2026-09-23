import {after, NextResponse} from "next/server";
import type {NextRequest} from "next/server";
import {OrderStatus, PaymentMethod, Prisma} from "@prisma/client";

import {isAdminRequest} from "@/lib/admin-auth";
import {sendOrderShippedEmail} from "@/lib/order-email";
import {prisma} from "@/lib/prisma";

type AdminOrderRouteProps = {params: Promise<{id: string}>};
const validStatuses = new Set<string>(Object.values(OrderStatus));

export async function PATCH(request: NextRequest, {params}: AdminOrderRouteProps) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({message: "Unauthorized"}, {status: 401});
  }
  const {id} = await params;
  const body = await request.json().catch(() => null) as
    | {status?: unknown; action?: unknown; reason?: unknown}
    | null;
  const action = typeof body?.action === "string" ? body.action : "status";
  const status = typeof body?.status === "string" ? body.status : "";
  const reason = typeof body?.reason === "string" ? body.reason.trim() : "";

  if (action === "status" && !validStatuses.has(status)) {
    return NextResponse.json({message: "Invalid order status"}, {status: 400});
  }
  if (!["status", "verifyInstapay", "convertToCash"].includes(action)) {
    return NextResponse.json({message: "Invalid order action"}, {status: 400});
  }
  if (action === "convertToCash" && (reason.length < 5 || reason.length > 300)) {
    return NextResponse.json({message: "Enter a short reason after contacting the customer"}, {status: 400});
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const previous = await tx.order.findUnique({
        where: {id},
        include: {items: {select: {variantId: true, collectionId: true, reservedVariantIds: true, quantity: true}}}
      });
      if (!previous) throw new Error("Order not found");
      if (previous.status === OrderStatus.CANCELLED) throw new Error("Cancelled orders cannot be changed");

      if (action === "verifyInstapay") {
        if (previous.paymentMethod !== PaymentMethod.INSTAPAY) throw new Error("This is not an InstaPay order");
        if (!previous.instapayVerifiedAt) {
          await tx.order.update({where: {id}, data: {instapayVerifiedAt: new Date()}});
        }
      } else if (action === "convertToCash") {
        if (previous.paymentMethod !== PaymentMethod.INSTAPAY || previous.instapayVerifiedAt) {
          throw new Error("Only unverified InstaPay orders can be converted");
        }
        if (previous.status === OrderStatus.SHIPPED || previous.status === OrderStatus.DELIVERED) {
          throw new Error("Shipped orders cannot be converted");
        }
        await tx.order.update({where: {id}, data: {
          paymentMethod: PaymentMethod.CASH_ON_DELIVERY,
          instapayClaimTokenHash: null,
          paymentMethodChangedAt: new Date(),
          paymentMethodChangeReason: reason
        }});
      } else if (status === OrderStatus.CANCELLED) {
        if (previous.status === OrderStatus.SHIPPED || previous.status === OrderStatus.DELIVERED) {
          throw new Error("Shipped orders require a manual return or refund process");
        }
        if (previous.items.some((item) => item.collectionId && item.reservedVariantIds.length === 0)) {
          throw new Error("This older collection order needs manual inventory reconciliation before cancellation");
        }
        await tx.order.update({where: {id}, data: {status: OrderStatus.CANCELLED, instapayClaimTokenHash: null}});
        for (const item of previous.items) {
          const variantIds = item.reservedVariantIds.length
            ? item.reservedVariantIds
            : item.variantId ? [item.variantId] : [];
          for (const variantId of variantIds) {
            await tx.fragranceVariant.update({
              where: {id: variantId},
              data: {stock: {increment: item.quantity}}
            });
          }
        }
        if (previous.couponId) {
          await tx.coupon.updateMany({
            where: {id: previous.couponId, usedCount: {gt: 0}},
            data: {usedCount: {decrement: 1}}
          });
        }
      } else {
        if (previous.paymentMethod === PaymentMethod.INSTAPAY && !previous.instapayVerifiedAt && status !== OrderStatus.PENDING) {
          throw new Error("Verify the InstaPay transfer before progressing this order");
        }
        await tx.order.update({where: {id}, data: {status: status as OrderStatus}});
      }

      const order = await tx.order.findUniqueOrThrow({
        where: {id},
        select: {id: true, status: true, paymentMethod: true, instapayClaimedAt: true, instapayVerifiedAt: true, paymentMethodChangedAt: true, paymentMethodChangeReason: true}
      });
      return {order, previousStatus: previous.status};
    }, {isolationLevel: Prisma.TransactionIsolationLevel.Serializable});

    if (result.order.status === OrderStatus.SHIPPED && result.previousStatus !== OrderStatus.SHIPPED) {
      after(async () => {
        try { await sendOrderShippedEmail(result.order.id); }
        catch (error) { console.error("Shipping email failed:", error); }
      });
    }
    return NextResponse.json({message: "Order updated", order: result.order});
  } catch (error) {
    return NextResponse.json({message: error instanceof Error ? error.message : "Unable to update order"}, {status: 409});
  }
}
