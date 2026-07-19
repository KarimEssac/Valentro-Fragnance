import {NextResponse} from "next/server";
import type {NextRequest} from "next/server";
import {revalidateTag} from "next/cache";

import {isAdminRequest} from "@/lib/admin-auth";
import {prisma} from "@/lib/prisma";
import {STOREFRONT_COLLECTIONS_TAG} from "@/lib/cache-tags";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function DELETE(request: NextRequest, context: RouteContext) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({message: "Unauthorized"}, {status: 401});
  }

  const {id} = await context.params;

  try {
    const collection = await prisma.collection.findUnique({
      where: {id},
      select: {id: true, isOffer: true, position: true}
    });

    if (!collection?.isOffer) {
      return NextResponse.json({message: "Collection offer was not found"}, {status: 404});
    }

    await prisma.$transaction(async (tx) => {
      await tx.collection.delete({where: {id}});
      await tx.collection.updateMany({
        where: {
          isOffer: true,
          position: {gt: collection.position}
        },
        data: {position: {decrement: 1}}
      });
    });

    revalidateTag(STOREFRONT_COLLECTIONS_TAG, "max");
    return NextResponse.json({message: "Collection offer deleted"});
  } catch {
    return NextResponse.json({message: "Unable to delete collection offer"}, {status: 400});
  }
}
