import {NextResponse} from "next/server";
import type {NextRequest} from "next/server";
import {revalidateTag} from "next/cache";
import {getServerSession} from "next-auth";
import type {Session} from "next-auth";

import {authOptions} from "@/lib/auth";
import {prisma} from "@/lib/prisma";
import {
  STOREFRONT_FRAGRANCES_TAG,
  STOREFRONT_TESTIMONIALS_TAG
} from "@/lib/cache-tags";
import {getStorefrontFragranceDetail} from "@/lib/storefront-data";
import type {StorefrontFragranceDetail} from "@/lib/storefront-data";

type RouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

export async function GET(
  _request: Request,
  context: RouteContext
): Promise<NextResponse<StorefrontFragranceDetail | {message: string}>> {
  const {slug} = await context.params;
  const fragrance = await getStorefrontFragranceDetail(slug);

  if (!fragrance) {
    return NextResponse.json({message: "Fragrance not found"}, {status: 404});
  }

  return NextResponse.json(fragrance, {
    headers: {
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300"
    }
  });
}

export async function POST(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse<{message: string}>> {
  const session = (await getServerSession(authOptions)) as Session | null;

  if (!session?.user?.id) {
    return NextResponse.json(
      {message: "You must be signed in to review this fragrance"},
      {status: 401}
    );
  }

  const {slug} = await context.params;
  const body = (await request.json()) as {
    rating?: unknown;
    messageEn?: unknown;
    messageAr?: unknown;
  };
  const rating = Number(body.rating);
  const messageEn =
    typeof body.messageEn === "string" ? body.messageEn.trim() : "";
  const messageAr =
    typeof body.messageAr === "string" && body.messageAr.trim()
      ? body.messageAr.trim()
      : null;

  if (!Number.isInteger(rating) || rating < 1 || rating > 5 || !messageEn) {
    return NextResponse.json(
      {message: "A rating from 1 to 5 and a review message are required"},
      {status: 400}
    );
  }

  const fragrance = await prisma.fragrance.findFirst({
    where: {
      slug,
      isPublished: true
    },
    select: {
      id: true
    }
  });

  if (!fragrance) {
    return NextResponse.json({message: "Fragrance not found"}, {status: 404});
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.user.id
    },
    select: {
      name: true,
      email: true
    }
  });

  await prisma.review.upsert({
    where: {
      fragranceId_userId: {
        fragranceId: fragrance.id,
        userId: session.user.id
      }
    },
    update: {
      reviewerName: user?.name ?? user?.email ?? "Valentro Client",
      rating,
      messageEn,
      messageAr,
      isPublished: true
    },
    create: {
      fragranceId: fragrance.id,
      userId: session.user.id,
      reviewerName: user?.name ?? user?.email ?? "Valentro Client",
      rating,
      messageEn,
      messageAr,
      isPublished: true
    }
  });

  const aggregate = await prisma.review.aggregate({
    where: {
      fragranceId: fragrance.id,
      isPublished: true
    },
    _avg: {
      rating: true
    },
    _count: {
      rating: true
    }
  });

  await prisma.fragrance.update({
    where: {
      id: fragrance.id
    },
    data: {
      ratingAverage: (aggregate._avg.rating ?? 0).toFixed(2),
      ratingCount: aggregate._count.rating
    }
  });

  revalidateTag(STOREFRONT_FRAGRANCES_TAG, "max");
  revalidateTag(STOREFRONT_TESTIMONIALS_TAG, "max");

  return NextResponse.json({message: "Review saved"});
}

export async function DELETE(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse<{message: string}>> {
  const session = (await getServerSession(authOptions)) as {
    user?: { id?: string; role?: string };
  } | null;

  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json(
      {message: "You must be an admin to delete a review"},
      {status: 403}
    );
  }

  const {slug} = await context.params;
  const body = (await request.json()) as {
    reviewId?: string;
  };
  const reviewId = body.reviewId;

  if (!reviewId) {
    return NextResponse.json(
      {message: "Review ID is required"},
      {status: 400}
    );
  }

  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    select: { fragranceId: true }
  });

  if (!review) {
    return NextResponse.json({message: "Review not found"}, {status: 404});
  }

  // Delete associated testimonial and then the review itself inside a transaction
  await prisma.$transaction([
    prisma.testimonial.deleteMany({
      where: { reviewId }
    }),
    prisma.review.delete({
      where: { id: reviewId }
    })
  ]);

  // Recalculate average rating and count for the fragrance
  const aggregate = await prisma.review.aggregate({
    where: {
      fragranceId: review.fragranceId,
      isPublished: true
    },
    _avg: {
      rating: true
    },
    _count: {
      rating: true
    }
  });

  await prisma.fragrance.update({
    where: {
      id: review.fragranceId
    },
    data: {
      ratingAverage: (aggregate._avg.rating ?? 0).toFixed(2),
      ratingCount: aggregate._count.rating
    }
  });

  revalidateTag(STOREFRONT_FRAGRANCES_TAG, "max");
  revalidateTag(STOREFRONT_TESTIMONIALS_TAG, "max");

  return NextResponse.json({message: "Review deleted successfully"});
}
