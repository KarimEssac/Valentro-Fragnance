import Navbar from "@/components/storefront/layout/Navbar";
import SalesBar from "@/components/storefront/layout/SalesBar";
import ShopClient from "@/components/storefront/shop/ShopClient";
import type {ShopFragrance} from "@/components/storefront/shop/ShopClient";
import {prisma} from "@/lib/prisma";

type FragrancesPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function FragrancesPage({params}: FragrancesPageProps) {
  const {locale} = await params;
  const fragrances = await prisma.fragrance.findMany({
    where: {
      isPublished: true
    },
    orderBy: [{position: "asc"}, {createdAt: "desc"}],
    include: {
      images: {
        orderBy: [{isPrimary: "desc"}, {position: "asc"}],
        take: 1
      },
      ingredients: {
        orderBy: [{note: "asc"}, {nameEn: "asc"}],
        select: {
          nameEn: true,
          nameAr: true
        }
      },
      variants: {
        orderBy: {price: "asc"},
        select: {
          price: true
        }
      }
    }
  });

  const products: ShopFragrance[] = fragrances.map((fragrance) => {
    const primaryImage = fragrance.images[0] ?? null;
    const minPrice = fragrance.variants[0]?.price ?? null;
    const maxPrice =
      fragrance.variants[fragrance.variants.length - 1]?.price ?? null;

    return {
      id: fragrance.id,
      slug: fragrance.slug,
      nameEn: fragrance.nameEn,
      nameAr: fragrance.nameAr,
      taglineEn: fragrance.taglineEn,
      taglineAr: fragrance.taglineAr,
      gender: fragrance.gender,
      scentProfile: fragrance.scentProfile,
      primaryImage: primaryImage
        ? {
            url: primaryImage.url,
            altEn: primaryImage.altEn,
            altAr: primaryImage.altAr
          }
        : null,
      ingredients: fragrance.ingredients,
      priceRange: {
        min: minPrice?.toString() ?? null,
        max: maxPrice?.toString() ?? null
      }
    };
  });

  return (
    <main className="min-h-screen bg-bg">
      <SalesBar />
      <Navbar cartCount={0} />
      <ShopClient locale={locale} fragrances={products} />
    </main>
  );
}
