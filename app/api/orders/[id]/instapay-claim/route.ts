import {createHash, timingSafeEqual} from "crypto";
import type {NextRequest} from "next/server";
import {NextResponse} from "next/server";
import {csrfCookieName, validateCsrfToken} from "@/lib/csrf";
import {prisma} from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  {params}: {params: Promise<{id: string}>}
) {
  const {id} = await params;
  const body = await request.json().catch(() => null) as
    | {csrfToken?: unknown; claimToken?: unknown}
    | null;
  if (!validateCsrfToken(
    typeof body?.csrfToken === "string" ? body.csrfToken : "",
    request.cookies.get(csrfCookieName)?.value
  )) {
    return NextResponse.json({message: "Invalid checkout token"}, {status: 403});
  }

  const token = typeof body?.claimToken === "string" ? body.claimToken : "";
  if (!/^[a-f0-9]{64}$/.test(token)) {
    return NextResponse.json({message: "Invalid payment confirmation link"}, {status: 403});
  }

  const order = await prisma.order.findUnique({
    where: {id},
    select: {paymentMethod: true, status: true, instapayClaimTokenHash: true, instapayClaimedAt: true}
  });
  const suppliedHash = Buffer.from(createHash("sha256").update(token).digest("hex"), "hex");
  const storedHash = order?.instapayClaimTokenHash
    ? Buffer.from(order.instapayClaimTokenHash, "hex")
    : Buffer.alloc(32);
  if (!order || storedHash.length !== suppliedHash.length || !timingSafeEqual(storedHash, suppliedHash)) {
    return NextResponse.json({message: "Invalid payment confirmation link"}, {status: 403});
  }
  if (order.paymentMethod !== "INSTAPAY" || order.status === "CANCELLED") {
    return NextResponse.json({message: "This order no longer accepts InstaPay claims"}, {status: 409});
  }

  if (!order.instapayClaimedAt) {
    await prisma.order.updateMany({
      where: {id, paymentMethod: "INSTAPAY", status: {not: "CANCELLED"}, instapayClaimedAt: null},
      data: {instapayClaimedAt: new Date()}
    });
  }
  return NextResponse.json({message: "Your payment claim has been recorded for manual verification"});
}
