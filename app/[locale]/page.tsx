import HeroSection from "@/components/storefront/home/HeroSection";
import AnnouncementBar from "@/components/storefront/layout/AnnouncementBar";
import Navbar from "@/components/storefront/layout/Navbar";

export const dynamic = "force-dynamic";

type HomePageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export default async function HomePage({params}: HomePageProps) {
  const {locale} = await params;

  return (
    <main className="min-h-screen bg-bg">
      <div className="fixed inset-x-0 top-0 z-50">
        <AnnouncementBar locale={locale} />
        <Navbar cartCount={0} />
      </div>
      <HeroSection />
    </main>
  );
}
