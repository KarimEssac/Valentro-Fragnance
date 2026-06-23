import {NextResponse} from "next/server";

import {prisma} from "@/lib/prisma";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {email?: unknown};
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

    if (!email || email.length > 254 || !emailPattern.test(email)) {
      return NextResponse.json({message: "Enter a valid email address"}, {status: 400});
    }

    await prisma.newsletterSubscriber.upsert({
      where: {email},
      update: {},
      create: {email}
    });

    return NextResponse.json({message: "Subscribed"}, {status: 201});
  } catch {
    return NextResponse.json({message: "Unable to subscribe"}, {status: 500});
  }
}
