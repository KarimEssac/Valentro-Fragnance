import {NextResponse} from "next/server";
import type {NextRequest} from "next/server";
import {CouponApplicability, CouponType, Prisma} from "@prisma/client";
import {getServerSession} from "next-auth";
import type {Session} from "next-auth";

import {authOptions} from "@/lib/auth";
import {prisma} from "@/lib/prisma";

type CouponPayload = {
  mode?: unknown;
  code?: unknown;
  generateCode?: unknown;
  type?: unknown;
  value?: unknown;
  minOrderAmount?: unknown;
  maxUses?: unknown;
  startsAt?: unknown;
  expiresAt?: unknown;
  isActive?: unknown;
  applicableTo?: unknown;
  userIds?: unknown;
  audienceRule?: unknown;
  audiencePercent?: unknown;
};

const couponTypes = new Set(Object.values(CouponType));
const applicabilityValues = new Set(Object.values(CouponApplicability));
const audienceRules = new Set(["TOP_SPEND", "TOP_ORDERS"]);

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
  if (Number.isNaN(date.getTime())) {
    throw new Error(`${label} is invalid`);
  }

  return date;
}

function asOptionalPositiveInt(value: unknown, label: string) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  if (!Number.isInteger(number) || number < 1) {
    throw new Error(`${label} is invalid`);
  }
  return number;
}

function asMoney(value: unknown, label: string, min = 0) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < min) {
    throw new Error(`${label} is invalid`);
  }
  return new Prisma.Decimal(number.toFixed(2));
}

function normalizeCode(value: unknown) {
  const code = asString(value).toUpperCase().replace(/[^A-Z0-9_-]/g, "");
  if (!code || code.length < 4 || code.length > 32) {
    throw new Error("Coupon code must be 4 to 32 letters or numbers");
  }
  return code;
}

function generatedCode(prefix = "VAL") {
  const token = Array.from(crypto.getRandomValues(new Uint8Array(6)))
    .map((byte) => byte.toString(36).padStart(2, "0"))
    .join("")
    .slice(0, 10)
    .toUpperCase();

  return `${prefix}-${token}`;
}

function asUserIds(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => asString(item))
    .filter((item) => /^[A-Za-z0-9_-]+$/.test(item));
}

async function assertAdmin() {
  const session = (await getServerSession(authOptions)) as Session | null;
  if (session?.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }
}

async function selectBulkUsers(rule: string, percent: number) {
  const users = await prisma.user.findMany({
    where: {role: "CUSTOMER"},
    select: {
      id: true,
      orders: {
        select: {
          total: true
        }
      }
    }
  });

  const ranked = users
    .map((user) => ({
      id: user.id,
      orderCount: user.orders.length,
      totalSpent: user.orders.reduce((sum, order) => sum + Number(order.total), 0)
    }))
    .filter((user) => (rule === "TOP_SPEND" ? user.totalSpent > 0 : user.orderCount > 0))
    .sort((a, b) =>
      rule === "TOP_SPEND"
        ? b.totalSpent - a.totalSpent
        : b.orderCount - a.orderCount || b.totalSpent - a.totalSpent
    );

  const take = Math.max(1, Math.ceil((ranked.length * percent) / 100));
  return ranked.slice(0, take).map((user) => user.id);
}

function parseSharedPayload(payload: CouponPayload) {
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

  return {
    type,
    value,
    minOrderAmount:
      payload.minOrderAmount === "" || payload.minOrderAmount === null
        ? null
        : asMoney(payload.minOrderAmount, "Minimum order", 0),
    maxUses: asOptionalPositiveInt(payload.maxUses, "Maximum uses"),
    startsAt,
    expiresAt,
    isActive: asBoolean(payload.isActive, true)
  };
}

export async function GET() {
  try {
    await assertAdmin();

    const coupons = await prisma.coupon.findMany({
      orderBy: [{createdAt: "desc"}],
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

    return NextResponse.json({coupons});
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to list coupons";
    return NextResponse.json({message}, {status: message === "Unauthorized" ? 401 : 400});
  }
}

export async function POST(request: NextRequest) {
  try {
    await assertAdmin();
    const payload = (await request.json()) as CouponPayload;
    const shared = parseSharedPayload(payload);
    const mode = asString(payload.mode) || "manual";

    let applicableTo = asString(payload.applicableTo) as CouponApplicability;
    let userIds = asUserIds(payload.userIds);
    let audienceRule: string | null = null;
    let audiencePercent: number | null = null;

    if (mode === "bulk") {
      audienceRule = asString(payload.audienceRule);
      if (!audienceRules.has(audienceRule)) {
        throw new Error("Bulk audience rule is invalid");
      }

      audiencePercent = Number(payload.audiencePercent);
      if (!Number.isInteger(audiencePercent) || audiencePercent < 1 || audiencePercent > 100) {
        throw new Error("Audience percent must be between 1 and 100");
      }

      userIds = await selectBulkUsers(audienceRule, audiencePercent);
      if (userIds.length === 0) {
        throw new Error("No customers matched the selected bulk audience");
      }

      applicableTo = CouponApplicability.SPECIFIC_USERS;
    } else if (!applicabilityValues.has(applicableTo)) {
      throw new Error("Coupon audience is invalid");
    }

    if (applicableTo === CouponApplicability.SPECIFIC_USERS && userIds.length === 0) {
      throw new Error("Select at least one customer for a targeted coupon");
    }

    const code =
      asBoolean(payload.generateCode, mode === "bulk") || !asString(payload.code)
        ? generatedCode(mode === "bulk" ? "BULK" : "VAL")
        : normalizeCode(payload.code);

    const coupon = await prisma.coupon.create({
      data: {
        ...shared,
        code,
        applicableTo,
        audienceRule,
        audiencePercent,
        users:
          applicableTo === CouponApplicability.SPECIFIC_USERS
            ? {connect: userIds.map((id) => ({id}))}
            : undefined
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

    return NextResponse.json({message: "Coupon created", coupon}, {status: 201});
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create coupon";
    return NextResponse.json({message}, {status: message === "Unauthorized" ? 401 : 400});
  }
}
