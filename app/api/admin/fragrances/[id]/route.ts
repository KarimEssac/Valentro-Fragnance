import {NextResponse} from "next/server";
import type {NextRequest} from "next/server";
import {FragranceNote, Gender, ScentProfile, Sillage} from "@prisma/client";
import {getServerSession} from "next-auth";
import type {Session} from "next-auth";

import {authOptions} from "@/lib/auth";
import {deleteCloudinaryImageByUrl} from "@/lib/cloudinary";
import {uploadFragranceImages} from "@/lib/fragrance-images";
import {prisma} from "@/lib/prisma";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const genderValues = new Set(Object.values(Gender));
const scentValues = new Set(Object.values(ScentProfile));
const sillageValues = new Set(Object.values(Sillage));
const seasonValues = new Set(["SPRING", "SUMMER", "FALL", "WINTER", "ALL_YEAR"]);

type VariantInput = {
  id?: string;
  sizeML: number;
  price: string;
  stock: number;
};

type ImageInput = {
  id: string;
  altEn: string;
  altAr: string;
  position: number;
  isPrimary: boolean;
  delete: boolean;
};

function stringValue(data: Record<string, unknown>, key: string, label: string, max = 240) {
  const value = typeof data[key] === "string" ? data[key].trim() : "";
  if (!value) throw new Error(`${label} is required`);
  if (value.length > max) throw new Error(`${label} is too long`);
  return value;
}

function optionalString(
  data: Record<string, unknown>,
  key: string,
  fallback: string,
  max = 2000
) {
  const value = typeof data[key] === "string" ? data[key].trim() : "";
  if (value.length > max) throw new Error(`${key} is too long`);
  return value || fallback;
}

function stringArray(data: Record<string, unknown>, key: string) {
  const value = data[key];
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);
}

function intValue(data: Record<string, unknown>, key: string, label: string, min = 0) {
  const value = Number(data[key]);
  if (!Number.isInteger(value) || value < min) {
    throw new Error(`${label} is invalid`);
  }
  return value;
}

function optionalIntValue(
  data: Record<string, unknown>,
  key: string,
  label: string,
  min = 1
) {
  const raw = data[key];
  if (raw === null || raw === undefined || raw === "") return null;

  const value = Number(raw);
  if (!Number.isInteger(value) || value < min) {
    throw new Error(`${label} is invalid`);
  }
  return value;
}

function skuFrom(slug: string, sizeML: number) {
  const prefix = slug
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .split("-")
    .filter(Boolean)
    .map((part) => part.slice(0, 3).toUpperCase())
    .join("-")
    .slice(0, 18);
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `VAL-${prefix || "FRG"}-${sizeML}-${suffix}`;
}

function variantInputs(data: Record<string, unknown>): VariantInput[] {
  const variants = data.variants;
  if (!Array.isArray(variants) || variants.length === 0) {
    throw new Error("At least one size is required");
  }

  const sizes = new Set<number>();

  return variants.map((variant, index) => {
    if (!variant || typeof variant !== "object") {
      throw new Error("Variant data is invalid");
    }

    const record = variant as Record<string, unknown>;
    const id = typeof record.id === "string" && record.id ? record.id : undefined;
    const sizeML = Number(record.sizeML);
    const price = Number(record.price);
    const stock = Number(record.stock);

    if (!Number.isInteger(sizeML) || sizeML <= 0) {
      throw new Error(`Size ${index + 1} is invalid`);
    }
    if (sizes.has(sizeML)) {
      throw new Error(`${sizeML}ML is already added`);
    }
    if (!Number.isFinite(price) || price <= 0) {
      throw new Error(`${sizeML}ML price is invalid`);
    }
    if (!Number.isInteger(stock) || stock < 0) {
      throw new Error(`${sizeML}ML stock is invalid`);
    }

    sizes.add(sizeML);

    return {
      id,
      sizeML,
      price: price.toFixed(2),
      stock
    };
  });
}

