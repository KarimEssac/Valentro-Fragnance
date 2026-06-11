"use client";

import {useLocale} from "next-intl";
import Image from "next/image";
import Link from "next/link";
import type {FormEvent} from "react";
import {useEffect, useMemo, useState} from "react";

type CartItem = {
  fragranceId: string;
  variantId: string;
  slug: string;
  name: string;
  image: string | null;
  sizeML: number;
  price: string;
  quantity: number;
};

type CheckoutForm = {
  email: string;
  firstName: string;
  lastName: string;
  address: string;
  apartment: string;
  city: string;
  governorate: string;
  postalCode: string;
  phone: string;
  notes: string;
};

const governorates = [
  "Cairo",
  "Giza",
  "Alexandria",
  "Dakahlia",
  "Red Sea",
  "Beheira",
  "Faiyum",
  "Gharbia",
  "Ismailia",
  "Monufia",
  "Minya",
  "Qalyubia",
  "New Valley",
  "Suez",
  "Aswan",
  "Asyut",
  "Beni Suef",
  "Port Said",
  "Damietta",
  "Sharqia",
  "South Sinai",
  "Kafr El Sheikh",
  "Matruh",
  "Luxor",
  "Qena",
  "North Sinai",
  "Sohag"
];

const initialForm: CheckoutForm = {
  email: "",
  firstName: "",
  lastName: "",
  address: "",
  apartment: "",
  city: "",
  governorate: "",
  postalCode: "",
  phone: "",
  notes: ""
};

function readCart() {
  try {
    return JSON.parse(
      window.localStorage.getItem("valentro-cart") ?? "[]"
    ) as CartItem[];
  } catch {
    return [];
  }
}

