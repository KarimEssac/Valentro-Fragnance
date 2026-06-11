import type {Metadata} from "next";
import {Hanken_Grotesk, Libre_Caslon_Text} from "next/font/google";
import {notFound} from "next/navigation";
import {NextIntlClientProvider} from "next-intl";
import {getMessages, getTranslations} from "next-intl/server";
import type {ReactNode} from "react";

import "../globals.css";
import RouteLoadingProvider from "@/components/storefront/loading/RouteLoadingProvider";
import {getTextDirection, isLocale, locales} from "@/lib/i18n";

const serif = Libre_Caslon_Text({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-serif",
  display: "swap"
});

const sans = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap"
});

type LocaleLayoutProps = {
  children: ReactNode;
  params: Promise<{
    locale: string;
  }>;
};

export async function generateMetadata({
  params
}: LocaleLayoutProps): Promise<Metadata> {
  const {locale} = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const t = await getTranslations({locale, namespace: "meta"});

  return {
    title: t("title"),
    description: t("description")
  };
}

export function generateStaticParams() {
  return locales.map((locale) => ({locale}));
}

export default async function LocaleLayout({
  children,
  params
}: LocaleLayoutProps) {
  const {locale} = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const messages = await getMessages();
  const direction = getTextDirection(locale);

  return (
    <html
      lang={locale}
      dir={direction}
      className={`${serif.variable} ${sans.variable}`}
      suppressHydrationWarning
    >
      <body>
        <NextIntlClientProvider messages={messages}>
          <RouteLoadingProvider>{children}</RouteLoadingProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
