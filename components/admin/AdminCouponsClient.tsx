"use client";

import {useMemo, useState} from "react";
import {useRouter} from "next/navigation";

import Modal from "@/components/ui/Modal";

type CouponUser = {
  id: string;
  name: string | null;
  email: string;
};

type Coupon = {
  id: string;
  code: string;
  type: "PERCENTAGE" | "FIXED";
  value: string;
  minOrderAmount: string | null;
  maxUses: number | null;
  usedCount: number;
  isActive: boolean;
  startsAt: string | null;
  expiresAt: string | null;
  audienceRule: string | null;
  audiencePercent: number | null;
  applicableTo: "ALL" | "SPECIFIC_USERS";
  createdAt: string;
  orderCount: number;
  users: CouponUser[];
};

type Customer = CouponUser & {
  orderCount: number;
  totalSpent: number;
};

type Props = {
  locale: string;
  coupons: Coupon[];
  customers: Customer[];
};

type CouponFormState = {
  code: string;
  generateCode: boolean;
  type: "PERCENTAGE" | "FIXED";
  value: string;
  minOrderAmount: string;
  maxUses: string;
  startsAt: string;
  expiresAt: string;
  isActive: boolean;
  applicableTo: "ALL" | "SPECIFIC_USERS";
  userIds: string[];
};

type BulkCouponFormState = Pick<
  CouponFormState,
  "type" | "value" | "minOrderAmount" | "maxUses" | "startsAt" | "expiresAt" | "isActive"
>;

const emptyForm: CouponFormState = {
  code: "",
  generateCode: false,
  type: "PERCENTAGE",
  value: "10",
  minOrderAmount: "",
  maxUses: "",
  startsAt: "",
  expiresAt: "",
  isActive: true,
  applicableTo: "ALL",
  userIds: []
};

const emptyBulkForm: BulkCouponFormState = {
  type: "PERCENTAGE",
  value: "15",
  minOrderAmount: "",
  maxUses: "",
  startsAt: "",
  expiresAt: "",
  isActive: true
};

function inputClass() {
  return "w-full border-0 border-b border-[#7A6A4F] bg-transparent px-0 py-3 text-base text-[#201B11] outline-none placeholder:text-[#7c766d] focus:border-[#D4AF37] focus:ring-0 disabled:text-[#7c766d]";
}

function labelClass() {
  return "label-caps mb-2 block text-[#7A6A4F]";
}

function Field({label, children}: {label: string; children: React.ReactNode}) {
  return (
    <label className="block">
      <span className={labelClass()}>{label}</span>
      {children}
    </label>
  );
}

function MinimumCheckoutField({
  value,
  onChange
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Field label="Minimum Checkout Total (Optional)">
      <div className="relative">
        <input
          value={value}
          type="number"
          min="0"
          step="0.01"
          placeholder="No minimum"
          onChange={(event) => onChange(event.target.value)}
          className={`${inputClass()} pr-14`}
        />
        <span className="label-caps pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-[#7A6A4F]">
          EGP
        </span>
      </div>
      <span className="mt-2 block text-xs leading-5 text-[#7c766d]">
        Applies when the pre-discount checkout subtotal reaches this amount. Leave blank for no
        minimum.
      </span>
    </Field>
  );
}

function toDateInput(value: string | null) {
  if (!value) return "";
  return value.slice(0, 16);
}

function statusFor(coupon: Coupon) {
  const now = Date.now();
  if (!coupon.isActive) return "Disabled";
  if (coupon.expiresAt && new Date(coupon.expiresAt).getTime() < now) return "Expired";
  if (coupon.startsAt && new Date(coupon.startsAt).getTime() > now) return "Scheduled";
  if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) return "Used up";
  return "Active";
}

function statusTone(status: string) {
  if (status === "Active") return "bg-[#D4AF37]";
  if (status === "Scheduled") return "bg-[#735c00]";
  if (status === "Expired" || status === "Used up") return "bg-[#7c766d]";
  return "bg-[#cdc5bb]";
}

