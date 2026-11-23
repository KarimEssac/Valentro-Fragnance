export const valentroSocialLinks = [
  {
    label: "Instagram",
    href: "https://www.instagram.com/valentro.fragrances?igsi=c3dhb2xtanRsaHFk&utm_source=qr",
    icon: "instagram"
  },
  {
    label: "Facebook",
    href: "https://www.facebook.com/share/14ji2RQyCwZ/?mibextid=wwXIfr",
    icon: "facebook"
  },
  {
    label: "TikTok",
    href: "https://www.tiktok.com/@valentro.fragranc?_r=1&_t=ZS-99TyFNlSMe9",
    icon: "tiktok"
  }
] as const;

export type BrandSocialPlatform = (typeof valentroSocialLinks)[number]["icon"];

export function BrandSocialIcon({
  platform,
  className
}: {
  platform: BrandSocialPlatform;
  className: string;
}) {
  switch (platform) {
    case "instagram":
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <path d="M17.5 6.5h.01" />
        </svg>
      );
    case "facebook":
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="currentColor">
          <path d="M13.5 22v-8h2.7l.4-3h-3.1V9.1c0-.9.3-1.5 1.6-1.5h1.7V4.9c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3V11H7.3v3h2.8v8h3.4Z" />
        </svg>
      );
    case "tiktok":
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="currentColor">
          <path d="M16.4 3c.4 2.4 1.8 3.9 4.1 4.1v3.1a7.4 7.4 0 0 1-4-1.2v6.4c0 3.8-2.2 5.6-5.2 5.6A5.1 5.1 0 0 1 6 16c0-3.2 2.4-5.3 5.8-5.1v3.2c-1.5-.2-2.6.5-2.6 1.9 0 1.2.9 2 2 2 1.3 0 2-.8 2-2.5V3h3.2Z" />
        </svg>
      );
  }
}
