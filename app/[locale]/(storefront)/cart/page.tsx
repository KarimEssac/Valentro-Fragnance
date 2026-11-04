"use client";

import dynamic from "next/dynamic";

const CartClient = dynamic(
  () => import("@/components/storefront/cart/CartClient"),
  { ssr: false }
);

export default function CartPage() {
  return (
    <>
      <CartClient />
    </>
  );
}
