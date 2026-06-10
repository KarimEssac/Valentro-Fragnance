import {getTranslations} from "next-intl/server";

type ProductDetailPageProps = {
  params: Promise<{
    locale: string;
    slug: string;
  }>;
};

export default async function ProductDetailPage({
  params
}: ProductDetailPageProps) {
  const {locale, slug} = await params;
  const t = await getTranslations({locale, namespace: "pages"});

  return (
    <main className="min-h-screen bg-bg px-gutter py-16 text-on-surface sm:py-24 lg:px-16">
      <h1 className="font-serif text-3xl leading-tight text-parchment sm:text-4xl">
        {t("productDetail")}
      </h1>
      {/* TODO: Product detail page for fragrance slug. */}
      <p className="mt-4 text-sm text-on-surface/70">{slug}</p>
    </main>
  );
}
