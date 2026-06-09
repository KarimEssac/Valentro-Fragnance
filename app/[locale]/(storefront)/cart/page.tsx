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
    <main className="min-h-screen bg-bg px-gutter py-24 text-on-surface lg:px-16">
      <h1 className="font-serif text-4xl text-parchment">{t("cart")}</h1>
      {/* TODO: Cart line items, coupon application, and COD checkout entry. */}
    </main>
  );
}
