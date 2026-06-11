import {NextRequest, NextResponse} from "next/server";
import {prisma} from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get("email")?.toLowerCase().trim();

  if (!email) {
    return NextResponse.json({exists: false, hasName: false});
  }

  const user = await prisma.user.findUnique({
    where: {email},
    select: {
      name: true
    }
  });

  if (!user) {
    return NextResponse.json({exists: false, hasName: false});
  }

  return NextResponse.json({
    exists: true,
    hasName: Boolean(user.name?.trim())
  });
}
