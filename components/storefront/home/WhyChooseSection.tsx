import {getLocale, getTranslations} from "next-intl/server";
import Image from "next/image";

const features = [
  {key: "longevity", icon: "clock"},
  {key: "projection", icon: "perfume"},
  {key: "concentration", icon: "drop"},
  {key: "ingredients", icon: "leaf"},
  {key: "craftsmanship", icon: "flask"},
  {key: "identity", icon: "crown"},
  {key: "detail", icon: "diamond"},
  {key: "excellence", icon: "shield"}
] as const;

const promises = [
  {key: "luxury", icon: "star"},
  {key: "quality", icon: "leaf"},
  {key: "extrait", icon: "drop"},
  {key: "legacy", icon: "shield"}
] as const;

type IconName = (typeof features)[number]["icon"] | (typeof promises)[number]["icon"];

function Icon({name, className}: {name: IconName; className?: string}) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.35"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {name === "clock" && (
        <>
          <circle cx="16" cy="16" r="11" />
          <path d="M16 8v8l5 3" />
          <path d="M16 3v2m0 22v2M3 16h2m22 0h2" />
        </>
      )}
      {name === "perfume" && (
        <>
          <path d="M12 4h8v4h-8zM14 8v4m4-4v4M10 12h12v15H10z" />
          <path d="M13 17c2 2 4 2 6 0M23 6l2-2m0 6h3m-4 3 2 2" />
        </>
      )}
      {name === "drop" && (
        <>
          <path d="M16 3C13 8 7 14 7 19a9 9 0 0 0 18 0c0-5-6-11-9-16Z" />
          <path d="M11 20a5 5 0 0 0 5 5" />
        </>
      )}
      {name === "leaf" && (
        <>
          <path d="M27 5C15 5 6 9 6 19a8 8 0 0 0 8 8C24 27 27 17 27 5Z" />
          <path d="M7 26c4-7 9-11 16-15" />
        </>
      )}
      {name === "flask" && (
        <>
          <path d="M11 4h10M13 4v9L6 25a2 2 0 0 0 2 3h16a2 2 0 0 0 2-3l-7-12V4" />
          <path d="M10 21h12m-9 3h.01m6 1h.01" />
        </>
      )}
      {name === "crown" && (
        <>
          <path d="m4 11 6 5 6-9 6 9 6-5-2 14H6L4 11Z" />
          <path d="M7 28h18" />
          <circle cx="4" cy="10" r="1" />
          <circle cx="16" cy="6" r="1" />
          <circle cx="28" cy="10" r="1" />
        </>
      )}
      {name === "diamond" && (
        <>
          <path d="M8 6h16l6 9-14 14L2 15l6-9Z" />
          <path d="M2 15h28M8 6l4 9 4 14 4-14 4-9" />
        </>
      )}
      {name === "shield" && (
        <>
          <path d="M16 3c4 3 8 4 12 4v9c0 7-4 11-12 14C8 27 4 23 4 16V7c4 0 8-1 12-4Z" />
          <path d="m11 16 4 4 7-8" />
        </>
      )}
      {name === "star" && (
        <path d="m16 3 3.9 8.2 9.1 1.2-6.6 6.5 1.6 9.1-8-4.3-8 4.3 1.6-9.1L3 12.4l9.1-1.2L16 3Z" />
      )}
    </svg>
  );
}

export default async function WhyChooseSection() {
  const locale = await getLocale();
  const t = await getTranslations({locale, namespace: "whyChoose"});

  return (
    <section
      aria-labelledby="why-valentro-title"
      className="bg-surface px-gutter py-20 text-parchment sm:py-24 lg:py-32"
    >
      <div className="mx-auto max-w-container">
        <div className="border border-outline bg-surface">
          <div className="grid lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.55fr)]">
            <div className="flex flex-col items-center border-b border-outline px-6 py-12 text-center sm:px-10 sm:py-16 lg:border-b-0 lg:border-e lg:px-12 lg:py-20">
              <Image
                src="/valentro-logo.png"
                alt="Valentro monogram and wordmark"
                width={1774}
                height={887}
                sizes="(min-width: 1024px) 360px, 80vw"
                className="h-auto w-full max-w-[360px]"
              />
              <span aria-hidden="true" className="my-6 h-px w-20 bg-gold/45" />
              <p className="label-caps text-gold">{t("eyebrow")}</p>
              <h2
                id="why-valentro-title"
                className="mt-5 font-serif text-4xl leading-tight sm:text-5xl"
              >
                {t("title")}
              </h2>
              <p className="mt-6 max-w-md text-base leading-8 text-on-surface/85">
                {t("intro")}
              </p>
              <div className="mt-12 max-w-sm border-t border-gold/40 pt-8">
                <p className="label-caps text-gold">{t("closingLabel")}</p>
                <p className="mt-4 font-serif text-xl leading-relaxed sm:text-2xl">
                  {t("closing")}
                </p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2">
              {features.map((feature) => (
                <article
                  key={feature.key}
                  className="flex gap-4 border-b border-outline px-6 py-7 last:border-b-0 sm:min-h-48 sm:gap-5 sm:px-7 sm:py-8 sm:[&:nth-last-child(2)]:border-b-0 sm:[&:nth-child(odd)]:border-e xl:px-9"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-gold/35 bg-parchment text-[#dfc49a]">
                    <Icon name={feature.icon} className="h-7 w-7" />
                  </div>
                  <div>
                    <h3 className="font-serif text-lg leading-snug sm:text-xl">
                      {t(`features.${feature.key}.title`)}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-on-surface/80">
                      {t(`features.${feature.key}.description`)}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <ul className="grid grid-cols-2 gap-6 border-t border-outline px-6 py-7 sm:grid-cols-4 sm:px-10 lg:px-12">
            {promises.map((promise) => (
              <li key={promise.key} className="flex items-center gap-3">
                <Icon name={promise.icon} className="h-7 w-7 shrink-0 text-gold" />
                <span className="text-[10px] font-semibold uppercase leading-5 tracking-[0.1em] text-on-surface sm:text-xs">
                  {t(`promises.${promise.key}`)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
