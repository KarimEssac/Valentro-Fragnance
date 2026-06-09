import type {Announcement} from "@prisma/client";
import {NextResponse} from "next/server";

import {prisma} from "@/lib/prisma";

export async function GET(): Promise<NextResponse<Announcement | null>> {
  const now = new Date();

  const announcement = await prisma.announcement.findFirst({
    where: {
      isActive: true,
      AND: [
        {
          OR: [{startAt: null}, {startAt: {lte: now}}]
        },
        {
          OR: [{endAt: null}, {endAt: {gte: now}}]
        }
      ]
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  return NextResponse.json(announcement);
}
