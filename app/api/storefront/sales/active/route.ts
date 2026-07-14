import {NextResponse} from "next/server";
import {getActiveAnnouncement} from "@/lib/storefront-data";

export type ActiveSalesLine = {
  id: string;
  textEn: string;
  textAr: string;
};

export async function GET(): Promise<NextResponse<ActiveSalesLine | null>> {
  try {
    const announcement = await getActiveAnnouncement();

    return NextResponse.json(announcement, {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120"
      }
    });
  } catch (error) {
    console.error("Failed to fetch active storefront sales line:", error);
    return NextResponse.json(null);
  }
}
