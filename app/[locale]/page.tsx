import CategoriesSection from "@/components/storefront/home/CategoriesSection";
import HeroSection from "@/components/storefront/home/HeroSection";
import NewsTicker from "@/components/storefront/home/NewsTicker";
import SignatureCollectionSection from "@/components/storefront/home/SignatureCollectionSection";
import Navbar from "@/components/storefront/layout/Navbar";
import SalesBar from "@/components/storefront/layout/SalesBar";

export const dynamic = "force-dynamic";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-bg">
      <div className="fixed inset-x-0 top-0 z-50">
        <SalesBar />
        <Navbar cartCount={0} />
      </div>
      <HeroSection />
      <NewsTicker />
      <SignatureCollectionSection />
      <CategoriesSection />
    </main>
  );
}
