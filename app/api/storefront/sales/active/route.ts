import {NextResponse} from "next/server";
import {prisma} from "@/lib/prisma";

export type ActiveSalesLine = {
  id: string;
  textEn: string;
  textAr: string;
};

export const revalidate = 0; // Dynamic route

export async function GET(): Promise<NextResponse<ActiveSalesLine | null>> {
  try {
    const now = new Date();
    const announcement = await prisma.announcement.findFirst({
      where: {
        isActive: true,
        OR: [
          { startAt: null, endAt: null },
          { startAt: { lte: now }, endAt: { gte: now } },
          { startAt: { lte: now }, endAt: null },
          { startAt: null, endAt: { gte: now } }
        ]
      },
      orderBy: {
        createdAt: "desc"
      },
      select: {
        id: true,
        textEn: true,
        textAr: true
      }
    });

    return NextResponse.json(announcement);
  } catch (error) {
    console.error("Failed to fetch active storefront sales line:", error);
    return NextResponse.json(null);
  }
}
