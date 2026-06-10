import CartClient from "@/components/storefront/cart/CartClient";
import Navbar from "@/components/storefront/layout/Navbar";
import SalesBar from "@/components/storefront/layout/SalesBar";

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
