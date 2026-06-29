import Image from "next/image";
import type {Metadata} from "next";

import Navbar from "@/components/storefront/layout/Navbar";

type AboutUsPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

type SocialLink = {
  label: string;
  href: string;
  icon: "facebook" | "instagram" | "tiktok" | "github" | "linkedin" | "portfolio" | "whatsapp";
};

const peterLinks: SocialLink[] = [
  {label: "Facebook", href: "https://www.facebook.com/peter.emil.71", icon: "facebook"},
  {label: "Instagram", href: "https://www.instagram.com/peter.wagdy_23/", icon: "instagram"}
];

const karimLinks: SocialLink[] = [
  {label: "GitHub", href: "https://github.com/KarimEssac/", icon: "github"},
  {label: "LinkedIn", href: "https://www.linkedin.com/in/karimessac/", icon: "linkedin"},
  {label: "Portfolio", href: "https://karimessac.github.io/My-Portfolio/", icon: "portfolio"},
  {label: "Facebook", href: "https://www.facebook.com/Karim.essac/", icon: "facebook"},
  {label: "WhatsApp", href: "https://wa.me/201200989845", icon: "whatsapp"}
];

const valentroLinks: SocialLink[] = [
  {label: "Facebook", href: "#valentro-facebook", icon: "facebook"},
  {label: "Instagram", href: "#valentro-instagram", icon: "instagram"},
  {label: "TikTok", href: "#valentro-tiktok", icon: "tiktok"}
];

const aboutHeroImage =
  "https://res.cloudinary.com/dpmmlk1zg/image/upload/v1782725829/valentro/site/about-us-heritage.webp";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "About Us | Valentro",
    description:
      "Meet Valentro, our story, our origins, our passion, and the people behind the fragrance house."
  };
}

function SocialIcon({icon}: {icon: SocialLink["icon"]}) {
  switch (icon) {
    case "facebook":
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-current">
          <path d="M13.5 22v-8h2.7l.4-3h-3.1V9.1c0-.9.3-1.5 1.6-1.5h1.7V4.9c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3V11H7.3v3h2.8v8h3.4Z" />
        </svg>
      );
    case "instagram":
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <path d="M17.5 6.5h.01" />
        </svg>
      );
    case "tiktok":
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-current">
          <path d="M16.4 3c.4 2.4 1.8 3.9 4.1 4.1v3.1a7.4 7.4 0 0 1-4-1.2v6.4c0 3.8-2.2 5.6-5.2 5.6A5.1 5.1 0 0 1 6 16c0-3.2 2.4-5.3 5.8-5.1v3.2c-1.5-.2-2.6.5-2.6 1.9 0 1.2.9 2 2 2 1.3 0 2-.8 2-2.5V3h3.2Z" />
        </svg>
      );
    case "github":
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-current">
          <path d="M12 2a10 10 0 0 0-3.2 19.5c.5.1.7-.2.7-.5v-1.8c-2.9.6-3.5-1.2-3.5-1.2-.5-1.1-1.1-1.4-1.1-1.4-.9-.6.1-.6.1-.6 1 0 1.6 1.1 1.6 1.1.9 1.5 2.4 1.1 3 .8.1-.7.4-1.1.7-1.4-2.3-.3-4.7-1.1-4.7-5a3.9 3.9 0 0 1 1-2.7c-.1-.3-.5-1.3.1-2.7 0 0 .9-.3 2.8 1a9.6 9.6 0 0 1 5 0c1.9-1.3 2.8-1 2.8-1 .6 1.4.2 2.4.1 2.7a3.9 3.9 0 0 1 1 2.7c0 3.9-2.4 4.7-4.7 5 .4.3.8 1 .8 2v2.5c0 .3.2.6.7.5A10 10 0 0 0 12 2Z" />
        </svg>
      );
    case "linkedin":
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-current">
          <path d="M6.5 8.8H3.3V21h3.2V8.8ZM4.9 3A1.9 1.9 0 1 0 5 6.8 1.9 1.9 0 0 0 4.9 3Zm16 11c0-3.3-1.8-5.4-4.6-5.4-2.1 0-3.1 1.2-3.6 2V8.8H9.5V21h3.2v-6.1c0-1.6.3-3.2 2.3-3.2s2 1.9 2 3.3v6h3.2v-7Z" />
        </svg>
      );
    case "portfolio":
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9" />
          <path d="M3.6 9h16.8M3.6 15h16.8M12 3c2.2 2.4 3.2 5.4 3.2 9s-1 6.6-3.2 9c-2.2-2.4-3.2-5.4-3.2-9s1-6.6 3.2-9Z" />
        </svg>
      );
    case "whatsapp":
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-current">
          <path d="M12 3a8.7 8.7 0 0 0-7.4 13.3L3.5 21l4.8-1.1A8.7 8.7 0 1 0 12 3Zm0 15.8c-1.4 0-2.8-.4-4-1.2l-.3-.2-2.2.5.5-2.1-.2-.3a7.1 7.1 0 1 1 6.2 3.3Zm4-5.3c-.2-.1-1.3-.6-1.5-.7-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a5.9 5.9 0 0 1-2.9-2.5c-.2-.3 0-.4.1-.6l.4-.5c.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5l-.7-1.6c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.2.2-.9.9-.9 2.1s.9 2.5 1 2.6c.1.2 1.8 2.8 4.4 3.9.6.3 1.1.4 1.5.5.6.2 1.2.1 1.6.1.5-.1 1.3-.5 1.5-1 .2-.5.2-.9.2-1-.1-.2-.2-.3-.4-.4Z" />
        </svg>
      );
  }
}

