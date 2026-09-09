import React from "react";
import { db } from "@/lib/db";
import { content, contentCategory, user } from "@/db/schema";
import { eq, ne, desc, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import ArticleDetailClient from "./ArticleDetailClient";
import { resolveImageUrl } from "@/lib/imageUrl";

export const dynamic = "force-dynamic";

const SITE_URL = process.env.NEXTAUTH_URL || "https://sreupnjatim.com";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  
  const articleQuery = await db.select({
    id: content.id,
    title: content.title,
    titleId: content.titleId,
    body: content.body,
    bodyId: content.bodyId,
    imageUrl: content.imageUrl,
    createdAt: content.createdAt,
    categoryName: contentCategory.name,
    authorName: user.name,
  })
  .from(content)
  .leftJoin(user, eq(content.updatedById, user.id))
  .leftJoin(contentCategory, eq(content.categoryId, contentCategory.id))
  .where(eq(content.slug, slug))
  .limit(1);

  const data = articleQuery[0];

  if (!data) {
    return { 
      title: "Artikel Tidak Ditemukan | SRE UPN Veteran Jawa Timur",
      robots: { index: false, follow: false }
    };
  }

  const plainText = (data.body || "").replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
  const description = plainText.substring(0, 165) + (plainText.length > 165 ? "..." : "");
  const resolvedCoverUrl = data.imageUrl ? resolveImageUrl(data.imageUrl) : "";
  const absoluteCoverUrl = resolvedCoverUrl 
    ? (resolvedCoverUrl.startsWith("http") ? resolvedCoverUrl : `${SITE_URL}${resolvedCoverUrl}`) 
    : `${SITE_URL}/favicon-512.png`;

  return {
    title: `${data.title} | SRE UPN Veteran Jawa Timur`,
    description: description || "Artikel wawasan transisi energi bersih dan terbarukan dari Society of Renewable Energy UPN Veteran Jawa Timur.",
    keywords: [
      data.title,
      data.categoryName || "Energi Terbarukan",
      "SRE UPN Veteran Jawa Timur",
      "SRE UPNVJT",
      "Society of Renewable Energy",
      "Clean Energy Transition",
      "EBT Indonesia"
    ],
    authors: [{ name: data.authorName || "Editorial Team SRE UPNVJT" }],
    creator: data.authorName || "SRE UPN Veteran Jawa Timur",
    publisher: "SRE UPN Veteran Jawa Timur",
    alternates: {
      canonical: `/articles/${slug}`,
    },
    openGraph: {
      title: data.title,
      description: description,
      url: `${SITE_URL}/articles/${slug}`,
      siteName: "SRE UPN Veteran Jawa Timur",
      locale: "id_ID",
      type: "article",
      publishedTime: data.createdAt ? new Date(data.createdAt).toISOString() : undefined,
      authors: [data.authorName || "SRE UPN Veteran Jawa Timur"],
      images: [
        {
          url: absoluteCoverUrl,
          width: 1200,
          height: 630,
          alt: data.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: data.title,
      description: description,
      images: [absoluteCoverUrl],
      creator: "@sreupnvjt",
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  };
}

export default async function ContentDetailPage({ params }) {
  const { slug } = await params;

  // 1. Fetch current article
  const articleQuery = await db.select({
    id: content.id,
    title: content.title,
    titleId: content.titleId,
    slug: content.slug,
    body: content.body,
    bodyId: content.bodyId,
    imageUrl: content.imageUrl,
    isPublished: content.isPublished,
    createdAt: content.createdAt,
    category: {
      id: contentCategory.id,
      name: contentCategory.name,
      slug: contentCategory.slug,
      color: contentCategory.color,
    },
    author: {
      name: user.name,
      profilePictureUrl: user.profilePictureUrl
    }
  })
  .from(content)
  .leftJoin(user, eq(content.updatedById, user.id))
  .leftJoin(contentCategory, eq(content.categoryId, contentCategory.id))
  .where(eq(content.slug, slug))
  .limit(1);

  const articleData = articleQuery[0];

  if (!articleData || !articleData.isPublished) {
    notFound();
  }

  // 2. Fetch up to 3 related / latest articles
  const relatedQuery = await db.select({
    id: content.id,
    title: content.title,
    titleId: content.titleId,
    slug: content.slug,
    body: content.body,
    bodyId: content.bodyId,
    imageUrl: content.imageUrl,
    createdAt: content.createdAt,
    category: {
      id: contentCategory.id,
      name: contentCategory.name,
      slug: contentCategory.slug,
      color: contentCategory.color,
    },
    author: {
      name: user.name,
    }
  })
  .from(content)
  .leftJoin(user, eq(content.updatedById, user.id))
  .leftJoin(contentCategory, eq(content.categoryId, contentCategory.id))
  .where(and(eq(content.isPublished, true), ne(content.slug, slug)))
  .orderBy(desc(content.createdAt))
  .limit(3);

  // 3. Automated JSON-LD Schema (Google Article & NewsArticle Structured Data)
  const plainText = (articleData.body || "").replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
  const description = plainText.substring(0, 165) + (plainText.length > 165 ? "..." : "");
  const resolvedCoverUrl = articleData.imageUrl ? resolveImageUrl(articleData.imageUrl) : "";
  const absoluteCoverUrl = resolvedCoverUrl 
    ? (resolvedCoverUrl.startsWith("http") ? resolvedCoverUrl : `${SITE_URL}${resolvedCoverUrl}`) 
    : `${SITE_URL}/favicon-512.png`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "headline": articleData.title,
    "description": description,
    "image": [absoluteCoverUrl],
    "datePublished": articleData.createdAt ? new Date(articleData.createdAt).toISOString() : new Date().toISOString(),
    "dateModified": articleData.createdAt ? new Date(articleData.createdAt).toISOString() : new Date().toISOString(),
    "author": [{
      "@type": "Person",
      "name": articleData.author?.name || "SRE Editorial Team"
    }],
    "publisher": {
      "@type": "Organization",
      "name": "Society of Renewable Energy UPN Veteran Jawa Timur",
      "url": SITE_URL,
      "logo": {
        "@type": "ImageObject",
        "url": `${SITE_URL}/icon-512.png`
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `${SITE_URL}/articles/${articleData.slug}`
    }
  };

  return (
    <>
      {/* Automated Google Rich Snippets / Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ArticleDetailClient articleData={articleData} relatedArticles={relatedQuery} />
    </>
  );
}
