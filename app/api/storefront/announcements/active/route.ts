import {NextResponse} from "next/server";
import {prisma} from "@/lib/prisma";

export const revalidate = 0; // Dynamic route

export async function GET() {
  try {
    const now = new Date();
    
    // Find an announcement that is active and either has no schedule or is currently within the scheduled window.
    const announcement = await prisma.announcement.findFirst({
      where: {
        isActive: true,
        OR: [
          // Indefinite / Manual
          {
            startAt: null,
            endAt: null
          },
          // Scheduled window with both start and end
          {
            startAt: { lte: now },
            endAt: { gte: now }
          },
          // Scheduled with start date only
          {
            startAt: { lte: now },
            endAt: null
          },
          // Scheduled with end date only
          {
            startAt: null,
            endAt: { gte: now }
          }
        ]
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    return NextResponse.json(announcement);
  } catch (error) {
    console.error("Failed to fetch active storefront announcement:", error);
    return NextResponse.json(
      {message: "Failed to fetch active storefront announcement"},
      {status: 500}
    );
  }
}
