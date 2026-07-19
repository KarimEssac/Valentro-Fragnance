import {NextResponse} from "next/server";
import type {NextRequest} from "next/server";
import {revalidateTag} from "next/cache";

import {isAdminRequest} from "@/lib/admin-auth";
import {prisma} from "@/lib/prisma";
import {STOREFRONT_ANNOUNCEMENTS_TAG} from "@/lib/cache-tags";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({message: "Unauthorized"}, {status: 401});
  }

  try {
    const {id} = await context.params;
    const body = await request.json();
    const {textEn, textAr, linkUrl, isActive, startAt, endAt} = body;

    const trimmedEn = textEn?.trim();
    if (!trimmedEn) {
      return NextResponse.json(
        {message: "English text is required"},
        {status: 400}
      );
    }

    const trimmedAr = textAr?.trim() || trimmedEn;

    let parsedStart: Date | null = null;
    let parsedEnd: Date | null = null;

    if (startAt) {
      parsedStart = new Date(startAt);
      if (isNaN(parsedStart.getTime())) {
        return NextResponse.json(
          {message: "Invalid start date"},
          {status: 400}
        );
      }
    }

    if (startAt === null) {
      parsedStart = null;
    }

    if (endAt) {
      parsedEnd = new Date(endAt);
      if (isNaN(parsedEnd.getTime())) {
        return NextResponse.json(
          {message: "Invalid end date"},
          {status: 400}
        );
      }
    }

    if (endAt === null) {
      parsedEnd = null;
    }

    if (parsedStart && parsedEnd && parsedEnd < parsedStart) {
      return NextResponse.json(
        {message: "End date must be after start date"},
        {status: 400}
      );
    }

    // Ensure only one is active at a time
    if (isActive) {
      await prisma.announcement.updateMany({
        where: {
          id: {not: id},
          isActive: true
        },
        data: {isActive: false}
      });
    }

    const updated = await prisma.announcement.update({
      where: {id},
      data: {
        textEn: trimmedEn,
        textAr: trimmedAr,
        linkUrl: linkUrl?.trim() || null,
        isActive: !!isActive,
        startAt: parsedStart,
        endAt: parsedEnd
      }
    });

    revalidateTag(STOREFRONT_ANNOUNCEMENTS_TAG, "max");
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update admin announcement:", error);
    return NextResponse.json(
      {message: "Failed to update announcement"},
      {status: 500}
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({message: "Unauthorized"}, {status: 401});
  }

  try {
    const {id} = await context.params;
    await prisma.announcement.delete({
      where: {id}
    });

    revalidateTag(STOREFRONT_ANNOUNCEMENTS_TAG, "max");
    return NextResponse.json({message: "Announcement deleted"});
  } catch (error) {
    console.error("Failed to delete admin announcement:", error);
    return NextResponse.json(
      {message: "Failed to delete announcement"},
      {status: 500}
    );
  }
}
