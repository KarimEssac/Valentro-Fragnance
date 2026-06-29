import {OrderStatus} from "@prisma/client";

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

export const dynamic = "force-dynamic";

export default async function AdminCommunityPage({
  params
}: AdminCommunityPageProps) {
  const {locale} = await params;
  const [users, subscribers, reviews] = await Promise.all([
    prisma.user.findMany({
      orderBy: {createdAt: "desc"},
      include: {
        orders: {
          where: {status: {in: revenueStatuses}},
          select: {
            total: true
          }
        }
      }
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
    })
  ]);

  const accounts = users
    .map((user) => {
      const spent = user.orders.reduce(
        (sum, order) => sum + Number(order.total),
        0
      );

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt.toISOString(),
        spent,
        orderCount: user.orders.length
      };
    })
    .sort((a, b) => b.spent - a.spent || a.email.localeCompare(b.email));

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
      totalSpent={accounts.reduce((sum, account) => sum + account.spent, 0)}
    />
  );
}
