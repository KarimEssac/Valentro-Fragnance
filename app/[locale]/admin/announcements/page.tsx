import {prisma} from "@/lib/prisma";
import AdminAnnouncementsClient from "@/components/admin/AdminAnnouncementsClient";

export const revalidate = 0; // Dynamic route

type AdminAnnouncementsPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export default async function AdminAnnouncementsPage({
  params
}: AdminAnnouncementsPageProps) {
  const {locale} = await params;

  // Retrieve all announcements, ordered by creation date descending.
  const announcements = await prisma.announcement.findMany({
    orderBy: {
      createdAt: "desc"
    }
  });

  // Map Decimal or Date fields if necessary. Since Prisma returns Date objects for DateTime fields,
  // Next.js Server Components can pass them directly to Client Components if we serialize them or keep them as is.
  // We will pass serialized versions to make sure client doesn't complain about passing raw Date objects.
  const serialized = announcements.map((ann) => ({
    id: ann.id,
    textEn: ann.textEn,
    textAr: ann.textAr,
    linkUrl: ann.linkUrl,
    isActive: ann.isActive,
    startAt: ann.startAt ? ann.startAt.toISOString() : null,
    endAt: ann.endAt ? ann.endAt.toISOString() : null,
    bgColor: ann.bgColor,
    textColor: ann.textColor,
    createdAt: ann.createdAt.toISOString()
  }));

  return (
    <AdminAnnouncementsClient
      locale={locale}
      initialAnnouncements={serialized}
    />
  );
}
