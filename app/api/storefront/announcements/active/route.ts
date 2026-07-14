import {NextResponse} from "next/server";
import {getActiveAnnouncement} from "@/lib/storefront-data";

export async function GET() {
  try {
    const announcement = await getActiveAnnouncement();

    return NextResponse.json(announcement, {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120"
      }
    });
  } catch (error) {
    console.error("Failed to fetch active storefront announcement:", error);
    return NextResponse.json(
      {message: "Failed to fetch active storefront announcement"},
      {status: 500}
    );
  }
}
