import {NextResponse} from "next/server";
import type {NextRequest} from "next/server";
import {Prisma} from "@prisma/client";
import {prisma} from "@/lib/prisma";

type StorefrontFragrance = {
  id: string;
  slug: string;
  nameEn: string;
  nameAr: string;
  taglineEn: string;
  taglineAr: string;
  gender: string;
  scentProfile: string;
  isFeatured: boolean;
  position: number;
  primaryImage: {
    url: string;
    altEn: string;
    altAr: string;
  } | null;
  priceRange: {
    min: string | null;
    max: string | null;
  };
};

export async function GET(
  request: NextRequest
): Promise<NextResponse<StorefrontFragrance[]>> {
  const {searchParams} = request.nextUrl;
  const collection = searchParams.get("collection");
  const gender = searchParams.get("gender");
  const scentProfile = searchParams.get("scentProfile");
  const featured = searchParams.get("featured");
  const take = Math.min(Number(searchParams.get("limit") ?? 12) || 12, 24);

  const where: Prisma.FragranceWhereInput = {
    isPublished: true,
    ...(collection
      ? {
          collections: {
            some: {
              collection: {
                slug: collection,
                isPublished: true
              }
            }
          }
        }
      : {}),
    ...(gender ? {gender: gender as Prisma.EnumGenderFilter["equals"]} : {}),
    ...(scentProfile
      ? {scentProfile: scentProfile as Prisma.EnumScentProfileFilter["equals"]}
      : {}),
    ...(featured === "true" ? {isFeatured: true} : {})
  };

  const fragrances = await prisma.fragrance.findMany({
    where,
    orderBy: [{position: "asc"}, {createdAt: "desc"}],
    take,
    include: {
      images: {
        orderBy: [{isPrimary: "desc"}, {position: "asc"}],
        take: 1
      },
      variants: {
        orderBy: {price: "asc"},
        select: {
          price: true
        }
      }
    }
  });

  return NextResponse.json(
    fragrances.map((fragrance) => {
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
        isFeatured: fragrance.isFeatured,
        position: fragrance.position,
        primaryImage: primaryImage
          ? {
              url: primaryImage.url,
              altEn: primaryImage.altEn,
              altAr: primaryImage.altAr
            }
          : null,
        priceRange: {
          min: minPrice?.toString() ?? null,
          max: maxPrice?.toString() ?? null
        }
      };
    })
  );
}
