import AdminInventoryClient from "@/components/admin/AdminInventoryClient";
import type {InventoryProduct} from "@/components/admin/AdminInventoryClient";
import {prisma} from "@/lib/prisma";

type AdminInventoryPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export default async function AdminInventoryPage({
  params
}: AdminInventoryPageProps) {
  const {locale} = await params;
  const fragrances = await prisma.fragrance.findMany({
    orderBy: [{position: "asc"}, {createdAt: "desc"}],
    include: {
      images: {
        orderBy: [{isPrimary: "desc"}, {position: "asc"}],
        take: 1
      },
      variants: {
        orderBy: [{sizeML: "asc"}]
      },
      collections: {
        include: {
          collection: {
            select: {
              nameEn: true,
              nameAr: true
            }
          }
        }
      },
      ingredients: {
        orderBy: [{note: "asc"}, {nameEn: "asc"}],
        select: {
          nameEn: true,
          note: true
        }
      }
    }
  });

  const products: InventoryProduct[] = fragrances.map((fragrance) => {
    const primaryImage = fragrance.images[0] ?? null;
    const prices = fragrance.variants.map((variant) => Number(variant.price));
    const minPrice = prices.length > 0 ? Math.min(...prices) : null;
    const maxPrice = prices.length > 0 ? Math.max(...prices) : null;

    return {
      id: fragrance.id,
      slug: fragrance.slug,
      nameEn: fragrance.nameEn,
      nameAr: fragrance.nameAr,
      taglineEn: fragrance.taglineEn,
      taglineAr: fragrance.taglineAr,
      descriptionEn: fragrance.descriptionEn,
      descriptionAr: fragrance.descriptionAr,
      gender: fragrance.gender,
      scentProfile: fragrance.scentProfile,
      sillage: fragrance.sillage,
      longevity: fragrance.longevity,
      isPublished: fragrance.isPublished,
      isFeatured: fragrance.isFeatured,
      totalStock: fragrance.variants.reduce(
        (sum, variant) => sum + variant.stock,
        0
      ),
      minPrice: minPrice?.toString() ?? null,
      maxPrice: maxPrice?.toString() ?? null,
      primaryImage: primaryImage
        ? {
            url: primaryImage.url,
            altEn: primaryImage.altEn,
            altAr: primaryImage.altAr
          }
        : null,
      collections: fragrance.collections.map(({collection}) =>
        locale === "ar" ? collection.nameAr : collection.nameEn
      ),
      variants: fragrance.variants.map((variant) => ({
        id: variant.id,
        sku: variant.sku,
        sizeML: variant.sizeML,
        price: variant.price.toString(),
        stock: variant.stock
      })),
      ingredients: fragrance.ingredients,
      avoidIf: fragrance.avoidIf,
      seasons: fragrance.seasons
    };
  });

  return <AdminInventoryClient locale={locale} products={products} />;
}
