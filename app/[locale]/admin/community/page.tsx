import type {OrderStatus} from "@prisma/client";

import AdminCommunityClient from "@/components/admin/AdminCommunityClient";
import {prisma} from "@/lib/prisma";

type AdminCommunityPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

const revenueStatuses: OrderStatus[] = [
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED"
];

type RestockDemandRow = {
  fragranceId: string;
  slug: string;
  nameEn: string;
  nameAr: string;
  image: {url: string; altEn: string; altAr: string} | null;
  activeRequestCount: number;
  totalDemand: number;
  latestRequestAt: string;
  variants: {
    id: string;
    sizeML: number;
    sku: string;
    stock: number;
    activeRequestCount: number;
    totalDemand: number;
    latestRequestAt: string;
    requesters: {email: string; requestedAt: string; locale: string}[];
  }[];
};

export const dynamic = "force-dynamic";

export default async function AdminCommunityPage({
  params
}: AdminCommunityPageProps) {
  const {locale} = await params;
  const [users, userOrderTotals, subscribers, reviews, restockRequests] = await Promise.all([
    prisma.user.findMany({
      orderBy: {createdAt: "desc"},
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      }
    }),
    prisma.order.groupBy({
      by: ["userId"],
      where: {status: {in: revenueStatuses}},
      _count: {_all: true},
      _sum: {total: true}
    }),
    prisma.newsletterSubscriber.findMany({
      orderBy: {createdAt: "desc"}
    }),
    prisma.review.findMany({
      orderBy: {createdAt: "desc"},
      include: {
        user: {
          select: {
            email: true
          }
        },
        fragrance: {
          select: {
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
            }
          }
        },
        testimonial: {
          select: {
            id: true,
            isPublished: true,
            position: true
          }
        }
      }
    }),
    prisma.restockRequest.findMany({
      orderBy: {requestedAt: "desc"},
      select: {
        email: true,
        locale: true,
        requestCount: true,
        requestedAt: true,
        notifiedAt: true,
        variant: {
          select: {
            id: true,
            sizeML: true,
            sku: true,
            stock: true,
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
                }
              }
            }
          }
        }
      }
    })
  ]);

  const totalsByUser = new Map(
    userOrderTotals.map((total) => [
      total.userId,
      {
        spent: Number(total._sum.total ?? 0),
        orderCount: total._count._all
      }
    ])
  );

  const accounts = users
    .map((user) => {
      const totals = totalsByUser.get(user.id);

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt.toISOString(),
        spent: totals?.spent ?? 0,
        orderCount: totals?.orderCount ?? 0
      };
    })
    .sort((a, b) => b.spent - a.spent || a.email.localeCompare(b.email));

  const demandByFragrance = new Map<string, RestockDemandRow>();

  for (const request of restockRequests) {
    const fragrance = request.variant.fragrance;
    let demand = demandByFragrance.get(fragrance.id);

    if (!demand) {
      demand = {
        fragranceId: fragrance.id,
        slug: fragrance.slug,
        nameEn: fragrance.nameEn,
        nameAr: fragrance.nameAr,
        image: fragrance.images[0] ?? null,
        activeRequestCount: 0,
        totalDemand: 0,
        latestRequestAt: request.requestedAt.toISOString(),
        variants: []
      };
      demandByFragrance.set(fragrance.id, demand);
    }

    let variantDemand = demand.variants.find(
      (variant) => variant.id === request.variant.id
    );

    if (!variantDemand) {
      variantDemand = {
        id: request.variant.id,
        sizeML: request.variant.sizeML,
        sku: request.variant.sku,
        stock: request.variant.stock,
        activeRequestCount: 0,
        totalDemand: 0,
        latestRequestAt: request.requestedAt.toISOString(),
        requesters: []
      };
      demand.variants.push(variantDemand);
    }

    demand.totalDemand += request.requestCount;
    variantDemand.totalDemand += request.requestCount;

    if (!request.notifiedAt) {
      demand.activeRequestCount += 1;
      variantDemand.activeRequestCount += 1;
      variantDemand.requesters.push({
        email: request.email,
        requestedAt: request.requestedAt.toISOString(),
        locale: request.locale
      });
    }
  }

  const restockDemand = [...demandByFragrance.values()]
    .map((demand) => ({
      ...demand,
      variants: demand.variants.sort(
        (a, b) =>
          b.activeRequestCount - a.activeRequestCount ||
          b.totalDemand - a.totalDemand ||
          a.sizeML - b.sizeML
      )
    }))
    .sort(
      (a, b) =>
        b.activeRequestCount - a.activeRequestCount ||
        b.totalDemand - a.totalDemand ||
        b.latestRequestAt.localeCompare(a.latestRequestAt)
    );

  return (
    <AdminCommunityClient
      locale={locale}
      accounts={accounts}
      subscribers={subscribers.map((subscriber) => ({
        id: subscriber.id,
        email: subscriber.email,
        createdAt: subscriber.createdAt.toISOString()
      }))}
      reviews={reviews.map((review) => ({
        id: review.id,
        reviewerName: review.reviewerName,
        userEmail: review.user.email,
        rating: review.rating,
        messageEn: review.messageEn,
        messageAr: review.messageAr,
        isPublished: review.isPublished,
        createdAt: review.createdAt.toISOString(),
        testimonialId: review.testimonial?.id ?? null,
        isTestimonial: Boolean(review.testimonial?.isPublished),
        testimonialPosition: review.testimonial?.position ?? null,
        fragrance: {
          slug: review.fragrance.slug,
          nameEn: review.fragrance.nameEn,
          nameAr: review.fragrance.nameAr,
          image: review.fragrance.images[0]
            ? {
                url: review.fragrance.images[0].url,
                altEn: review.fragrance.images[0].altEn,
                altAr: review.fragrance.images[0].altAr
              }
            : null
        }
      }))}
      restockDemand={restockDemand}
      totalSpent={accounts.reduce((sum, account) => sum + account.spent, 0)}
    />
  );
}
