import {headers} from "next/headers";

import AnnouncementBarClient from "@/components/storefront/layout/AnnouncementBarClient";

type ActiveAnnouncement = {
  id: string;
  textEn: string;
  textAr: string;
  linkUrl: string | null;
  bgColor: string;
  textColor: string;
};

type AnnouncementBarProps = {
  locale: string;
};

async function requestOrigin() {
  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  const protocol =
    headerStore.get("x-forwarded-proto") ??
    (process.env.NODE_ENV === "development" ? "http" : "https");

  if (host) {
    return `${protocol}://${host}`;
  }

  return process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXTAUTH_URL ?? null;
}

async function getActiveAnnouncement() {
  const origin = await requestOrigin();

  if (!origin) {
    return null;
  }

  try {
    const response = await fetch(
      `${origin}/api/storefront/announcements/active`,
      {
        cache: "no-store"
      }
    );

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as ActiveAnnouncement | null;
  } catch {
    return null;
  }
}

export default async function AnnouncementBar({locale}: AnnouncementBarProps) {
  const announcement = await getActiveAnnouncement();

  if (!announcement) {
    return null;
  }

  return (
    <AnnouncementBarClient
      announcement={{
        id: announcement.id,
        text: locale === "ar" ? announcement.textAr : announcement.textEn,
        linkUrl: announcement.linkUrl,
        bgColor: announcement.bgColor || "var(--color-surface)",
        textColor: announcement.textColor || "var(--color-gold)"
      }}
    />
  );
}
