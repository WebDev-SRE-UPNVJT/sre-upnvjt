import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || "sre-upnvjt";
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || "https://cdn.webly.biz.id/";

export const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID || "",
    secretAccessKey: R2_SECRET_ACCESS_KEY || "",
  },
});

/**
 * Uploads a buffer or file content directly to Cloudflare R2 bucket.
 * @param {Buffer} buffer - File buffer
 * @param {string} key - R2 Storage object key (path/filename)
 * @param {string} contentType - MIME type of the file
 * @returns {Promise<string>} Public URL of the uploaded file
 */
export async function uploadToR2(buffer, key, contentType = "image/webp") {
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  });

  await r2Client.send(command);

  // Return object key (relative path) so domain can be dynamically rendered/prepended anywhere
  return key;
}

/**
 * Deletes an object from Cloudflare R2 bucket.
 * @param {string} keyOrUrl - R2 Storage object key or full URL
 */
export async function deleteFromR2(keyOrUrl) {
  if (!keyOrUrl) return;

  // Extract clean object key from full URL if provided
  let key = keyOrUrl;
  if (keyOrUrl.startsWith("http://") || keyOrUrl.startsWith("https://")) {
    try {
      const urlObj = new URL(keyOrUrl);
      key = urlObj.pathname.replace(/^\/+/, "");
    } catch {
      key = keyOrUrl.replace(/^https?:\/\/[^\/]+\//, "");
    }
  } else {
    key = key.replace(/^\/+/, "");
  }

  if (!key) return;

  const command = new DeleteObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
  });

  await r2Client.send(command);
}
