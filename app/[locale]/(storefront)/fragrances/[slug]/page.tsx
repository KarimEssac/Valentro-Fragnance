import ProductDetailClient from "@/components/storefront/product/ProductDetailClient";
import {notFound} from "next/navigation";
import {
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
  const product = await getStorefrontFragranceDetail(slug);

  if (!product) notFound();

  return (
    <>
      <ProductDetailClient key={slug} slug={slug} initialProduct={product} />
    </>
  );
}
