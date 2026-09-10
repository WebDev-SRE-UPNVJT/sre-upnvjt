import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

function getR2Config() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucketName = process.env.R2_BUCKET_NAME || "sre-upnvjt";
  const publicUrl = process.env.R2_PUBLIC_URL || "https://cdn.webly.biz.id/";

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error("Kredensial Cloudflare R2 belum disetel di Environment Variables Vercel (R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY). Pastikan sudah ditambahkan di Vercel Project Settings > Environment Variables.");
  }

  const client = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: accessKeyId || "",
      secretAccessKey: secretAccessKey || "",
    },
  });

  return { client, bucketName, publicUrl };
}

export const r2Client = new Proxy({}, {
  get(target, prop) {
    const { client } = getR2Config();
    const value = client[prop];
    return typeof value === 'function' ? value.bind(client) : value;
  }
});

/**
 * Uploads a buffer or file content directly to Cloudflare R2 bucket.
 * @param {Buffer} buffer - File buffer
 * @param {string} key - R2 Storage object key (path/filename)
 * @param {string} contentType - MIME type of the file
 * @returns {Promise<string>} Public URL of the uploaded file
 */
export async function uploadToR2(buffer, key, contentType = "image/webp") {
  const { client, bucketName } = getR2Config();
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  });

  await client.send(command);

  // Return object key (relative path) so domain can be dynamically rendered/prepended anywhere
  return key;
}

/**
 * Deletes an object from Cloudflare R2 bucket.
 * Handles full URLs (R2.dev, custom CDN, local proxy /api/cdn/) as well as raw keys.
 * @param {string} keyOrUrl - R2 Storage object key or full URL
 */
export async function deleteFromR2(keyOrUrl) {
  if (!keyOrUrl || typeof keyOrUrl !== "string") return;

  try {
    let raw = keyOrUrl.trim();
    if (!raw) return;

    let key = raw;

    // If it's a full URL, parse the pathname
    if (key.startsWith("http://") || key.startsWith("https://")) {
      try {
        const urlObj = new URL(key);
        const host = urlObj.hostname.toLowerCase();

        // Do not attempt R2 delete on non-storage third-party domains
        if (
          host.includes("google.com") ||
          host.includes("googleapis.com") ||
          host.includes("youtube.com") ||
          host.includes("youtu.be") ||
          host.includes("unsplash.com") ||
          host.includes("qrserver.com")
        ) {
          return;
        }

        key = urlObj.pathname;
      } catch {
        key = key.replace(/^https?:\/\/[^\/]+/, "");
      }
    }

    // Strip internal proxy prefix /api/cdn/
    key = key.replace(/^\/?api\/cdn\//, "");

    // Strip known public CDN / R2 prefixes if present in string
    key = key
      .replace(/^https?:\/\/pub-[a-zA-Z0-9]+\.r2\.dev\//, "")
      .replace(/^https?:\/\/cdn\.webly\.biz\.id\//, "")
      .replace(/^https?:\/\/[a-zA-Z0-9]+\.r2\.cloudflarestorage\.com\/[^\/]+\//, "");

    // Strip leading slashes
    key = key.replace(/^\/+/, "");

    if (!key) return;

    const command = new DeleteObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
    });

    await r2Client.send(command);
    console.log(`[deleteFromR2] Deleted object from bucket '${R2_BUCKET_NAME}': ${key}`);
  } catch (err) {
    console.warn(`[deleteFromR2] Warning deleting ${keyOrUrl}:`, err?.message || err);
  }
}
