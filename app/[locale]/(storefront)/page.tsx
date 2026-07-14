import CategoriesSection from "@/components/storefront/home/CategoriesSection";
import HeroSection from "@/components/storefront/home/HeroSection";
import NewsTicker from "@/components/storefront/home/NewsTicker";
import ScentFinder from "@/components/storefront/home/ScentFinder";
import SignatureCollectionSection from "@/components/storefront/home/SignatureCollectionSection";
import TestimonialsSection from "@/components/storefront/home/TestimonialsSection";
import Navbar from "@/components/storefront/layout/Navbar";
import SalesBar from "@/components/storefront/layout/SalesBar";
import {
  getActiveAnnouncement,
  getStorefrontFragrances,
  getStorefrontTestimonials
} from "@/lib/storefront-data";

export default async function HomePage() {
  const [announcement, fragrances, testimonials] = await Promise.all([
    getActiveAnnouncement(),
    getStorefrontFragrances({collection: "signature-line", limit: 8}),
    getStorefrontTestimonials(8)
  ]);

  return (
    <main className="min-h-screen bg-bg">
      <div className="absolute inset-x-0 top-0 z-50">
        <SalesBar initialSale={announcement} />
        <Navbar cartCount={0} />
      </div>
      <HeroSection />
      <NewsTicker initialSale={announcement} />
      <SignatureCollectionSection initialFragrances={fragrances} />
      <CategoriesSection />
      <TestimonialsSection initialTestimonials={testimonials} />
      <ScentFinder />
    </main>
  );
}
