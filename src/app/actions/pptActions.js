"use server";

import { db } from "@/lib/db";
import { pptModule, pptSlide, pptPhase, pptModuleProgress } from "@/db/schema";
import { desc, asc, eq, and, count } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// ─── Phase Actions ────────────────────────────────────────────────────────────
export async function getPptPhases() {
  try {
    const phases = await db.query.pptPhase.findMany({
      orderBy: [asc(pptPhase.order), asc(pptPhase.id)],
    });
    return { success: true, data: phases || [] };
  } catch (error) {
    console.error("Error fetching PPT phases:", error);
    return { success: false, error: error.message, data: [] };
  }
}

export async function createPptPhase(data) {
  try {
    const { name, description, order } = data;
    const [result] = await db.insert(pptPhase).values({
      name,
      description: description || null,
      order: order !== undefined && order !== "" ? parseInt(order) : 0,
    }).returning();
    revalidatePath("/ppt");
    revalidatePath("/member/materi");
    return { success: true, phase: result };
  } catch (error) {
    console.error("Error creating PPT phase:", error);
    return { success: false, error: error.message };
  }
}

export async function updatePptPhase(id, data) {
  try {
    const { name, description, order } = data;
    const [result] = await db.update(pptPhase)
      .set({
        name,
        description: description !== undefined ? (description || null) : undefined,
        order: order !== undefined && order !== "" ? parseInt(order) : undefined,
      })
      .where(eq(pptPhase.id, id))
      .returning();
    revalidatePath("/ppt");
    revalidatePath("/member/materi");
    return { success: true, phase: result };
  } catch (error) {
    console.error("Error updating PPT phase:", error);
    return { success: false, error: error.message };
  }
}

export async function deletePptPhase(id) {
  try {
    await db.delete(pptPhase).where(eq(pptPhase.id, id));
    revalidatePath("/ppt");
    revalidatePath("/member/materi");
    return { success: true };
  } catch (error) {
    console.error("Error deleting PPT phase:", error);
    return { success: false, error: error.message };
  }
}

// ─── Slug Helper ─────────────────────────────────────────────────────────────
function slugify(text) {
  return (text || "")
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function generateModuleSlug(title, currentId = null) {
  let baseSlug = slugify(title) || "materi";
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await db.query.pptModule.findFirst({
      where: eq(pptModule.slug, slug),
      columns: { id: true },
    });
    if (!existing || (currentId && existing.id === currentId)) {
      return slug;
    }
    counter++;
    slug = `${baseSlug}-${counter}`;
  }
}

// ─── Module Actions ───────────────────────────────────────────────────────────
export async function getPptModules() {
  try {
    const modules = await db
      .select({
        id: pptModule.id,
        slug: pptModule.slug,
        phaseId: pptModule.phaseId,
        phaseName: pptPhase.name,
        phaseOrder: pptPhase.order,
        title: pptModule.title,
        description: pptModule.description,
        notes: pptModule.notes,
        coverImageUrl: pptModule.coverImageUrl,
        isPublished: pptModule.isPublished,
        createdById: pptModule.createdById,
        createdAt: pptModule.createdAt,
        updatedAt: pptModule.updatedAt,
        slideCount: count(pptSlide.id),
      })
      .from(pptModule)
      .leftJoin(pptSlide, eq(pptSlide.moduleId, pptModule.id))
      .leftJoin(pptPhase, eq(pptPhase.id, pptModule.phaseId))
      .groupBy(pptModule.id, pptPhase.id)
      .orderBy(desc(pptModule.createdAt));

    return { success: true, data: modules };
  } catch (error) {
    console.error("Error fetching PPT modules:", error);
    return { success: false, error: error.message, data: [] };
  }
}

export async function getPptModule(identifier) {
  try {
    const isNum = !isNaN(Number(identifier));
    let mod = null;

    // Try finding by slug first
    mod = await db.query.pptModule.findFirst({
      where: (t, { eq }) => eq(t.slug, String(identifier)),
      with: {
        phase: true,
        slides: { orderBy: [asc(pptSlide.order)] },
      },
    });

    // Fallback to ID if not found and identifier is numeric
    if (!mod && isNum) {
      mod = await db.query.pptModule.findFirst({
        where: (t, { eq }) => eq(t.id, Number(identifier)),
        with: {
          phase: true,
          slides: { orderBy: [asc(pptSlide.order)] },
        },
      });
    }

    return { success: true, data: mod || null };
  } catch (error) {
    console.error("Error fetching PPT module:", error);
    return { success: false, error: error.message, data: null };
  }
}

