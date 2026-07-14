import "server-only";

import {Prisma} from "@prisma/client";
import {unstable_cache} from "next/cache";

import {prisma} from "@/lib/prisma";
import {
  calculateProductPrice,
  resolveActiveProductDiscount
} from "@/lib/product-discounts";
import type {ActiveProductDiscount} from "@/lib/product-discounts";

export const STOREFRONT_FRAGRANCES_TAG = "storefront-fragrances";
export const STOREFRONT_COLLECTIONS_TAG = "storefront-collections";
export const STOREFRONT_TESTIMONIALS_TAG = "storefront-testimonials";
export const STOREFRONT_ANNOUNCEMENTS_TAG = "storefront-announcements";

export type StorefrontFragrance = {
  id: string;
  slug: string;
  nameEn: string;
  nameAr: string;
  taglineEn: string;
  taglineAr: string;
  gender: string;
  scentProfile: string;
  avoidIf: string[];
  bestFor: string[];
  seasons: string[];
  sillage: string;
  isFeatured: boolean;
  position: number;
  ingredients: {nameEn: string; nameAr: string}[];
  primaryImage: {
    url: string;
    altEn: string;
    altAr: string;
  } | null;
  priceRange: {min: string | null; max: string | null};
  originalPriceRange: {min: string | null; max: string | null};
  discount: ActiveProductDiscount | null;
  variants: {
    id: string;
    sizeML: number;
    price: string;
    originalPrice: string;
    stock: number;
  }[];
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
  discount: ActiveProductDiscount | null;
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
    originalPrice: string;
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

export type StorefrontTestimonial = {
  id: string;
  messageEn: string;
  messageAr: string;
  image: {url: string; altEn: string; altAr: string};
  rating: number;
  position: number;
  fragrance: {slug: string; nameEn: string; nameAr: string} | null;
};

export type ActiveAnnouncement = {
  id: string;
  textEn: string;
  textAr: string;
  linkUrl: string | null;
};

export type StorefrontCollectionOffer = {
  id: string;
  slug: string;
  position: number;
  code: string | null;
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  coverImage: string;
  offerPrice: string | null;
  combinedValue: string;
  discountPercent: number;
  products: {
    id: string;
    slug: string;
    nameEn: string;
    nameAr: string;
    image: {url: string; altEn: string; altAr: string} | null;
  }[];
};

export type FragranceFilters = {
  collection?: string | null;
  gender?: string | null;
  scentProfile?: string | null;
  featured?: boolean;
  limit?: number;
};

const getCachedFragrances = unstable_cache(
  async (filters: FragranceFilters): Promise<StorefrontFragrance[]> => {
    const take = Math.max(1, Math.min(filters.limit ?? 12, 100));
    const where: Prisma.FragranceWhereInput = {
      isPublished: true,
      ...(filters.collection
        ? {
            collections: {
              some: {
                collection: {
                  slug: filters.collection,
                  isPublished: true
                }
              }
            }
          }
        : {}),
      ...(filters.gender
        ? {gender: filters.gender as Prisma.EnumGenderFilter["equals"]}
        : {}),
      ...(filters.scentProfile
        ? {
            scentProfile:
              filters.scentProfile as Prisma.EnumScentProfileFilter["equals"]
          }
        : {}),
      ...(filters.featured ? {isFeatured: true} : {})
    };

    const fragrances = await prisma.fragrance.findMany({
      where,
      orderBy: [{position: "asc"}, {createdAt: "desc"}],
      take,
      select: {
        id: true,
        slug: true,
        nameEn: true,
        nameAr: true,
        taglineEn: true,
        taglineAr: true,
        gender: true,
        scentProfile: true,
        avoidIf: true,
        bestFor: true,
        seasons: true,
        sillage: true,
        isFeatured: true,
        position: true,
        discountType: true,
        discountValue: true,
        discountIsActive: true,
        discountStartsAt: true,
        discountExpiresAt: true,
        images: {
          orderBy: [{isPrimary: "desc"}, {position: "asc"}],
          take: 1,
          select: {url: true, altEn: true, altAr: true}
        },
        variants: {
          orderBy: {price: "asc"},
          select: {id: true, sizeML: true, price: true, stock: true}
        },
        ingredients: {
          orderBy: [{note: "asc"}, {nameEn: "asc"}],
          select: {nameEn: true, nameAr: true}
        }
      }
    });
    const now = new Date();

    return fragrances.map((fragrance) => {
      const discountConfig = {
        discountType: fragrance.discountType,
        discountValue: fragrance.discountValue,
        discountIsActive: fragrance.discountIsActive,
        discountStartsAt: fragrance.discountStartsAt,
        discountExpiresAt: fragrance.discountExpiresAt
      };
      const discount = resolveActiveProductDiscount(discountConfig, now);
      const variants = fragrance.variants.map((variant) => {
        const pricing = calculateProductPrice(variant.price, discountConfig, now);

        return {
          id: variant.id,
          sizeML: variant.sizeML,
          price: pricing.price,
          originalPrice: pricing.originalPrice,
          stock: variant.stock
        };
      });
      const minPrice = variants[0] ?? null;
      const maxPrice = variants[variants.length - 1] ?? null;

      return {
        id: fragrance.id,
        slug: fragrance.slug,
        nameEn: fragrance.nameEn,
        nameAr: fragrance.nameAr,
        taglineEn: fragrance.taglineEn,
        taglineAr: fragrance.taglineAr,
        gender: fragrance.gender,
        scentProfile: fragrance.scentProfile,
        avoidIf: fragrance.avoidIf,
        bestFor: fragrance.bestFor,
        seasons: fragrance.seasons,
        sillage: fragrance.sillage,
        isFeatured: fragrance.isFeatured,
        position: fragrance.position,
        ingredients: fragrance.ingredients,
        primaryImage: fragrance.images[0] ?? null,
        priceRange: {
          min: minPrice?.price ?? null,
          max: maxPrice?.price ?? null
        },
        originalPriceRange: {
          min: minPrice?.originalPrice ?? null,
          max: maxPrice?.originalPrice ?? null
        },
        discount,
        variants
      };
    });
  },
  ["storefront-fragrances-v1"],
  {revalidate: 60, tags: [STOREFRONT_FRAGRANCES_TAG]}
);

export function getStorefrontFragrances(filters: FragranceFilters = {}) {
  return getCachedFragrances(filters);
}

const getCachedFragranceDetail = unstable_cache(
  async (slug: string): Promise<StorefrontFragranceDetail | null> => {
    const fragrance = await prisma.fragrance.findFirst({
      where: {slug, isPublished: true},
      select: {
        id: true,
        slug: true,
        nameEn: true,
        nameAr: true,
        taglineEn: true,
        taglineAr: true,
        descriptionEn: true,
        descriptionAr: true,
        gender: true,
        scentProfile: true,
        sillage: true,
        longevity: true,
        ratingAverage: true,
        ratingCount: true,
        discountType: true,
        discountValue: true,
        discountIsActive: true,
        discountStartsAt: true,
        discountExpiresAt: true,
        images: {orderBy: [{isPrimary: "desc"}, {position: "asc"}]},
        variants: {orderBy: [{sizeML: "asc"}]},
        ingredients: {orderBy: [{note: "asc"}, {nameEn: "asc"}]},
        reviews: {
          where: {isPublished: true},
          orderBy: {createdAt: "desc"},
          take: 6,
          select: {
            id: true,
            reviewerName: true,
            rating: true,
            messageEn: true,
            messageAr: true,
            createdAt: true,
            user: {select: {name: true}}
          }
        }
      }
    });

    if (!fragrance) return null;

    const now = new Date();
    const discountConfig = {
      discountType: fragrance.discountType,
      discountValue: fragrance.discountValue,
      discountIsActive: fragrance.discountIsActive,
      discountStartsAt: fragrance.discountStartsAt,
      discountExpiresAt: fragrance.discountExpiresAt
    };

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
      ratingAverage: fragrance.ratingAverage.toString(),
      ratingCount: fragrance.ratingCount,
      discount: resolveActiveProductDiscount(discountConfig, now),
      images: fragrance.images,
      variants: fragrance.variants.map((variant) => {
        const pricing = calculateProductPrice(variant.price, discountConfig, now);

        return {
          id: variant.id,
          sizeML: variant.sizeML,
          price: pricing.price,
          originalPrice: pricing.originalPrice,
          compareAtPrice: variant.compareAtPrice?.toString() ?? null,
          stock: variant.stock,
          sku: variant.sku
        };
      }),
      ingredients: fragrance.ingredients,
      reviews: fragrance.reviews.map((review) => {
        const dbName = review.user?.name?.trim();
        const rawReviewerName = dbName || review.reviewerName;

        return {
          id: review.id,
          reviewerName: rawReviewerName.includes("@")
            ? "Valentro Client"
            : rawReviewerName,
          rating: review.rating,
          messageEn: review.messageEn,
          messageAr: review.messageAr,
          createdAt: review.createdAt.toISOString()
        };
      })
    };
  },
  ["storefront-fragrance-detail-v1"],
  {revalidate: 60, tags: [STOREFRONT_FRAGRANCES_TAG]}
);

