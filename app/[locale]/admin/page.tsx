import Link from "next/link";
import {getTranslations} from "next-intl/server";
import type {Prisma} from "@prisma/client";

import {prisma} from "@/lib/prisma";

type AdminPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

type DashboardSummary = {
  currentRevenue: Prisma.Decimal;
  previousRevenue: Prisma.Decimal;
  averageOrderValue: Prisma.Decimal;
  previousAverageOrderValue: Prisma.Decimal;
  currentOrders: number;
  previousOrders: number;
  activeOrders: number;
  pendingOrders: number;
  newCustomers: number;
  previousNewCustomers: number;
  publishedFragrances: number;
  activeCoupons: number;
  lowStockCount: number;
};

type MonthlyRevenue = {
  month: Date;
  total: Prisma.Decimal;
};

function numberFromDecimal(value: Prisma.Decimal | null | undefined) {
  return value ? Number(value.toString()) : 0;
}

function startOfDay(date: Date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function monthStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function formatPercentChange(current: number, previous: number) {
  if (previous === 0) return current > 0 ? "+100%" : "0%";
  const change = ((current - previous) / previous) * 100;
  return `${change >= 0 ? "+" : ""}${change.toFixed(1)}%`;
}

function Trend({value}: {value: string}) {
  const isPositive = value.startsWith("+");
  const isNeutral = value === "0%";

  return (
    <span
      className={`text-xs font-semibold ${
        isNeutral ? "text-gold" : isPositive ? "text-green-700" : "text-red-700"
      }`}
    >
      {value}
    </span>
  );
}

function StatCard({
  label,
  value,
  detail,
  trend
}: {
  label: string;
  value: string;
  detail: string;
  trend?: string;
}) {
  return (
    <div className="border border-outline/50 bg-surface/70 p-4 sm:p-6 transition-colors duration-300 hover:border-gold/70">
      <p className="label-caps mb-2 text-[10px] sm:text-xs text-gold">{label}</p>
      <p className="font-serif text-2xl sm:text-4xl leading-tight text-parchment">{value}</p>
      <div className="mt-4 flex flex-wrap items-center gap-1 sm:gap-2 text-[10px] sm:text-xs text-on-surface/70">
        {trend ? <Trend value={trend} /> : null}
        <span className="truncate">{detail}</span>
      </div>
    </div>
  );
}

export default async function AdminPage({params}: AdminPageProps) {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: "admin"});
  const now = new Date();
  const currentPeriodStart = startOfDay(new Date(now));
  currentPeriodStart.setDate(currentPeriodStart.getDate() - 30);
  const previousPeriodStart = startOfDay(new Date(now));
  previousPeriodStart.setDate(previousPeriodStart.getDate() - 60);
  const chartStart = monthStart(addMonths(now, -5));

  const [summaryRows, lowStockVariants, recentOrders, monthlyRevenue] =
    await Promise.all([
    prisma.$queryRaw<DashboardSummary[]>`
      SELECT
        COALESCE(SUM("total") FILTER (
          WHERE "status"::text IN ('CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED')
            AND "createdAt" >= ${currentPeriodStart}
        ), 0)::numeric AS "currentRevenue",
        COALESCE(SUM("total") FILTER (
          WHERE "status"::text IN ('CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED')
            AND "createdAt" >= ${previousPeriodStart}
            AND "createdAt" < ${currentPeriodStart}
        ), 0)::numeric AS "previousRevenue",
        COALESCE(AVG("total") FILTER (
          WHERE "status"::text IN ('CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED')
            AND "createdAt" >= ${currentPeriodStart}
        ), 0)::numeric AS "averageOrderValue",
        COALESCE(AVG("total") FILTER (
          WHERE "status"::text IN ('CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED')
            AND "createdAt" >= ${previousPeriodStart}
            AND "createdAt" < ${currentPeriodStart}
        ), 0)::numeric AS "previousAverageOrderValue",
        COUNT(*) FILTER (
          WHERE "createdAt" >= ${currentPeriodStart}
        )::integer AS "currentOrders",
        COUNT(*) FILTER (
          WHERE "createdAt" >= ${previousPeriodStart}
            AND "createdAt" < ${currentPeriodStart}
        )::integer AS "previousOrders",
        COUNT(*) FILTER (
          WHERE "status"::text IN ('PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED')
        )::integer AS "activeOrders",
        COUNT(*) FILTER (
          WHERE "status"::text = 'PENDING'
        )::integer AS "pendingOrders",
        (
          SELECT COUNT(*)::integer
          FROM "User"
          WHERE "role"::text = 'CUSTOMER'
            AND "createdAt" >= ${currentPeriodStart}
        ) AS "newCustomers",
        (
          SELECT COUNT(*)::integer
          FROM "User"
          WHERE "role"::text = 'CUSTOMER'
            AND "createdAt" >= ${previousPeriodStart}
            AND "createdAt" < ${currentPeriodStart}
        ) AS "previousNewCustomers",
        (
          SELECT COUNT(*)::integer FROM "Fragrance" WHERE "isPublished" = true
        ) AS "publishedFragrances",
        (
          SELECT COUNT(*)::integer FROM "Coupon" WHERE "isActive" = true
        ) AS "activeCoupons",
        (
          SELECT COUNT(*)::integer FROM "FragranceVariant" WHERE "stock" <= 5
        ) AS "lowStockCount"
      FROM "Order"
    `,
    prisma.fragranceVariant.findMany({
      where: {stock: {lte: 5}},
      orderBy: {stock: "asc"},
      take: 5,
      select: {
        id: true,
        sizeML: true,
        sku: true,
        stock: true,
        fragrance: {
          select: {
            nameEn: true,
            nameAr: true
          }
        }
      }
    }),
    prisma.order.findMany({
      orderBy: {createdAt: "desc"},
      take: 5,
      select: {
        id: true,
        status: true,
        total: true,
        createdAt: true,
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    }),
    prisma.$queryRaw<MonthlyRevenue[]>`
      SELECT
        date_trunc('month', "createdAt") AS "month",
        COALESCE(SUM("total"), 0)::numeric AS "total"
      FROM "Order"
      WHERE "status"::text IN ('CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED')
        AND "createdAt" >= ${chartStart}
      GROUP BY date_trunc('month', "createdAt")
      ORDER BY "month" ASC
    `
  ]);

  const summary = summaryRows[0];

  const currency = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "EGP",
    maximumFractionDigits: 0
  });
  const compact = new Intl.NumberFormat(locale, {notation: "compact"});
  const dateFormat = new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric"
  });

  const revenue = numberFromDecimal(summary.currentRevenue);
  const previousRevenueValue = numberFromDecimal(summary.previousRevenue);
  const averageOrderValue = numberFromDecimal(summary.averageOrderValue);
  const previousAverageOrderValue = numberFromDecimal(
    summary.previousAverageOrderValue
  );

  const revenueByMonth = new Map(
    monthlyRevenue.map((entry) => [
      `${entry.month.getFullYear()}-${entry.month.getMonth()}`,
      numberFromDecimal(entry.total)
    ])
  );

  const months = Array.from({length: 6}, (_, index) => {
    const date = monthStart(addMonths(now, index - 5));
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    const total = revenueByMonth.get(key) ?? 0;

    return {
      key,
      label: new Intl.DateTimeFormat(locale, {month: "short"}).format(date),
      total
    };
  });
  const maxMonthlyRevenue = Math.max(...months.map((month) => month.total), 1);
  const needsAttention = summary.pendingOrders + summary.lowStockCount;

  return (
    <section className="mx-auto max-w-container px-gutter py-10 text-parchment sm:py-12 lg:px-16">
      <header className="mb-12 flex flex-col gap-5 border-b border-outline/70 pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="label-caps mb-3 text-gold">Admin Console</p>
          <h1 className="font-serif text-[clamp(2.4rem,5vw,4rem)] leading-tight">
            {t("dashboard")}
          </h1>
        </div>
        <div className="label-caps border border-outline/70 px-4 py-3 text-on-surface/70">
          Last 30 Days
        </div>
      </header>

      <section className="mb-10 grid grid-cols-2 gap-4 sm:gap-5 xl:grid-cols-3">
        <StatCard
          label="Total Revenue"
          value={currency.format(revenue)}
          trend={formatPercentChange(revenue, previousRevenueValue)}
          detail="vs previous 30 days"
        />
        <StatCard
          label="Active Orders"
          value={compact.format(summary.activeOrders)}
          trend={formatPercentChange(summary.currentOrders, summary.previousOrders)}
          detail="orders in motion"
        />
        <StatCard
          label="Pending Confirmation"
          value={compact.format(summary.pendingOrders)}
          detail={summary.pendingOrders > 0 ? "requires admin response" : "no pending orders"}
        />
        <StatCard
          label="Average Order Value"
          value={currency.format(averageOrderValue)}
          trend={formatPercentChange(averageOrderValue, previousAverageOrderValue)}
          detail="confirmed revenue only"
        />
        <StatCard
          label="New Customers"
          value={compact.format(summary.newCustomers)}
          trend={formatPercentChange(summary.newCustomers, summary.previousNewCustomers)}
          detail="created this period"
        />
        <StatCard
          label="Inventory Watch"
          value={compact.format(summary.lowStockCount)}
          detail="variants at 5 units or less"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.45fr_0.85fr]">
        <div className="border border-outline/60 bg-surface/70 p-6">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <p className="label-caps mb-2 text-gold">Revenue</p>
              <h2 className="font-serif text-3xl leading-tight">
                Monthly Revenue
              </h2>
            </div>
            <p className="text-sm text-on-surface/70">Last 6 months</p>
          </div>
          <div className="flex h-72 items-end gap-4 border-b border-outline/70 pb-4">
            {months.map((month) => (
              <div key={month.key} className="flex flex-1 flex-col items-center gap-3">
                <div className="flex h-56 w-full items-end bg-surface-hi/70">
                  <div
                    className="w-full bg-gold transition-all duration-500"
                    style={{
                      height: `${Math.max((month.total / maxMonthlyRevenue) * 100, month.total > 0 ? 8 : 0)}%`
                    }}
                    title={currency.format(month.total)}
                  />
                </div>
                <span className="label-caps text-[10px] text-on-surface/70">
                  {month.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="border border-outline/60 bg-surface/70 p-6">
            <p className="label-caps mb-2 text-gold">Attention</p>
            <h2 className="font-serif text-3xl leading-tight">
              {needsAttention} Priority Signals
            </h2>
            <div className="mt-6 space-y-4 text-sm leading-6 text-on-surface/80">
              <Link
                href={`/${locale}/admin/orders`}
                className="block border-l-2 border-gold pl-4 transition-colors hover:text-gold"
              >
                {summary.pendingOrders} orders are still pending confirmation.
              </Link>
              <Link
                href={`/${locale}/admin/inventory`}
                className="block border-l-2 border-outline pl-4 transition-colors hover:text-gold"
              >
                {summary.lowStockCount} fragrance variants are low on stock.
              </Link>
            </div>
          </div>

          <div className="border border-outline/60 bg-surface/70 p-6">
            <p className="label-caps mb-2 text-gold">Catalogue Health</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="font-serif text-3xl">{summary.publishedFragrances}</p>
                <p className="label-caps mt-1 text-on-surface/70">Published</p>
              </div>
              <div>
                <p className="font-serif text-3xl">{summary.activeCoupons}</p>
                <p className="label-caps mt-1 text-on-surface/70">Coupons</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <div className="border border-outline/60 bg-surface/70 p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="label-caps mb-2 text-gold">Orders</p>
              <h2 className="font-serif text-3xl">Recent Activity</h2>
            </div>
            <Link
              href={`/${locale}/admin/orders`}
              className="label-caps text-gold transition-colors hover:text-parchment"
            >
              View All
            </Link>
          </div>
          <div className="divide-y divide-outline/60">
            {recentOrders.length > 0 ? (
              recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="grid gap-2 py-4 text-sm md:grid-cols-[1fr_auto_auto] md:items-center"
                >
                  <div>
                    <p className="font-semibold text-parchment">
                      {order.user.name ?? order.user.email}
                    </p>
                    <p className="text-on-surface/65">
                      {dateFormat.format(order.createdAt)}
                    </p>
                  </div>
                  <p className="label-caps text-gold">{order.status}</p>
                  <p className="font-semibold">{currency.format(Number(order.total))}</p>
                </div>
              ))
            ) : (
              <p className="py-4 text-sm text-on-surface/70">
                No orders have been placed yet.
              </p>
            )}
          </div>
        </div>

        <div className="border border-outline/60 bg-surface/70 p-6">
          <p className="label-caps mb-2 text-gold">Inventory</p>
          <h2 className="font-serif text-3xl">Low Stock</h2>
          <div className="mt-6 divide-y divide-outline/60">
            {lowStockVariants.length > 0 ? (
              lowStockVariants.map((variant) => (
                <div key={variant.id} className="flex items-center justify-between gap-4 py-4">
                  <div>
                    <p className="font-semibold text-parchment">
                      {locale === "ar"
                        ? variant.fragrance.nameAr
                        : variant.fragrance.nameEn}
                    </p>
                    <p className="text-sm text-on-surface/65">
                      {variant.sizeML}ML · {variant.sku}
                    </p>
                  </div>
                  <p className="label-caps text-red-700">{variant.stock} left</p>
                </div>
              ))
            ) : (
              <p className="py-4 text-sm text-on-surface/70">
                No variants are under the low-stock threshold.
              </p>
            )}
          </div>
        </div>
      </section>
    </section>
  );
}
