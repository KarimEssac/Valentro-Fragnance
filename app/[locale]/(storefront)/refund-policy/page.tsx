import type {Metadata} from "next";
import {getTranslations} from "next-intl/server";
import Navbar from "@/components/storefront/layout/Navbar";
import SalesBar from "@/components/storefront/layout/SalesBar";

type RefundPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

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

function ClockIcon() {
  return (
    <svg aria-hidden="true" className="mb-6 h-8 w-8 text-muted-brass" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25">
      <circle cx="12" cy="12" r="8" />
      <path d="M12 7.5V12l3 2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg aria-hidden="true" className="me-3 mt-1 h-4 w-4 shrink-0 text-warm-gold" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="m4.5 10 3.25 3.25L15.5 5.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BottleIcon() {
  return (
    <svg aria-hidden="true" className="mb-6 h-7 w-7 text-muted-brass" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.15">
      <path d="M9 3h6v4l2 2v11H7V9l2-2V3Z" strokeLinejoin="round" />
      <path d="M9 7h6M9.5 12h5" />
    </svg>
  );
}

function DiamondIcon() {
  return (
    <svg aria-hidden="true" className="mx-auto mb-4 h-7 w-7 text-muted-brass" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.15">
      <path d="m5 8 3-4h8l3 4-7 11L5 8Z" strokeLinejoin="round" />
      <path d="M5 8h14M8 4l4 15 4-15" />
    </svg>
  );
}

export default async function RefundPolicyPage({params}: RefundPageProps) {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: "refund"});
  const isRtl = locale === "ar";

  return (
    <div className="min-h-screen bg-parchment-base text-on-surface selection:bg-warm-gold selection:text-deep-onyx" dir={isRtl ? "rtl" : "ltr"}>
      <SalesBar />
      <Navbar cartCount={0} />

      {/* Main Content */}
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="px-margin-mobile md:px-margin-desktop py-section-gap max-w-container-max mx-auto text-center relative overflow-hidden">
          <div className="relative z-10 max-w-3xl mx-auto">
            <span className="font-label-caps text-label-caps text-muted-brass uppercase tracking-widest mb-6 block">
              {t("subtitle")}
            </span>
            <h1 className="font-display-lg text-[clamp(2.5rem,6vw,5.25rem)] text-deep-onyx mb-8 leading-none tracking-tighter">
              {t("title")}
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mx-auto leading-relaxed">
              {t("introduction")}
            </p>
          </div>
        </section>

        <div className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto mb-section-gap">
          <div className="w-full h-px bg-muted-brass/30" />
        </div>

        {/* The 30-Day Window */}
        <section className="px-margin-mobile md:px-margin-desktop py-16 max-w-container-max mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter items-center">
            <div className="md:col-span-5 md:col-start-2">
              <h2 className="font-headline-lg text-headline-lg text-deep-onyx mb-6 leading-tight">
                {t("sections.window.title")}
              </h2>
              <p className="font-body-lg text-body-lg text-on-surface-variant mb-6 leading-relaxed">
                {t("sections.window.desc1")}
              </p>
              <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                {t("sections.window.desc2")}
              </p>
            </div>
            <div className="md:col-span-5 md:col-start-8">
              <div className="bg-marble-vein p-12 relative overflow-hidden group">
                <div className="absolute inset-0 bg-parchment-base opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                <div className="relative z-10">
                  <ClockIcon />
                  <h3 className="font-headline-md text-headline-md text-deep-onyx mb-4 leading-snug">
                    {t("sections.window.timelineTitle")}
                  </h3>
                  <ul className="space-y-4 font-body-md text-body-md text-on-surface-variant">
                    <li className="flex items-start">
                      <CheckIcon />
                      <span>{t("sections.window.bullet1")}</span>
                    </li>
                    <li className="flex items-start">
                      <CheckIcon />
                      <span>{t("sections.window.bullet2")}</span>
                    </li>
                    <li className="flex items-start">
                      <CheckIcon />
                      <span>{t("sections.window.bullet3")}</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* The Sanctuary of Scent */}
        <section className="px-margin-mobile md:px-margin-desktop py-section-gap max-w-container-max mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter">
            <div className="md:col-span-6 order-2 md:order-1 mt-12 md:mt-0">
              <div
                className="bg-cover bg-center w-full h-[600px] border border-muted-brass/10"
                style={{backgroundImage: "url('/refund_policy_flatlay.png')"}}
              />
            </div>
            <div className="md:col-span-5 md:col-start-8 flex flex-col justify-center order-1 md:order-2">
              <BottleIcon />
              <h2 className="font-headline-lg text-headline-lg text-deep-onyx mb-6 leading-tight">
                {t("sections.sanctuary.title")}
              </h2>
              <p className="font-body-lg text-body-lg text-on-surface-variant mb-6 leading-relaxed">
                {t("sections.sanctuary.desc")}
              </p>
              <div className="border-s border-muted-brass ps-6 mt-8">
                <h4 className="font-label-caps text-label-caps text-deep-onyx uppercase tracking-widest mb-2 leading-none">
                  {t("sections.sanctuary.protocolTitle")}
                </h4>
                <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                  {t("sections.sanctuary.protocolDesc")}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* The Path to Resolution */}
        <section className="px-margin-mobile md:px-margin-desktop py-16 max-w-container-max mx-auto bg-surface-container-low">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="font-headline-lg text-headline-lg text-deep-onyx mb-6 leading-tight">
              {t("sections.path.title")}
            </h2>
            <p className="font-body-lg text-body-lg text-on-surface-variant">
              {t("sections.path.intro")}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="p-8 border border-muted-brass/20 hover:border-muted-brass/60 transition-colors duration-500 bg-surface">
              <div className="text-4xl font-headline-lg text-muted-brass mb-4 opacity-50">01</div>
              <h3 className="font-headline-md text-headline-md text-deep-onyx mb-4 text-2xl leading-snug">
                {t("sections.path.step1Title")}
              </h3>
              <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                {t("sections.path.step1Desc")}
              </p>
            </div>
            <div className="p-8 border border-muted-brass/20 hover:border-muted-brass/60 transition-colors duration-500 bg-surface">
              <div className="text-4xl font-headline-lg text-muted-brass mb-4 opacity-50">02</div>
              <h3 className="font-headline-md text-headline-md text-deep-onyx mb-4 text-2xl leading-snug">
                {t("sections.path.step2Title")}
              </h3>
              <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                {t("sections.path.step2Desc")}
              </p>
            </div>
            <div className="p-8 border border-muted-brass/20 hover:border-muted-brass/60 transition-colors duration-500 bg-surface">
              <div className="text-4xl font-headline-lg text-muted-brass mb-4 opacity-50">03</div>
              <h3 className="font-headline-md text-headline-md text-deep-onyx mb-4 text-2xl leading-snug">
                {t("sections.path.step3Title")}
              </h3>
              <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                {t("sections.path.step3Desc")}
              </p>
            </div>
          </div>
        </section>

        {/* Exclusions of Rarity */}
        <section className="px-margin-mobile md:px-margin-desktop py-section-gap max-w-container-max mx-auto">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <DiamondIcon />
            <h2 className="font-headline-lg text-headline-lg text-deep-onyx mb-6 leading-tight">
              {t("sections.exclusions.title")}
            </h2>
            <p className="font-body-lg text-body-lg text-on-surface-variant">
              {t("sections.exclusions.intro")}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter max-w-4xl mx-auto">
            <div className="p-10 bg-surface border-t border-muted-brass">
              <h3 className="font-headline-md text-headline-md text-deep-onyx mb-4 text-xl leading-snug">
                {t("sections.exclusions.card1Title")}
              </h3>
              <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                {t("sections.exclusions.card1Desc")}
              </p>
            </div>
            <div className="p-10 bg-surface border-t border-muted-brass">
              <h3 className="font-headline-md text-headline-md text-deep-onyx mb-4 text-xl leading-snug">
                {t("sections.exclusions.card2Title")}
              </h3>
              <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                {t("sections.exclusions.card2Desc")}
              </p>
            </div>
          </div>
          <div className="mt-16 text-center">
            <a
              href="mailto:concierge@valentro.com"
              className="inline-block bg-deep-onyx text-parchment-base font-label-caps text-label-caps uppercase tracking-widest px-10 py-5 hover:bg-warm-gold transition-colors duration-300"
            >
              {t("sections.exclusions.button")}
            </a>
          </div>
        </section>
      </main>
    </div>
  );
}
