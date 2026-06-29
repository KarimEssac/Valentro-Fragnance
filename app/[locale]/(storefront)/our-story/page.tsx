import {redirect} from "next/navigation";

type OurStoryRedirectPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export default async function OurStoryRedirectPage({
  params
}: OurStoryRedirectPageProps) {
  const {locale} = await params;
  redirect(`/${locale}/about-us`);
}
