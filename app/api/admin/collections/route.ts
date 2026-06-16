import {NextResponse} from "next/server";
import type {NextRequest} from "next/server";
import {Prisma} from "@prisma/client";
import {getServerSession} from "next-auth";
import type {Session} from "next-auth";

import {authOptions} from "@/lib/auth";
import {uploadCollectionImages} from "@/lib/fragrance-images";
import {prisma} from "@/lib/prisma";

export const runtime = "nodejs";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function text(data: Record<string, unknown>, key: string, label: string, max = 240) {
  const value = typeof data[key] === "string" ? data[key].trim() : "";
  if (!value) throw new Error(`${label} is required`);
  if (value.length > max) throw new Error(`${label} is too long`);
  return value;
}

function optionalText(
  data: Record<string, unknown>,
  key: string,
  fallback: string,
  max = 2000
) {
  const value = typeof data[key] === "string" ? data[key].trim() : "";
  if (value.length > max) throw new Error(`${key} is too long`);
  return value || fallback;
}

function optionalPositiveInt(data: Record<string, unknown>, key: string, label: string) {
  const value = data[key];
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  if (!Number.isInteger(number) || number < 1) throw new Error(`${label} is invalid`);
  return number;
}

function money(data: Record<string, unknown>, key: string, label: string) {
  const number = Number(data[key]);
  if (!Number.isFinite(number) || number <= 0) throw new Error(`${label} is invalid`);
  return new Prisma.Decimal(number.toFixed(2));
}

function productIds(data: Record<string, unknown>) {
  const raw = data.productIds;
  if (!Array.isArray(raw)) throw new Error("Products are required");
  const ids = raw
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter(Boolean);
  const unique = Array.from(new Set(ids));
  if (unique.length < 2) throw new Error("Select at least two products for a collection offer");
  return unique;
}

export async function GET() {
  const session = (await getServerSession(authOptions)) as Session | null;

  if (session?.user.role !== "ADMIN") {
    return NextResponse.json({message: "Unauthorized"}, {status: 401});
  }

  const collections = await prisma.collection.findMany({
    where: {isOffer: true},
    orderBy: [{position: "asc"}, {createdAt: "desc"}],
    include: {
      fragrances: {
        include: {
          fragrance: {
            select: {
              id: true,
              nameEn: true,
              variants: {
                orderBy: {price: "asc"},
                select: {price: true}
              },
              images: {
                orderBy: [{isPrimary: "desc"}, {position: "asc"}],
                take: 1,
                select: {url: true}
              }
            }
          }
        }
      }
    }
  });

  return NextResponse.json({
    collections: collections.map((collection) => ({
      id: collection.id,
      slug: collection.slug,
      code: collection.code,
      nameEn: collection.nameEn,
      descriptionEn: collection.descriptionEn,
      coverImage: collection.coverImage,
      offerPrice: collection.offerPrice?.toString() ?? null,
      isPublished: collection.isPublished,
      position: collection.position,
      products: collection.fragrances.map(({fragrance}) => ({
        id: fragrance.id,
        nameEn: fragrance.nameEn,
        image: fragrance.images[0]?.url ?? null,
        price: fragrance.variants[0]?.price.toString() ?? null
      }))
    }))
  });
}

export async function POST(request: NextRequest) {
  const session = (await getServerSession(authOptions)) as Session | null;

  if (session?.user.role !== "ADMIN") {
    return NextResponse.json({message: "Unauthorized"}, {status: 401});
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({message: "Invalid request"}, {status: 400});
  }

  try {
    const rawPayload = form.get("payload");
    const data =
      typeof rawPayload === "string" ? (JSON.parse(rawPayload) as Record<string, unknown>) : {};

    const nameEn = text(data, "nameEn", "Collection name");
    const nameAr = optionalText(data, "nameAr", nameEn);
    const descriptionEn = optionalText(data, "descriptionEn", "", 2000);
    const descriptionAr = optionalText(data, "descriptionAr", descriptionEn, 2000);
    const code = optionalText(data, "code", slugify(nameEn).toUpperCase(), 80)
      .replace(/[^a-zA-Z0-9._-]/g, "-")
      .toUpperCase();
    const slug = slugify(optionalText(data, "slug", nameEn, 80));
    if (!slug) throw new Error("Slug is required");

    const selectedProductIds = productIds(data);
    const offerPrice = money(data, "offerPrice", "Bundle price");
    const displayOrder = optionalPositiveInt(data, "position", "Display order");
    const isPublished = Boolean(data.isPublished);
    const imageFiles = form
      .getAll("image")
      .filter((value): value is File => value instanceof File && value.size > 0);

    const selectedProducts = await prisma.fragrance.findMany({
      where: {id: {in: selectedProductIds}},
      select: {
        id: true,
        images: {
          orderBy: [{isPrimary: "desc"}, {position: "asc"}],
          take: 1,
          select: {url: true}
        }
      }
    });

    if (selectedProducts.length !== selectedProductIds.length) {
      throw new Error("One or more selected products could not be found");
    }

    const uploadedImages = await uploadCollectionImages(imageFiles, slug);
    const coverImage = uploadedImages[0] ?? selectedProducts[0]?.images[0]?.url;
    if (!coverImage) throw new Error("Add a collection image or choose products with images");

    await prisma.$transaction(async (tx) => {
      const collection = await tx.collection.create({
        data: {
          slug,
          code,
          nameEn,
          nameAr,
          descriptionEn,
          descriptionAr,
          coverImage,
          offerPrice,
          isOffer: true,
          isPublished,
          position: 0,
          fragrances: {
            create: selectedProductIds.map((fragranceId) => ({
              fragrance: {connect: {id: fragranceId}}
            }))
          }
        },
        select: {id: true}
      });

      const orderedOffers = await tx.collection.findMany({
        where: {isOffer: true, id: {not: collection.id}},
        orderBy: [{position: "asc"}, {createdAt: "asc"}],
        select: {id: true}
      });
      const orderedIds = orderedOffers.map((offer) => offer.id);
      const targetIndex = displayOrder
        ? Math.min(displayOrder - 1, orderedIds.length)
        : orderedIds.length;
      orderedIds.splice(targetIndex, 0, collection.id);

      for (const [index, collectionId] of orderedIds.entries()) {
        await tx.collection.update({
          where: {id: collectionId},
          data: {position: index + 1}
        });
      }
    });

    return NextResponse.json({message: "Collection offer created"}, {status: 201});
  } catch (error) {
    return NextResponse.json(
      {message: error instanceof Error ? error.message : "Unable to create collection offer"},
      {status: 400}
    );
  }
}
