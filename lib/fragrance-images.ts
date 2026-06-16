import sharp from "sharp";

import {uploadBufferToCloudinary} from "@/lib/cloudinary";

async function uploadOptimizedImages(files: File[], slug: string, folder: string) {
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
    const optimized = await sharp(original)
      .rotate()
      .resize({
        width: 2000,
        height: 2000,
        fit: "inside",
        withoutEnlargement: true
      })
      .webp({
        quality: 88,
        effort: 6,
        smartSubsample: true
      })
      .toBuffer();

    const upload = await uploadBufferToCloudinary(optimized, {
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
