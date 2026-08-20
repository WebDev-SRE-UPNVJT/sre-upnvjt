import { db } from "@/lib/db";
import { content } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";
export const revalidate = 3600; // Revalidate every 1 hour

export default async function sitemap() {
  const baseUrl = (process.env.NEXTAUTH_URL || "https://www.sreupnjatim.com").replace(/\/$/, "");
  const now = new Date();

  // 1. Static Public Pages
  const staticPages = [
    {
      url: `${baseUrl}`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/articles`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/events`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.85,
    },
    {
      url: `${baseUrl}/activity`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.85,
    },
    {
      url: `${baseUrl}/merchandise`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/merchandise/order`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/join`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.85,
    },
    {
      url: `${baseUrl}/status`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.6,
    },
  ];

  // 2. Dynamic Article Pages from Database
  let articlePages = [];
  try {
    const publishedArticles = await db
      .select({
        slug: content.slug,
        createdAt: content.createdAt,
      })
      .from(content)
      .where(eq(content.isPublished, true))
      .orderBy(desc(content.createdAt));

    articlePages = publishedArticles
      .filter((article) => article.slug && article.slug.trim() !== "")
      .map((article) => ({
        url: `${baseUrl}/articles/${encodeURIComponent(article.slug)}`,
        lastModified: article.createdAt ? new Date(article.createdAt) : now,
        changeFrequency: "weekly",
        priority: 0.8,
      }));
  } catch (err) {
    console.error("[sitemap] Failed to fetch articles for sitemap:", err.message);
  }

  return [...staticPages, ...articlePages];
}
