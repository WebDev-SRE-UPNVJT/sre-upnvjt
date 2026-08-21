"use server";

import { db } from "@/lib/db";
import { pptModule, pptSlide } from "@/db/schema";
import { desc, asc, eq, count } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getPptModules() {
  try {
    const modules = await db
      .select({
        id: pptModule.id,
        title: pptModule.title,
        description: pptModule.description,
        coverImageUrl: pptModule.coverImageUrl,
        isPublished: pptModule.isPublished,
        createdById: pptModule.createdById,
        createdAt: pptModule.createdAt,
        updatedAt: pptModule.updatedAt,
        slideCount: count(pptSlide.id),
      })
      .from(pptModule)
      .leftJoin(pptSlide, eq(pptSlide.moduleId, pptModule.id))
      .groupBy(pptModule.id)
      .orderBy(desc(pptModule.createdAt));

    return { success: true, data: modules };
  } catch (error) {
    console.error("Error fetching PPT modules:", error);
    return { success: false, error: error.message, data: [] };
  }
}

export async function getPptModule(id) {
  try {
    const mod = await db.query.pptModule.findFirst({
      where: (t, { eq }) => eq(t.id, id),
      with: {
        slides: { orderBy: [asc(pptSlide.order)] },
      },
    });
    return { success: true, data: mod || null };
  } catch (error) {
    console.error("Error fetching PPT module:", error);
    return { success: false, error: error.message, data: null };
  }
}

export async function createPptModule(data, createdById) {
  try {
    const { title, description, notes, coverImageUrl, isPublished } = data;
    const [result] = await db.insert(pptModule).values({
      title,
      description: description || null,
      notes: notes || null,
      coverImageUrl: coverImageUrl || null,
      isPublished: Boolean(isPublished),
      createdById,
    }).returning();
    revalidatePath("/ppt");
    return { success: true, module: { ...result, slideCount: 0 } };
  } catch (error) {
    console.error("Error creating PPT module:", error);
    return { success: false, error: error.message };
  }
}

export async function updatePptModule(id, data) {
  try {
    const { title, description, notes, coverImageUrl, isPublished } = data;
    const existing = await db.query.pptModule.findFirst({ where: eq(pptModule.id, id) });
    if (coverImageUrl !== undefined && existing?.coverImageUrl && existing.coverImageUrl !== coverImageUrl) {
      try {
        const { deleteFromR2 } = await import("@/lib/r2");
        await deleteFromR2(existing.coverImageUrl);
      } catch (r2Err) {
        console.warn("Failed to delete old PPT cover image from R2:", r2Err);
      }
    }

    const [result] = await db.update(pptModule)
      .set({
        title,
        description: description || null,
        notes: notes || null,
        coverImageUrl: coverImageUrl || null,
        isPublished: Boolean(isPublished),
        updatedAt: new Date(),
      })
      .where(eq(pptModule.id, id))
      .returning();
    revalidatePath("/ppt");
    return { success: true, module: result };
  } catch (error) {
    console.error("Error updating PPT module:", error);
    return { success: false, error: error.message };
  }
}

export async function deletePptModule(id) {
  try {
    const mod = await db.query.pptModule.findFirst({ where: eq(pptModule.id, id) });
    const slides = await db.query.pptSlide.findMany({ where: eq(pptSlide.moduleId, id) });

    try {
      const { deleteFromR2 } = await import("@/lib/r2");
      if (mod?.coverImageUrl) {
        await deleteFromR2(mod.coverImageUrl);
      }
      for (const s of slides) {
        if (s.fileUrl) {
          await deleteFromR2(s.fileUrl);
        }
      }
    } catch (r2Err) {
      console.warn("Failed to delete PPT module files from R2:", r2Err);
    }

    await db.delete(pptSlide).where(eq(pptSlide.moduleId, id));
    await db.delete(pptModule).where(eq(pptModule.id, id));
    revalidatePath("/ppt");
    return { success: true };
  } catch (error) {
    console.error("Error deleting PPT module:", error);
    return { success: false, error: error.message };
  }
}

export async function createPptSlide(moduleId, data) {
  try {
    const { title, fileUrl } = data;

    // Get current max order
    const existing = await db.query.pptSlide.findMany({
      where: (t, { eq }) => eq(t.moduleId, moduleId),
      orderBy: [desc(pptSlide.order)],
      limit: 1,
    });
    const nextOrder = existing.length > 0 ? existing[0].order + 1 : 1;

    const [result] = await db.insert(pptSlide).values({
      moduleId,
      order: nextOrder,
      title: title || null,
      fileUrl,
    }).returning();

    revalidatePath(`/ppt`);
    return { success: true, slide: result };
  } catch (error) {
    console.error("Error creating PPT slide:", error);
    return { success: false, error: error.message };
  }
}

export async function updatePptSlide(slideId, data) {
  try {
    const { title, fileUrl, order } = data;
    const existing = await db.query.pptSlide.findFirst({ where: eq(pptSlide.id, slideId) });
    if (fileUrl !== undefined && existing?.fileUrl && existing.fileUrl !== fileUrl) {
      try {
        const { deleteFromR2 } = await import("@/lib/r2");
        await deleteFromR2(existing.fileUrl);
      } catch (r2Err) {
        console.warn("Failed to delete old PPT slide file from R2:", r2Err);
      }
    }

    const [result] = await db.update(pptSlide)
      .set({
        title: title || null,
        fileUrl,
        ...(order !== undefined ? { order: parseInt(order) } : {}),
      })
      .where(eq(pptSlide.id, slideId))
      .returning();
    revalidatePath("/ppt");
    return { success: true, slide: result };
  } catch (error) {
    console.error("Error updating PPT slide:", error);
    return { success: false, error: error.message };
  }
}

export async function deletePptSlide(slideId, moduleId) {
  try {
    const existing = await db.query.pptSlide.findFirst({ where: eq(pptSlide.id, slideId) });
    if (existing?.fileUrl) {
      try {
        const { deleteFromR2 } = await import("@/lib/r2");
        await deleteFromR2(existing.fileUrl);
      } catch (r2Err) {
        console.warn("Failed to delete PPT slide file from R2:", r2Err);
      }
    }

    await db.delete(pptSlide).where(eq(pptSlide.id, slideId));

    // Re-sequence remaining slides
    const remaining = await db.query.pptSlide.findMany({
      where: (t, { eq }) => eq(t.moduleId, moduleId),
      orderBy: [asc(pptSlide.order)],
    });
    for (let i = 0; i < remaining.length; i++) {
      if (remaining[i].order !== i + 1) {
        await db.update(pptSlide).set({ order: i + 1 }).where(eq(pptSlide.id, remaining[i].id));
      }
    }

    revalidatePath("/ppt");
    return { success: true };
  } catch (error) {
    console.error("Error deleting PPT slide:", error);
    return { success: false, error: error.message };
  }
}

export async function reorderSlides(moduleId, orderedSlideIds) {
  try {
    for (let i = 0; i < orderedSlideIds.length; i++) {
      await db.update(pptSlide)
        .set({ order: i + 1 })
        .where(eq(pptSlide.id, orderedSlideIds[i]));
    }
    revalidatePath("/ppt");
    return { success: true };
  } catch (error) {
    console.error("Error reordering slides:", error);
    return { success: false, error: error.message };
  }
}
