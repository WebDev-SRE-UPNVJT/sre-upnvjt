"use server";

import { db } from "@/lib/db";
import { documentCategory, documentItem } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// ─── DOCUMENT CATEGORY ACTIONS ───────────────────────────────────────────────
export async function createDocumentCategory(formData) {
  try {
    const name = formData.get("name")?.trim();
    const description = formData.get("description")?.trim() || null;

    if (!name) return { error: "Nama kategori wajib diisi" };

    const [newCat] = await db.insert(documentCategory).values({
      name,
      description,
    }).returning();

    revalidatePath("/documents");
    revalidatePath("/staff/dokumen");
    return { success: true, category: newCat };
  } catch (err) {
    return { error: err.message || "Gagal membuat kategori" };
  }
}

export async function updateDocumentCategory(id, formData) {
  try {
    const name = formData.get("name")?.trim();
    const description = formData.get("description")?.trim() || null;

    if (!name) return { error: "Nama kategori wajib diisi" };

    const [updated] = await db.update(documentCategory).set({
      name,
      description,
    }).where(eq(documentCategory.id, id)).returning();

    revalidatePath("/documents");
    revalidatePath("/staff/dokumen");
    return { success: true, category: updated };
  } catch (err) {
    return { error: err.message || "Gagal mengupdate kategori" };
  }
}

export async function deleteDocumentCategory(id) {
  try {
    // Delete items in category first to preserve integrity
    await db.delete(documentItem).where(eq(documentItem.categoryId, id));
    await db.delete(documentCategory).where(eq(documentCategory.id, id));

    revalidatePath("/documents");
    revalidatePath("/staff/dokumen");
    return { success: true };
  } catch (err) {
    return { error: err.message || "Gagal menghapus kategori" };
  }
}

// ─── DOCUMENT ITEM ACTIONS ───────────────────────────────────────────────────
export async function createDocumentItem(payload, uploadedById) {
  try {
    const { categoryId, title, description, fileUrl } = payload;

    if (!title || !fileUrl || !categoryId) {
      return { error: "Judul, kategori, dan file dokumen wajib diisi" };
    }

    const [newItem] = await db.insert(documentItem).values({
      categoryId: parseInt(categoryId),
      title: title.trim(),
      description: description?.trim() || null,
      fileUrl,
      uploadedById: parseInt(uploadedById),
    }).returning();

    const fullItem = await db.query.documentItem.findFirst({
      where: eq(documentItem.id, newItem.id),
      with: {
        category: true,
        uploadedBy: { columns: { id: true, name: true, email: true } },
      },
    });

    revalidatePath("/documents");
    revalidatePath("/staff/dokumen");
    return { success: true, item: fullItem };
  } catch (err) {
    return { error: err.message || "Gagal membuat dokumen" };
  }
}

export async function updateDocumentItem(id, payload) {
  try {
    const { categoryId, title, description, fileUrl } = payload;

    if (!title || !fileUrl || !categoryId) {
      return { error: "Judul, kategori, dan file dokumen wajib diisi" };
    }

    const [updated] = await db.update(documentItem).set({
      categoryId: parseInt(categoryId),
      title: title.trim(),
      description: description?.trim() || null,
      fileUrl,
    }).where(eq(documentItem.id, id)).returning();

    const fullItem = await db.query.documentItem.findFirst({
      where: eq(documentItem.id, updated.id),
      with: {
        category: true,
        uploadedBy: { columns: { id: true, name: true, email: true } },
      },
    });

    revalidatePath("/documents");
    revalidatePath("/staff/dokumen");
    return { success: true, item: fullItem };
  } catch (err) {
    return { error: err.message || "Gagal mengupdate dokumen" };
  }
}

export async function deleteDocumentItem(id) {
  try {
    await db.delete(documentItem).where(eq(documentItem.id, id));

    revalidatePath("/documents");
    revalidatePath("/staff/dokumen");
    return { success: true };
  } catch (err) {
    return { error: err.message || "Gagal menghapus dokumen" };
  }
}
