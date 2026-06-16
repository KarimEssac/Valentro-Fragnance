import {getTranslations} from "next-intl/server";

import AdminCollectionsClient from "@/components/admin/AdminCollectionsClient";
import AdminShell from "@/components/admin/AdminShell";
import {prisma} from "@/lib/prisma";

type AdminCollectionsPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export default async function AdminCollectionsPage({
  params
}: AdminCollectionsPageProps) {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: "admin"});

  const [products, collections] = await Promise.all([
    prisma.fragrance.findMany({
      orderBy: [{position: "asc"}, {createdAt: "desc"}],
      select: {
        id: true,
        slug: true,
        nameEn: true,
        images: {
          orderBy: [{isPrimary: "desc"}, {position: "asc"}],
          take: 1,
          select: {url: true}
        },
        variants: {
          orderBy: {price: "asc"},
          take: 1,
          select: {price: true}
        }
      }
    }),
    prisma.collection.findMany({
      where: {isOffer: true},
      orderBy: [{position: "asc"}, {createdAt: "desc"}],
      include: {
        fragrances: {
          include: {
            fragrance: {
              select: {
                id: true,
                slug: true,
                nameEn: true,
                images: {
                  orderBy: [{isPrimary: "desc"}, {position: "asc"}],
                  take: 1,
                  select: {url: true}
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
    })
  ]);

  return (
    <AdminShell title={t("collections")} fullWidth framed={false} showTitle={false}>
      <AdminCollectionsClient
        locale={locale}
        products={products.map((product) => ({
          id: product.id,
          slug: product.slug,
          nameEn: product.nameEn,
          image: product.images[0]?.url ?? null,
          price: product.variants[0]?.price.toString() ?? null
        }))}
        collections={collections.map((collection) => ({
          id: collection.id,
          slug: collection.slug,
          code: collection.code,
          nameEn: collection.nameEn,
          descriptionEn: collection.descriptionEn,
          coverImage: collection.coverImage,
          offerPrice: collection.offerPrice?.toString() ?? null,
          isPublished: collection.isPublished,
          position: collection.position,
          products: collection.fragrances.map(({fragrance}) => ({
            id: fragrance.id,
            slug: fragrance.slug,
            nameEn: fragrance.nameEn,
            image: fragrance.images[0]?.url ?? null,
            price: fragrance.variants[0]?.price.toString() ?? null
          }))
        }))}
      />
    </AdminShell>
  );
}