function SocialList({links}: {links: SocialLink[]}) {
  return (
    <div className="flex flex-wrap gap-4">
      {links.map((link) => (
        <a
          key={link.label}
          href={link.href}
          aria-label={link.label}
          title={link.label}
          target="_blank"
          rel="noopener noreferrer"
          className="focus-gold group flex h-11 w-11 items-center justify-center border border-outline/70 text-gold transition-all duration-300 hover:-translate-y-1 hover:border-gold hover:bg-gold hover:text-surface-hi hover:shadow-[0_12px_28px_rgba(111,70,24,0.18)]"
        >
          <span className="transition-transform duration-300 group-hover:scale-110">
            <SocialIcon icon={link.icon} />
          </span>
        </a>
      ))}
    </div>
  );
}

function SectionDivider() {
  return <hr className="mx-auto my-16 w-full max-w-[1180px] border-outline/60 sm:my-24" />;
}

export default async function AboutUsPage({params}: AboutUsPageProps) {
  const {locale} = await params;
  const isArabic = locale === "ar";

  return (
    <>
      <Navbar cartCount={0} />
      <main className="bg-bg text-on-surface" dir={isArabic ? "rtl" : "ltr"}>
      <section className="mx-auto flex max-w-container flex-col items-center justify-center px-gutter pb-12 pt-6 text-center sm:pb-16 sm:pt-10">
        <p className="label-caps mb-5 text-gold">Valentro Maison</p>
        <h1 className="font-serif text-[clamp(3rem,10vw,7rem)] leading-[0.95] text-parchment">
          About Us
        </h1>
        <div className="my-8 h-px w-28 bg-outline" />
        <p className="max-w-2xl text-base leading-8 text-on-surface/75 sm:text-lg">
          A fragrance house built on Egyptian ambition, European olfactory
          discipline, and a belief that scent should feel personal, cinematic,
          and unforgettable.
        </p>
      </section>

      <section className="mx-auto grid max-w-container items-center gap-10 px-gutter pb-6 md:grid-cols-12 lg:px-16">
        <div className="md:col-span-5 md:col-start-2">
          <p className="label-caps mb-4 text-gold">Our Story</p>
          <h2 className="font-serif text-[clamp(2.25rem,5vw,4rem)] leading-tight text-parchment">
            Crafted for people who remember places by scent.
          </h2>
          <div className="mt-6 space-y-5 text-sm leading-7 text-on-surface/78 sm:text-base">
            <p>
              Valentro began as a direct idea: make fragrance feel intimate
              again. Instead of treating perfume as a quick purchase, we build
              every product around mood, memory, character, and the quiet
              confidence that arrives when a scent truly belongs to someone.
            </p>
            <p>
              Our catalog is curated with the same care as a private wardrobe.
              Each composition is chosen for presence, balance, longevity, and
              the way it moves through a real day.
            </p>
          </div>
        </div>
        <div className="md:col-span-5">
          <div className="relative aspect-[4/5] overflow-hidden border border-outline/60 bg-surface-hi">
            <Image
              src={aboutHeroImage}
              alt="Valentro fragrance atmosphere"
              fill
              priority
              sizes="(min-width: 1024px) 42vw, 100vw"
              className="object-cover"
            />
          </div>
        </div>
      </section>

      <SectionDivider />

      <section className="mx-auto grid max-w-container gap-10 px-gutter md:grid-cols-12 lg:px-16">
        <div className="md:col-span-4 md:col-start-2">
          <p className="label-caps mb-4 text-gold">Where We Are From</p>
          <h2 className="font-serif text-4xl leading-tight text-parchment sm:text-5xl">
            Born in Egypt, shaped for a global taste.
          </h2>
        </div>
        <div className="space-y-5 text-sm leading-7 text-on-surface/78 sm:text-base md:col-span-5 md:col-start-7">
          <p>
            Valentro is rooted in Egypt: a place of heat, stone, evening air,
            hospitality, and strong personal style. That origin gives the brand
            its warmth and its appetite for bold signatures.
          </p>
          <p>
            Our inspiration reaches outward too, toward classic perfumery,
            modern fashion, and the emotional detail of everyday life. The
            result is a maison that feels local in spirit and international in
            finish.
          </p>
        </div>
      </section>

      <SectionDivider />

      <section className="mx-auto grid max-w-container items-center gap-10 px-gutter md:grid-cols-12 lg:px-16">
        <div className="order-2 md:order-1 md:col-span-5 md:col-start-2">
          <div className="relative aspect-square overflow-hidden border border-outline/60 bg-surface-hi">
            <Image
              src="/uploads/fragrances/ultra-male.png"
              alt="Valentro fragrance bottle"
              fill
              sizes="(min-width: 1024px) 38vw, 100vw"
              className="object-contain p-8"
            />
          </div>
        </div>
        <div className="order-1 md:order-2 md:col-span-5">
          <p className="label-caps mb-4 text-gold">Idea & Passion</p>
          <h2 className="font-serif text-[clamp(2.25rem,5vw,4rem)] leading-tight text-parchment">
            Luxury should feel deliberate, not distant.
          </h2>
          <div className="mt-6 space-y-5 text-sm leading-7 text-on-surface/78 sm:text-base">
            <p>
              Our idea is to make premium fragrance easier to understand without
              making it feel ordinary. We care about notes, sillage, seasons,
              personality, and the exact moment a fragrance becomes part of a
              person&apos;s identity.
            </p>
            <p>
              The passion is in the editing: fewer distractions, stronger
              choices, richer details, and a buying experience that feels as
              refined as the scent itself.
            </p>
          </div>
        </div>
      </section>

      <SectionDivider />

      <section className="mx-auto grid max-w-container items-center gap-10 px-gutter md:grid-cols-12 lg:px-16">
        <div className="md:col-span-5 md:col-start-2">
          <div className="flex aspect-square items-center justify-center border border-outline/60 bg-surface-hi p-8">
            <div className="flex h-full w-full flex-col items-center justify-center border border-outline/50 text-center">
              <span className="label-caps mb-5 text-gold">CEO</span>
              <span className="font-serif text-5xl text-parchment">Peter</span>
              <span className="font-serif text-5xl text-parchment">Emil</span>
            </div>
          </div>
        </div>
        <div className="md:col-span-5">
          <p className="label-caps mb-4 text-gold">The Visionary</p>
          <h2 className="font-serif text-[clamp(2.4rem,5vw,4.5rem)] leading-tight text-parchment">
            Peter Emil
          </h2>
          <p className="mt-6 text-sm leading-7 text-on-surface/78 sm:text-base">
            As CEO of Valentro, Peter Emil leads the brand with a focus on
            taste, restraint, and emotional clarity. His role is to protect the
            maison&apos;s direction: elegant products, honest presentation, and a
            standard of detail that customers can feel before they even wear the
            fragrance.
          </p>
          <div className="mt-7">
            <SocialList links={peterLinks} />
          </div>
        </div>
      </section>

      <SectionDivider />

      <section className="mx-auto grid max-w-container items-center gap-10 px-gutter pb-20 md:grid-cols-12 lg:px-16">
        <div className="md:col-span-5 md:col-start-2">
          <p className="label-caps mb-4 text-gold">The Digital Builder</p>
          <h2 className="font-serif text-[clamp(2.4rem,5vw,4.5rem)] leading-tight text-parchment">
            Karim Essac
          </h2>
          <p className="mt-6 text-sm leading-7 text-on-surface/78 sm:text-base">
            Karim Essac is the website developer behind Valentro&apos;s digital
            experience. His work translates the brand into a fast, polished, and
            usable storefront, from the product discovery flow to the admin tools
            that keep the maison operating.
          </p>
          <div className="mt-7">
            <SocialList links={karimLinks} />
          </div>
        </div>
        <div className="md:col-span-5">
          <div className="flex aspect-[3/4] items-center justify-center border border-outline/60 bg-surface-hi p-6">
            <div className="flex h-full w-full flex-col items-center justify-center border border-outline/50 px-6 text-center">
              <span className="material-symbols-outlined mb-5 text-4xl text-gold">
                terminal
              </span>
              <span className="font-serif text-4xl leading-tight text-parchment">
                Digital
                <br />
                Craftsmanship
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-outline/60 bg-surface/70 px-gutter py-14 text-center">
        <p className="label-caps mb-5 text-gold">Online Pages</p>
        <h2 className="font-serif text-4xl text-parchment sm:text-5xl">
          Follow Valentro
        </h2>
        <div className="mt-8 flex justify-center">
          <SocialList links={valentroLinks} />
        </div>
      </section>
      </main>
    </>
  );
}
