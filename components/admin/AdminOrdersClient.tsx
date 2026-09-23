"use client";

import {useMemo, useState} from "react";

import ValentroSelect from "@/components/ui/ValentroSelect";

type AdminOrderItem = {
  fragranceName: string;
  collectionId?: string | null;
  sizeML: number;
  quantity: number;
  unitPrice: string;
  totalPrice: string;
};

type AddressSnapshot = {
  email?: string;
  firstName?: string;
  lastName?: string;
  address?: string;
  apartment?: string | null;
  city?: string;
  governorate?: string;
  postalCode?: string | null;
  phone?: string;
  country?: string;
};

export type AdminOrderRow = {
  id: string;
  shortId: string;
  createdAt: string;
  customerName: string;
  customerEmail: string;
  subtotal: string;
  discountAmount: string;
  total: string;
  status: string;
  paymentMethod: string;
  instapayClaimedAt: string | null;
  instapayVerifiedAt: string | null;
  paymentMethodChangedAt: string | null;
  paymentMethodChangeReason: string | null;
  itemCount: number;
  itemsPreview: string;
  addressSnapshot: unknown;
  notes: string | null;
  items: AdminOrderItem[];
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

const editableStatuses = statusOptions.filter((option) => option !== "ALL");

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
    <div className="flex h-28 flex-col justify-between border border-outline/55 bg-surface/70 p-4 transition-colors hover:border-gold/70 sm:h-36 sm:p-6">
      <p
        className={`label-caps text-[10px] sm:text-xs ${
          tone === "gold" ? "text-gold" : "text-on-surface/70"
        }`}
      >
        {label}
      </p>
      <p className="font-serif text-2xl leading-tight text-parchment sm:text-4xl">
        {value}
      </p>
    </div>
  );
}

function addressFromSnapshot(value: unknown): AddressSnapshot {
  if (!value || typeof value !== "object") return {};

  return value as AddressSnapshot;
}

