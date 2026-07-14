import {NextResponse} from "next/server";
import {revalidateTag} from "next/cache";
import {getServerSession} from "next-auth";
import type {Session} from "next-auth";

import {authOptions} from "@/lib/auth";
import {prisma} from "@/lib/prisma";
import {STOREFRONT_COLLECTIONS_TAG} from "@/lib/storefront-data";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function DELETE(_request: Request, context: RouteContext) {
  const session = (await getServerSession(authOptions)) as Session | null;

  if (session?.user.role !== "ADMIN") {
    return NextResponse.json({message: "Unauthorized"}, {status: 401});
  }

  const {id} = await context.params;

  try {
    const collection = await prisma.collection.findUnique({
      where: {id},
      select: {id: true, isOffer: true}
    });

    if (!collection?.isOffer) {
      return NextResponse.json({message: "Collection offer was not found"}, {status: 404});
    }

    await prisma.$transaction(async (tx) => {
      await tx.collection.delete({where: {id}});

      const remainingOffers = await tx.collection.findMany({
        where: {isOffer: true},
        orderBy: [{position: "asc"}, {createdAt: "asc"}],
        select: {id: true}
      });

      for (const [index, offer] of remainingOffers.entries()) {
        await tx.collection.update({
          where: {id: offer.id},
          data: {position: index + 1}
        });
      }
    });

    revalidateTag(STOREFRONT_COLLECTIONS_TAG, "max");
    return NextResponse.json({message: "Collection offer deleted"});
  } catch {
    return NextResponse.json({message: "Unable to delete collection offer"}, {status: 400});
  }
}
