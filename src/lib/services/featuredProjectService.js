import { db } from "../db";
import { featuredProject } from "@/db/schema";
import { eq, asc, desc } from "drizzle-orm";

export const featuredProjectService = {
  getAllProjects: async () => {
    return await db
      .select()
      .from(featuredProject)
      .orderBy(asc(featuredProject.order), desc(featuredProject.createdAt));
  },

  getPublishedProjects: async () => {
    return await db
      .select()
      .from(featuredProject)
      .where(eq(featuredProject.isPublished, true))
      .orderBy(asc(featuredProject.order), desc(featuredProject.createdAt));
  },

  getProjectById: async (id) => {
    const results = await db
      .select()
      .from(featuredProject)
      .where(eq(featuredProject.id, id));
    return results[0] || null;
  },

  createProject: async (data) => {
    const [newProject] = await db
      .insert(featuredProject)
      .values({
        title: data.title,
        category: data.category,
        status: data.status || "ONGOING",
        description: data.description,
        imageUrl: data.imageUrl || null,
        isPublished: data.isPublished ?? false,
        order: data.order ?? 0,
        createdById: data.createdById,
      })
      .returning();
    return newProject;
  },

  updateProject: async (id, data) => {
    const existing = await db.query.featuredProject.findFirst({ where: eq(featuredProject.id, id) });
    const updateData = {
      ...data,
      updatedAt: new Date(),
    };

    if (data.imageUrl !== undefined && existing?.imageUrl && existing.imageUrl !== data.imageUrl) {
      try {
        const { deleteFromR2 } = await import("@/lib/r2");
        await deleteFromR2(existing.imageUrl);
      } catch (r2Err) {
        console.warn("Failed to delete old featured project image from R2:", r2Err);
      }
    }

    const [updated] = await db
      .update(featuredProject)
      .set(updateData)
      .where(eq(featuredProject.id, id))
      .returning();
    return updated;
  },

  deleteProject: async (id) => {
    const existing = await db.query.featuredProject.findFirst({ where: eq(featuredProject.id, id) });
    const [deleted] = await db
      .delete(featuredProject)
      .where(eq(featuredProject.id, id))
      .returning();

    if (existing?.imageUrl) {
      try {
        const { deleteFromR2 } = await import("@/lib/r2");
        await deleteFromR2(existing.imageUrl);
      } catch (r2Err) {
        console.warn("Failed to delete featured project image from R2:", r2Err);
      }
    }

    return deleted;
  },
};
