import {NextResponse} from "next/server";
import type {NextRequest} from "next/server";

import {isAdminRequest} from "@/lib/admin-auth";
import {prisma} from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

async function refreshFragranceRating(fragranceId: string) {
  const aggregate = await prisma.review.aggregate({
    where: {
      fragranceId,
      isPublished: true
    },
    _avg: {rating: true},
    _count: {_all: true}
  });

  await prisma.fragrance.update({
    where: {id: fragranceId},
    data: {
      ratingAverage: aggregate._avg.rating ?? 0,
      ratingCount: aggregate._count._all
    }
  });
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({message: "Unauthorized"}, {status: 401});
  }

  const {id} = await context.params;
  const body = (await request.json()) as {isTestimonial?: boolean};

  const review = await prisma.review.findUnique({
    where: {id},
    include: {
      fragrance: {
        select: {
          id: true,
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
          }
        }
      },
      testimonial: {
        select: {
          id: true
        }
      }
    }
  });

  if (!review) {
    return NextResponse.json({message: "Review not found"}, {status: 404});
  }

  const shouldPublish = Boolean(body.isTestimonial);

  if (!shouldPublish) {
    const testimonial = await prisma.testimonial.updateMany({
      where: {reviewId: id},
      data: {isPublished: false}
    });

    return NextResponse.json({
      message: "Review removed from testimonials.",
      isTestimonial: false,
      testimonialId: testimonial.count > 0 ? review.testimonial?.id ?? null : null,
      testimonialPosition: null
    });
  }

  const image = review.fragrance.images[0];
  const lastTestimonial = await prisma.testimonial.findFirst({
    orderBy: {position: "desc"},
    select: {position: true}
  });
  const position = (lastTestimonial?.position ?? 0) + 1;

  const testimonial = await prisma.testimonial.upsert({
    where: {reviewId: id},
    update: {
      messageEn: review.messageEn,
      messageAr: review.messageAr ?? review.messageEn,
      imageUrl: image?.url ?? "/images/hero-fragrance.webp",
      imageAltEn: image?.altEn ?? review.fragrance.nameEn,
      imageAltAr: image?.altAr ?? review.fragrance.nameAr,
      rating: review.rating,
      fragranceId: review.fragranceId,
      isPublished: true
    },
    create: {
      reviewId: id,
      messageEn: review.messageEn,
      messageAr: review.messageAr ?? review.messageEn,
      imageUrl: image?.url ?? "/images/hero-fragrance.webp",
      imageAltEn: image?.altEn ?? review.fragrance.nameEn,
      imageAltAr: image?.altAr ?? review.fragrance.nameAr,
      rating: review.rating,
      fragranceId: review.fragranceId,
      position,
      isPublished: true
    }
  });

  return NextResponse.json({
    message: "Review selected as a storefront testimonial.",
    isTestimonial: true,
    testimonialId: testimonial.id,
    testimonialPosition: testimonial.position
  });
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({message: "Unauthorized"}, {status: 401});
  }

  const {id} = await context.params;
  const review = await prisma.review.findUnique({
    where: {id},
    select: {
      id: true,
      fragranceId: true
    }
  });

  if (!review) {
    return NextResponse.json({message: "Review not found"}, {status: 404});
  }

  await prisma.$transaction([
    prisma.testimonial.deleteMany({
      where: {reviewId: id}
    }),
    prisma.review.delete({
      where: {id}
    })
  ]);

  await refreshFragranceRating(review.fragranceId);

  return NextResponse.json({message: "Review deleted."});
}
