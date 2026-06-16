"use client";

import {useMemo, useState} from "react";

export type AdminOrderRow = {
  id: string;
  shortId: string;
  createdAt: string;
  customerName: string;
  customerEmail: string;
  total: string;
  status: string;
  itemCount: number;
  itemsPreview: string;
};

type OrderSummary = {
  total: number;
  pending: number;
  processing: number;
  shipped: number;
  delivered: number;
};

type AdminOrdersClientProps = {
  locale: string;
  orders: AdminOrderRow[];
  summary: OrderSummary;
};

const statusOptions = [
  "ALL",
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED"
];

function StatusBadge({status}: {status: string}) {
  const classes: Record<string, string> = {
    PENDING: "border-gold/60 text-gold",
    CONFIRMED: "border-green-800/40 text-green-800",
    PROCESSING: "border-outline text-on-surface",
    SHIPPED: "border-parchment/30 text-parchment",
    DELIVERED: "border-green-700/40 text-green-700",
    CANCELLED: "border-red-700/40 text-red-700"
  };

  return (
    <span
      className={`label-caps inline-flex items-center border px-3 py-1 text-[10px] ${
        classes[status] ?? "border-outline text-on-surface"
      }`}
    >
      {status.toLowerCase().replace("_", " ")}
    </span>
  );
}

function SummaryCard({
  label,
  value,
  tone = "default"
}: {
  label: string;
  value: number;
  tone?: "default" | "gold";
}) {
  return (
    <div className="flex h-28 sm:h-36 flex-col justify-between border border-outline/55 bg-surface/70 p-4 sm:p-6 transition-colors hover:border-gold/70">
      <p
        className={`label-caps text-[10px] sm:text-xs ${
          tone === "gold" ? "text-gold" : "text-on-surface/70"
        }`}
      >
        {label}
      </p>
      <p className="font-serif text-2xl sm:text-4xl leading-tight text-parchment">{value}</p>
    </div>
  );
}

export default function AdminOrdersClient({
  locale,
  orders,
  summary
}: AdminOrdersClientProps) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("ALL");
  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        month: "short",
        day: "numeric",
        year: "numeric"
      }),
    [locale]
  );
  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        style: "currency",
        currency: "EGP",
        maximumFractionDigits: 0
      }),
    [locale]
  );

  const filteredOrders = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesStatus = status === "ALL" || order.status === status;
      const haystack = [
        order.id,
        order.shortId,
        order.customerName,
        order.customerEmail,
        order.status,
        order.itemsPreview
      ]
        .join(" ")
        .toLowerCase();
      const matchesQuery = !normalizedQuery || haystack.includes(normalizedQuery);

      return matchesStatus && matchesQuery;
    });
  }, [orders, query, status]);

  return (
    <section className="mx-auto max-w-container px-gutter py-10 text-parchment sm:py-12 lg:px-16">
      <header className="mb-12 border-b border-outline/70 pb-6">
        <p className="label-caps mb-3 text-gold">Admin Console</p>
        <h1 className="font-serif text-[clamp(2.4rem,5vw,4rem)] leading-tight">
          Order Management
        </h1>
        <div className="mt-6 h-px w-16 bg-gold" />
      </header>

      <section
        aria-label="Order status summary"
        className="mb-12 grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 xl:grid-cols-5"
      >
        <SummaryCard label="Total Orders" value={summary.total} />
        <SummaryCard label="Pending" value={summary.pending} tone="gold" />
        <SummaryCard label="Processing" value={summary.processing} />
        <SummaryCard label="Shipped" value={summary.shipped} />
        <SummaryCard label="Delivered" value={summary.delivered} />
      </section>

      <section className="mb-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="relative w-full lg:max-w-xl">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search order ID, customer, email, status, or item"
            className="w-full border-0 border-b border-outline bg-transparent px-0 pb-3 pl-9 text-base text-parchment outline-none placeholder:text-on-surface/50 focus:border-gold focus:ring-0"
          />
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            className="absolute bottom-3 left-0 h-5 w-5 text-gold"
          >
            <path d="m21 21-4.3-4.3" />
            <circle cx="11" cy="11" r="7" />
          </svg>
        </div>

        <div className="relative">
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="label-caps min-h-10 cursor-pointer border border-outline bg-surface px-8 pr-12 text-parchment transition-colors focus:border-gold outline-none appearance-none"
            aria-label="Filter orders by status"
          >
            {statusOptions.map((option) => (
              <option key={option} value={option} className="bg-surface text-parchment">
                {option === "ALL" ? "All Statuses" : option.toLowerCase().replace("_", " ")}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-gold">
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </div>
        </div>
      </section>

      <section className="border-t border-parchment pt-2">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] border-collapse text-left">
            <thead>
              <tr className="border-b border-outline/70">
                <th className="label-caps py-5 pr-6 text-on-surface/70">Order ID</th>
                <th className="label-caps px-6 py-5 text-on-surface/70">Date</th>
                <th className="label-caps px-6 py-5 text-on-surface/70">Customer</th>
                <th className="label-caps px-6 py-5 text-on-surface/70">Items</th>
                <th className="label-caps px-6 py-5 text-right text-on-surface/70">Total</th>
                <th className="label-caps px-6 py-5 text-on-surface/70">Status</th>
              </tr>
            </thead>
            <tbody className="text-sm text-parchment">
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-outline/35 transition-colors hover:bg-surface/70"
                  >
                    <td className="py-5 pr-6 font-serif text-lg">{order.shortId}</td>
                    <td className="px-6 py-5 text-on-surface/70">
                      {dateFormatter.format(new Date(order.createdAt))}
                    </td>
                    <td className="px-6 py-5">
                      <p>{order.customerName}</p>
                      <p className="mt-1 text-xs text-on-surface/60">
                        {order.customerEmail}
                      </p>
                    </td>
                    <td className="max-w-[260px] px-6 py-5 text-on-surface/75">
                      <p className="truncate">{order.itemsPreview}</p>
                      <p className="mt-1 text-xs">{order.itemCount} items</p>
                    </td>
                    <td className="px-6 py-5 text-right font-serif text-lg">
                      {currencyFormatter.format(Number(order.total))}
                    </td>
                    <td className="px-6 py-5">
                      <StatusBadge status={order.status} />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-on-surface/70">
                    No orders match the current search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex flex-col gap-3 text-on-surface/70 sm:flex-row sm:items-center sm:justify-between">
          <p className="label-caps">
            Showing {filteredOrders.length} of {orders.length} orders
          </p>
          {(query || status !== "ALL") && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setStatus("ALL");
              }}
              className="label-caps text-gold transition-colors hover:text-parchment"
            >
              Clear Filters
            </button>
          )}
        </div>
      </section>
    </section>
  );
}
