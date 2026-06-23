import type {ReactNode} from "react";
import Footer from "@/components/storefront/layout/Footer";

type StorefrontLayoutProps = {
  children: ReactNode;
};

export default function StorefrontLayout({children}: StorefrontLayoutProps) {
  return (
    <>
      {children}
      <Footer />
    </>
  );
}
