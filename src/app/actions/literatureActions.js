"use server";

import { db } from "@/lib/db";
import { literatureCategory, literatureItem } from "@/db/schema";
import { asc, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getCategories() {
  try {
    const categories = await db.query.literatureCategory.findMany({
      orderBy: [asc(literatureCategory.name)],
    });
    return { success: true, data: categories };
  } catch (error) {
    console.error("Error fetching literature categories:", error);
    return { success: false, error: error.message, data: [] };
  }
}

export async function getLiteratureItems() {
  try {
    const items = await db.query.literatureItem.findMany({
      orderBy: [desc(literatureItem.createdAt)],
      with: {
        category: { columns: { id: true, name: true, imageUrl: true } },
      },
    });
    return { success: true, data: items };
  } catch (error) {
    console.error("Error fetching literature items:", error);
    return { success: false, error: error.message, data: [] };
  }
}

export async function createCategory(data) {
  try {
    const { name, imageUrl, description } = data;
    const [result] = await db.insert(literatureCategory).values({
      name,
      imageUrl: imageUrl || null,
      description: description || null,
    }).returning();
    revalidatePath("/literature");
    return { success: true, category: result };
  } catch (error) {
    console.error("Error creating category:", error);
    return { success: false, error: error.message };
  }
}

export async function updateCategory(id, data) {
  try {
    const { name, imageUrl, description } = data;
    const existing = await db.query.literatureCategory.findFirst({ where: eq(literatureCategory.id, id) });
    if (imageUrl !== undefined && existing?.imageUrl && existing.imageUrl !== imageUrl) {
      try {
        const { deleteFromR2 } = await import("@/lib/r2");
        await deleteFromR2(existing.imageUrl);
      } catch (r2Err) {
        console.warn("Failed to delete old literature category image from R2:", r2Err);
      }
    }

    const [result] = await db.update(literatureCategory)
      .set({ name, imageUrl: imageUrl || null, description: description || null })
      .where(eq(literatureCategory.id, id))
      .returning();
    revalidatePath("/literature");
    return { success: true, category: result };
  } catch (error) {
    console.error("Error updating category:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteCategory(id) {
  try {
    const existing = await db.query.literatureCategory.findFirst({ where: eq(literatureCategory.id, id) });
    await db.delete(literatureCategory).where(eq(literatureCategory.id, id));

    if (existing?.imageUrl) {
      try {
        const { deleteFromR2 } = await import("@/lib/r2");
        await deleteFromR2(existing.imageUrl);
      } catch (r2Err) {
        console.warn("Failed to delete literature category image from R2:", r2Err);
      }
    }

    revalidatePath("/literature");
    return { success: true };
  } catch (error) {
    console.error("Error deleting category:", error);
    return { success: false, error: error.message };
  }
}

export async function createLiteratureItem(data, uploadedById) {
  try {
    const { categoryId, title, author, year, driveUrl, type, isPublished } = data;
    const [result] = await db.insert(literatureItem).values({
      categoryId: parseInt(categoryId),
      title,
      author: author || null,
      year: year ? parseInt(year) : null,
      driveUrl,
      type: type || null,
      isPublished: Boolean(isPublished),
      uploadedById,
    }).returning();

    const full = await db.query.literatureItem.findFirst({
      where: (t, { eq }) => eq(t.id, result.id),
      with: { category: { columns: { id: true, name: true, imageUrl: true } } },
    });

    revalidatePath("/literature");
    return { success: true, item: full };
  } catch (error) {
    console.error("Error creating literature item:", error);
    return { success: false, error: error.message };
  }
}

export async function updateLiteratureItem(id, data) {
  try {
    const { categoryId, title, author, year, driveUrl, type, isPublished } = data;
    await db.update(literatureItem).set({
      categoryId: parseInt(categoryId),
      title,
      author: author || null,
      year: year ? parseInt(year) : null,
      driveUrl,
      type: type || null,
      isPublished: Boolean(isPublished),
    }).where(eq(literatureItem.id, id));

    const updated = await db.query.literatureItem.findFirst({
      where: (t, { eq }) => eq(t.id, id),
      with: { category: { columns: { id: true, name: true, imageUrl: true } } },
    });

    revalidatePath("/literature");
    return { success: true, item: updated };
  } catch (error) {
    console.error("Error updating literature item:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteLiteratureItem(id) {
  try {
    await db.delete(literatureItem).where(eq(literatureItem.id, id));
    revalidatePath("/literature");
    return { success: true };
  } catch (error) {
    console.error("Error deleting literature item:", error);
    return { success: false, error: error.message };
  }
}
