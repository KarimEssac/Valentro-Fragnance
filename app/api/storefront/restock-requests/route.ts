import {NextResponse} from "next/server";
import {getServerSession} from "next-auth";
import type {Session} from "next-auth";

import {authOptions} from "@/lib/auth";
import {prisma} from "@/lib/prisma";
import {sendRestockDemandOwnerEmail} from "@/lib/restock-notifications";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const idPattern = /^[A-Za-z0-9_-]{8,64}$/;

type RestockRequestPayload = {
  variantId?: unknown;
  email?: unknown;
  locale?: unknown;
};

export async function POST(request: Request) {
  try {
    const session = (await getServerSession(authOptions)) as Session | null;
    const payload = (await request.json()) as RestockRequestPayload;
    const variantId =
      typeof payload.variantId === "string" ? payload.variantId.trim() : "";
    const email =
      typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
    const locale = payload.locale === "ar" ? "ar" : "en";

    if (!idPattern.test(variantId)) {
      return NextResponse.json({message: "Fragrance size is invalid"}, {status: 400});
    }

    if (!email || email.length > 254 || !emailPattern.test(email)) {
      return NextResponse.json({message: "Enter a valid email address"}, {status: 400});
    }

    const variant = await prisma.fragranceVariant.findFirst({
      where: {
        id: variantId,
        fragrance: {isPublished: true}
      },
      select: {
        id: true,
        stock: true,
        sizeML: true,
        fragrance: {
          select: {
            slug: true,
            nameEn: true,
            nameAr: true,
            images: {
              orderBy: [{isPrimary: "desc"}, {position: "asc"}],
              take: 1,
              select: {url: true}
            }
          }
        }
      }
    });

    if (!variant) {
      return NextResponse.json({message: "Fragrance size was not found"}, {status: 404});
    }

    if (variant.stock > 0) {
      return NextResponse.json(
        {message: "This fragrance size is already back in stock"},
        {status: 409}
      );
    }

    const existing = await prisma.restockRequest.findUnique({
      where: {
        variantId_email: {variantId, email}
      },
      select: {
        id: true,
        notifiedAt: true
      }
    });

    if (existing && !existing.notifiedAt) {
      await prisma.restockRequest.update({
        where: {id: existing.id},
        data: {
          userId: session?.user?.id ?? null,
          locale
        }
      });

      return NextResponse.json({
        message: "You are already on the restock list for this size.",
        alreadyRequested: true
      });
    }

    let savedRequest: {id: string; requestedAt: Date};

    if (existing) {
      savedRequest = await prisma.restockRequest.update({
        where: {id: existing.id},
        data: {
          userId: session?.user?.id ?? null,
          locale,
          requestedAt: new Date(),
          notifiedAt: null,
          requestCount: {increment: 1}
        },
        select: {id: true, requestedAt: true}
      });
    } else {
      savedRequest = await prisma.restockRequest.create({
        data: {
          variantId,
          userId: session?.user?.id ?? null,
          email,
          locale
        },
        select: {id: true, requestedAt: true}
      });
    }

    try {
      await sendRestockDemandOwnerEmail({
        requestId: savedRequest.id,
        requesterEmail: email,
        requestedAt: savedRequest.requestedAt,
        variant: {
          sizeML: variant.sizeML,
          fragrance: {
            slug: variant.fragrance.slug,
            nameEn: variant.fragrance.nameEn,
            nameAr: variant.fragrance.nameAr,
            imageUrl: variant.fragrance.images[0]?.url ?? null
          }
        }
      });
    } catch (error) {
      console.error(
        "Restock demand was saved, but the owner email could not be prepared:",
        error instanceof Error ? error.message : "Unknown email error"
      );
    }

    const fragranceName = locale === "ar"
      ? variant.fragrance.nameAr
      : variant.fragrance.nameEn;

    return NextResponse.json(
      {
        message:
          locale === "ar"
            ? `سنرسل لك رسالة عند توفر ${fragranceName} بحجم ${variant.sizeML} مل.`
            : `We'll email you when ${fragranceName} ${variant.sizeML}ml is back in stock.`,
        alreadyRequested: false
      },
      {status: 201}
    );
  } catch (error) {
    console.error("Restock request failed:", error);
    return NextResponse.json(
      {message: "Unable to save your restock request"},
      {status: 500}
    );
  }
}
