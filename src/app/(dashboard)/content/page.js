import React from "react";
import { db } from "@/lib/db";
import { content, contentCategory, user } from "@/db/schema";
import { eq, desc, asc } from "drizzle-orm";
import ContentClient from "./ContentClient";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Content Management | SRE Portal",
};

export default async function ContentPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const currentUser = await db.query.user.findFirst({
    where: eq(user.email, session.user.email),
    with: { role: true }
  });

  const categories = await db.query.contentCategory.findMany({
    orderBy: [asc(contentCategory.name)]
  });

  const rawContents = await db.select({
    id: content.id,
    title: content.title,
    titleId: content.titleId,
    slug: content.slug,
    body: content.body,
    bodyId: content.bodyId,
    categoryId: content.categoryId,
    imageUrl: content.imageUrl,
    isPublished: content.isPublished,
    createdAt: content.createdAt,
    author: {
      name: user.name,
    },
    category: {
      id: contentCategory.id,
      name: contentCategory.name,
      slug: contentCategory.slug,
      color: contentCategory.color,
    }
  })
  .from(content)
  .leftJoin(user, eq(content.updatedById, user.id))
  .leftJoin(contentCategory, eq(content.categoryId, contentCategory.id))
  .orderBy(desc(content.createdAt));

  const contentsData = rawContents.map(c => ({
    id: c.id,
    title: c.title,
    titleId: c.titleId,
    slug: c.slug,
    body: c.body,
    bodyId: c.bodyId,
    categoryId: c.categoryId,
    categoryName: c.category?.name || null,
    categoryColor: c.category?.color || null,
    imageUrl: c.imageUrl,
    isPublished: c.isPublished,
    createdAt: c.createdAt,
    authorName: c.author?.name || "Unknown",
  }));

  return (
    <ContentClient 
      initialContents={contentsData} 
      initialCategories={categories}
      currentUser={currentUser} 
    />
  );
}
