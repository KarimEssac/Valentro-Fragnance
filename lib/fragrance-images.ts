import {uploadBufferToCloudinary} from "@/lib/cloudinary";

async function optimizeImageBuffer(original: Buffer, maxDimension: number): Promise<Buffer> {
  try {
    const sharpModule = await import("sharp");
    const sharp = sharpModule.default || sharpModule;
    return await sharp(original)
      .rotate()
      .resize({
        width: maxDimension,
        height: maxDimension,
        fit: "inside",
        withoutEnlargement: true
      })
      .webp({
        quality: 88,
        effort: 6,
        smartSubsample: true
      })
      .toBuffer();
  } catch (error) {
    console.warn("Sharp image optimization bypassed:", error instanceof Error ? error.message : error);
    return original;
  }
}

async function uploadOptimizedImages(
  files: File[],
  slug: string,
  folder: string,
  maxDimension = 2000
) {
  const saved: string[] = [];

  for (const [index, file] of files.entries()) {
    if (!file.size) continue;
    if (!file.type.startsWith("image/")) {
      throw new Error("Only image files can be uploaded");
    }
    if (file.size > 5 * 1024 * 1024) {
      throw new Error("Each image must be 5MB or less");
    }

    const publicId = `${slug}-${Date.now()}-${index}`.replace(
      /[^a-zA-Z0-9._-]/g,
      "-"
    );
    const original = Buffer.from(await file.arrayBuffer());
    const payload = await optimizeImageBuffer(original, maxDimension);

    const upload = await uploadBufferToCloudinary(payload, {
      folder,
      public_id: publicId,
      resource_type: "image",
      format: "webp",
      overwrite: false
    });

    saved.push(upload.secure_url);
  }

  return saved;
}

export async function uploadFragranceImages(files: File[], slug: string) {
  return uploadOptimizedImages(files, slug, "valentro/fragrances");
}

export async function uploadCollectionImages(files: File[], slug: string) {
  return uploadOptimizedImages(files, slug, "valentro/collections");
}

export async function uploadFragranceReferenceImage(file: File | null, slug: string) {
  if (!file || !file.size) return null;
  const images = await uploadOptimizedImages([file], slug, "valentro/references", 800);
  return images[0] ?? null;
}
