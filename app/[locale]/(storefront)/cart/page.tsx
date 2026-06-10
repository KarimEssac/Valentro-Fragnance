import {getTranslations} from "next-intl/server";

type CartPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export default async function CartPage({params}: CartPageProps) {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: "pages"});

  return (
    <main className="min-h-screen bg-bg px-gutter py-16 text-on-surface sm:py-24 lg:px-16">
      <h1 className="font-serif text-3xl leading-tight text-parchment sm:text-4xl">{t("cart")}</h1>
      {/* TODO: Cart line items, coupon application, and COD checkout entry. */}
    </main>
  );
}