export async function createPptModule(data, createdById) {
  try {
    const { title, description, notes, coverImageUrl, isPublished, phaseId } = data;
    const parsedPhaseId = phaseId ? parseInt(phaseId) : null;
    const slug = await generateModuleSlug(title);

    const [result] = await db.insert(pptModule).values({
      title,
      slug,
      description: description || null,
      notes: notes || null,
      coverImageUrl: coverImageUrl || null,
      isPublished: Boolean(isPublished),
      phaseId: parsedPhaseId,
      createdById,
    }).returning();
    revalidatePath("/ppt");
    revalidatePath("/member/materi");
    return { success: true, module: { ...result, slideCount: 0 } };
  } catch (error) {
    console.error("Error creating PPT module:", error);
    return { success: false, error: error.message };
  }
}

export async function updatePptModule(id, data) {
  try {
    const { title, description, notes, coverImageUrl, isPublished, phaseId } = data;
    const existing = await db.query.pptModule.findFirst({ where: eq(pptModule.id, id) });
    if (coverImageUrl !== undefined && existing?.coverImageUrl && existing.coverImageUrl !== coverImageUrl) {
      try {
        const { deleteFromR2 } = await import("@/lib/r2");
        await deleteFromR2(existing.coverImageUrl);
      } catch (r2Err) {
        console.warn("Failed to delete old PPT cover image from R2:", r2Err);
      }
    }

    const parsedPhaseId = phaseId !== undefined ? (phaseId ? parseInt(phaseId) : null) : undefined;

    let slug = existing?.slug;
    if (!slug || (title && title !== existing?.title)) {
      slug = await generateModuleSlug(title || existing?.title, id);
    }

    const [result] = await db.update(pptModule)
      .set({
        title,
        slug,
        description: description || null,
        notes: notes || null,
        coverImageUrl: coverImageUrl || null,
        isPublished: Boolean(isPublished),
        ...(parsedPhaseId !== undefined ? { phaseId: parsedPhaseId } : {}),
        updatedAt: new Date(),
      })
      .where(eq(pptModule.id, id))
      .returning();
    revalidatePath("/ppt");
    revalidatePath("/member/materi");
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

// ─── Member Progress Actions ──────────────────────────────────────────────────
export async function savePptModuleProgress({ moduleId, currentSlideIdx, maxSlideIdx, isCompleted }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const userId = Number(session.user.id);
    const modId = Number(moduleId);
    if (!modId || isNaN(modId)) {
      return { success: false, error: "Invalid module ID" };
    }

    const existing = await db.query.pptModuleProgress.findFirst({
      where: and(
        eq(pptModuleProgress.userId, userId),
        eq(pptModuleProgress.moduleId, modId)
      ),
    });

    const now = new Date();
    if (existing) {
      const calculatedMax = Math.max(existing.maxSlideIdx || 0, maxSlideIdx || 0, currentSlideIdx || 0);
      const completed = existing.isCompleted || !!isCompleted;

      await db.update(pptModuleProgress)
        .set({
          currentSlideIdx: currentSlideIdx !== undefined ? currentSlideIdx : existing.currentSlideIdx,
          maxSlideIdx: calculatedMax,
          isCompleted: completed,
          completedAt: completed && !existing.completedAt ? now : existing.completedAt,
          lastAccessedAt: now,
          updatedAt: now,
        })
        .where(eq(pptModuleProgress.id, existing.id));
    } else {
      const calculatedMax = Math.max(maxSlideIdx || 0, currentSlideIdx || 0);
      await db.insert(pptModuleProgress).values({
        userId,
        moduleId: modId,
        currentSlideIdx: currentSlideIdx || 0,
        maxSlideIdx: calculatedMax,
        isCompleted: !!isCompleted,
        completedAt: isCompleted ? now : null,
        lastAccessedAt: now,
        createdAt: now,
        updatedAt: now,
      });
    }

    return { success: true };
  } catch (error) {
    console.error("Error saving PPT module progress:", error);
    return { success: false, error: error.message };
  }
}
