import type {Metadata} from "next";
import {getTranslations} from "next-intl/server";

type RefundPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

const sections = ["returns", "damaged", "opened", "incorrect", "refunds", "support"] as const;

export async function generateMetadata({
  params
}: RefundPageProps): Promise<Metadata> {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: "refund"});

  return {
    title: t("metaTitle"),
    description: t("metaDescription")
  };
}

export default async function RefundPolicyPage({params}: RefundPageProps) {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: "refund"});

  return (
    <main
      className="min-h-screen bg-parchment-base text-on-surface selection:bg-warm-gold selection:text-deep-onyx"
      dir={locale === "ar" ? "rtl" : "ltr"}
    >
      <div className="mx-auto max-w-container-max px-margin-mobile pb-section-gap md:px-margin-desktop">
        <header className="mx-auto max-w-3xl pb-12 text-center md:pb-16">
          <p className="mb-6 font-label-caps text-label-caps uppercase tracking-widest text-muted-brass">
            {t("brand")}
          </p>
          <h1 className="mb-8 font-display-lg text-[clamp(2.5rem,6vw,5.25rem)] leading-none tracking-tighter text-deep-onyx">
            {t("title")}
          </h1>
          <p className="mx-auto max-w-2xl whitespace-pre-line font-body-lg text-body-lg leading-relaxed text-on-surface-variant">
            {t("introduction")}
          </p>
        </header>

        <div className="mx-auto max-w-3xl divide-y divide-muted-brass/25 border-y border-muted-brass/30 text-center">
          {sections.map((section) => (
            <section key={section} className="py-8 md:py-10">
              <h2 className="mb-4 font-headline-md text-headline-md leading-snug text-deep-onyx">
                {t(`sections.${section}.title`)}
              </h2>
              <div className="mx-auto max-w-2xl space-y-4 font-body-lg text-body-lg leading-relaxed text-on-surface-variant">
                {t(`sections.${section}.body`).split("\n\n").map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
              {section === "support" ? (
                <a
                  href="mailto:concierge@valentro.com"
                  className="mt-6 inline-block bg-deep-onyx px-8 py-4 font-label-caps text-label-caps uppercase tracking-widest text-parchment-base transition-colors hover:bg-warm-gold"
                >
                  {t("contact")}
                </a>
              ) : null}
            </section>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="font-label-caps text-label-caps uppercase tracking-widest text-muted-brass">
            {t("brand")}
          </p>
          <p className="mt-3 font-headline-md text-headline-md text-deep-onyx">{t("signature")}</p>
          <p className="mt-3 font-body-md text-body-md text-on-surface-variant">{t("closing")}</p>
        </div>
      </div>
    </main>
  );
}
