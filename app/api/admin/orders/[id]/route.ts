import {NextResponse} from "next/server";
import {OrderStatus} from "@prisma/client";
import {getServerSession} from "next-auth";
import type {Session} from "next-auth";

import {authOptions} from "@/lib/auth";
import {prisma} from "@/lib/prisma";

type AdminOrderRouteProps = {
  params: Promise<{
    id: string;
  }>;
};

const validStatuses = new Set<string>(Object.values(OrderStatus));

export async function PATCH(request: Request, {params}: AdminOrderRouteProps) {
  const session = (await getServerSession(authOptions)) as Session | null;

  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({message: "Unauthorized"}, {status: 401});
  }

  const {id} = await params;
  const body = (await request.json()) as {status?: unknown};
  const status = typeof body.status === "string" ? body.status : "";

  if (!validStatuses.has(status)) {
    return NextResponse.json({message: "Invalid order status"}, {status: 400});
  }

  try {
    const order = await prisma.order.update({
      where: {id},
      data: {status: status as OrderStatus},
      select: {
        id: true,
        status: true
      }
    });

    return NextResponse.json({
      message: "Order status updated",
      order
    });
  } catch {
    return NextResponse.json({message: "Order not found"}, {status: 404});
  }
}
