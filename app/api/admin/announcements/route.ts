import {NextResponse} from "next/server";
import type {NextRequest} from "next/server";
import {getServerSession} from "next-auth";
import type {Session} from "next-auth";

import {authOptions} from "@/lib/auth";
import {prisma} from "@/lib/prisma";

export const revalidate = 0; // Dynamic route

export async function GET() {
  const session = (await getServerSession(authOptions)) as Session | null;

  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({message: "Unauthorized"}, {status: 401});
  }

  try {
    const announcements = await prisma.announcement.findMany({
      orderBy: {
        createdAt: "desc"
      }
    });

    return NextResponse.json(announcements);
  } catch (error) {
    console.error("Failed to fetch admin announcements:", error);
    return NextResponse.json(
      {message: "Failed to fetch announcements"},
      {status: 500}
    );
  }
}

export async function POST(request: NextRequest) {
  const session = (await getServerSession(authOptions)) as Session | null;

  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({message: "Unauthorized"}, {status: 401});
  }

  try {
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

    if (endAt) {
      parsedEnd = new Date(endAt);
      if (isNaN(parsedEnd.getTime())) {
        return NextResponse.json(
          {message: "Invalid end date"},
          {status: 400}
        );
      }
    }

    if (parsedStart && parsedEnd && parsedEnd < parsedStart) {
      return NextResponse.json(
        {message: "End date must be after start date"},
        {status: 400}
      );
    }

    // Set background color to #F7EEDF (var(--color-surface)) and text to #6F4618 (var(--color-gold))
    const bgColor = "#F7EEDF";
    const textColor = "#6F4618";

    // If this new announcement is marked active, deactivate all others
    if (isActive) {
      await prisma.announcement.updateMany({
        where: {isActive: true},
        data: {isActive: false}
      });
    }

    const announcement = await prisma.announcement.create({
      data: {
        textEn: trimmedEn,
        textAr: trimmedAr,
        linkUrl: linkUrl?.trim() || null,
        isActive: !!isActive,
        startAt: parsedStart,
        endAt: parsedEnd,
        bgColor,
        textColor
      }
    });

    return NextResponse.json(announcement, {status: 201});
  } catch (error) {
    console.error("Failed to create admin announcement:", error);
    return NextResponse.json(
      {message: "Failed to create announcement"},
      {status: 500}
    );
  }
}
