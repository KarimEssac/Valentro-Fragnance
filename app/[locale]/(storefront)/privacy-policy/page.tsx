import type {Metadata} from "next";
import {getTranslations} from "next-intl/server";
import Navbar from "@/components/storefront/layout/Navbar";
import SalesBar from "@/components/storefront/layout/SalesBar";

type PrivacyPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export async function generateMetadata({
  params
}: PrivacyPageProps): Promise<Metadata> {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: "privacy"});

  return {
    title: t("metaTitle"),
    description: t("metaDescription")
  };
}

export default async function PrivacyPolicyPage({params}: PrivacyPageProps) {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: "privacy"});
  const isRtl = locale === "ar";

  return (
    <div className="min-h-screen bg-parchment-base text-on-surface selection:bg-warm-gold selection:text-deep-onyx" dir={isRtl ? "rtl" : "ltr"}>
      {/* Navigation Header */}
      <div className="absolute inset-x-0 top-0 z-50">
        <SalesBar />
        <Navbar cartCount={0} />
      </div>

      {/* Main Content */}
      <main className="pt-32 pb-section-gap max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
        {/* Introduction */}
        <section className="grid grid-cols-12 gap-gutter mb-section-gap items-center min-h-[614px]">
          <div className="col-span-12 md:col-span-8 md:col-start-3 text-center">
            <span className="font-label-caps text-label-caps text-muted-brass block mb-8 uppercase tracking-widest">
              {t("subtitle")}
            </span>
            <h1 className="font-display-lg text-[clamp(2.5rem,6vw,5.25rem)] text-deep-onyx mb-12 leading-none">
              {t("title")}
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant mx-auto max-w-3xl leading-relaxed">
              {t("introduction")}
            </p>
          </div>
        </section>

        <div className="w-full h-px bg-muted-brass/30 mb-section-gap" />

        {/* Data Collection */}
        <section className="grid grid-cols-12 gap-gutter mb-section-gap">
          <div className="col-span-12 md:col-span-4 mb-8 md:mb-0">
            <h2 className="font-headline-lg text-headline-lg text-deep-onyx sticky top-32 leading-tight">
              {t("sections.essence.title")}
            </h2>
          </div>
          <div className="col-span-12 md:col-span-7 md:col-start-6">
            <p className="font-body-lg text-body-lg text-on-surface-variant mb-12 leading-relaxed">
              {t("sections.essence.intro")}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              {/* Bento Grid Style Cards */}
              <div className="bg-marble-vein p-8 border border-muted-brass/10 hover:border-warm-gold/50 transition-colors duration-500">
                <span className="material-symbols-outlined text-muted-brass mb-4 text-3xl block" data-icon="badge">
                  badge
                </span>
                <h3 className="font-headline-md text-headline-md text-deep-onyx mb-4 text-2xl leading-snug">
                  {t("sections.essence.card1.title")}
                </h3>
                <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                  {t("sections.essence.card1.desc")}
                </p>
              </div>

              <div className="bg-marble-vein p-8 border border-muted-brass/10 hover:border-warm-gold/50 transition-colors duration-500">
                <span className="material-symbols-outlined text-muted-brass mb-4 text-3xl block" data-icon="cruelty_free">
                  cruelty_free
                </span>
                <h3 className="font-headline-md text-headline-md text-deep-onyx mb-4 text-2xl leading-snug">
                  {t("sections.essence.card2.title")}
                </h3>
                <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                  {t("sections.essence.card2.desc")}
                </p>
              </div>

              <div className="bg-marble-vein p-8 border border-muted-brass/10 hover:border-warm-gold/50 transition-colors duration-500 md:col-span-2">
                <span className="material-symbols-outlined text-muted-brass mb-4 text-3xl block" data-icon="memory">
                  memory
                </span>
                <h3 className="font-headline-md text-headline-md text-deep-onyx mb-4 text-2xl leading-snug">
                  {t("sections.essence.card3.title")}
                </h3>
                <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                  {t("sections.essence.card3.desc")}
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className="w-full h-px bg-muted-brass/30 mb-section-gap" />

        {/* Usage */}
        <section className="grid grid-cols-12 gap-gutter mb-section-gap">
          <div className="col-span-12 md:col-span-7 mb-12 md:mb-0 order-2 md:order-1">
            <div className="space-y-12">
              <div>
                <h3 className="font-headline-md text-headline-md text-deep-onyx mb-4 leading-snug">
                  {t("sections.curate.item1.title")}
                </h3>
                <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed">
                  {t("sections.curate.item1.desc")}
                </p>
              </div>
              <div>
                <h3 className="font-headline-md text-headline-md text-deep-onyx mb-4 leading-snug">
                  {t("sections.curate.item2.title")}
                </h3>
                <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed">
                  {t("sections.curate.item2.desc")}
                </p>
              </div>
              <div>
                <h3 className="font-headline-md text-headline-md text-deep-onyx mb-4 leading-snug">
                  {t("sections.curate.item3.title")}
                </h3>
                <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed">
                  {t("sections.curate.item3.desc")}
                </p>
              </div>
            </div>
          </div>
          <div className="col-span-12 md:col-span-4 md:col-start-9 order-1 md:order-2">
            <h2 className="font-headline-lg text-headline-lg text-deep-onyx sticky top-32 leading-tight">
              {t("sections.curate.title")}
            </h2>
          </div>
        </section>

        <div className="w-full h-px bg-muted-brass/30 mb-section-gap" />

        {/* Your Rights */}
        <section className="grid grid-cols-12 gap-gutter mb-section-gap">
          <div className="col-span-12 md:col-span-5 mb-8 md:mb-0">
            <h2 className="font-headline-lg text-headline-lg text-deep-onyx mb-6 leading-tight">
              {t("sections.sovereignty.title")}
            </h2>
            <p className="font-body-lg text-body-lg text-on-surface-variant mb-12 leading-relaxed">
              {t("sections.sovereignty.intro")}
            </p>
            <a
              className="inline-flex items-center gap-4 bg-transparent border border-deep-onyx text-deep-onyx px-8 py-4 font-label-caps text-label-caps hover:bg-deep-onyx hover:text-parchment-base transition-all duration-300"
              href="mailto:privacy@valentro.com"
            >
              {t("sections.sovereignty.button")}
              <span className={`material-symbols-outlined text-sm ${isRtl ? "rotate-180" : ""}`} data-icon="arrow_forward">
                arrow_forward
              </span>
            </a>
          </div>
          <div className="col-span-12 md:col-span-6 md:col-start-7">
            <ul className="space-y-8 border-s border-muted-brass/20 ps-8 relative">
              <li className="relative">
                <div className={`absolute top-2.5 w-2.5 h-2.5 bg-warm-gold rounded-full ${isRtl ? "-right-[38px]" : "-left-[38px]"}`} />
                <h4 className="font-headline-md text-headline-md text-deep-onyx text-xl mb-2 leading-snug">
                  {t("sections.sovereignty.right1.title")}
                </h4>
                <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                  {t("sections.sovereignty.right1.desc")}
                </p>
              </li>
              <li className="relative">
                <div className={`absolute top-2.5 w-2.5 h-2.5 bg-warm-gold rounded-full ${isRtl ? "-right-[38px]" : "-left-[38px]"}`} />
                <h4 className="font-headline-md text-headline-md text-deep-onyx text-xl mb-2 leading-snug">
                  {t("sections.sovereignty.right2.title")}
                </h4>
                <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                  {t("sections.sovereignty.right2.desc")}
                </p>
              </li>
              <li className="relative">
                <div className={`absolute top-2.5 w-2.5 h-2.5 bg-warm-gold rounded-full ${isRtl ? "-right-[38px]" : "-left-[38px]"}`} />
                <h4 className="font-headline-md text-headline-md text-deep-onyx text-xl mb-2 leading-snug">
                  {t("sections.sovereignty.right3.title")}
                </h4>
                <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                  {t("sections.sovereignty.right3.desc")}
                </p>
              </li>
            </ul>
          </div>
        </section>

        <div className="w-full h-px bg-muted-brass/30 mb-section-gap" />

        {/* Security */}
        <section className="grid grid-cols-12 gap-gutter">
          <div className="col-span-12 md:col-span-10 md:col-start-2 text-center">
            <h2 className="font-headline-lg text-headline-lg text-deep-onyx mb-8 leading-tight">
              {t("sections.bastion.title")}
            </h2>
            <div className="max-w-4xl mx-auto space-y-8">
              <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed">
                {t("sections.bastion.desc1")}
              </p>
              <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed">
                {t("sections.bastion.desc2")}
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
