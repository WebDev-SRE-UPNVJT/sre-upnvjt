/**
 * Utility to resolve image URLs properly across public and dashboard pages.
 * If the URL points to Cloudflare R2 bucket (r2.dev or cdn.webly.biz.id), 
 * it routes through the internal proxy /api/cdn/[key] so private/R2 images 
 * are fetched seamlessly via S3 credentials.
 */
export function resolveImageUrl(url) {
  if (!url || typeof url !== "string") return "";

  const trimmed = url.trim();
  if (!trimmed) return "";

  // Return early if data URL or blob URL (for local previews)
  if (trimmed.startsWith("data:") || trimmed.startsWith("blob:")) {
    return trimmed;
  }

  // Strip known R2 hostnames / domains to get the object key
  let cleaned = trimmed
    .replace(/^https?:\/\/pub-[a-zA-Z0-9]+\.r2\.dev\//, "")
    .replace(/^https?:\/\/cdn\.webly\.biz\.id\//, "")
    .replace(/^https?:\/\/[a-zA-Z0-9]+\.r2\.cloudflarestorage\.com\/[^\/]+\//, "");

  // If it already points to internal CDN proxy
  if (cleaned.startsWith("/api/cdn/")) {
    return cleaned;
  }

  // If it's another absolute external URL (Unsplash, Supabase, Cloudinary, etc.)
  if (cleaned.startsWith("http://") || cleaned.startsWith("https://")) {
    return cleaned;
  }

  // If it's a local public asset like /images/..., /icons/..., etc.
  if (cleaned.startsWith("/")) {
    if (
      cleaned.startsWith("/images/") ||
      cleaned.startsWith("/icons/") ||
      cleaned.startsWith("/logo") ||
      cleaned.startsWith("/favicon") ||
      cleaned.startsWith("/apple-icon")
    ) {
      return cleaned;
    }
    return `/api/cdn/${cleaned.replace(/^\/+/, "")}`;
  }

  // Default: treat as R2 key and route via /api/cdn/
  return `/api/cdn/${cleaned.replace(/^\/+/, "")}`;
}

export function resolveLogoUrl(url) {
  return resolveImageUrl(url);
}
