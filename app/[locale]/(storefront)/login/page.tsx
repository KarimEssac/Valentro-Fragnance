import {getTranslations} from "next-intl/server";
import {headers} from "next/headers";

import LoginClient from "@/components/storefront/auth/LoginClient";
import Navbar from "@/components/storefront/layout/Navbar";
import SalesBar from "@/components/storefront/layout/SalesBar";

type LoginPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export default async function LoginPage({params}: LoginPageProps) {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: "pages"});

  const headersList = await headers();
  const referer = headersList.get("referer");
  const host = headersList.get("host");

  let defaultCallbackUrl = `/${locale}`;
  if (referer && host) {
    try {
      const refererUrl = new URL(referer);
      if (refererUrl.host === host && !refererUrl.pathname.includes("/login")) {
        defaultCallbackUrl = refererUrl.pathname + refererUrl.search;
      }
    } catch {
      // Ignore invalid URL
    }
  }

  return (
    <>
      <div className="absolute inset-x-0 top-0 z-50">
        <SalesBar />
        <Navbar cartCount={0} />
      </div>
      <main className="flex min-h-screen items-center justify-center bg-bg px-gutter pb-16 pt-32 text-on-surface sm:pt-40">
        <section className="w-full max-w-md border border-outline bg-surface p-6 sm:p-8">
          <p className="label-caps text-gold">VALENTRO</p>
          <h1 className="mt-4 font-serif text-3xl leading-tight text-parchment sm:text-4xl">
            {t("login")}
          </h1>
          <p className="mt-3 text-sm leading-6 text-on-surface/75">
            Enter your email to access member offers. New emails are created
            automatically.
          </p>
          <LoginClient defaultCallbackUrl={defaultCallbackUrl} />
        </section>
      </main>
    </>
  );
}
