import {NextResponse} from "next/server";

import {getStorefrontCollectionOffers} from "@/lib/storefront-data";

export async function GET() {
  const collections = await getStorefrontCollectionOffers();

  return NextResponse.json(
    {collections},
    {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300"
      }
    }
  );
}