function imageInputs(data: Record<string, unknown>): ImageInput[] {
  const images = data.images;
  if (!Array.isArray(images)) return [];

  return images.map((image, index) => {
    if (!image || typeof image !== "object") {
      throw new Error("Image data is invalid");
    }

    const record = image as Record<string, unknown>;
    const id = typeof record.id === "string" ? record.id : "";
    if (!id) throw new Error("Image data is invalid");

    return {
      id,
      altEn:
        typeof record.altEn === "string" && record.altEn.trim()
          ? record.altEn.trim().slice(0, 240)
          : "Fragrance image",
      altAr:
        typeof record.altAr === "string" && record.altAr.trim()
          ? record.altAr.trim().slice(0, 240)
          : typeof record.altEn === "string" && record.altEn.trim()
            ? record.altEn.trim().slice(0, 240)
            : "Fragrance image",
      position: Number.isInteger(Number(record.position)) ? Number(record.position) : index + 1,
      isPrimary: record.isPrimary === true,
      delete: record.delete === true
    };
  });
}

async function requestData(request: NextRequest) {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    const payload = form.get("payload");
    let data: Record<string, unknown>;

    try {
      data = typeof payload === "string" ? (JSON.parse(payload) as Record<string, unknown>) : {};
    } catch {
      throw new Error("Product data is invalid");
    }

    return {
      data,
      files: form.getAll("images").filter((value): value is File => value instanceof File)
    };
  }

  return {
    data: (await request.json()) as Record<string, unknown>,
    files: []
  };
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const session = (await getServerSession(authOptions)) as Session | null;

  if (session?.user.role !== "ADMIN") {
    return NextResponse.json({message: "Unauthorized"}, {status: 401});
  }

  const {id} = await context.params;
  let data: Record<string, unknown>;
  let files: File[];

  try {
    const parsed = await requestData(request);
    data = parsed.data;
    files = parsed.files;
  } catch (error) {
    return NextResponse.json(
      {message: error instanceof Error ? error.message : "Invalid request"},
      {status: 400}
    );
  }

  try {
    const slug = stringValue(data, "slug", "Slug", 80);
    const nameEn = stringValue(data, "nameEn", "English name");
    const nameAr = optionalString(data, "nameAr", nameEn, 240);
    const taglineEn = stringValue(data, "taglineEn", "English tagline", 300);
    const descriptionEn = stringValue(data, "descriptionEn", "English description", 2000);
    const taglineAr = optionalString(data, "taglineAr", taglineEn, 300);
    const descriptionAr = optionalString(data, "descriptionAr", descriptionEn, 2000);
    const gender = stringValue(data, "gender", "Gender") as Gender;
    const scentProfile = stringValue(data, "scentProfile", "Scent profile") as ScentProfile;
    const sillage = stringValue(data, "sillage", "Sillage") as Sillage;
    const position = optionalIntValue(data, "position", "Display order", 1);
    const variants = variantInputs(data);
    const imageEdits = imageInputs(data);
    const selectedSeasons = stringArray(data, "seasons").filter((season) =>
      seasonValues.has(season)
    );

    if (!genderValues.has(gender)) throw new Error("Gender is invalid");
    if (!scentValues.has(scentProfile)) throw new Error("Scent profile is invalid");
    if (!sillageValues.has(sillage)) throw new Error("Sillage is invalid");

    const uploadedImages = await uploadFragranceImages(files, slug);

    const deletedImageUrls: string[] = [];

    const saved = await prisma.$transaction(async (tx) => {
      const existing = await tx.fragrance.findUnique({
        where: {id},
        select: {
          id: true,
          variants: {
            select: {id: true}
          },
          images: {
            select: {id: true, url: true}
          }
        }
      });

      if (!existing) throw new Error("Fragrance was not found");

      const existingVariantIds = new Set(existing.variants.map((variant) => variant.id));
      const keptVariantIds = variants
        .map((variant) => variant.id)
        .filter((variantId): variantId is string => Boolean(variantId));
      const existingImageIds = new Set(existing.images.map((image) => image.id));

      await tx.fragrance.update({
        where: {id},
        data: {
          slug,
          nameEn,
          nameAr,
          taglineEn,
          taglineAr,
          descriptionEn,
          descriptionAr,
          gender,
          scentProfile,
          avoidIf: stringArray(data, "avoidIf"),
          seasons: selectedSeasons.includes("ALL_YEAR") ? ["ALL_YEAR"] : selectedSeasons,
          sillage,
          longevity: intValue(data, "longevity", "Longevity", 1),
          ingredients: {
            deleteMany: {},
            create: stringArray(data, "ingredients").map((ingredient, index, list) => ({
              nameEn: ingredient,
              nameAr: ingredient,
              note:
                index === 0
                  ? FragranceNote.TOP
                  : index === list.length - 1
                    ? FragranceNote.BASE
                    : FragranceNote.MIDDLE
            }))
          }
        }
      });

      for (const variant of variants) {
        if (variant.id && existingVariantIds.has(variant.id)) {
          await tx.fragranceVariant.update({
            where: {id: variant.id},
            data: {
              sizeML: variant.sizeML,
              price: variant.price,
              stock: variant.stock
            }
          });
        } else {
          await tx.fragranceVariant.create({
            data: {
              fragranceId: id,
              sizeML: variant.sizeML,
              price: variant.price,
              stock: variant.stock,
              sku: skuFrom(slug, variant.sizeML)
            }
          });
        }
      }

      const deleteIds = [...existingVariantIds].filter(
        (variantId) => !keptVariantIds.includes(variantId)
      );

      if (deleteIds.length > 0) {
        await tx.fragranceVariant.deleteMany({
          where: {
            id: {in: deleteIds}
          }
        });
      }

      const imageDeleteIds = imageEdits
        .filter((image) => image.delete && existingImageIds.has(image.id))
        .map((image) => image.id);

      if (imageDeleteIds.length > 0) {
        deletedImageUrls.push(
          ...existing.images
            .filter((image) => imageDeleteIds.includes(image.id))
            .map((image) => image.url)
        );
        await tx.fragranceImage.deleteMany({
          where: {
            fragranceId: id,
            id: {in: imageDeleteIds}
          }
        });
      }

      const keptImageEdits = imageEdits.filter(
        (image) => !image.delete && existingImageIds.has(image.id)
      );

      for (const image of keptImageEdits) {
        await tx.fragranceImage.update({
          where: {id: image.id},
          data: {
            altEn: image.altEn,
            altAr: image.altAr,
            position: image.position,
            isPrimary: false
          }
        });
      }

      const createdImageIds: string[] = [];
      for (const [index, url] of uploadedImages.entries()) {
        const created = await tx.fragranceImage.create({
          data: {
            fragranceId: id,
            url,
            altEn: `${nameEn} fragrance bottle`,
            altAr: `${nameAr} fragrance bottle`,
            position: keptImageEdits.length + index + 1,
            isPrimary: false
          },
          select: {id: true}
        });
        createdImageIds.push(created.id);
      }

      const requestedPrimary = keptImageEdits.find((image) => image.isPrimary)?.id;
      let primaryImageId = requestedPrimary;

      if (!primaryImageId) {
        const firstImage = await tx.fragranceImage.findFirst({
          where: {fragranceId: id},
          orderBy: [{position: "asc"}, {id: "asc"}],
          select: {id: true}
        });
        primaryImageId = firstImage?.id ?? createdImageIds[0];
      }

      await tx.fragranceImage.updateMany({
        where: {fragranceId: id},
        data: {isPrimary: false}
      });

      if (primaryImageId) {
        await tx.fragranceImage.update({
          where: {id: primaryImageId},
          data: {isPrimary: true}
        });
      }

      const orderedProducts = await tx.fragrance.findMany({
        where: {id: {not: id}},
        orderBy: [{position: "asc"}, {createdAt: "asc"}],
        select: {id: true}
      });
      const orderedIds = orderedProducts.map((product) => product.id);
      const targetIndex = position ? Math.min(position - 1, orderedIds.length) : orderedIds.length;
      orderedIds.splice(targetIndex, 0, id);

      for (const [index, fragranceId] of orderedIds.entries()) {
        await tx.fragrance.update({
          where: {id: fragranceId},
          data: {position: index + 1}
        });
      }

      return tx.fragrance.findUnique({
        where: {id},
        select: {id: true}
      });
    });

    await Promise.allSettled(
      deletedImageUrls.map((url) => deleteCloudinaryImageByUrl(url))
    );

    return NextResponse.json({message: "Product updated", id: saved?.id});
  } catch (error) {
    return NextResponse.json(
      {message: error instanceof Error ? error.message : "Unable to update product"},
      {status: 400}
    );
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  void request;

  const session = (await getServerSession(authOptions)) as Session | null;

  if (session?.user.role !== "ADMIN") {
    return NextResponse.json({message: "Unauthorized"}, {status: 401});
  }

  const {id} = await context.params;

  try {
    await prisma.fragrance.delete({where: {id}});
    return NextResponse.json({message: "Product deleted"});
  } catch {
    return NextResponse.json({message: "Unable to delete product"}, {status: 400});
  }
}
