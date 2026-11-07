import ShopClient from "@/components/storefront/shop/ShopClient";
import type {
  ShopCollectionOffer,
  ShopFragrance
} from "@/components/storefront/shop/ShopClient";
import {
  getStorefrontCollectionOffers,
  getStorefrontFragrances
} from "@/lib/storefront-data";

type FragrancesPageProps = {
  params: Promise<{
    locale: string;
  }>;
  searchParams: Promise<{
    type?: string;
  }>;
};

export default async function FragrancesPage({
  params,
  searchParams
}: FragrancesPageProps) {
  const {locale} = await params;
  const {type = ""} = await searchParams;
  const [fragrances, collections] = await Promise.all([
    getStorefrontFragrances({limit: null}),
    getStorefrontCollectionOffers()
  ]);
  const products: ShopFragrance[] = fragrances;
  const collectionOffers: ShopCollectionOffer[] = collections;

  return (
    <main className="min-h-screen bg-bg">
      <ShopClient
        key={type}
        locale={locale}
        fragrances={products}
        collections={collectionOffers}
      />
    </main>
  );
}
