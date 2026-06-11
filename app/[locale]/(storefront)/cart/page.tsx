"use client";

import dynamic from "next/dynamic";
import Navbar from "@/components/storefront/layout/Navbar";
import SalesBar from "@/components/storefront/layout/SalesBar";

const CartClient = dynamic(
  () => import("@/components/storefront/cart/CartClient"),
  { ssr: false }
);

export default function CartPage() {
  return (
    <>
      <div className="absolute inset-x-0 top-0 z-50">
        <SalesBar />
        <Navbar cartCount={0} />
      </div>
      <CartClient />
    </>
  );
}
