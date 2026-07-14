import Navbar from "@/components/storefront/layout/Navbar";
import SalesBar from "@/components/storefront/layout/SalesBar";
import ShopClient from "@/components/storefront/shop/ShopClient";
import type {
  ShopCollectionOffer,
  ShopFragrance
} from "@/components/storefront/shop/ShopClient";
import {
  getActiveAnnouncement,
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
  const [fragrances, collections, announcement] = await Promise.all([
    getStorefrontFragrances({limit: 100}),
    getStorefrontCollectionOffers(),
    getActiveAnnouncement()
  ]);
  const products: ShopFragrance[] = fragrances;
  const collectionOffers: ShopCollectionOffer[] = collections;

  return (
    <main className="min-h-screen bg-bg">
      <SalesBar initialSale={announcement} />
      <Navbar cartCount={0} />
      <ShopClient
        key={type}
        locale={locale}
        fragrances={products}
        collections={collectionOffers}
      />
    </main>
  );
}
