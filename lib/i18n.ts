import {getRequestConfig} from "next-intl/server";

export const locales = ["en", "ar"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

export function getTextDirection(locale: Locale): "ltr" | "rtl" {
  return locale === "ar" ? "rtl" : "ltr";
}

export default getRequestConfig(async ({locale, requestLocale}) => {
  const requestedLocale = locale ?? (await requestLocale);
  const resolvedLocale =
    requestedLocale && isLocale(requestedLocale) ? requestedLocale : defaultLocale;

  return {
    locale: resolvedLocale,
    messages: (await import(`../messages/${resolvedLocale}.json`)).default
  };
});
