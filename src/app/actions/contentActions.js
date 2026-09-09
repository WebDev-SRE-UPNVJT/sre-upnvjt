"use server";

import { db } from "@/lib/db";
import { content, contentCategory, user } from "@/db/schema";
import { eq, desc, asc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// ==========================================
// 1. Content Categories Actions
// ==========================================

export async function getContentCategories() {
  try {
    const categories = await db.query.contentCategory.findMany({
      orderBy: [asc(contentCategory.name)],
    });
    return { success: true, data: categories };
  } catch (error) {
    console.error("Error fetching content categories:", error);
    return { success: false, error: error.message, data: [] };
  }
}

export async function createContentCategory(data) {
  try {
    const { name, slug, description, color } = data;
    const generatedSlug = (slug || name)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    const [result] = await db.insert(contentCategory).values({
      name: name.trim(),
      slug: generatedSlug,
      description: description?.trim() || null,
      color: color || "emerald",
      createdAt: new Date(),
    }).returning();

    revalidatePath("/content");
    revalidatePath("/articles");
    revalidatePath("/");
    return { success: true, category: result };
  } catch (error) {
    console.error("Error creating content category:", error);
    if (error.code === '23505' || error.code === 'ER_DUP_ENTRY') {
      return { success: false, error: "A category with this name or slug already exists." };
    }
    return { success: false, error: error.message };
  }
}

export async function updateContentCategory(id, data) {
  try {
    const { name, slug, description, color } = data;
    const generatedSlug = slug
      ? slug.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
      : undefined;

    const updatePayload = {
      ...(name && { name: name.trim() }),
      ...(generatedSlug && { slug: generatedSlug }),
      description: description !== undefined ? (description?.trim() || null) : undefined,
      ...(color && { color }),
    };

    const [result] = await db.update(contentCategory)
      .set(updatePayload)
      .where(eq(contentCategory.id, id))
      .returning();

    revalidatePath("/content");
    revalidatePath("/articles");
    revalidatePath("/");
    return { success: true, category: result };
  } catch (error) {
    console.error("Error updating content category:", error);
    if (error.code === '23505' || error.code === 'ER_DUP_ENTRY') {
      return { success: false, error: "A category with this name or slug already exists." };
    }
    return { success: false, error: error.message };
  }
}

export async function deleteContentCategory(id) {
  try {
    await db.delete(contentCategory).where(eq(contentCategory.id, id));

    revalidatePath("/content");
    revalidatePath("/articles");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error deleting content category:", error);
    return { success: false, error: error.message };
  }
}

// ==========================================
// 2. Content (Articles) Actions
// ==========================================

export async function createContent(data) {
  try {
    const { title, titleId, slug, body, bodyId, imageUrl, isPublished, updatedById, categoryId } = data;
    
    const [result] = await db.insert(content).values({
      title,
      titleId: titleId?.trim() || null,
      slug,
      body,
      bodyId: bodyId || null,
      categoryId: categoryId ? parseInt(categoryId, 10) : null,
      imageUrl: imageUrl || null,
      isPublished: isPublished !== undefined ? isPublished : false,
      updatedById,
      createdAt: new Date(),
    }).returning({ id: content.id });

    revalidatePath("/content");
    revalidatePath("/dashboard/content");
    revalidatePath("/articles");
    revalidatePath("/");
    return { success: true, data: { id: result.id, title, slug } };
  } catch (error) {
    console.error("Error creating content:", error);
    if (error.code === '23505' || error.code === 'ER_DUP_ENTRY') {
      return { success: false, error: "Slug already exists. Please choose a different title or slug." };
    }
    return { success: false, error: error.message };
  }
}

export async function updateContent(id, data) {
  try {
    const { title, titleId, slug, body, bodyId, imageUrl, isPublished, updatedById, categoryId } = data;
    
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
      titleId: titleId !== undefined ? (titleId?.trim() || null) : undefined,
      slug,
      body,
      bodyId: bodyId !== undefined ? (bodyId || null) : undefined,
      categoryId: categoryId !== undefined ? (categoryId ? parseInt(categoryId, 10) : null) : undefined,
      imageUrl,
      isPublished,
      updatedById,
    }).where(eq(content.id, id));

    revalidatePath("/content");
    revalidatePath(`/articles/${slug}`);
    revalidatePath("/articles");
    revalidatePath("/dashboard/content");
    revalidatePath("/");
    return { success: true, data: { id, title, slug } };
  } catch (error) {
    console.error("Error updating content:", error);
    if (error.code === '23505' || error.code === 'ER_DUP_ENTRY') {
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
    revalidatePath("/articles");
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
      titleId: content.titleId,
      slug: content.slug,
      body: content.body,
      bodyId: content.bodyId,
      imageUrl: content.imageUrl,
      createdAt: content.createdAt,
      categoryId: content.categoryId,
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
    .where(eq(content.isPublished, true))
    .orderBy(desc(content.createdAt));

    return { success: true, data: articles };
  } catch (error) {
    console.error("Error fetching public content:", error);
    return { success: false, error: error.message };
  }
}
