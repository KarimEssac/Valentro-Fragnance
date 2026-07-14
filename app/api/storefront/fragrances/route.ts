import {NextResponse} from "next/server";
import type {NextRequest} from "next/server";

import {getStorefrontFragrances} from "@/lib/storefront-data";

export async function GET(request: NextRequest) {
  const {searchParams} = request.nextUrl;
  const isFinderRequest = searchParams.get("finder") === "true";
  const maxLimit = isFinderRequest ? 100 : 24;
  const requestedLimit = Number(searchParams.get("limit") ?? 12) || 12;
  const fragrances = await getStorefrontFragrances({
    collection: searchParams.get("collection"),
    gender: searchParams.get("gender"),
    scentProfile: searchParams.get("scentProfile"),
    featured: searchParams.get("featured") === "true",
    limit: Math.min(requestedLimit, maxLimit)
  });

  return NextResponse.json(fragrances, {
    headers: {
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300"
    }
  });
}