export function getStorefrontFragranceDetail(slug: string) {
  return getCachedFragranceDetail(slug);
}

const getCachedTestimonials = unstable_cache(
  async (limit: number): Promise<StorefrontTestimonial[]> => {
    const testimonials = await prisma.testimonial.findMany({
      where: {isPublished: true},
      orderBy: [{position: "asc"}, {createdAt: "desc"}],
      take: Math.max(1, Math.min(limit, 12)),
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
              select: {url: true, altEn: true, altAr: true}
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
                  select: {url: true, altEn: true, altAr: true}
                }
              }
            }
          }
        }
      }
    });

    return testimonials.map((testimonial) => {
      const selectedFragrance =
        testimonial.review?.fragrance ?? testimonial.fragrance;
      const fragranceImage = selectedFragrance?.images[0] ?? null;

      return {
        id: testimonial.id,
        messageEn: testimonial.review?.messageEn ?? testimonial.messageEn,
        messageAr: testimonial.review?.messageAr ?? testimonial.messageAr,
        image: fragranceImage ?? {
          url: testimonial.imageUrl,
          altEn: testimonial.imageAltEn,
          altAr: testimonial.imageAltAr
        },
        rating: testimonial.review?.rating ?? testimonial.rating,
        position: testimonial.position,
        fragrance:
          selectedFragrance?.isPublished
            ? {
                slug: selectedFragrance.slug,
                nameEn: selectedFragrance.nameEn,
                nameAr: selectedFragrance.nameAr
              }
            : null
      };
    });
  },
  ["storefront-testimonials-v1"],
  {revalidate: 60, tags: [STOREFRONT_TESTIMONIALS_TAG]}
);

