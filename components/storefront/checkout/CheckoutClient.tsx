"use client";

import {useLocale} from "next-intl";
import Image from "next/image";
import Link from "next/link";
import type {FormEvent} from "react";
import {useEffect, useMemo, useState} from "react";

import {
  cartOriginalSubtotal,
  cartSubtotal,
  mergeCartPricing,
  readCartItems,
  requestCartPricing,
  writeCartItems,
  type CartItem,
  type CartPricingQuote
} from "@/lib/cart-items";
import {productDiscountBadge} from "@/lib/product-discounts";

type CheckoutDiscount = {
  code: string;
  type: "PERCENTAGE" | "FIXED";
  value: string;
  discountAmount: number;
  source: "ACCOUNT" | "COUPON";
};

type CheckoutDiscountSelection = {
  source: "PRODUCT" | "ACCOUNT" | "COUPON";
  discountAmount: number;
  code: string | null;
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

type MissingField = {
  field: keyof CheckoutForm;
  label: string;
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
  id,
  label,
  value,
  onChange,
  type = "text",
  autoComplete,
  maxLength,
  required = true,
  inputMode
}: {
  id: string;
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
        id={id}
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
    typeof window === "undefined" ? [] : readCartItems()
  );
  const [form, setForm] = useState<CheckoutForm>(initialForm);
  const [csrfToken, setCsrfToken] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [status, setStatus] = useState("");
  const [missingFields, setMissingFields] = useState<MissingField[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [checkoutDiscount, setCheckoutDiscount] = useState<CheckoutDiscount | null>(null);
  const [couponInput, setCouponInput] = useState("");
  const [appliedCouponCode, setAppliedCouponCode] = useState("");
  const [couponOpen, setCouponOpen] = useState(false);
  const [discountMessage, setDiscountMessage] = useState("");
  const [discountMessageIsError, setDiscountMessageIsError] = useState(false);
  const [discountLoading, setDiscountLoading] = useState(false);
  const [discountRequestVersion, setDiscountRequestVersion] = useState(0);

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

  useEffect(() => {
    const controller = new AbortController();
    const storedItems = readCartItems();

    if (storedItems.length > 0) {
      requestCartPricing(storedItems, controller.signal)
        .then((pricing) => {
          setItems((current) => {
            const nextItems = mergeCartPricing(current, pricing);
            writeCartItems(nextItems, false);
            return nextItems;
          });
        })
        .catch((error) => {
          if (!(error instanceof Error && error.name === "AbortError")) {
            setStatus("Current product prices will be verified before purchase.");
          }
        });
    }

    return () => controller.abort();
  }, []);

  const subtotal = cartSubtotal(items);
  const originalSubtotal = cartOriginalSubtotal(items);
  const productSavings = Math.max(0, originalSubtotal - subtotal);
  const pricingRequestItems = JSON.stringify(
    items.map(({variantId, quantity}) => ({variantId, quantity}))
  );
  const displayedDiscount = subtotal > 0 ? checkoutDiscount : null;
  const discountAmount = displayedDiscount?.discountAmount ?? 0;
  const total = Math.max(0, subtotal - discountAmount);

  useEffect(() => {
    const controller = new AbortController();
    const normalizedEmail = form.email.trim().toLowerCase();

    if (!csrfToken || pricingRequestItems === "[]") {
      return () => controller.abort();
    }

    const timer = window.setTimeout(
      () => {
        setDiscountLoading(true);

        fetch("/api/orders/discount", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json"
          },
          body: JSON.stringify({
            csrfToken,
            items: JSON.parse(pricingRequestItems) as {
              variantId: string;
              quantity: number;
            }[],
            email: normalizedEmail,
            couponCode: appliedCouponCode
          }),
          signal: controller.signal
        })
          .then(async (response) => {
            const data = (await response.json()) as {
              discount?: CheckoutDiscount | null;
              selection?: CheckoutDiscountSelection | null;
              pricing?: CartPricingQuote;
              message?: string;
            };

            if (data.pricing) {
              setItems((current) => {
                const nextItems = mergeCartPricing(current, data.pricing as CartPricingQuote);
                writeCartItems(nextItems, false);
                return nextItems;
              });
            }

            if (data.discount !== undefined) {
              setCheckoutDiscount(data.discount ?? null);
            }

            if (!response.ok) {
              throw new Error(data.message ?? "Unable to apply this discount");
            }

            if (appliedCouponCode) setDiscountMessageIsError(false);
            setDiscountMessage((current) => {
              if (appliedCouponCode) {
                if (data.selection?.source === "COUPON") {
                  return `Coupon ${appliedCouponCode} gives the biggest saving and was applied.`;
                }
                if (data.selection?.source === "ACCOUNT") {
                  return `Coupon ${appliedCouponCode} is valid, but your bulk discount saves more. Only the bulk discount was applied.`;
                }
                if (data.selection?.source === "PRODUCT") {
                  return `Coupon ${appliedCouponCode} is valid, but the product discount gives the best price. Only the product discount was applied.`;
                }
              }
              if (data.selection?.source === "ACCOUNT") {
                return current || "Your bulk discount gives the biggest saving and was applied automatically.";
              }
              return current;
            });
          })
          .catch((error) => {
            if (error instanceof Error && error.name === "AbortError") return;
            if (appliedCouponCode) setAppliedCouponCode("");
            setDiscountMessageIsError(true);
            setDiscountMessage(
              error instanceof Error ? error.message : "Unable to apply this discount"
            );
          })
          .finally(() => {
            if (!controller.signal.aborted) setDiscountLoading(false);
          });
      },
      appliedCouponCode ? 0 : 450
    );

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [appliedCouponCode, csrfToken, discountRequestVersion, form.email, pricingRequestItems]);

  function applyCoupon() {
    const code = couponInput.trim().toUpperCase();

    if (!code) {
      setDiscountMessageIsError(true);
      setDiscountMessage("Enter a coupon code first.");
      return;
    }

    setCouponInput(code);
    setAppliedCouponCode(code);
    setDiscountMessageIsError(false);
    setDiscountMessage("");
    setDiscountRequestVersion((version) => version + 1);
  }

  function removeCoupon() {
    setCouponInput("");
    setAppliedCouponCode("");
    setCheckoutDiscount(null);
    setDiscountMessageIsError(false);
    setDiscountMessage("");
    setDiscountRequestVersion((version) => version + 1);
  }

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
    if (field === "email") {
      setCheckoutDiscount(null);
      setDiscountMessageIsError(false);
      setDiscountMessage("");
      setDiscountLoading(false);
    }
    setMissingFields((current) =>
      current.filter((item) => item.field !== field)
    );
  }

  function getMissingFields() {
    const checks: MissingField[] = [];
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(form.email.trim())) {
      checks.push({field: "email", label: "Email address"});
    }
    if (form.firstName.trim().length < 2) {
      checks.push({field: "firstName", label: "First name"});
    }
    if (form.lastName.trim().length < 2) {
      checks.push({field: "lastName", label: "Last name"});
    }
    if (form.address.trim().length < 5) {
      checks.push({field: "address", label: "Address"});
    }
    if (form.city.trim().length < 2) {
      checks.push({field: "city", label: "City"});
    }
    if (!form.governorate.trim()) {
      checks.push({field: "governorate", label: "Governorate"});
    }
    if (form.phone.replace(/[^\d]/g, "").length < 8) {
      checks.push({field: "phone", label: "Phone"});
    }

    return checks;
  }

  function focusMissingField(field: keyof CheckoutForm) {
    window.requestAnimationFrame(() => {
      const element = document.getElementById(`checkout-${field}`);

      element?.scrollIntoView({behavior: "smooth", block: "center"});
      if (
        element instanceof HTMLInputElement ||
        element instanceof HTMLSelectElement ||
        element instanceof HTMLTextAreaElement
      ) {
        element.focus({preventScroll: true});
      }
    });
  }

  async function submitOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (items.length === 0) return;

    const nextMissingFields = getMissingFields();

    if (nextMissingFields.length > 0) {
      setMissingFields(nextMissingFields);
      setStatus("Complete the missing checkout details.");
      focusMissingField(nextMissingFields[0].field);
      return;
    }

    setIsSubmitting(true);
    setStatus("");
    setMissingFields([]);

    const response = await fetch("/api/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify({
        ...form,
        csrfToken,
        couponCode: appliedCouponCode,
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
        <form id="checkout-form" onSubmit={submitOrder} noValidate className="space-y-7">
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
              id="checkout-email"
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
                id="checkout-firstName"
                label="First Name"
                autoComplete="given-name"
                value={form.firstName}
                maxLength={40}
                onChange={(value) => updateField("firstName", value)}
              />
              <Field
                id="checkout-lastName"
                label="Last Name"
                autoComplete="family-name"
                value={form.lastName}
                maxLength={40}
                onChange={(value) => updateField("lastName", value)}
              />
            </div>
            <Field
              id="checkout-address"
              label="Address"
              autoComplete="address-line1"
              value={form.address}
              maxLength={120}
              onChange={(value) => updateField("address", value)}
            />
            <Field
              id="checkout-apartment"
              label="Apartment, suite, etc. (optional)"
              autoComplete="address-line2"
              required={false}
              value={form.apartment}
              maxLength={80}
              onChange={(value) => updateField("apartment", value)}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                id="checkout-city"
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
                  id="checkout-governorate"
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
                id="checkout-postalCode"
                label="Postal Code (optional)"
                autoComplete="postal-code"
                required={false}
                inputMode="numeric"
                value={form.postalCode}
                maxLength={12}
                onChange={(value) => updateField("postalCode", value)}
              />
              <Field
                id="checkout-phone"
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
                id="checkout-notes"
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
            disabled={isSubmitting || !csrfToken || discountLoading}
            className="label-caps flex min-h-12 w-full items-center justify-center border border-parchment bg-parchment px-8 text-surface-hi transition-colors hover:border-gold hover:bg-gold disabled:cursor-not-allowed disabled:opacity-60 lg:hidden"
          >
            {isSubmitting ? "Placing Order..." : "Complete Purchase"}
          </button>
        </form>

        <aside className="border border-outline bg-surface p-5 lg:sticky lg:top-28">
          <h2 className="font-serif text-3xl leading-tight">Order Summary</h2>
          <div className="mt-5 space-y-4 border-b border-outline/60 pb-5">
            {items.map((item) => {
              const lineTotal = Number(item.price) * item.quantity;
              const originalLineTotal =
                Number(item.originalPrice ?? item.price) * item.quantity;
              const hasProductDiscount = originalLineTotal > lineTotal + 0.001;

              return (
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
                    <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-on-surface/70">
                      <span>{item.sizeML}ml</span>
                      {hasProductDiscount && item.discount ? (
                        <span className="label-caps text-[9px] text-gold">
                          {productDiscountBadge(item.discount, (amount) =>
                            priceFormatter.format(amount)
                          )}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <div className="text-right text-sm">
                    {hasProductDiscount ? (
                      <p className="text-xs text-on-surface/55 line-through">
                        {priceFormatter.format(originalLineTotal)}
                      </p>
                    ) : null}
                    <p className="text-parchment">{priceFormatter.format(lineTotal)}</p>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="border-b border-outline/60 py-1">
            <button
              type="button"
              aria-expanded={couponOpen}
              aria-controls="checkout-coupon-entry"
              onClick={() => setCouponOpen((open) => !open)}
              className="flex min-h-11 w-full items-center justify-between gap-4 text-left transition-colors hover:text-gold"
            >
              <span className="font-serif text-lg">Have a coupon?</span>
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                className={`h-4 w-4 transition-transform ${couponOpen ? "rotate-180" : ""}`}
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>
            <p className="pb-3 text-[11px] leading-5 text-on-surface/60">
              We automatically apply only the single discount that saves you the most. Discounts cannot be combined.
            </p>
            {couponOpen ? (
              <div id="checkout-coupon-entry" className="pb-4 pt-2">
                <div className="flex gap-2">
                  <input
                    value={couponInput}
                    maxLength={32}
                    autoComplete="off"
                    aria-label="Coupon code"
                    placeholder="Coupon code"
                    onChange={(event) => setCouponInput(event.target.value.toUpperCase())}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        applyCoupon();
                      }
                    }}
                    className="h-10 min-w-0 flex-1 border border-outline bg-surface-hi px-3 text-xs uppercase tracking-[0.1em] text-parchment outline-none transition-colors placeholder:text-on-surface/45 focus:border-gold"
                  />
                  <button
                    type="button"
                    onClick={applyCoupon}
                    disabled={discountLoading || !csrfToken || !couponInput.trim()}
                    className="label-caps min-h-10 border border-parchment bg-parchment px-4 text-surface-hi transition-colors hover:border-gold hover:bg-gold disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {discountLoading && appliedCouponCode ? "Applying..." : "Apply"}
                  </button>
                </div>
                {appliedCouponCode ? (
                  <button
                    type="button"
                    onClick={removeCoupon}
                    disabled={discountLoading}
                    className="label-caps mt-3 border-b border-outline pb-1 text-on-surface/70 transition-colors hover:border-gold hover:text-gold disabled:opacity-50"
                  >
                    Remove Coupon
                  </button>
                ) : null}
                {discountMessage ? (
                  <p
                    role={discountMessageIsError ? "alert" : "status"}
                    className={`mt-3 text-xs leading-5 ${
                      discountMessageIsError
                        ? "text-red-400"
                        : displayedDiscount
                          ? "text-gold"
                          : "text-on-surface/70"
                    }`}
                  >
                    {discountMessage}
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
          <div className="mt-5 space-y-3 border-b border-outline/60 pb-5 text-sm text-on-surface/75">
            {productSavings > 0 ? (
              <>
                <div className="flex justify-between gap-4">
                  <span>Original subtotal</span>
                  <span className="text-on-surface/55 line-through">
                    {priceFormatter.format(originalSubtotal)}
                  </span>
                </div>
                <div className="flex justify-between gap-4 text-gold">
                  <span>Product discounts</span>
                  <span>-{priceFormatter.format(productSavings)}</span>
                </div>
              </>
            ) : null}
            <div className="flex justify-between gap-4">
              <span>Subtotal</span>
              <span className="text-parchment">
                {priceFormatter.format(subtotal)}
              </span>
            </div>
            {displayedDiscount ? (
              <div className="flex justify-between gap-4 text-gold">
                <span>
                  {displayedDiscount.source === "COUPON" ? "Coupon" : "Bulk Discount"} ({displayedDiscount.code})
                </span>
                <span>-{priceFormatter.format(discountAmount)}</span>
              </div>
            ) : null}
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
              {priceFormatter.format(total)}
            </span>
          </div>
          {missingFields.length > 0 ? (
            <div className="mt-5 border border-red-700/45 bg-surface-hi px-4 py-3">
              <p className="label-caps text-red-700">Missing Details</p>
              <ul className="mt-2 space-y-1 text-sm text-on-surface/80">
                {missingFields.map((item) => (
                  <li key={item.field}>
                    <button
                      type="button"
                      onClick={() => focusMissingField(item.field)}
                      className="text-left underline decoration-outline underline-offset-4 transition-colors hover:text-gold"
                    >
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          <button
            type="submit"
            form="checkout-form"
            disabled={isSubmitting || !csrfToken || discountLoading}
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
