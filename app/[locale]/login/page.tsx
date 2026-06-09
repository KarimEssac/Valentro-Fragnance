import {getTranslations} from "next-intl/server";

type LoginPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export default async function LoginPage({params}: LoginPageProps) {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: "pages"});

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg px-gutter text-on-surface">
      <section className="w-full max-w-md border border-umber bg-surface p-8">
        <p className="label-caps text-gold">VALENTRO</p>
        <h1 className="mt-4 font-serif text-4xl text-parchment">
          {t("login")}
        </h1>
        {/* TODO: Build credentials sign-in form wired to NextAuth. */}
      </section>
    </main>
  );
}
