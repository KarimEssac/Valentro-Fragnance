import Image from "next/image";
import Link from "next/link";
import {notFound} from "next/navigation";

import Navbar from "@/components/storefront/layout/Navbar";
import SalesBar from "@/components/storefront/layout/SalesBar";
import {prisma} from "@/lib/prisma";
import {getProductTransitionName} from "@/lib/product-image-transition";
import CollectionFragranceLink from "@/components/storefront/product/CollectionFragranceLink";

type CollectionDetailPageProps = {
  params: Promise<{
    locale: string;
    slug: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function CollectionDetailPage({
  params
}: CollectionDetailPageProps) {
  const {locale, slug} = await params;
  const isArabic = locale === "ar";
  const collection = await prisma.collection.findFirst({
    where: {
      slug,
      isOffer: true,
      isPublished: true
    },
    include: {
      fragrances: {
        include: {
          fragrance: {
            select: {
              id: true,
              slug: true,
              nameEn: true,
              nameAr: true,
              taglineEn: true,
              taglineAr: true,
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

  if (!collection) notFound();

  const money = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "EGP",
    maximumFractionDigits: 0
  });
  const name = isArabic ? collection.nameAr : collection.nameEn;
  const description = isArabic
    ? collection.descriptionAr
    : collection.descriptionEn;
  const products = collection.fragrances.map(({fragrance}) => fragrance);
  const combinedValue = products.reduce(
    (sum, product) => sum + Number(product.variants[0]?.price ?? 0),
    0
  );
  const offerPrice = Number(collection.offerPrice ?? 0);
  const discountPercent =
    combinedValue > 0 && offerPrice > 0
      ? Math.max(0, Math.round(((combinedValue - offerPrice) / combinedValue) * 100))
      : 0;

  return (
    <main className="min-h-screen bg-bg text-parchment">
      <SalesBar />
      <Navbar cartCount={0} />
      <section className="px-gutter pb-24 pt-12 lg:px-16">
        <div className="mx-auto grid max-w-container gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
          <div
            data-product-transition-target={slug}
            style={{viewTransitionName: getProductTransitionName(slug)}}
            className="relative aspect-[4/5] overflow-hidden bg-surface"
          >
            <Image
              src={collection.coverImage}
              alt={name}
              fill
              unoptimized
              priority
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
            <div className="absolute left-5 top-5 label-caps bg-parchment px-4 py-2 text-surface-hi">
              Collection
            </div>
          </div>

          <div className="lg:sticky lg:top-24">
            <p className="label-caps mb-4 text-gold">
              {collection.code ?? collection.slug}
            </p>
            <h1 className="font-serif text-[clamp(2.5rem,5vw,5rem)] leading-none">
              {name}
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-on-surface/75">
              {description || "A limited bundle curated by Valentro."}
            </p>

            <div className="mt-8 grid grid-cols-3 gap-4 border-y border-outline/70 py-6">
              <div>
                <p className="label-caps mb-2 text-on-surface/55">Bundle</p>
                <p className="font-serif text-2xl">{money.format(offerPrice)}</p>
              </div>
              <div>
                <p className="label-caps mb-2 text-on-surface/55">Value</p>
                <p className="font-serif text-2xl line-through">
                  {money.format(combinedValue)}
                </p>
              </div>
              <div>
                <p className="label-caps mb-2 text-on-surface/55">Savings</p>
                <p className="font-serif text-2xl">{discountPercent}%</p>
              </div>
            </div>

            <Link
              href={`/${locale}/fragrances`}
              className="label-caps mt-8 inline-flex min-h-12 items-center justify-center border border-parchment px-8 text-parchment transition-colors hover:bg-parchment hover:text-surface-hi"
            >
              Continue Shopping
            </Link>
          </div>
        </div>

        <div className="mx-auto mt-20 max-w-container">
          <div className="mb-8 flex items-end justify-between gap-6 border-b border-outline/70 pb-5">
            <h2 className="font-serif text-3xl leading-tight">Included Fragrances</h2>
            <span className="label-caps text-on-surface/60">{products.length} pieces</span>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-12 sm:gap-x-6 md:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => {
              const productName = isArabic ? product.nameAr : product.nameEn;
              const tagline = isArabic ? product.taglineAr : product.taglineEn;
              const image = product.images[0] ?? null;
              const imageAlt = image ? (isArabic ? image.altAr : image.altEn) : productName;

              return (
                <CollectionFragranceLink
                  key={product.id}
                  locale={locale}
                  slug={product.slug}
                  imageUrl={image?.url ?? null}
                  imageAlt={imageAlt}
                  className="group block"
                >
                  <div
                    data-product-transition-source
                    className="relative mb-4 aspect-[3/4] overflow-hidden bg-surface"
                  >
                    {image ? (
                      <Image
                        src={image.url}
                        alt={imageAlt}
                        fill
                        unoptimized
                        sizes="(min-width: 1024px) 24vw, 50vw"
                        className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02]"
                      />
                    ) : null}
                  </div>
                  <div className="text-center">
                    <h3 className="font-serif text-2xl leading-tight">{productName}</h3>
                    <p className="mx-auto mt-2 line-clamp-2 min-h-10 max-w-[17rem] text-sm leading-5 text-on-surface/70">
                      {tagline}
                    </p>
                    <p className="label-caps mt-3 text-on-surface/70">
                      {product.variants[0]?.price
                        ? money.format(Number(product.variants[0].price))
                        : "Price on request"}
                    </p>
                  </div>
                </CollectionFragranceLink>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
