import {NextResponse} from "next/server";
import type {NextRequest} from "next/server";

import {getStorefrontTestimonials} from "@/lib/storefront-data";

export async function GET(request: NextRequest) {
  const requestedLimit =
    Number(request.nextUrl.searchParams.get("limit") ?? 6) || 6;
  const testimonials = await getStorefrontTestimonials(
    Math.min(requestedLimit, 12)
  );

  return NextResponse.json(testimonials, {
    headers: {
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300"
    }
  });
}
