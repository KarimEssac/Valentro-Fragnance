import {v2 as cloudinary} from "cloudinary";
import type {UploadApiResponse, UploadApiOptions} from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

function assertCloudinaryConfig() {
  if (
    !process.env.CLOUDINARY_CLOUD_NAME ||
    !process.env.CLOUDINARY_API_KEY ||
    !process.env.CLOUDINARY_API_SECRET
  ) {
    throw new Error("Cloudinary environment variables are not configured");
  }
}

export function uploadBufferToCloudinary(
  buffer: Buffer,
  options: UploadApiOptions
): Promise<UploadApiResponse> {
  assertCloudinaryConfig();

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) {
        reject(error);
        return;
      }

      if (!result) {
        reject(new Error("Cloudinary upload failed"));
        return;
      }

      resolve(result);
    });

    stream.end(buffer);
  });
}

export async function deleteCloudinaryImageByUrl(url: string) {
  assertCloudinaryConfig();

  const publicId = publicIdFromCloudinaryUrl(url);
  if (!publicId) return;

  await cloudinary.uploader.destroy(publicId, {resource_type: "image"});
}

function publicIdFromCloudinaryUrl(url: string) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname !== "res.cloudinary.com") return null;

    const uploadIndex = parsed.pathname.indexOf("/image/upload/");
    if (uploadIndex === -1) return null;

    const path = parsed.pathname.slice(uploadIndex + "/image/upload/".length);
    const withoutVersion = path.replace(/^v\d+\//, "");
    return withoutVersion.replace(/\.[^.]+$/, "");
  } catch {
    return null;
  }
}
