/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  serverExternalPackages: ["canvas", "pdfjs-dist"],
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        // Firebase Storage — covers both default and custom buckets
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
      },
      {
        // Supabase Storage
        protocol: "https",
        hostname: "*.supabase.co",
      },
      {
        // Cloudinary
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
};

export default nextConfig;
