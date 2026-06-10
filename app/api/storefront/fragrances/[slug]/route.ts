import {NextResponse} from "next/server";
import type {NextRequest} from "next/server";
import {getServerSession} from "next-auth";
import type {Session} from "next-auth";

import {authOptions} from "@/lib/auth";
import {prisma} from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

export type StorefrontFragranceDetail = {
  id: string;
  slug: string;
  nameEn: string;
  nameAr: string;
  taglineEn: string;
  taglineAr: string;
  descriptionEn: string;
  descriptionAr: string;
  gender: string;
  scentProfile: string;
  sillage: string;
  longevity: number;
  ratingAverage: string;
  ratingCount: number;
  images: {
    id: string;
    url: string;
    altEn: string;
    altAr: string;
    position: number;
    isPrimary: boolean;
  }[];
  variants: {
    id: string;
    sizeML: number;
    price: string;
    compareAtPrice: string | null;
    stock: number;
    sku: string;
  }[];
  ingredients: {
    id: string;
    nameEn: string;
    nameAr: string;
    note: string;
  }[];
  reviews: {
    id: string;
    reviewerName: string;
    rating: number;
    messageEn: string;
    messageAr: string | null;
    createdAt: string;
  }[];
};

export async function GET(
  _request: Request,
  context: RouteContext
): Promise<NextResponse<StorefrontFragranceDetail | {message: string}>> {
  const {slug} = await context.params;

  const fragrance = await prisma.fragrance.findFirst({
    where: {
      slug,
      isPublished: true
    },
    include: {
      images: {
        orderBy: [{isPrimary: "desc"}, {position: "asc"}]
      },
      variants: {
        orderBy: [{sizeML: "asc"}]
      },
      ingredients: {
        orderBy: [{note: "asc"}, {nameEn: "asc"}]
      },
      reviews: {
        where: {
          isPublished: true
        },
        orderBy: {createdAt: "desc"},
        take: 6,
        select: {
          id: true,
          reviewerName: true,
          rating: true,
          messageEn: true,
          messageAr: true,
          createdAt: true
        }
      }
    }
  });

  if (!fragrance) {
    return NextResponse.json({message: "Fragrance not found"}, {status: 404});
  }

  return NextResponse.json({
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
    ratingAverage: fragrance.ratingAverage.toString(),
    ratingCount: fragrance.ratingCount,
    images: fragrance.images.map((image) => ({
      id: image.id,
      url: image.url,
      altEn: image.altEn,
      altAr: image.altAr,
      position: image.position,
      isPrimary: image.isPrimary
    })),
    variants: fragrance.variants.map((variant) => ({
      id: variant.id,
      sizeML: variant.sizeML,
      price: variant.price.toString(),
      compareAtPrice: variant.compareAtPrice?.toString() ?? null,
      stock: variant.stock,
      sku: variant.sku
    })),
    ingredients: fragrance.ingredients.map((ingredient) => ({
      id: ingredient.id,
      nameEn: ingredient.nameEn,
      nameAr: ingredient.nameAr,
      note: ingredient.note
    })),
    reviews: fragrance.reviews.map((review) => ({
      id: review.id,
      reviewerName: review.reviewerName,
      rating: review.rating,
      messageEn: review.messageEn,
      messageAr: review.messageAr,
      createdAt: review.createdAt.toISOString()
    }))
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

  return NextResponse.json({message: "Review saved"});
}
