import {CouponType, Prisma} from "@prisma/client";
import {NextResponse} from "next/server";
import type {NextRequest} from "next/server";
import {revalidateTag} from "next/cache";

import {isAdminRequest} from "@/lib/admin-auth";
import {prisma} from "@/lib/prisma";
import {STOREFRONT_FRAGRANCES_TAG} from "@/lib/cache-tags";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type DiscountPayload = {
  type?: unknown;
  value?: unknown;
  startsAt?: unknown;
  expiresAt?: unknown;
};

const discountTypes = new Set(Object.values(CouponType));

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function optionalDate(value: unknown, label: string) {
  const input = text(value);
  if (!input) return null;

  const date = new Date(input);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`${label} is invalid`);
  }

  return date;
}

export async function PUT(request: NextRequest, context: RouteContext) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({message: "Unauthorized"}, {status: 401});
  }

  let payload: DiscountPayload;

  try {
    payload = (await request.json()) as DiscountPayload;
  } catch {
    return NextResponse.json({message: "Invalid request"}, {status: 400});
  }

  try {
    const {id} = await context.params;
    const type = text(payload.type) as CouponType;
    const numericValue = Number(payload.value);
    const startsAt = optionalDate(payload.startsAt, "Start time");
    const expiresAt = optionalDate(payload.expiresAt, "End time");

    if (!discountTypes.has(type)) {
      throw new Error("Discount type is invalid");
    }
    if (!Number.isFinite(numericValue) || numericValue <= 0) {
      throw new Error("Discount value must be greater than zero");
    }
    if (type === CouponType.PERCENTAGE && numericValue > 100) {
      throw new Error("Percentage discounts cannot exceed 100%");
    }
    const now = new Date();
    const effectiveStart = startsAt && startsAt > now ? startsAt : now;
    if (expiresAt && expiresAt <= effectiveStart) {
      throw new Error(
        startsAt && startsAt > now
          ? "End time must be after start time"
          : "End time must be in the future"
      );
    }

    const existing = await prisma.fragrance.findUnique({
      where: {id},
      select: {id: true}
    });

    if (!existing) {
      return NextResponse.json({message: "Fragrance was not found"}, {status: 404});
    }

    const fragrance = await prisma.fragrance.update({
      where: {id},
      data: {
        discountType: type,
        discountValue: new Prisma.Decimal(numericValue.toFixed(2)),
        discountIsActive: true,
        discountStartsAt: startsAt,
        discountExpiresAt: expiresAt
      },
      select: {
        id: true,
        discountType: true,
        discountValue: true,
        discountIsActive: true,
        discountStartsAt: true,
        discountExpiresAt: true
      }
    });

    revalidateTag(STOREFRONT_FRAGRANCES_TAG, "max");
    return NextResponse.json({
      message: "Product discount saved",
      discount: {
        type: fragrance.discountType,
        value: fragrance.discountValue?.toString() ?? null,
        isActive: fragrance.discountIsActive,
        startsAt: fragrance.discountStartsAt?.toISOString() ?? null,
        expiresAt: fragrance.discountExpiresAt?.toISOString() ?? null
      }
    });
  } catch (error) {
    return NextResponse.json(
      {message: error instanceof Error ? error.message : "Unable to save discount"},
      {status: 400}
    );
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({message: "Unauthorized"}, {status: 401});
  }

  const {id} = await context.params;
  const existing = await prisma.fragrance.findUnique({
    where: {id},
    select: {id: true}
  });

  if (!existing) {
    return NextResponse.json({message: "Fragrance was not found"}, {status: 404});
  }

  try {
    await prisma.fragrance.update({
      where: {id},
      data: {discountIsActive: false}
    });

    revalidateTag(STOREFRONT_FRAGRANCES_TAG, "max");
    return NextResponse.json({message: "Product discount stopped"});
  } catch {
    return NextResponse.json({message: "Unable to stop discount"}, {status: 400});
  }
}
