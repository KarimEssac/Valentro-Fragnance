import {NextResponse} from "next/server";

import {prisma} from "@/lib/prisma";

export async function GET() {
  const collections = await prisma.collection.findMany({
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
  });

  return NextResponse.json({
    collections: collections.map((collection) => {
      const products = collection.fragrances.map(({fragrance}) => ({
        id: fragrance.id,
        slug: fragrance.slug,
        nameEn: fragrance.nameEn,
        nameAr: fragrance.nameAr,
        image: fragrance.images[0] ?? null,
        price: fragrance.variants[0]?.price.toString() ?? null
      }));
      const combinedValue = products.reduce(
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
        code: collection.code,
        nameEn: collection.nameEn,
        nameAr: collection.nameAr,
        descriptionEn: collection.descriptionEn,
        descriptionAr: collection.descriptionAr,
        coverImage: collection.coverImage,
        offerPrice: collection.offerPrice?.toString() ?? null,
        combinedValue: combinedValue.toFixed(2),
        discountPercent,
        products
      };
    })
  });
}
