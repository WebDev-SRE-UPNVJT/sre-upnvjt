"use server";

import { db } from "@/lib/db";
import { content, user } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function createContent(data) {
  try {
    const { title, slug, body, imageUrl, isPublished, updatedById } = data;
    
    const [result] = await db.insert(content).values({
      title,
      slug,
      body,
      imageUrl: imageUrl || null,
      isPublished: isPublished !== undefined ? isPublished : false,
      updatedById,
      createdAt: new Date(),
    }).returning({ id: content.id });

    revalidatePath("/content");
    revalidatePath("/dashboard/content");
    revalidatePath("/");
    return { success: true, data: { id: result.id, title, slug } };
  } catch (error) {
    console.error("Error creating content:", error);
    if (error.code === 'ER_DUP_ENTRY') {
      return { success: false, error: "Slug already exists. Please choose a different title or slug." };
    }
    return { success: false, error: error.message };
  }
}

export async function updateContent(id, data) {
  try {
    const { title, slug, body, imageUrl, isPublished, updatedById } = data;
    
    const existing = await db.query.content.findFirst({ where: eq(content.id, id) });
    if (imageUrl !== undefined && existing?.imageUrl && existing.imageUrl !== imageUrl) {
      try {
        const { deleteFromR2 } = await import("@/lib/r2");
        await deleteFromR2(existing.imageUrl);
      } catch (r2Err) {
        console.warn("Failed to delete old content image from R2:", r2Err);
      }
    }

    await db.update(content).set({
      title,
      slug,
      body,
      imageUrl,
      isPublished,
      updatedById,
    }).where(eq(content.id, id));

    revalidatePath("/content");
    revalidatePath(`/content/${slug}`);
    revalidatePath("/dashboard/content");
    revalidatePath("/");
    return { success: true, data: { id, title, slug } };
  } catch (error) {
    console.error("Error updating content:", error);
    if (error.code === 'ER_DUP_ENTRY') {
      return { success: false, error: "Slug already exists. Please choose a different title or slug." };
    }
    return { success: false, error: error.message };
  }
}

export async function deleteContent(id) {
  try {
    const existing = await db.query.content.findFirst({ where: eq(content.id, id) });
    await db.delete(content).where(eq(content.id, id));

    if (existing?.imageUrl) {
      try {
        const { deleteFromR2 } = await import("@/lib/r2");
        await deleteFromR2(existing.imageUrl);
      } catch (r2Err) {
        console.warn("Failed to delete content image from R2:", r2Err);
      }
    }

    revalidatePath("/content");
    revalidatePath("/dashboard/content");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error deleting content:", error);
    return { success: false, error: error.message };
  }
}

export async function getPublicContent() {
  try {
    const articles = await db.select({
      id: content.id,
      title: content.title,
      slug: content.slug,
      body: content.body,
      imageUrl: content.imageUrl,
      createdAt: content.createdAt,
      author: {
        name: user.name,
        profilePictureUrl: user.profilePictureUrl
      }
    })
    .from(content)
    .leftJoin(user, eq(content.updatedById, user.id))
    .where(eq(content.isPublished, true))
    .orderBy(desc(content.createdAt));

    return { success: true, data: articles };
  } catch (error) {
    console.error("Error fetching public content:", error);
    return { success: false, error: error.message };
  }
}