export default function AdminCouponsClient({locale, coupons, customers}: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [form, setForm] = useState<CouponFormState>(emptyForm);
  const [bulkRule, setBulkRule] = useState<"TOP_SPEND" | "TOP_ORDERS">("TOP_SPEND");
  const [bulkPercent, setBulkPercent] = useState("10");
  const [bulkForm, setBulkForm] = useState<BulkCouponFormState>(emptyBulkForm);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [editForm, setEditForm] = useState<CouponFormState>(emptyForm);
  const [editError, setEditError] = useState("");
  const [couponToDelete, setCouponToDelete] = useState<Coupon | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [status, setStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const money = useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        style: "currency",
        currency: "EGP",
        maximumFractionDigits: 0
      }),
    [locale]
  );

  const filteredCoupons = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return coupons;
    return coupons.filter((coupon) =>
      [
        coupon.code,
        coupon.type,
        coupon.applicableTo,
        coupon.audienceRule ?? "",
        statusFor(coupon),
        ...coupon.users.map((user) => `${user.name ?? ""} ${user.email}`)
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalized)
    );
  }, [coupons, query]);

  const predictedBulkUsers = useMemo(() => {
    const percent = Math.min(Math.max(Number(bulkPercent) || 0, 0), 100);
    const eligible = customers
      .filter((customer) =>
        bulkRule === "TOP_SPEND" ? customer.totalSpent > 0 : customer.orderCount > 0
      )
      .sort((a, b) =>
        bulkRule === "TOP_SPEND"
          ? b.totalSpent - a.totalSpent
          : b.orderCount - a.orderCount || b.totalSpent - a.totalSpent
      );
    return eligible.slice(0, Math.max(1, Math.ceil((eligible.length * percent) / 100)));
  }, [bulkPercent, bulkRule, customers]);

  function updateForm(key: keyof CouponFormState, value: CouponFormState[typeof key]) {
    setForm((current) => ({...current, [key]: value}));
  }

  function updateEditForm(key: keyof CouponFormState, value: CouponFormState[typeof key]) {
    setEditForm((current) => ({...current, [key]: value}));
  }

  function updateBulkForm(
    key: keyof BulkCouponFormState,
    value: BulkCouponFormState[typeof key]
  ) {
    setBulkForm((current) => ({...current, [key]: value}));
  }

  function openEdit(coupon: Coupon) {
    setEditing(coupon);
    setStatus("");
    setEditError("");
    setEditForm({
      code: coupon.code,
      generateCode: false,
      type: coupon.type,
      value: coupon.value,
      minOrderAmount: coupon.minOrderAmount ?? "",
      maxUses: coupon.maxUses?.toString() ?? "",
      startsAt: toDateInput(coupon.startsAt),
      expiresAt: toDateInput(coupon.expiresAt),
      isActive: coupon.isActive,
      applicableTo: coupon.applicableTo,
      userIds: coupon.users.map((user) => user.id)
    });
  }

  async function submitCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("");
    setSubmitting(true);

    try {
      const response = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({...form, mode: "manual"})
      });
      const result = (await response.json()) as {message?: string};
      if (!response.ok) throw new Error(result.message ?? "Unable to create coupon");
      setForm(emptyForm);
      router.refresh();
      setStatus(result.message ?? "Coupon created");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to create coupon");
    } finally {
      setSubmitting(false);
    }
  }

  async function submitBulk(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("");
    setSubmitting(true);

    try {
      const response = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
          ...bulkForm,
          mode: "bulk",
          generateCode: true,
          applicableTo: "SPECIFIC_USERS",
          audienceRule: bulkRule,
          audiencePercent: Number(bulkPercent)
        })
      });
      const result = (await response.json()) as {message?: string};
      if (!response.ok) throw new Error(result.message ?? "Unable to generate bulk coupon");
      router.refresh();
      setStatus(result.message ?? "Bulk coupon generated");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to generate bulk coupon");
    } finally {
      setSubmitting(false);
    }
  }

  async function submitEdit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) return;
    setStatus("");
    setEditError("");
    setSubmitting(true);

    try {
      const response = await fetch(`/api/admin/coupons/${editing.id}`, {
        method: "PUT",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(editForm)
      });
      const result = (await response.json()) as {message?: string};
      if (!response.ok) throw new Error(result.message ?? "Unable to update coupon");
      setEditing(null);
      router.refresh();
      setStatus(result.message ?? "Coupon updated");
    } catch (error) {
      setEditError(error instanceof Error ? error.message : "Unable to update coupon");
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteCoupon() {
    if (!couponToDelete) return;

    setDeleting(true);
    setDeleteError("");

    try {
      const response = await fetch(`/api/admin/coupons/${couponToDelete.id}`, {
        method: "DELETE"
      });
      const result = (await response.json()) as {message?: string};
      if (!response.ok) throw new Error(result.message ?? "Unable to delete coupon");

      setCouponToDelete(null);
      router.refresh();
      setStatus(result.message ?? "Coupon deleted");
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : "Unable to delete coupon");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <section className="-mx-gutter -my-10 min-h-screen bg-[#fcf9f3] px-5 py-12 text-[#201B11] sm:-my-12 md:px-16 md:py-24 lg:-mx-16">
      <header className="mb-16 border-b border-[#7A6A4F] pb-8 md:mb-24">
        <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="label-caps mb-4 text-[#7A6A4F]">Discounts & Offers</p>
            <h1 className="font-serif text-[clamp(2rem,5vw,3.5rem)] leading-tight text-[#201B11]">
              Promotional Management
            </h1>
          </div>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Filter archive"
            className="w-full border-0 border-b border-[#7A6A4F] bg-transparent pb-3 text-sm uppercase tracking-[0.15em] text-[#201B11] outline-none placeholder:text-[#7c766d] focus:border-[#D4AF37] focus:ring-0 md:w-72"
          />
        </div>
      </header>

      <div className="grid grid-cols-1 gap-8 md:gap-16 lg:grid-cols-12">
        <section className="border border-[#7A6A4F]/10 bg-[#EAE4D8]/30 p-8 md:p-12 lg:col-span-7">
          <h2 className="mb-8 flex items-center gap-3 font-serif text-[2rem] leading-tight text-[#201B11]">
            <span className="flex h-5 w-5 items-center justify-center border border-[#7A6A4F] text-sm text-[#7A6A4F]">
              +
            </span>
            Create New Coupon
          </h2>
          <form onSubmit={submitCreate} className="space-y-10">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              <Field label="Code Name (Optional)">
                <input
                  value={form.code}
                  maxLength={32}
                  autoComplete="off"
                  onChange={(event) => updateForm("code", event.target.value.toUpperCase())}
                  placeholder="Leave blank to generate automatically"
                  className={inputClass()}
                />
              </Field>
              <Field label="Discount Type">
                <select
                  value={form.type}
                  onChange={(event) =>
                    updateForm("type", event.target.value as CouponFormState["type"])
                  }
                  className={inputClass()}
                >
                  <option value="PERCENTAGE">Percentage (%)</option>
                  <option value="FIXED">Fixed Amount</option>
                </select>
              </Field>
              <Field label="Value">
                <input
                  value={form.value}
                  type="number"
                  min="1"
                  max={form.type === "PERCENTAGE" ? "100" : undefined}
                  step="0.01"
                  onChange={(event) => updateForm("value", event.target.value)}
                  placeholder="20"
                  className={inputClass()}
                />
              </Field>
              <Field label="Expiry Date">
                <input
                  value={form.expiresAt}
                  type="datetime-local"
                  onChange={(event) => updateForm("expiresAt", event.target.value)}
                  className={inputClass()}
                />
              </Field>
              <Field label="Start Date">
                <input
                  value={form.startsAt}
                  type="datetime-local"
                  onChange={(event) => updateForm("startsAt", event.target.value)}
                  className={inputClass()}
                />
              </Field>
              <Field label="Maximum Uses">
                <input
                  value={form.maxUses}
                  type="number"
                  min="1"
                  placeholder="Unlimited"
                  onChange={(event) => updateForm("maxUses", event.target.value)}
                  className={inputClass()}
                />
              </Field>
              <MinimumCheckoutField
                value={form.minOrderAmount}
                onChange={(value) => updateForm("minOrderAmount", value)}
              />
            </div>
            <div className="grid gap-6">
              <label className="label-caps flex items-center gap-3 text-[#4b463e]">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(event) => updateForm("isActive", event.target.checked)}
                />
                Active in selected period
              </label>
            </div>
            <CustomerPicker
              customers={customers}
              money={money}
              applicableTo={form.applicableTo}
              selected={form.userIds}
              onAudienceChange={(value) => updateForm("applicableTo", value)}
              onChange={(value) => updateForm("userIds", value)}
            />
            <button
              type="submit"
              disabled={submitting}
              className="label-caps inline-flex min-h-14 w-full items-center justify-center gap-2 bg-[#201B11] px-8 py-4 text-[#F9F6F0] transition-colors hover:bg-[#D4AF37] disabled:opacity-50 md:w-auto"
            >
              {submitting ? "Saving..." : "Create Coupon"} <span aria-hidden="true">→</span>
            </button>
          </form>
        </section>

        <section className="lg:col-span-5">
          <form onSubmit={submitBulk} className="flex h-full flex-col justify-between">
            <div>
              <h2 className="mb-6 border-b border-[#7A6A4F]/30 pb-4 font-serif text-[2rem] leading-tight text-[#201B11]">
                Bulk Engine
              </h2>
              <p className="mb-8 max-w-md text-base leading-7 text-[#4b463e]">
                Apply blanket discounts across designated client tiers to stimulate acquisition or
                reward loyalty.
              </p>
              <div className="space-y-8">
              <Field label="Target Cohort">
                <select
                  value={bulkRule}
                  onChange={(event) =>
                    setBulkRule(event.target.value as "TOP_SPEND" | "TOP_ORDERS")
                  }
                  className={inputClass()}
                >
                  <option value="TOP_SPEND">Top paying customers</option>
                  <option value="TOP_ORDERS">Top customers by order count</option>
                </select>
              </Field>
              <Field label="Top Percent">
                <input
                  value={bulkPercent}
                  type="number"
                  min="1"
                  max="100"
                  onChange={(event) => setBulkPercent(event.target.value)}
                  className={inputClass()}
                />
              </Field>
              <div className="grid gap-6 sm:grid-cols-2">
                <Field label="Discount Type">
                  <select
                    value={bulkForm.type}
                    onChange={(event) =>
                      updateBulkForm(
                        "type",
                        event.target.value as BulkCouponFormState["type"]
                      )
                    }
                    className={inputClass()}
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED">Fixed Amount</option>
                  </select>
                </Field>
                <Field label="Discount Value">
                  <input
                    value={bulkForm.value}
                    type="number"
                    min="1"
                    max={bulkForm.type === "PERCENTAGE" ? "100" : undefined}
                    step="0.01"
                    onChange={(event) => updateBulkForm("value", event.target.value)}
                    className={inputClass()}
                  />
                </Field>
              </div>
              <div className="grid gap-6 sm:grid-cols-2">
                <MinimumCheckoutField
                  value={bulkForm.minOrderAmount}
                  onChange={(value) => updateBulkForm("minOrderAmount", value)}
                />
                <Field label="Maximum Uses">
                  <input
                    value={bulkForm.maxUses}
                    type="number"
                    min="1"
                    placeholder="Unlimited"
                    onChange={(event) => updateBulkForm("maxUses", event.target.value)}
                    className={inputClass()}
                  />
                </Field>
              </div>
              <div className="grid gap-6 sm:grid-cols-2">
                <Field label="Starts At">
                  <input
                    value={bulkForm.startsAt}
                    type="datetime-local"
                    onChange={(event) => updateBulkForm("startsAt", event.target.value)}
                    className={inputClass()}
                  />
                </Field>
                <Field label="Ends At">
                  <input
                    value={bulkForm.expiresAt}
                    type="datetime-local"
                    onChange={(event) => updateBulkForm("expiresAt", event.target.value)}
                    className={inputClass()}
                  />
                </Field>
              </div>
              <label className="label-caps flex items-center gap-3 text-[#4b463e]">
                <input
                  type="checkbox"
                  checked={bulkForm.isActive}
                  onChange={(event) => updateBulkForm("isActive", event.target.checked)}
                />
                Active in selected period
              </label>
            </div>
            <div className="mt-8 border border-[#7A6A4F]/20 bg-white/35 p-4">
              <p className="label-caps mb-3 text-[#7A6A4F]">
                Matching Customers: {predictedBulkUsers.length}
              </p>
              <div className="max-h-40 space-y-2 overflow-y-auto pr-2">
                {predictedBulkUsers.length ? (
                  predictedBulkUsers.map((customer) => (
                    <p key={customer.id} className="text-sm text-[#4b463e]">
                      {customer.name ?? customer.email} · {customer.orderCount} orders ·{" "}
                      {money.format(customer.totalSpent)}
                    </p>
                  ))
                ) : (
                  <p className="text-sm text-[#7c766d]">No customers match this cohort yet.</p>
                )}
              </div>
            </div>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="label-caps mt-12 inline-flex min-h-14 w-full items-center justify-center gap-2 border border-[#201B11] bg-transparent px-8 py-4 text-[#201B11] transition-colors hover:bg-[#EAE4D8] disabled:opacity-50"
            >
            Execute Bulk Action <span aria-hidden="true">↯</span>
            </button>
          </form>
        </section>
      </div>

      {status ? <p className="mt-8 text-sm text-[#735c00]">{status}</p> : null}

      <hr className="my-20 border-[#7A6A4F] opacity-50 md:my-32" />

      <section>
        <div className="mb-8 flex items-end justify-between gap-6">
          <h2 className="font-serif text-[2rem] leading-tight text-[#201B11]">Archive</h2>
          <span className="label-caps text-[#7A6A4F]">Filter</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] border-collapse text-left">
            <thead>
              <tr className="border-b-2 border-[#201B11]">
                {["Code", "Type", "Value", "Audience", "Usage", "Status", "Actions"].map(
                  (head) => (
                    <th
                      key={head}
                      className={`label-caps pb-4 text-[#7A6A4F] ${
                        head === "Actions" ? "pr-4 text-right" : "pl-4"
                      }`}
                    >
                      {head}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#7A6A4F]/20 text-base text-[#201B11]">
              {filteredCoupons.map((coupon) => {
                const currentStatus = statusFor(coupon);
                return (
                  <tr key={coupon.id} className="group transition-colors hover:bg-[#EAE4D8]/20">
                    <td className="py-6 pl-4 font-semibold">{coupon.code}</td>
                    <td className="py-6 pl-4 text-[#4b463e]">
                      {coupon.type === "PERCENTAGE" ? "Percentage" : "Fixed"}
                    </td>
                    <td className="py-6 pl-4">
                      {coupon.type === "PERCENTAGE"
                        ? `${Number(coupon.value)}%`
                        : money.format(Number(coupon.value))}
                    </td>
                    <td className="py-6 pl-4 text-[#4b463e]">
                      {coupon.applicableTo === "ALL"
                        ? "All customers"
                        : `${coupon.users.length} customers`}
                    </td>
                    <td className="py-6 pl-4 text-[#4b463e]">
                      {coupon.usedCount}
                      {coupon.maxUses ? ` / ${coupon.maxUses}` : " / unlimited"}
                    </td>
                    <td className="py-6 pl-4">
                      <span className="inline-flex items-center gap-2 text-[#7c766d]">
                        <span className={`h-2 w-2 ${statusTone(currentStatus)}`} />
                        {currentStatus}
                      </span>
                    </td>
                    <td className="py-6 pr-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(coupon)}
                          className="label-caps min-h-9 border border-[#7A6A4F] px-4 text-[#4b463e] transition-colors hover:border-[#201B11] hover:bg-[#EAE4D8] hover:text-[#201B11]"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDeleteError("");
                            setCouponToDelete(coupon);
                          }}
                          className="label-caps min-h-9 border border-red-700 px-4 text-red-700 transition-colors hover:bg-red-700 hover:text-white"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filteredCoupons.length === 0 ? (
          <p className="py-10 text-center text-sm text-[#7c766d]">No coupons found.</p>
        ) : null}
      </section>

      {editing ? (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center overflow-y-auto bg-[#201B11]/45 p-4 backdrop-blur-sm sm:p-8"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !submitting) setEditing(null);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="coupon-editor-title"
            className="max-h-[calc(100vh-2rem)] w-full max-w-3xl overflow-y-auto border border-[#7A6A4F]/30 bg-[#fcf9f3] p-8 text-[#201B11] shadow-[0_24px_90px_rgba(32,27,17,0.28)]"
          >
            <div className="mb-8 flex items-start justify-between gap-4">
              <div>
                <p className="label-caps mb-2 text-[#7A6A4F]">Coupon Editor</p>
                <h2 id="coupon-editor-title" className="font-serif text-4xl leading-tight">{editing.code}</h2>
              </div>
              <button type="button" aria-label="Close coupon editor" onClick={() => setEditing(null)} className="text-2xl text-[#7A6A4F]">
                x
              </button>
            </div>
            <form onSubmit={submitEdit} className="space-y-8">
              <div className="grid gap-6 sm:grid-cols-2">
                <Field label="Coupon Code">
                  <input
                    value={editForm.code}
                    onChange={(event) => updateEditForm("code", event.target.value)}
                    className={inputClass()}
                  />
                </Field>
                <Field label="Discount Type">
                  <select
                    value={editForm.type}
                    onChange={(event) =>
                      updateEditForm("type", event.target.value as CouponFormState["type"])
                    }
                    className={inputClass()}
                  >
                    <option value="PERCENTAGE">Percentage</option>
                    <option value="FIXED">Fixed amount</option>
                  </select>
                </Field>
                <Field label="Discount Value">
                  <input
                    value={editForm.value}
                    type="number"
                    min="1"
                    max={editForm.type === "PERCENTAGE" ? "100" : undefined}
                    step="0.01"
                    onChange={(event) => updateEditForm("value", event.target.value)}
                    className={inputClass()}
                  />
                </Field>
                <Field label="Maximum Uses">
                  <input
                    value={editForm.maxUses}
                    type="number"
                    min="1"
                    placeholder="Unlimited"
                    onChange={(event) => updateEditForm("maxUses", event.target.value)}
                    className={inputClass()}
                  />
                </Field>
                <Field label="Starts At">
                  <input
                    value={editForm.startsAt}
                    type="datetime-local"
                    onChange={(event) => updateEditForm("startsAt", event.target.value)}
                    className={inputClass()}
                  />
                </Field>
                <Field label="Ends At">
                  <input
                    value={editForm.expiresAt}
                    type="datetime-local"
                    onChange={(event) => updateEditForm("expiresAt", event.target.value)}
                    className={inputClass()}
                  />
                </Field>
                <MinimumCheckoutField
                  value={editForm.minOrderAmount}
                  onChange={(value) => updateEditForm("minOrderAmount", value)}
                />
                <Field label="Status">
                  <label className="label-caps flex min-h-12 items-center gap-3 text-[#4b463e]">
                    <input
                      type="checkbox"
                      checked={editForm.isActive}
                      onChange={(event) => updateEditForm("isActive", event.target.checked)}
                    />
                    Active / re-enabled
                  </label>
                </Field>
              </div>
              <CustomerPicker
                customers={customers}
                money={money}
                applicableTo={editForm.applicableTo}
                selected={editForm.userIds}
                onAudienceChange={(value) => updateEditForm("applicableTo", value)}
                onChange={(value) => updateEditForm("userIds", value)}
              />
              {editError ? <p role="alert" className="text-sm text-red-700">{editError}</p> : null}
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  className="label-caps min-h-12 border border-[#201B11] px-6 text-[#201B11] hover:bg-[#EAE4D8]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="label-caps min-h-12 bg-[#201B11] px-6 text-[#F9F6F0] hover:bg-[#D4AF37] disabled:opacity-50"
                >
                  {submitting ? "Saving..." : "Save / Re-enable"}
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}

      <Modal
        isOpen={Boolean(couponToDelete)}
        title="Delete Coupon"
        onClose={() => {
          if (!deleting) setCouponToDelete(null);
        }}
      >
        <div className="space-y-6">
          <p className="text-sm leading-6 text-on-surface/80">
            Are you sure you want to permanently delete &ldquo;{couponToDelete?.code}&rdquo;? Existing
            order totals will be preserved, but this coupon can no longer be used.
          </p>
          {deleteError ? <p role="alert" className="text-sm text-red-400">{deleteError}</p> : null}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => setCouponToDelete(null)}
              disabled={deleting}
              className="label-caps min-h-11 border border-outline px-6 text-parchment transition-colors hover:bg-surface-mid disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={deleteCoupon}
              disabled={deleting}
              className="label-caps min-h-11 border border-red-500 bg-red-600 px-6 text-white shadow-[0_8px_24px_rgba(220,38,38,0.25)] transition-colors hover:border-red-400 hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-400 disabled:cursor-not-allowed disabled:border-red-900 disabled:bg-red-950 disabled:text-red-300 disabled:shadow-none disabled:opacity-70"
            >
              {deleting ? "Deleting..." : "Yes, Delete"}
            </button>
          </div>
        </div>
      </Modal>
    </section>
  );
}

function CustomerPicker({
  customers,
  money,
  applicableTo,
  selected,
  onAudienceChange,
  onChange
}: {
  customers: Customer[];
  money: Intl.NumberFormat;
  applicableTo: "ALL" | "SPECIFIC_USERS";
  selected: string[];
  onAudienceChange: (value: "ALL" | "SPECIFIC_USERS") => void;
  onChange: (value: string[]) => void;
}) {
  const [query, setQuery] = useState("");
  const filtered = customers
    .filter((customer) =>
      `${customer.name ?? ""} ${customer.email}`.toLowerCase().includes(query.toLowerCase())
    )
    .slice(0, 30);

  function toggle(id: string) {
    onChange(selected.includes(id) ? selected.filter((item) => item !== id) : [...selected, id]);
  }

  return (
    <div className="border border-[#7A6A4F]/20 bg-white/35 p-4">
      <div className="mb-4 grid gap-6 sm:grid-cols-2">
        <Field label="Audience">
          <select
            value={applicableTo}
            onChange={(event) => onAudienceChange(event.target.value as "ALL" | "SPECIFIC_USERS")}
            className={inputClass()}
          >
            <option value="ALL">All customers</option>
            <option value="SPECIFIC_USERS">Specific customers</option>
          </select>
        </Field>
        <Field label="Find Customers">
          <input
            value={query}
            disabled={applicableTo === "ALL"}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Name or email"
            className={inputClass()}
          />
        </Field>
      </div>
      {applicableTo === "SPECIFIC_USERS" ? (
        <div className="max-h-56 space-y-2 overflow-y-auto pr-2">
          {filtered.map((customer) => (
            <label
              key={customer.id}
              className="flex items-center justify-between gap-4 border border-[#7A6A4F]/20 px-3 py-2 text-sm"
            >
              <span>
                <span className="block text-[#201B11]">{customer.name ?? customer.email}</span>
                <span className="text-xs text-[#7c766d]">
                  {customer.email} · {customer.orderCount} orders ·{" "}
                  {money.format(customer.totalSpent)}
                </span>
              </span>
              <input
                type="checkbox"
                checked={selected.includes(customer.id)}
                onChange={() => toggle(customer.id)}
              />
            </label>
          ))}
        </div>
      ) : null}
    </div>
  );
}
