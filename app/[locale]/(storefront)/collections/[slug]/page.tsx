import {getTranslations} from "next-intl/server";

type CollectionDetailPageProps = {
  params: Promise<{
    locale: string;
    slug: string;
  }>;
};

export default async function CollectionDetailPage({
  params
}: CollectionDetailPageProps) {
  const {locale, slug} = await params;
  const t = await getTranslations({locale, namespace: "pages"});

  return (
    <main className="min-h-screen bg-bg px-gutter py-24 text-on-surface lg:px-16">
      <h1 className="font-serif text-4xl text-parchment">
        {t("collectionDetail")}
      </h1>
      {/* TODO: Collection landing page and product grid. */}
      <p className="mt-4 text-sm text-on-surface/70">{slug}</p>
    </main>
  );
}
