import {NextResponse} from "next/server";
import type {NextRequest} from "next/server";
import {prisma} from "@/lib/prisma";

type StorefrontTestimonial = {
  id: string;
  messageEn: string;
  messageAr: string;
  image: {
    url: string;
    altEn: string;
    altAr: string;
  };
  rating: number;
  position: number;
  fragrance: {
    slug: string;
    nameEn: string;
    nameAr: string;
  } | null;
};

export async function GET(
  request: NextRequest
): Promise<NextResponse<StorefrontTestimonial[]>> {
  const take = Math.min(
    Number(request.nextUrl.searchParams.get("limit") ?? 6) || 6,
    12
  );

  const testimonials = await prisma.testimonial.findMany({
    where: {
      isPublished: true
    },
    orderBy: [{position: "asc"}, {createdAt: "desc"}],
    take,
    include: {
      fragrance: {
        select: {
          slug: true,
          nameEn: true,
          nameAr: true,
          isPublished: true,
          images: {
            orderBy: [{isPrimary: "desc"}, {position: "asc"}],
            take: 1,
            select: {
              url: true,
              altEn: true,
              altAr: true
            }
          }
        }
      },
      review: {
        select: {
          messageEn: true,
          messageAr: true,
          rating: true,
          fragrance: {
            select: {
              slug: true,
              nameEn: true,
              nameAr: true,
              isPublished: true,
              images: {
                orderBy: [{isPrimary: "desc"}, {position: "asc"}],
                take: 1,
                select: {
                  url: true,
                  altEn: true,
                  altAr: true
                }
              }
            }
          }
        }
      }
    }
  });

  return NextResponse.json(
    testimonials.map((testimonial) => {
      const selectedFragrance =
        testimonial.review?.fragrance ?? testimonial.fragrance;
      const fragranceImage = selectedFragrance?.images[0] ?? null;

      return {
        id: testimonial.id,
        messageEn: testimonial.review?.messageEn ?? testimonial.messageEn,
        messageAr: testimonial.review?.messageAr ?? testimonial.messageAr,
        image: fragranceImage
          ? {
              url: fragranceImage.url,
              altEn: fragranceImage.altEn,
              altAr: fragranceImage.altAr
            }
          : {
              url: testimonial.imageUrl,
              altEn: testimonial.imageAltEn,
              altAr: testimonial.imageAltAr
            },
        rating: testimonial.review?.rating ?? testimonial.rating,
        position: testimonial.position,
        fragrance:
          selectedFragrance && selectedFragrance.isPublished
            ? {
                slug: selectedFragrance.slug,
                nameEn: selectedFragrance.nameEn,
                nameAr: selectedFragrance.nameAr
              }
            : null
      };
    })
  );
}
