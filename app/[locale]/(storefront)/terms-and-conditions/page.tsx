import type {Metadata} from "next";
import Link from "next/link";
import {getTranslations} from "next-intl/server";

import Navbar from "@/components/storefront/layout/Navbar";
import SalesBar from "@/components/storefront/layout/SalesBar";

type TermsPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

const sectionKeys = [
  "acceptance",
  "orders",
  "products",
  "pricing",
  "delivery",
  "returns",
  "care",
  "intellectualProperty",
  "changes",
  "contact"
] as const;

export async function generateMetadata({params}: TermsPageProps): Promise<Metadata> {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: "terms"});

  return {
    title: t("metaTitle"),
    description: t("metaDescription")
  };
}

export default async function TermsAndConditionsPage({params}: TermsPageProps) {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: "terms"});
  const isRtl = locale === "ar";

  return (
    <div
      className="min-h-screen bg-parchment-base text-on-surface selection:bg-warm-gold selection:text-deep-onyx"
      dir={isRtl ? "rtl" : "ltr"}
    >
      <div className="absolute inset-x-0 top-0 z-50">
        <SalesBar />
        <Navbar cartCount={0} />
      </div>

      <main className="mx-auto max-w-container-max px-margin-mobile pb-section-gap pt-32 md:px-margin-desktop">
        <section className="mx-auto max-w-3xl py-16 text-center md:py-24">
          <span className="font-label-caps mb-6 block text-label-caps uppercase tracking-widest text-muted-brass">
            {t("subtitle")}
          </span>
          <h1 className="font-display-lg text-[clamp(2.5rem,6vw,5.25rem)] leading-none tracking-tighter text-deep-onyx">
            {t("title")}
          </h1>
          <p className="font-body-lg mx-auto mt-8 max-w-2xl text-body-lg leading-relaxed text-on-surface-variant">
            {t("introduction")}
          </p>
          <p className="font-label-caps mt-7 text-label-caps uppercase tracking-widest text-muted-brass">
            {t("lastUpdated")}
          </p>
        </section>

        <div className="h-px w-full bg-muted-brass/30" />

        <section className="mx-auto max-w-4xl divide-y divide-muted-brass/25">
          {sectionKeys.map((key) => (
            <article key={key} className="grid gap-4 py-9 md:grid-cols-12 md:gap-gutter md:py-12">
              <h2 className="font-headline-md text-headline-md text-2xl leading-snug text-deep-onyx md:col-span-4">
                {t(`sections.${key}.title`)}
              </h2>
              <p className="font-body-lg text-body-lg leading-relaxed text-on-surface-variant md:col-span-7 md:col-start-6">
                {t(`sections.${key}.body`)}
                {key === "returns" ? (
                  <>
                    {" "}
                    <Link
                      href={`/${locale}/refund-policy`}
                      className="text-deep-onyx underline decoration-warm-gold underline-offset-4 transition-colors hover:text-warm-gold"
                    >
                      {isRtl ? "عرض سياسة الاسترجاع" : "View the Refund Policy"}
                    </Link>
                    .
                  </>
                ) : null}
              </p>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}
