"use client";

import dynamic from "next/dynamic";

const CheckoutClient = dynamic(
  () => import("@/components/storefront/checkout/CheckoutClient"),
  { ssr: false }
);

export default function CheckoutPage() {
  return (
    <>
      <CheckoutClient />
    </>
  );
}
