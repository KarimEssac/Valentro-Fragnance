import {mkdir, writeFile} from "fs/promises";
import path from "path";
import {NextResponse} from "next/server";
import type {NextRequest} from "next/server";
import {FragranceNote, Gender, ScentProfile, Sillage} from "@prisma/client";
import {getServerSession} from "next-auth";
import type {Session} from "next-auth";

import {authOptions} from "@/lib/auth";
import {prisma} from "@/lib/prisma";

const genderValues = new Set(Object.values(Gender));
const scentValues = new Set(Object.values(ScentProfile));
const sillageValues = new Set(Object.values(Sillage));
const seasonValues = new Set(["SPRING", "SUMMER", "FALL", "WINTER", "ALL_YEAR"]);

function text(form: FormData, key: string, label: string, max = 240) {
  const value = form.get(key);
  const result = typeof value === "string" ? value.trim() : "";
  if (!result) throw new Error(`${label} is required`);
  if (result.length > max) throw new Error(`${label} is too long`);
  return result;
}

function optionalText(form: FormData, key: string, fallback: string, max = 2000) {
  const value = form.get(key);
  const result = typeof value === "string" ? value.trim() : "";
  if (result.length > max) throw new Error(`${key} is too long`);
  return result || fallback;
}

function values(form: FormData, key: string) {
  return form
    .getAll(key)
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter(Boolean);
}

function positiveInt(form: FormData, key: string, label: string) {
  const number = Number(form.get(key));
  if (!Number.isInteger(number) || number < 0) {
    throw new Error(`${label} is invalid`);
  }
  return number;
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

function variantsFrom(form: FormData, slug: string) {
  const raw = form.get("variants");
  let parsed: unknown;

  try {
    parsed = typeof raw === "string" ? JSON.parse(raw) : null;
  } catch {
    throw new Error("Variants are invalid");
  }

  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error("At least one size is required");
  }

  const sizes = new Set<number>();

  return parsed.map((variant, index) => {
    if (!variant || typeof variant !== "object") {
      throw new Error("Variant data is invalid");
    }

    const record = variant as Record<string, unknown>;
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
      sizeML,
      price: price.toFixed(2),
      stock,
      sku: skuFrom(slug, sizeML)
    };
  });
}

async function saveImages(files: File[], slug: string) {
  const uploadDir = path.join(process.cwd(), "public", "uploads", "fragrances");
  await mkdir(uploadDir, {recursive: true});

  const saved = [];

  for (const [index, file] of files.entries()) {
    if (!file.size) continue;
    if (!file.type.startsWith("image/")) {
      throw new Error("Only image files can be uploaded");
    }
    if (file.size > 5 * 1024 * 1024) {
      throw new Error("Each image must be 5MB or less");
    }

    const extension = file.name.split(".").pop()?.toLowerCase() || "png";
    const safeName = `${slug}-${Date.now()}-${index}.${extension}`.replace(
      /[^a-zA-Z0-9._-]/g,
      "-"
    );
    const bytes = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(uploadDir, safeName), bytes);
    saved.push(`/uploads/fragrances/${safeName}`);
  }

  return saved;
}

export async function GET() {
  return NextResponse.json({message: "Use the admin inventory page"});
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
    const slug = text(form, "slug", "Slug", 80);
    const nameEn = text(form, "nameEn", "English name");
    const nameAr = optionalText(form, "nameAr", nameEn);
    const taglineEn = text(form, "taglineEn", "English tagline", 300);
    const descriptionEn = text(form, "descriptionEn", "English description", 2000);
    const taglineAr = optionalText(form, "taglineAr", taglineEn, 300);
    const descriptionAr = optionalText(form, "descriptionAr", descriptionEn, 2000);
    const gender = text(form, "gender", "Gender") as Gender;
    const scentProfile = text(form, "scentProfile", "Scent profile") as ScentProfile;
    const sillage = text(form, "sillage", "Sillage") as Sillage;

    if (!genderValues.has(gender)) throw new Error("Gender is invalid");
    if (!scentValues.has(scentProfile)) throw new Error("Scent profile is invalid");
    if (!sillageValues.has(sillage)) throw new Error("Sillage is invalid");

    const variants = variantsFrom(form, slug);
    const uploadedImages = await saveImages(
      form.getAll("images").filter((value): value is File => value instanceof File),
      slug
    );
    const selectedSeasons = values(form, "seasons").filter((season) =>
      seasonValues.has(season)
    );
    const finalSeasons = selectedSeasons.includes("ALL_YEAR")
      ? ["ALL_YEAR"]
      : selectedSeasons;
    const ingredients = values(form, "ingredients");

    await prisma.fragrance.create({
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
        avoidIf: values(form, "avoidIf"),
        bestFor: [],
        seasons: finalSeasons,
        sillage,
        longevity: positiveInt(form, "longevity", "Longevity"),
        isPublished: true,
        variants: {
          create: variants
        },
        ingredients: {
          create: ingredients.map((ingredient, index) => ({
            nameEn: ingredient,
            nameAr: ingredient,
            note:
              index === 0
                ? FragranceNote.TOP
                : index === ingredients.length - 1
                  ? FragranceNote.BASE
                  : FragranceNote.MIDDLE
          }))
        },
        images: {
          create: uploadedImages.map((url, index) => ({
            url,
            altEn: `${nameEn} fragrance bottle`,
            altAr: `${nameAr} fragrance bottle`,
            position: index + 1,
            isPrimary: index === 0
          }))
        }
      }
    });

    return NextResponse.json({message: "Product created"}, {status: 201});
  } catch (error) {
    return NextResponse.json(
      {message: error instanceof Error ? error.message : "Unable to create product"},
      {status: 400}
    );
  }
}