export function getStorefrontTestimonials(limit = 8) {
  return getCachedTestimonials(limit);
}

const getCachedCollectionOffers = unstable_cache(
  async (): Promise<StorefrontCollectionOffer[]> => {
    const collections = await prisma.collection.findMany({
      where: {isOffer: true, isPublished: true},
      orderBy: [{position: "asc"}, {createdAt: "desc"}],
      select: {
        id: true,
        slug: true,
        position: true,
        code: true,
        nameEn: true,
        nameAr: true,
        descriptionEn: true,
        descriptionAr: true,
        coverImage: true,
        offerPrice: true,
        fragrances: {
          select: {
            fragrance: {
              select: {
                id: true,
                slug: true,
                nameEn: true,
                nameAr: true,
                images: {
                  orderBy: [{isPrimary: "desc"}, {position: "asc"}],
                  take: 1,
                  select: {url: true, altEn: true, altAr: true}
                },
                variants: {
                  orderBy: {price: "asc"},
                  take: 1,
                  select: {price: true}
                }
              }
            }
          }
        }
      }
    });

    return collections.map((collection) => {
      const pricedProducts = collection.fragrances.map(({fragrance}) => ({
        id: fragrance.id,
        slug: fragrance.slug,
        nameEn: fragrance.nameEn,
        nameAr: fragrance.nameAr,
        image: fragrance.images[0] ?? null,
        price: fragrance.variants[0]?.price.toString() ?? null
      }));
      const combinedValue = pricedProducts.reduce(
        (sum, product) => sum + Number(product.price ?? 0),
        0
      );
      const offerPrice = Number(collection.offerPrice ?? 0);

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
        discountPercent:
          combinedValue > 0 && offerPrice > 0
            ? Math.max(
                0,
                Math.round(((combinedValue - offerPrice) / combinedValue) * 100)
              )
            : 0,
        products: pricedProducts.map(({price: _price, ...product}) => product)
      };
    });
  },
  ["storefront-collection-offers-v1"],
  {revalidate: 60, tags: [STOREFRONT_COLLECTIONS_TAG]}
);

export function getStorefrontCollectionOffers() {
  return getCachedCollectionOffers();
}

const getCachedActiveAnnouncement = unstable_cache(
  async (): Promise<ActiveAnnouncement | null> => {
    const now = new Date();

    return prisma.announcement.findFirst({
      where: {
        isActive: true,
        OR: [
          {startAt: null, endAt: null},
          {startAt: {lte: now}, endAt: {gte: now}},
          {startAt: {lte: now}, endAt: null},
          {startAt: null, endAt: {gte: now}}
        ]
      },
      orderBy: {createdAt: "desc"},
      select: {id: true, textEn: true, textAr: true, linkUrl: true}
    });
  },
  ["storefront-active-announcement-v1"],
  {revalidate: 30, tags: [STOREFRONT_ANNOUNCEMENTS_TAG]}
);

export function getActiveAnnouncement() {
  return getCachedActiveAnnouncement();
}
