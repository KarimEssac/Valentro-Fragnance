import {after, NextResponse} from "next/server";
import type {NextRequest} from "next/server";
import {revalidateTag} from "next/cache";
import {OrderStatus, PaymentMethod, Prisma} from "@prisma/client";

import {isAdminRequest} from "@/lib/admin-auth";
import {STOREFRONT_FRAGRANCES_TAG} from "@/lib/cache-tags";
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
    | {status?: unknown; action?: unknown; reason?: unknown; stockReturned?: unknown}
    | null;
  const action = typeof body?.action === "string" ? body.action : "status";
  const status = typeof body?.status === "string" ? body.status : "";
  const reason = typeof body?.reason === "string" ? body.reason.trim() : "";
  const isDeletion = action === "delete";
  const isCancellation = action === "status" && status === OrderStatus.CANCELLED;
  const releasesReservation = isDeletion || isCancellation;

  if (action === "status" && !validStatuses.has(status)) {
    return NextResponse.json({message: "Invalid order status"}, {status: 400});
  }
  if (!["status", "verifyInstapay", "convertToCash", "delete"].includes(action)) {
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
      if (!previous) {
        if (isDeletion) return {order: null, previousStatus: null};
        throw new Error("Order not found");
      }

      const wasCancelled = previous.status === OrderStatus.CANCELLED;
      if (wasCancelled && !releasesReservation) {
        throw new Error("Cancelled orders cannot be changed");
      }

      if (releasesReservation && !wasCancelled) {
        const wasShipped = previous.status === OrderStatus.SHIPPED || previous.status === OrderStatus.DELIVERED;
        if (wasShipped && body?.stockReturned !== true) {
          throw new Error("Confirm the items are back in stock before cancelling or deleting this order");
        }
        if (previous.items.some((item) => item.collectionId && item.reservedVariantIds.length === 0)) {
          throw new Error("This older collection order is missing its inventory reservation details and needs manual reconciliation");
        }

        if (previous.couponId) {
          await tx.coupon.updateMany({
            where: {id: previous.couponId, usedCount: {gt: 0}},
            data: {usedCount: {decrement: 1}}
          });
        }
        for (const item of previous.items) {
          const variantIds = item.reservedVariantIds.length
            ? item.reservedVariantIds
            : item.variantId ? [item.variantId] : [];
          for (const variantId of variantIds) {
            // A product may have been deleted from inventory since the order was placed.
            await tx.fragranceVariant.updateMany({
              where: {id: variantId},
              data: {stock: {increment: item.quantity}}
            });
          }
        }
      }

      if (isDeletion) {
        await tx.order.delete({where: {id}});
        return {order: null, previousStatus: previous.status};
      }

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
      } else if (isCancellation) {
        if (!wasCancelled) {
          await tx.order.update({
            where: {id},
            data: {status: OrderStatus.CANCELLED, instapayClaimTokenHash: null}
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

    if (releasesReservation && result.previousStatus && result.previousStatus !== OrderStatus.CANCELLED) {
      revalidateTag(STOREFRONT_FRAGRANCES_TAG, {expire: 0});
    }

    const {order} = result;
    if (!order) return NextResponse.json({message: "Order deleted"});

    if (order.status === OrderStatus.SHIPPED && result.previousStatus !== OrderStatus.SHIPPED) {
      after(async () => {
        try { await sendOrderShippedEmail(order.id); }
        catch (error) { console.error("Shipping email failed:", error); }
      });
    }
    return NextResponse.json({message: "Order updated", order});
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034") {
      return NextResponse.json({message: "The order or inventory changed during this update. Please try again."}, {status: 409});
    }
    return NextResponse.json({message: error instanceof Error ? error.message : "Unable to update order"}, {status: 409});
  }
}
