export default function robots() {
  const baseUrl = (process.env.NEXTAUTH_URL || "https://www.sreupnjatim.com").replace(/\/$/, "");

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/dashboard",
          "/dashboard/",
          "/member",
          "/member/",
          "/staff",
          "/staff/",
          "/api/",
          "/login",
          "/register",
          "/s/",
        ],
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: [
          "/dashboard",
          "/dashboard/",
          "/member",
          "/member/",
          "/staff",
          "/staff/",
          "/api/",
          "/login",
          "/register",
          "/s/",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
