import CategoriesSection from "@/components/storefront/home/CategoriesSection";
import HeroSection from "@/components/storefront/home/HeroSection";
import NewsTicker from "@/components/storefront/home/NewsTicker";
import ScentFinder from "@/components/storefront/home/ScentFinder";
import SignatureCollectionSection from "@/components/storefront/home/SignatureCollectionSection";
import TestimonialsSection from "@/components/storefront/home/TestimonialsSection";
import WhyChooseSection from "@/components/storefront/home/WhyChooseSection";
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
      <HeroSection />
      <NewsTicker initialSale={announcement} />
      <SignatureCollectionSection initialFragrances={fragrances} />
      <CategoriesSection />
      <TestimonialsSection initialTestimonials={testimonials} />
      <WhyChooseSection />
      <ScentFinder />
    </main>
  );
}
