import {NextResponse} from "next/server";
import type {NextRequest} from "next/server";
import {CouponApplicability, CouponType, Prisma} from "@prisma/client";
import {getServerSession} from "next-auth";
import type {Session} from "next-auth";

import {authOptions} from "@/lib/auth";
import {prisma} from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type CouponUpdatePayload = {
  code?: unknown;
  type?: unknown;
  value?: unknown;
  minOrderAmount?: unknown;
  maxUses?: unknown;
  startsAt?: unknown;
  expiresAt?: unknown;
  isActive?: unknown;
  resetUses?: unknown;
  applicableTo?: unknown;
  userIds?: unknown;
};

const couponTypes = new Set(Object.values(CouponType));
const applicabilityValues = new Set(Object.values(CouponApplicability));

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function asBoolean(value: unknown, fallback = false) {
  return typeof value === "boolean" ? value : fallback;
}

function asOptionalDate(value: unknown, label: string) {
  const text = asString(value);
  if (!text) return null;

  const date = new Date(text);
  if (Number.isNaN(date.getTime())) throw new Error(`${label} is invalid`);
  return date;
}

function asOptionalPositiveInt(value: unknown, label: string) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  if (!Number.isInteger(number) || number < 1) throw new Error(`${label} is invalid`);
  return number;
}

function asMoney(value: unknown, label: string, min = 0) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < min) throw new Error(`${label} is invalid`);
  return new Prisma.Decimal(number.toFixed(2));
}

function normalizeCode(value: unknown) {
  const code = asString(value).toUpperCase().replace(/[^A-Z0-9_-]/g, "");
  if (!code || code.length < 4 || code.length > 32) {
    throw new Error("Coupon code must be 4 to 32 letters or numbers");
  }
  return code;
}

function asUserIds(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => asString(item))
    .filter((item) => /^[A-Za-z0-9_-]+$/.test(item));
}

async function assertAdmin() {
  const session = (await getServerSession(authOptions)) as Session | null;
  if (session?.user.role !== "ADMIN") throw new Error("Unauthorized");
}

function parsePayload(payload: CouponUpdatePayload) {
  const type = asString(payload.type) as CouponType;
  if (!couponTypes.has(type)) throw new Error("Coupon type is invalid");

  const value = asMoney(payload.value, "Coupon value", 0.01);
  if (type === "PERCENTAGE" && Number(value) > 100) {
    throw new Error("Percentage coupons cannot exceed 100%");
  }

  const startsAt = asOptionalDate(payload.startsAt, "Start date");
  const expiresAt = asOptionalDate(payload.expiresAt, "End date");
  if (startsAt && expiresAt && startsAt >= expiresAt) {
    throw new Error("End date must be after start date");
  }

  const applicableTo = asString(payload.applicableTo) as CouponApplicability;
  if (!applicabilityValues.has(applicableTo)) {
    throw new Error("Coupon audience is invalid");
  }

  const userIds = asUserIds(payload.userIds);
  if (applicableTo === CouponApplicability.SPECIFIC_USERS && userIds.length === 0) {
    throw new Error("Select at least one customer for a targeted coupon");
  }

  return {
    code: normalizeCode(payload.code),
    type,
    value,
    minOrderAmount:
      payload.minOrderAmount === "" || payload.minOrderAmount === null
        ? null
        : asMoney(payload.minOrderAmount, "Minimum order", 0),
    maxUses: asOptionalPositiveInt(payload.maxUses, "Maximum uses"),
    startsAt,
    expiresAt,
    isActive: asBoolean(payload.isActive, true),
    applicableTo,
    userIds
  };
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    await assertAdmin();
    const {id} = await context.params;
    const payload = (await request.json()) as CouponUpdatePayload;
    const parsed = parsePayload(payload);

    const coupon = await prisma.coupon.update({
      where: {id},
      data: {
        code: parsed.code,
        type: parsed.type,
        value: parsed.value,
        minOrderAmount: parsed.minOrderAmount,
        maxUses: parsed.maxUses,
        startsAt: parsed.startsAt,
        expiresAt: parsed.expiresAt,
        isActive: parsed.isActive,
        applicableTo: parsed.applicableTo,
        audienceRule: null,
        audiencePercent: null,
        usedCount: asBoolean(payload.resetUses) ? 0 : undefined,
        users: {
          set:
            parsed.applicableTo === CouponApplicability.SPECIFIC_USERS
              ? parsed.userIds.map((userId) => ({id: userId}))
              : []
        }
      },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json({message: "Coupon updated", coupon});
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update coupon";
    return NextResponse.json({message}, {status: message === "Unauthorized" ? 401 : 400});
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  void request;

  try {
    await assertAdmin();
    const {id} = await context.params;

    await prisma.coupon.update({
      where: {id},
      data: {isActive: false}
    });

    return NextResponse.json({message: "Coupon disabled"});
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to disable coupon";
    return NextResponse.json({message}, {status: message === "Unauthorized" ? 401 : 400});
  }
}
