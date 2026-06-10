import {NextResponse} from "next/server";

export type ActiveSalesLine = {
  id: string;
  textEn: string;
  textAr: string;
};

/**
 * GET /api/storefront/sales/active
 *
 * Returns the currently active sales / promo line for the hero section.
 * For now this returns hardcoded mock data. Once the Sales model is added
 * to Prisma it should query the database just like the announcements route.
 */
export async function GET(): Promise<NextResponse<ActiveSalesLine | null>> {
  // TODO: Replace with a Prisma query once the model exists
  const mock: ActiveSalesLine = {
    id: "mock-sale-001",
    textEn: "Up to 30% Off — Limited Collection",
    textAr: "خصم يصل إلى ٣٠٪ — مجموعة محدودة"
  };

  return NextResponse.json(mock);
}
