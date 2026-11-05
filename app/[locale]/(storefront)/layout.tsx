import type {ReactNode} from "react";
import CartNotification from "@/components/storefront/cart/CartNotification";
import Footer from "@/components/storefront/layout/Footer";
import StorefrontHeader from "@/components/storefront/layout/StorefrontHeader";

type StorefrontLayoutProps = {
  children: ReactNode;
};

export default function StorefrontLayout({children}: StorefrontLayoutProps) {
  return (
    <>
      <StorefrontHeader />
      {children}
      <Footer />
      <CartNotification />
    </>
  );
}
