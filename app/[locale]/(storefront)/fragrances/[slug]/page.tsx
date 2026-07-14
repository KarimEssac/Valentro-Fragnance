import ProductDetailClient from "@/components/storefront/product/ProductDetailClient";
import Navbar from "@/components/storefront/layout/Navbar";
import SalesBar from "@/components/storefront/layout/SalesBar";
import {notFound} from "next/navigation";
import {
  getActiveAnnouncement,
  getStorefrontFragranceDetail
} from "@/lib/storefront-data";

type ProductDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function ProductDetailPage({
  params
}: ProductDetailPageProps) {
  const {slug} = await params;
  const [product, announcement] = await Promise.all([
    getStorefrontFragranceDetail(slug),
    getActiveAnnouncement()
  ]);

  if (!product) notFound();

  return (
    <>
      <div className="absolute inset-x-0 top-0 z-50">
        <SalesBar initialSale={announcement} />
        <Navbar cartCount={0} />
      </div>
      <ProductDetailClient slug={slug} initialProduct={product} />
    </>
  );
}
