import {randomUUID} from "crypto";

import {uploadBufferToCloudinary} from "@/lib/cloudinary";

export async function uploadNewsletterImage(file: File) {
  if (!file.size) throw new Error("Choose an image to attach");
  if (!file.type.startsWith("image/")) {
    throw new Error("Newsletter attachment must be an image");
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("Newsletter images must be 5MB or less");
  }

  const original = Buffer.from(await file.arrayBuffer());
  let payload: Buffer = original;
  try {
    const sharpModule = await import("sharp");
    const sharp = sharpModule.default || sharpModule;
    payload = (await sharp(original)
      .rotate()
      .resize({
        width: 1600,
        height: 1000,
        fit: "inside",
        withoutEnlargement: true
      })
      .webp({quality: 88, effort: 6, smartSubsample: true})
      .toBuffer()) as Buffer;
  } catch (error) {
    console.warn("Sharp image optimization bypassed:", error instanceof Error ? error.message : error);
  }

  const upload = await uploadBufferToCloudinary(payload, {
    folder: "valentro/newsletters",
    public_id: `newsletter-${Date.now()}-${randomUUID().slice(0, 8)}`,
    resource_type: "image",
    format: "webp",
    overwrite: false
  });

  return upload.secure_url;
}