function cleanText(value: string, maxLength: number) {
  return value.replace(/[<>{}[\]$;'"`|\\]/g, "").slice(0, maxLength);
}

function cleanName(value: string, maxLength: number) {
  return cleanText(value, maxLength)
    .replace(/[^\p{L}\s-]/gu, "")
    .replace(/\s+/g, " ");
}

function cleanPhone(value: string) {
  return value.replace(/[^\d+\s-]/g, "").slice(0, 18);
}

function cleanPostal(value: string) {
  return value.replace(/[^0-9-]/g, "").slice(0, 12);
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  autoComplete,
  maxLength,
  required = true,
  inputMode
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  autoComplete?: string;
  maxLength: number;
  required?: boolean;
  inputMode?: "email" | "numeric" | "tel" | "text";
}) {
  return (
    <label className="block">
      <span className="label-caps text-on-surface/75">{label}</span>
      <input
        required={required}
        type={type}
        value={value}
        maxLength={maxLength}
        autoComplete={autoComplete}
        inputMode={inputMode}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1.5 h-10 w-full border-0 border-b border-outline bg-surface-hi px-3 text-sm text-parchment outline-none transition-colors placeholder:text-on-surface/45 focus:border-gold"
      />
    </label>
  );
}

export default function CheckoutClient() {
  const locale = useLocale();
  const [items, setItems] = useState<CartItem[]>(() =>
    typeof window === "undefined" ? [] : readCart()
  );
  const [form, setForm] = useState<CheckoutForm>(initialForm);
  const [csrfToken, setCsrfToken] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [status, setStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderId, setOrderId] = useState("");

  const priceFormatter = useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        style: "currency",
        currency: "EGP",
        maximumFractionDigits: 0
      }),
    [locale]
  );

  useEffect(() => {
    async function loadCheckoutContext() {
      const [csrfResponse, sessionResponse] = await Promise.all([
        fetch("/api/orders/csrf", {headers: {Accept: "application/json"}}),
        fetch("/api/auth/session", {headers: {Accept: "application/json"}})
      ]);
      const csrfData = (await csrfResponse.json()) as {token?: string};
      const sessionData = (await sessionResponse.json()) as {
        user?: {email?: string; name?: string};
      };

      if (sessionData.user?.email) {
        setIsLoggedIn(true);
      }
      setCsrfToken(csrfData.token ?? "");
      setForm((current) => ({
        ...current,
        email: sessionData.user?.email ?? current.email,
        firstName:
          sessionData.user?.name?.split(" ")[0] ?? current.firstName,
        lastName:
          sessionData.user?.name?.split(" ").slice(1).join(" ") ??
          current.lastName
      }));
    }

    loadCheckoutContext().catch(() => {
      setStatus("Checkout security token could not be loaded.");
    });
  }, []);

  const subtotal = items.reduce(
    (total, item) => total + Number(item.price) * item.quantity,
    0
  );

  function updateField<FieldName extends keyof CheckoutForm>(
    field: FieldName,
    value: string
  ) {
    const cleaned =
      field === "firstName" || field === "lastName" || field === "city"
        ? cleanName(value, field === "city" ? 50 : 40)
        : field === "phone"
          ? cleanPhone(value)
            : field === "postalCode"
              ? cleanPostal(value)
              : cleanText(
                  value,
                  field === "address"
                    ? 120
                    : field === "apartment"
                      ? 80
                      : field === "notes"
                        ? 300
                        : 120
                );

    setForm((current) => ({...current, [field]: cleaned}));
  }

  async function submitOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (items.length === 0) return;

    setIsSubmitting(true);
    setStatus("");

    const response = await fetch("/api/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify({
        ...form,
        csrfToken,
        paymentMethod: "CASH_ON_DELIVERY",
        billingAddress: "same",
        items: items.map((item) => ({
          variantId: item.variantId,
          quantity: item.quantity
        }))
      })
    });
    const data = (await response.json()) as {
      message?: string;
      orderId?: string;
    };

    setIsSubmitting(false);

    if (!response.ok) {
      setStatus(data.message ?? "Unable to complete purchase.");
      return;
    }

    window.localStorage.removeItem("valentro-cart");
    window.dispatchEvent(new Event("valentro-cart-updated"));
    setItems([]);
    setOrderId(data.orderId ?? "");
    setStatus("Order placed. We will contact you to confirm delivery.");
  }

  if (orderId) {
    return (
      <main className="min-h-screen bg-bg px-gutter pb-20 pt-[104px] text-parchment sm:pt-36 lg:px-16">
        <section className="mx-auto max-w-2xl border border-outline bg-surface px-6 py-10 text-center">
          <p className="label-caps text-gold">Order Confirmed</p>
          <h1 className="mt-3 font-serif text-4xl leading-tight sm:text-5xl">
            Thank you for your purchase
          </h1>
          <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-on-surface/75">
            Your order number is {orderId}. A Valentro advisor will contact you
            before dispatch.
          </p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href={`/${locale}/orders/${orderId}`}
              className="label-caps inline-flex min-h-11 items-center justify-center border border-parchment bg-parchment px-7 text-surface-hi transition-colors hover:border-gold hover:bg-gold"
            >
              Track Order
            </Link>
            <Link
              href={`/${locale}/fragrances`}
              className="label-caps inline-flex min-h-11 items-center justify-center border border-outline px-7 text-parchment transition-colors hover:border-gold hover:text-gold"
            >
              Continue Shopping
            </Link>
          </div>
        </section>
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <main className="min-h-screen bg-bg px-gutter pb-20 pt-[104px] text-parchment sm:pt-36 lg:px-16">
        <section className="mx-auto max-w-2xl border border-outline bg-surface px-6 py-10 text-center">
          <p className="label-caps text-gold">Checkout</p>
          <h1 className="mt-3 font-serif text-4xl leading-tight sm:text-5xl">
            Your cart is empty
          </h1>
          <Link
            href={`/${locale}/fragrances`}
            className="label-caps mt-7 inline-flex min-h-11 items-center justify-center border border-parchment bg-parchment px-7 text-surface-hi transition-colors hover:border-gold hover:bg-gold"
          >
            Shop Fragrances
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-bg px-gutter pb-16 pt-[96px] text-parchment sm:pt-32 lg:px-16">
      <div className="mx-auto grid max-w-container gap-6 lg:grid-cols-[minmax(0,1fr)_390px] lg:items-start lg:gap-10">
        <form id="checkout-form" onSubmit={submitOrder} className="space-y-7">
          <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-on-surface/70">
            <Link href={`/${locale}/cart`} className="hover:text-gold">
              Cart
            </Link>
            <span>/</span>
            <span className="text-parchment">Information & Payment</span>
          </div>

          <section className="space-y-4">
            <div className="flex items-end justify-between gap-4">
              <h1 className="font-serif text-4xl leading-tight sm:text-5xl">
                Checkout
              </h1>
              {!isLoggedIn && (
                <Link
                  href={`/${locale}/login?callbackUrl=/${locale}/checkout`}
                  className="label-caps border-b border-outline pb-1 text-on-surface/75 hover:border-gold hover:text-gold"
                >
                  Log in
                </Link>
              )}
            </div>
            <Field
              label="Email Address"
              type="email"
              inputMode="email"
              autoComplete="email"
              value={form.email}
              maxLength={120}
              onChange={(value) => updateField("email", value)}
            />
          </section>

          <section className="space-y-4">
            <h2 className="font-serif text-3xl leading-tight sm:text-4xl">
              Delivery
            </h2>
            <label className="block">
              <span className="label-caps text-on-surface/75">
                Country/Region
              </span>
              <select
                disabled
                className="mt-1.5 h-10 w-full border-0 border-b border-outline bg-surface-hi px-3 text-sm text-parchment outline-none"
              >
                <option>Egypt</option>
              </select>
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="First Name"
                autoComplete="given-name"
                value={form.firstName}
                maxLength={40}
                onChange={(value) => updateField("firstName", value)}
              />
              <Field
                label="Last Name"
                autoComplete="family-name"
                value={form.lastName}
                maxLength={40}
                onChange={(value) => updateField("lastName", value)}
              />
            </div>
            <Field
              label="Address"
              autoComplete="address-line1"
              value={form.address}
              maxLength={120}
              onChange={(value) => updateField("address", value)}
            />
            <Field
              label="Apartment, suite, etc. (optional)"
              autoComplete="address-line2"
              required={false}
              value={form.apartment}
              maxLength={80}
              onChange={(value) => updateField("apartment", value)}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="City"
                autoComplete="address-level2"
                value={form.city}
                maxLength={50}
                onChange={(value) => updateField("city", value)}
              />
              <label className="block">
                <span className="label-caps text-on-surface/75">
                  Governorate
                </span>
                <select
                  required
                  value={form.governorate}
                  autoComplete="address-level1"
                  onChange={(event) =>
                    updateField("governorate", event.target.value)
                  }
                  className="mt-1.5 h-10 w-full border-0 border-b border-outline bg-surface-hi px-3 text-sm text-parchment outline-none focus:border-gold"
                >
                  <option value="">Select Governorate</option>
                  {governorates.map((governorate) => (
                    <option key={governorate} value={governorate}>
                      {governorate}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Postal Code (optional)"
                autoComplete="postal-code"
                required={false}
                inputMode="numeric"
                value={form.postalCode}
                maxLength={12}
                onChange={(value) => updateField("postalCode", value)}
              />
              <Field
                label="Phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={form.phone}
                maxLength={18}
                onChange={(value) => updateField("phone", value)}
              />
            </div>
            <label className="block">
              <span className="label-caps text-on-surface/75">
                Additional Instructions (optional)
              </span>
              <textarea
                value={form.notes}
                maxLength={300}
                rows={3}
                onChange={(event) => updateField("notes", event.target.value)}
                className="mt-1.5 min-h-24 w-full resize-y border-0 border-b border-outline bg-surface-hi px-3 py-2 text-sm leading-6 text-parchment outline-none transition-colors placeholder:text-on-surface/45 focus:border-gold"
              />
            </label>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-3xl leading-tight sm:text-4xl">
              Payment
            </h2>
            <p className="text-sm text-on-surface/75">
              All transactions are secure and encrypted.
            </p>
            <div className="border border-outline/70 bg-surface">
              <label className="flex min-h-12 items-center gap-3 border-b border-outline/60 px-4 text-sm">
                <input
                  type="radio"
                  name="paymentMethod"
                  checked
                  readOnly
                  className="h-4 w-4 accent-parchment"
                />
                Cash on Delivery (COD)
              </label>
              <label className="flex min-h-12 cursor-not-allowed items-center justify-between gap-3 px-4 text-sm text-on-surface/55">
                <span className="flex items-center gap-3">
                  <input type="radio" disabled className="h-4 w-4" />
                  Instapay
                </span>
                <span className="label-caps border border-outline px-2 py-1 text-[10px] text-gold">
                  Soon
                </span>
              </label>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-3xl leading-tight sm:text-4xl">
              Billing Address
            </h2>
            <div className="border border-outline/70 bg-surface">
              <label className="flex min-h-12 items-center gap-3 border-b border-outline/60 px-4 text-sm">
                <input
                  type="radio"
                  name="billingAddress"
                  checked
                  readOnly
                  className="h-4 w-4 accent-parchment"
                />
                Same as shipping address
              </label>
              <label className="flex min-h-12 cursor-not-allowed items-center justify-between gap-3 px-4 text-sm text-on-surface/55">
                <span className="flex items-center gap-3">
                  <input type="radio" disabled className="h-4 w-4" />
                  Use a different billing address
                </span>
                <span className="label-caps border border-outline px-2 py-1 text-[10px] text-gold">
                  Soon
                </span>
              </label>
            </div>
          </section>

          {status ? (
            <p className="border border-outline bg-surface px-4 py-3 text-sm text-on-surface">
              {status}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting || !csrfToken}
            className="label-caps flex min-h-12 w-full items-center justify-center border border-parchment bg-parchment px-8 text-surface-hi transition-colors hover:border-gold hover:bg-gold disabled:cursor-not-allowed disabled:opacity-60 lg:hidden"
          >
            {isSubmitting ? "Placing Order..." : "Complete Purchase"}
          </button>
        </form>

        <aside className="border border-outline bg-surface p-5 lg:sticky lg:top-28">
          <h2 className="font-serif text-3xl leading-tight">Order Summary</h2>
          <div className="mt-5 space-y-4 border-b border-outline/60 pb-5">
            {items.map((item) => (
              <div key={item.variantId} className="flex items-center gap-3">
                <div className="relative h-16 w-14 shrink-0 border border-outline bg-surface-mid">
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  ) : null}
                  <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-parchment text-[10px] font-semibold text-surface-hi">
                    {item.quantity}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold uppercase tracking-[0.08em]">
                    {item.name}
                  </p>
                  <p className="mt-0.5 text-xs text-on-surface/70">
                    {item.sizeML}ml
                  </p>
                </div>
                <p className="text-sm text-parchment">
                  {priceFormatter.format(Number(item.price) * item.quantity)}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-5 space-y-3 border-b border-outline/60 pb-5 text-sm text-on-surface/75">
            <div className="flex justify-between gap-4">
              <span>Subtotal</span>
              <span className="text-parchment">
                {priceFormatter.format(subtotal)}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span>Shipping</span>
              <span className="label-caps text-[10px] text-parchment">
                Complimentary
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span>Estimated Taxes</span>
              <span className="text-parchment">{priceFormatter.format(0)}</span>
            </div>
          </div>
          <div className="mt-5 flex items-end justify-between gap-4">
            <span className="label-caps text-on-surface/75">Total</span>
            <span className="font-serif text-4xl leading-none">
              {priceFormatter.format(subtotal)}
            </span>
          </div>
          <button
            type="submit"
            form="checkout-form"
            disabled={isSubmitting || !csrfToken}
            className="label-caps mt-6 hidden min-h-12 w-full items-center justify-center border border-parchment bg-parchment px-8 text-surface-hi transition-colors hover:border-gold hover:bg-gold disabled:cursor-not-allowed disabled:opacity-60 lg:flex"
          >
            {isSubmitting ? "Placing Order..." : "Complete Purchase"}
          </button>
          <Link
            href={`/${locale}/cart`}
            className="label-caps mt-3 flex min-h-10 w-full items-center justify-center border border-outline text-parchment transition-colors hover:border-gold hover:text-gold"
          >
            Return to Cart
          </Link>
        </aside>
      </div>
    </main>
  );
}
