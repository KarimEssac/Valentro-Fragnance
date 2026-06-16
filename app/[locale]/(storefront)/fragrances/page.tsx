import Navbar from "@/components/storefront/layout/Navbar";
import SalesBar from "@/components/storefront/layout/SalesBar";
import ShopClient from "@/components/storefront/shop/ShopClient";
import type {
  ShopCollectionOffer,
  ShopFragrance
} from "@/components/storefront/shop/ShopClient";
import {prisma} from "@/lib/prisma";

type FragrancesPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function FragrancesPage({params}: FragrancesPageProps) {
  const {locale} = await params;
  const [fragrances, collections] = await Promise.all([
    prisma.fragrance.findMany({
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
    }),
    prisma.collection.findMany({
      where: {
        isOffer: true,
        isPublished: true
      },
      orderBy: [{position: "asc"}, {createdAt: "desc"}],
      include: {
        fragrances: {
          include: {
            fragrance: {
              select: {
                id: true,
                slug: true,
                nameEn: true,
                nameAr: true,
                images: {
                  orderBy: [{isPrimary: "desc"}, {position: "asc"}],
                  take: 1,
                  select: {
                    url: true,
                    altEn: true,
                    altAr: true
                  }
                },
                variants: {
                  orderBy: {price: "asc"},
                  take: 1,
                  select: {
                    price: true
                  }
                }
              }
            }
          }
        }
      }
    })
  ]);

  const products: ShopFragrance[] = fragrances.map((fragrance) => {
    const primaryImage = fragrance.images[0] ?? null;
    const minPrice = fragrance.variants[0]?.price ?? null;
    const maxPrice =
      fragrance.variants[fragrance.variants.length - 1]?.price ?? null;

      return {
        id: fragrance.id,
        slug: fragrance.slug,
        position: fragrance.position,
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

  const collectionOffers: ShopCollectionOffer[] = collections.map((collection) => {
    const includedProducts = collection.fragrances.map(({fragrance}) => ({
      id: fragrance.id,
      slug: fragrance.slug,
      nameEn: fragrance.nameEn,
      nameAr: fragrance.nameAr,
      image: fragrance.images[0] ?? null,
      price: fragrance.variants[0]?.price.toString() ?? null
    }));
    const combinedValue = includedProducts.reduce(
      (sum, product) => sum + Number(product.price ?? 0),
      0
    );
    const offerPrice = Number(collection.offerPrice ?? 0);
    const discountPercent =
      combinedValue > 0 && offerPrice > 0
        ? Math.max(0, Math.round(((combinedValue - offerPrice) / combinedValue) * 100))
        : 0;

    return {
      id: collection.id,
      slug: collection.slug,
      position: collection.position,
      code: collection.code,
      nameEn: collection.nameEn,
      nameAr: collection.nameAr,
      descriptionEn: collection.descriptionEn,
      descriptionAr: collection.descriptionAr,
      coverImage: collection.coverImage,
      offerPrice: collection.offerPrice?.toString() ?? null,
      combinedValue: combinedValue.toFixed(2),
      discountPercent,
      products: includedProducts.map(({price, ...product}) => product)
    };
  });

  return (
    <main className="min-h-screen bg-bg">
      <SalesBar />
      <Navbar cartCount={0} />
      <ShopClient
        locale={locale}
        fragrances={products}
        collections={collectionOffers}
      />
    </main>
  );
}
