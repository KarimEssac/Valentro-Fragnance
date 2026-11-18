import {NextResponse} from "next/server";

import {getStorefrontCollectionOffers} from "@/lib/storefront-data";

export async function GET() {
  const collections = await getStorefrontCollectionOffers();

  return NextResponse.json(
    {collections},
    {
      headers: {
        "Cache-Control": "no-store"
      }
    }
  );
}
