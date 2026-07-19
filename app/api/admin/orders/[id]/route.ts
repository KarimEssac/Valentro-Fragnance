import {after, NextResponse} from "next/server";
import type {NextRequest} from "next/server";
import {OrderStatus} from "@prisma/client";

import {isAdminRequest} from "@/lib/admin-auth";
import {sendOrderShippedEmail} from "@/lib/order-email";
import {prisma} from "@/lib/prisma";

type AdminOrderRouteProps = {
  params: Promise<{
    id: string;
  }>;
};

const validStatuses = new Set<string>(Object.values(OrderStatus));

export async function PATCH(request: NextRequest, {params}: AdminOrderRouteProps) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({message: "Unauthorized"}, {status: 401});
  }

  const {id} = await params;
  const body = (await request.json()) as {status?: unknown};
  const status = typeof body.status === "string" ? body.status : "";

  if (!validStatuses.has(status)) {
    return NextResponse.json({message: "Invalid order status"}, {status: 400});
  }

  try {
    const previousOrder = await prisma.order.findUnique({
      where: {id},
      select: {status: true}
    });

    if (!previousOrder) {
      return NextResponse.json({message: "Order not found"}, {status: 404});
    }

    const order = await prisma.order.update({
      where: {id},
      data: {status: status as OrderStatus},
      select: {
        id: true,
        status: true
      }
    });

    if (status === "SHIPPED" && previousOrder.status !== "SHIPPED") {
      after(async () => {
        try {
          await sendOrderShippedEmail(order.id);
        } catch (error) {
          console.error(
            "Order status was updated, but the shipping email could not be prepared:",
            error instanceof Error ? error.message : "Unknown email error"
          );
        }
      });
    }

    return NextResponse.json({
      message: "Order status updated",
      order
    });
  } catch {
    return NextResponse.json({message: "Order not found"}, {status: 404});
  }
}