export default function AdminOrdersClient({
  locale,
  orders,
  summary
}: AdminOrdersClientProps) {
  const [orderRows, setOrderRows] = useState(orders);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("ALL");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(
    orders[0]?.id ?? null
  );
  const [message, setMessage] = useState("");
  const [updatingOrderId, setUpdatingOrderId] = useState("");
  const [conversionReason, setConversionReason] = useState("");

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

  const selectedOrder = orderRows.find((order) => order.id === selectedOrderId) ??
    orderRows[0] ??
    null;

  const filteredOrders = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return orderRows.filter((order) => {
      const matchesStatus = status === "ALL" || order.status === status;
      const haystack = [
        order.id,
        order.shortId,
        order.customerName,
        order.customerEmail,
        order.status,
        order.paymentMethod,
        order.itemsPreview
      ]
        .join(" ")
        .toLowerCase();
      const matchesQuery = !normalizedQuery || haystack.includes(normalizedQuery);

      return matchesStatus && matchesQuery;
    });
  }, [orderRows, query, status]);

  const currentSummary = useMemo(
    () => ({
      total: orderRows.length,
      pending: orderRows.filter((order) => order.status === "PENDING").length,
      processing: orderRows.filter((order) =>
        ["CONFIRMED", "PROCESSING"].includes(order.status)
      ).length,
      shipped: orderRows.filter((order) => order.status === "SHIPPED").length,
      delivered: orderRows.filter((order) => order.status === "DELIVERED").length
    }),
    [orderRows]
  );

  async function updateOrderStatus(orderId: string, nextStatus: string) {
    if (nextStatus === "CANCELLED" && !window.confirm("Cancel this order and release its reserved stock and coupon?")) return;
    await updateOrder(orderId, {status: nextStatus});
  }

  async function updateOrder(orderId: string, payload: {status?: string; action?: string; reason?: string}) {
    setUpdatingOrderId(orderId);
    setMessage("");

    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(payload)
      });
      const result = (await response.json()) as {
        message?: string;
        order?: Partial<AdminOrderRow>;
      };

      if (!response.ok) {
        throw new Error(result.message ?? "Unable to update order status");
      }

      setOrderRows((current) =>
        current.map((order) =>
          order.id === orderId
            ? {...order, ...result.order}
            : order
        )
      );
      setMessage("Order updated.");
      if (payload.action === "convertToCash") setConversionReason("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to update order");
    } finally {
      setUpdatingOrderId("");
    }
  }

  function renderDetails(order: AdminOrderRow) {
    const address = addressFromSnapshot(order.addressSnapshot);

    return (
      <aside className="border border-outline/60 bg-surface/70 p-5 xl:sticky xl:top-8">
        <div className="border-b border-outline/60 pb-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="label-caps mb-2 text-gold">Order Details</p>
              <h2 className="font-serif text-3xl leading-tight">{order.shortId}</h2>
            </div>
            <StatusBadge status={order.status} />
          </div>
          <p className="mt-3 text-sm text-on-surface/70">
            {dateFormatter.format(new Date(order.createdAt))}
          </p>
        </div>

        <div className="border-b border-outline/60 py-5">
          <p className="label-caps mb-3 text-gold">Payment</p>
          <p className="text-sm text-parchment">{order.paymentMethod === "INSTAPAY" ? "InstaPay" : "Cash on delivery"}</p>
          {order.paymentMethod === "INSTAPAY" ? (
            <>
              <p className="mt-2 text-sm text-on-surface/75">
                {order.instapayVerifiedAt ? "Transfer verified by admin" : order.instapayClaimedAt ? "Customer claims transfer sent — verify in InstaPay" : "Awaiting customer transfer claim"}
              </p>
              <p className="mt-2 break-all font-mono text-xs text-on-surface/65">Transfer note: {order.id}</p>
              {!order.instapayVerifiedAt && order.status !== "CANCELLED" ? (
                <div className="mt-4 space-y-3">
                  <button type="button" disabled={updatingOrderId === order.id} onClick={() => {
                    if (window.confirm("Have you independently found this transfer in InstaPay?")) updateOrder(order.id, {action: "verifyInstapay"});
                  }} className="label-caps min-h-10 w-full border border-gold px-3 text-gold disabled:opacity-50">Mark transfer verified</button>
                  <p className="text-xs leading-5 text-on-surface/65">After contacting the customer, you can switch this unverified order to cash on delivery.</p>
                  <input value={conversionReason} onChange={(event) => setConversionReason(event.target.value)} maxLength={300} placeholder="Reason for changing payment method" aria-label="Reason for changing payment method" className="min-h-10 w-full border border-outline bg-surface-hi px-3 text-sm text-parchment" />
                  <button type="button" disabled={updatingOrderId === order.id || conversionReason.trim().length < 5} onClick={() => updateOrder(order.id, {action: "convertToCash", reason: conversionReason})} className="label-caps min-h-10 w-full border border-outline px-3 disabled:opacity-50">Switch to cash on delivery</button>
                </div>
              ) : null}
            </>
          ) : null}
          {order.paymentMethodChangedAt ? (
            <p className="mt-3 text-xs leading-5 text-on-surface/65">Changed from InstaPay on {dateFormatter.format(new Date(order.paymentMethodChangedAt))}. Reason: {order.paymentMethodChangeReason}</p>
          ) : null}
        </div>

        <div className="border-b border-outline/60 py-5">
          <label className="block">
            <span className="label-caps mb-2 block text-on-surface/70">
              Move Status
            </span>
            <ValentroSelect
              value={order.status}
              disabled={updatingOrderId === order.id}
              onChange={(event) => updateOrderStatus(order.id, event.target.value)}
              className="min-h-11 bg-surface-hi"
            >
              {editableStatuses.map((option) => (
                <option key={option} value={option}>
                  {option.toLowerCase().replace("_", " ")}
                </option>
              ))}
            </ValentroSelect>
          </label>
        </div>

        <div className="border-b border-outline/60 py-5">
          <p className="label-caps mb-3 text-gold">Customer</p>
          <p className="font-semibold text-parchment">{order.customerName}</p>
          <p className="mt-1 break-all text-sm text-on-surface/70">
            {order.customerEmail}
          </p>
          <p className="mt-3 text-sm text-on-surface/75">
            {[address.firstName, address.lastName].filter(Boolean).join(" ")}
          </p>
          <p className="mt-1 text-sm text-on-surface/75">{address.phone}</p>
        </div>

        <div className="border-b border-outline/60 py-5">
          <p className="label-caps mb-3 text-gold">Delivery Address</p>
          <div className="space-y-1 text-sm leading-6 text-on-surface/75">
            <p>{address.address}</p>
            {address.apartment ? <p>{address.apartment}</p> : null}
            <p>
              {[address.city, address.governorate, address.postalCode]
                .filter(Boolean)
                .join(", ")}
            </p>
            <p>{address.country ?? "Egypt"}</p>
          </div>
        </div>

        <div className="border-b border-outline/60 py-5">
          <p className="label-caps mb-3 text-gold">Items</p>
          <div className="space-y-4">
            {order.items.map((item, index) => (
              <div
                key={`${item.fragranceName}-${item.sizeML}-${index}`}
                className="grid grid-cols-[1fr_auto] gap-4 text-sm"
              >
                <div>
                  <p className="font-semibold text-parchment">
                    {item.fragranceName}
                  </p>
                  <p className="mt-1 text-on-surface/65">
                    {item.collectionId ? "Collection" : `${item.sizeML}ml`} × {item.quantity} ·{" "}
                    {currencyFormatter.format(Number(item.unitPrice))}
                  </p>
                </div>
                <p className="font-semibold">
                  {currencyFormatter.format(Number(item.totalPrice))}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3 py-5 text-sm text-on-surface/75">
          <div className="flex justify-between gap-4">
            <span>Subtotal</span>
            <span>{currencyFormatter.format(Number(order.subtotal))}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span>Discount</span>
            <span>{currencyFormatter.format(Number(order.discountAmount))}</span>
          </div>
          <div className="flex justify-between gap-4 text-parchment">
            <span className="label-caps">Total</span>
            <span className="font-serif text-2xl">
              {currencyFormatter.format(Number(order.total))}
            </span>
          </div>
        </div>

        {order.notes ? (
          <div className="border-t border-outline/60 pt-5">
            <p className="label-caps mb-2 text-gold">Notes</p>
            <p className="text-sm leading-6 text-on-surface/75">{order.notes}</p>
          </div>
        ) : null}
      </aside>
    );
  }

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
        <SummaryCard label="Total Orders" value={currentSummary.total || summary.total} />
        <SummaryCard label="Pending" value={currentSummary.pending} tone="gold" />
        <SummaryCard label="Processing" value={currentSummary.processing} />
        <SummaryCard label="Shipped" value={currentSummary.shipped} />
        <SummaryCard label="Delivered" value={currentSummary.delivered} />
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

        <ValentroSelect
          wrapperClassName="sm:w-auto sm:min-w-48"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            aria-label="Filter orders by status"
          >
            {statusOptions.map((option) => (
              <option key={option} value={option} className="bg-surface text-parchment">
                {option === "ALL" ? "All Statuses" : option.toLowerCase().replace("_", " ")}
              </option>
            ))}
          </ValentroSelect>
      </section>

      {message ? (
        <p className="mb-6 border border-outline/60 bg-surface px-4 py-3 text-sm text-on-surface">
          {message}
        </p>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <section className="border-t border-parchment pt-2">
          <div className="space-y-3 md:hidden">
            {filteredOrders.length > 0 ? (
              filteredOrders.map((order) => (
                <article
                  key={order.id}
                  className={`border border-outline/50 bg-surface/70 p-4 ${
                    selectedOrder?.id === order.id ? "border-gold" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-serif text-xl leading-tight">
                        {order.shortId}
                      </p>
                      <p className="mt-1 text-xs text-on-surface/65">
                        {dateFormatter.format(new Date(order.createdAt))}
                      </p>
                    </div>
                    <StatusBadge status={order.status} />
                  </div>
                  <p className="mt-2 text-xs text-gold">{order.paymentMethod === "INSTAPAY" ? order.instapayVerifiedAt ? "InstaPay verified" : order.instapayClaimedAt ? "InstaPay · customer claims paid" : "InstaPay · awaiting transfer" : "Cash on delivery"}</p>

                  <div className="mt-4 min-w-0">
                    <p className="font-semibold text-parchment">
                      {order.customerName}
                    </p>
                    <p className="mt-1 break-all text-xs text-on-surface/65">
                      {order.customerEmail}
                    </p>
                  </div>

                  <div className="mt-4 grid grid-cols-[1fr_auto] gap-4 text-sm">
                    <div className="min-w-0">
                      <p className="truncate text-on-surface/75">
                        {order.itemsPreview}
                      </p>
                      <p className="mt-1 text-xs text-on-surface/60">
                        {order.itemCount} items
                      </p>
                    </div>
                    <p className="font-serif text-lg">
                      {currencyFormatter.format(Number(order.total))}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedOrderId(order.id)}
                    className="label-caps mt-4 min-h-10 w-full border border-outline text-gold transition-colors hover:border-gold hover:text-parchment"
                  >
                    View Details
                  </button>
                </article>
              ))
            ) : (
              <div className="border border-outline/50 bg-surface/70 px-4 py-10 text-center text-sm text-on-surface/70">
                No orders match the current search.
              </div>
            )}
          </div>

          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[980px] border-collapse text-left">
              <thead>
                <tr className="border-b border-outline/70">
                  <th className="label-caps py-5 pr-6 text-on-surface/70">Order ID</th>
                  <th className="label-caps px-6 py-5 text-on-surface/70">Date</th>
                  <th className="label-caps px-6 py-5 text-on-surface/70">Customer</th>
                  <th className="label-caps px-6 py-5 text-on-surface/70">Items</th>
                  <th className="label-caps px-6 py-5 text-right text-on-surface/70">Total</th>
                  <th className="label-caps px-6 py-5 text-on-surface/70">Status</th>
                  <th className="label-caps py-5 pl-6 text-on-surface/70">Action</th>
                </tr>
              </thead>
              <tbody className="text-sm text-parchment">
                {filteredOrders.length > 0 ? (
                  filteredOrders.map((order) => (
                    <tr
                      key={order.id}
                      className={`border-b border-outline/35 transition-colors hover:bg-surface/70 ${
                        selectedOrder?.id === order.id ? "bg-surface/70" : ""
                      }`}
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
                        <p className="mt-2 text-xs text-gold">{order.paymentMethod === "INSTAPAY" ? order.instapayVerifiedAt ? "InstaPay verified" : order.instapayClaimedAt ? "InstaPay · claims paid" : "InstaPay · awaiting" : "Cash on delivery"}</p>
                      </td>
                      <td className="py-5 pl-6">
                        <button
                          type="button"
                          onClick={() => setSelectedOrderId(order.id)}
                          className="label-caps text-gold transition-colors hover:text-parchment"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-on-surface/70">
                      No orders match the current search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex flex-col gap-3 text-on-surface/70 sm:flex-row sm:items-center sm:justify-between">
            <p className="label-caps">
              Showing {filteredOrders.length} of {orderRows.length} orders
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

        {selectedOrder ? (
          renderDetails(selectedOrder)
        ) : (
          <aside className="border border-outline/60 bg-surface/70 p-5 text-sm text-on-surface/70">
            Select an order to view details.
          </aside>
        )}
      </div>
    </section>
  );
}
