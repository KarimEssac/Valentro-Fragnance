import Link from "next/link";
import {notFound} from "next/navigation";
import type {OrderStatus} from "@prisma/client";

import Navbar from "@/components/storefront/layout/Navbar";
import SalesBar from "@/components/storefront/layout/SalesBar";
import {prisma} from "@/lib/prisma";

type OrderTrackingPageProps = {
  params: Promise<{
    locale: string;
    orderId: string;
  }>;
};

type AddressSnapshot = {
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

const steps: {
  key: Exclude<OrderStatus, "CANCELLED">;
  label: string;
  description: string;
}[] = [
  {
    key: "PENDING",
    label: "Order Placed",
    description: "Your order has been received."
  },
  {
    key: "CONFIRMED",
    label: "Confirmed",
    description: "A Valentro advisor confirmed the details."
  },
  {
    key: "PROCESSING",
    label: "Preparing",
    description: "Your selection is being prepared."
  },
  {
    key: "SHIPPED",
    label: "On the Way",
    description: "Your order is moving toward your address."
  },
  {
    key: "DELIVERED",
    label: "Delivered",
    description: "The order has reached its destination."
  }
];

function addressFromSnapshot(value: unknown): AddressSnapshot {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as AddressSnapshot;
}

function statusIndex(status: OrderStatus) {
  if (status === "CANCELLED") return -1;

  return steps.findIndex((step) => step.key === status);
}

function formatStatus(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default async function OrderTrackingPage({
  params
}: OrderTrackingPageProps) {
  const {locale, orderId} = await params;

  const order = await prisma.order.findUnique({
    where: {id: orderId},
    include: {
      items: {
        orderBy: {id: "asc"}
      },
      user: {
        select: {
          email: true
        }
      }
    }
  });

  if (!order) {
    notFound();
  }

  const address = addressFromSnapshot(order.addressSnapshot);
  const currentStep = statusIndex(order.status);
  const isCancelled = order.status === "CANCELLED";
  const createdAt = new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(order.createdAt);
  const estimatedDate = new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(order.createdAt.getTime() + 4 * 24 * 60 * 60 * 1000));
  const priceFormatter = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "EGP",
    maximumFractionDigits: 0
  });

  return (
    <>
      <div className="absolute inset-x-0 top-0 z-50">
        <SalesBar />
        <Navbar cartCount={0} />
      </div>

      <main className="min-h-screen bg-bg px-gutter pb-16 pt-[104px] text-parchment sm:pt-36 lg:px-16">
        <div className="mx-auto max-w-container">
          <header className="border-b border-outline/70 pb-6">
            <p className="label-caps text-gold">Order Tracking</p>
            <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h1 className="font-serif text-4xl leading-tight sm:text-5xl">
                  The Journey of Your Selection
                </h1>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-on-surface/70 sm:gap-4">
                  <span>Order #{order.id.slice(-8).toUpperCase()}</span>
                  <span className="h-1 w-1 bg-outline" />
                  <span>Placed {createdAt}</span>
                  {!isCancelled ? (
                    <>
                      <span className="h-1 w-1 bg-outline" />
                      <span>Estimated Delivery {estimatedDate}</span>
                    </>
                  ) : null}
                </div>
              </div>
              <span
                className={`label-caps inline-flex w-fit border px-3 py-2 ${
                  isCancelled
                    ? "border-[#93000a] text-[#93000a]"
                    : "border-gold text-gold"
                }`}
              >
                {formatStatus(order.status)}
              </span>
            </div>
          </header>

          <section className="mt-7 border border-outline bg-surface p-4 sm:p-5">
            {isCancelled ? (
              <div>
                <h2 className="font-serif text-3xl leading-tight">
                  Order Cancelled
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-on-surface/75">
                  This order is no longer active. Contact Valentro support if
                  you need help with a replacement order or refund status.
                </p>
                <div className="mt-4 grid gap-3 text-sm text-on-surface/75 sm:grid-cols-3">
                  <div className="border border-outline/70 bg-bg/40 p-3">
                    <p className="label-caps text-parchment">Status</p>
                    <p className="mt-1 text-[#93000a]">Cancelled</p>
                  </div>
                  <div className="border border-outline/70 bg-bg/40 p-3">
                    <p className="label-caps text-parchment">Order Placed</p>
                    <p className="mt-1">{createdAt}</p>
                  </div>
                  <div className="border border-outline/70 bg-bg/40 p-3">
                    <p className="label-caps text-parchment">Next Step</p>
                    <p className="mt-1">Support follow-up</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="pb-1 min-[867px]:overflow-x-auto">
                <ol className="grid gap-0 min-[867px]:min-w-[760px] min-[867px]:grid-cols-5 max-[866px]:gap-4">
                  {steps.map((step, index) => {
                    const isComplete = index < currentStep;
                    const isActive = index === currentStep;
                    const isPending = index > currentStep;

                    return (
                      <li
                        key={step.key}
                        className="relative px-2 first:pl-0 last:pr-0 max-[866px]:grid max-[866px]:grid-cols-[24px_1fr] max-[866px]:gap-3 max-[866px]:px-0"
                      >
                        {index < steps.length - 1 ? (
                          <span
                            className={`absolute ${
                              index < currentStep
                                ? "bg-gold"
                                : "bg-outline/70"
                            } min-[867px]:left-[calc(50%+10px)] min-[867px]:right-[calc(-50%+10px)] min-[867px]:top-3 min-[867px]:h-px max-[866px]:bottom-[-1rem] max-[866px]:left-[11px] max-[866px]:top-6 max-[866px]:w-px`}
                          />
                        ) : null}
                        <div className="relative flex flex-col items-center text-center max-[866px]:contents">
                          <span
                            className={`z-10 h-6 w-6 border max-[866px]:col-start-1 ${
                              isActive
                                ? "border-gold bg-gold shadow-gold"
                                : isComplete
                                  ? "border-parchment bg-parchment"
                                  : "border-outline bg-surface"
                            }`}
                          />
                          <div className="max-[866px]:col-start-2 max-[866px]:pb-1">
                            <h2
                              className={`label-caps mt-3 text-[10px] max-[866px]:mt-0 max-[866px]:text-left ${
                                isPending
                                  ? "text-on-surface/55"
                                  : isActive
                                    ? "text-gold"
                                    : "text-parchment"
                              }`}
                            >
                              {step.label}
                            </h2>
                            <p className="mt-1 max-w-[9rem] text-xs leading-5 text-on-surface/70 max-[866px]:max-w-none max-[866px]:text-left">
                              {step.description}
                            </p>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </div>
            )}
          </section>

          <div className="mt-7 grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
            <section className="border border-outline bg-surface p-4 sm:p-5">
              <h2 className="font-serif text-3xl leading-tight">
                Order Details
              </h2>
              <div className="mt-5 divide-y divide-outline/60">
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start justify-between gap-4 py-4 first:pt-0 last:pb-0"
                  >
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.08em] text-parchment">
                        {locale === "ar"
                          ? item.fragranceNameAr
                          : item.fragranceNameEn}
                      </p>
                      <p className="mt-1 text-xs text-on-surface/70">
                        {item.collectionId ? "Collection" : `${item.sizeML}ml`} x {item.quantity}
                      </p>
                    </div>
                    <p className="shrink-0 text-sm text-parchment">
                      {priceFormatter.format(Number(item.totalPrice))}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-5 border-t border-outline/70 pt-4">
                <div className="flex justify-between gap-4 text-sm text-on-surface/75">
                  <span>Subtotal</span>
                  <span className="text-parchment">
                    {priceFormatter.format(Number(order.subtotal))}
                  </span>
                </div>
                <div className="mt-2 flex justify-between gap-4 text-sm text-on-surface/75">
                  <span>Discount</span>
                  <span className="text-parchment">
                    {priceFormatter.format(Number(order.discountAmount))}
                  </span>
                </div>
                <div className="mt-4 flex items-end justify-between gap-4 font-serif text-3xl text-parchment">
                  <span>Total</span>
                  <span>{priceFormatter.format(Number(order.total))}</span>
                </div>
              </div>
            </section>

            <aside className="space-y-5">
              <section className="border border-outline bg-surface p-4 sm:p-5">
                <h2 className="label-caps border-b border-outline/70 pb-3 text-parchment">
                  Delivery Details
                </h2>
                <div className="mt-4 space-y-3 text-sm leading-6 text-on-surface/75">
                  <div>
                    <p className="font-semibold text-parchment">
                      Shipping Address
                    </p>
                    <p>
                      {[address.firstName, address.lastName]
                        .filter(Boolean)
                        .join(" ")}
                    </p>
                    <p>{address.address}</p>
                    {address.apartment ? <p>{address.apartment}</p> : null}
                    <p>
                      {[address.city, address.governorate, address.country]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                    {address.postalCode ? <p>{address.postalCode}</p> : null}
                  </div>
                  <div>
                    <p className="font-semibold text-parchment">Contact</p>
                    <p>{order.user.email}</p>
                    {address.phone ? <p>{address.phone}</p> : null}
                  </div>
                </div>
              </section>

              <section className="border border-outline bg-surface p-4 sm:p-5">
                <h2 className="label-caps border-b border-outline/70 pb-3 text-parchment">
                  Need Assistance?
                </h2>
                <p className="mt-4 text-sm leading-6 text-on-surface/75">
                  Our team can help with delivery timing or order updates.
                </p>
                <Link
                  href={`/${locale}/fragrances`}
                  className="label-caps mt-5 flex min-h-10 items-center justify-center border border-parchment text-parchment transition-colors hover:bg-parchment hover:text-surface-hi"
                >
                  Continue Shopping
                </Link>
              </section>
            </aside>
          </div>
        </div>
      </main>
    </>
  );
}
