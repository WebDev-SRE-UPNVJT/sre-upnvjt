"use server";

import { db } from "@/lib/db";
import { merchandise } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function createMerchandise(data) {
  try {
    const { name, price, description, imageUrl, linkUrl, isAvailable } = data;
    
    const [result] = await db.insert(merchandise).values({
      name,
      price,
      description,
      imageUrl,
      linkUrl,
      isAvailable: isAvailable !== undefined ? isAvailable : true,
    }).returning({ id: merchandise.id });

    revalidatePath("/merchandise");
    revalidatePath("/");
    return { success: true, merchandise: { id: result.id, name } };
  } catch (error) {
    console.error("Error creating merchandise:", error);
    return { success: false, error: error.message };
  }
}

export async function updateMerchandise(id, data) {
  try {
    const { name, price, description, imageUrl, linkUrl, isAvailable } = data;
    
    const existing = await db.query.merchandise.findFirst({ where: eq(merchandise.id, id) });
    if (imageUrl !== undefined && existing?.imageUrl && existing.imageUrl !== imageUrl) {
      try {
        const { deleteFromR2 } = await import("@/lib/r2");
        await deleteFromR2(existing.imageUrl);
      } catch (r2Err) {
        console.warn("Failed to delete old merchandise image from R2:", r2Err);
      }
    }

    await db.update(merchandise).set({
      name,
      price,
      description,
      imageUrl,
      linkUrl,
      isAvailable,
    }).where(eq(merchandise.id, id));

    revalidatePath("/merchandise");
    revalidatePath("/");
    return { success: true, merchandise: { id, name } };
  } catch (error) {
    console.error("Error updating merchandise:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteMerchandise(id) {
  try {
    const existing = await db.query.merchandise.findFirst({ where: eq(merchandise.id, id) });
    await db.delete(merchandise).where(eq(merchandise.id, id));

    if (existing?.imageUrl) {
      try {
        const { deleteFromR2 } = await import("@/lib/r2");
        await deleteFromR2(existing.imageUrl);
      } catch (r2Err) {
        console.warn("Failed to delete merchandise image from R2:", r2Err);
      }
    }

    revalidatePath("/merchandise");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error deleting merchandise:", error);
    return { success: false, error: error.message };
  }
}

export async function getPublicMerchandise() {
  try {
    const merch = await db.query.merchandise.findMany({
      where: eq(merchandise.isAvailable, true),
      orderBy: [desc(merchandise.createdAt)]
    });
    // Serialize decimal price to number to avoid Next.js serialization warnings
    const serialized = merch.map(m => ({
      ...m,
      price: m.price ? Number(m.price) : 0
    }));
    return { success: true, data: serialized };
  } catch (error) {
    console.error("Error fetching merchandise:", error);
    return { success: false, error: error.message };
  }
}
