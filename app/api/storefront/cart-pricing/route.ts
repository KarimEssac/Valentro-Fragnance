import {NextResponse} from "next/server";

import {calculateCartPricing, parseCartPricingItems} from "@/lib/cart-pricing";
import {prisma} from "@/lib/prisma";

type CartPricingPayload = {
  items?: unknown;
};

export async function POST(request: Request) {
  let payload: CartPricingPayload;

  try {
    payload = (await request.json()) as CartPricingPayload;
  } catch {
    return NextResponse.json({message: "Invalid cart pricing request"}, {status: 400});
  }

  try {
    const items = parseCartPricingItems(payload.items);
    const pricing = await calculateCartPricing(prisma, items);

    return NextResponse.json(pricing, {
      headers: {"Cache-Control": "no-store"}
    });
  } catch (error) {
    return NextResponse.json(
      {message: error instanceof Error ? error.message : "Unable to price this cart"},
      {status: 400}
    );
  }
}
