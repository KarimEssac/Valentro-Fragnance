import ProductDetailClient from "@/components/storefront/product/ProductDetailClient";
import Navbar from "@/components/storefront/layout/Navbar";
import SalesBar from "@/components/storefront/layout/SalesBar";

type ProductDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function ProductDetailPage({
  params
}: ProductDetailPageProps) {
  const {slug} = await params;

  return (
    <>
      <div className="absolute inset-x-0 top-0 z-50">
        <SalesBar />
        <Navbar cartCount={0} />
      </div>
      <ProductDetailClient slug={slug} />
    </>
  );
}
