import { db } from "../db";
import { activity } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export const activityService = {
  getAllActivities: async () => {
    return await db.select().from(activity).orderBy(desc(activity.date));
  },

  getActivityById: async (id) => {
    const results = await db.select().from(activity).where(eq(activity.id, id));
    return results[0] || null;
  },

  createActivity: async (data) => {
    const [newActivity] = await db.insert(activity).values({
      name: data.name,
      description: data.description || "",
      location: data.location || "",
      imageUrl: data.imageUrl || null,
      date: new Date(data.date),
      type: data.type,
      link: data.link || null,
      linkType: data.linkType || 'detail',
      isPriority: data.isPriority ?? false,
      isAnnouncementModal: data.isAnnouncementModal ?? false,
    }).returning();
    return newActivity;
  },

  updateActivity: async (id, data) => {
    const existing = await db.query.activity.findFirst({ where: eq(activity.id, id) });
    const updateData = {
      ...data,
      updatedAt: new Date(),
    };
    if (data.location !== undefined) updateData.location = data.location;
    if (data.imageUrl !== undefined) {
      updateData.imageUrl = data.imageUrl;
      if (existing?.imageUrl && existing.imageUrl !== data.imageUrl) {
        try {
          const { deleteFromR2 } = await import("@/lib/r2");
          await deleteFromR2(existing.imageUrl);
        } catch (r2Err) {
          console.warn("Failed to delete old activity image from R2:", r2Err);
        }
      }
    }
    if (data.isPriority !== undefined) updateData.isPriority = data.isPriority;
    if (data.isAnnouncementModal !== undefined) updateData.isAnnouncementModal = data.isAnnouncementModal;
    if (data.date) {
      updateData.date = new Date(data.date);
    }
    
    const [updated] = await db.update(activity)
      .set(updateData)
      .where(eq(activity.id, id))
      .returning();
    return updated;
  },

  deleteActivity: async (id) => {
    const existing = await db.query.activity.findFirst({ where: eq(activity.id, id) });
    const [deleted] = await db.delete(activity)
      .where(eq(activity.id, id))
      .returning();

    if (existing?.imageUrl) {
      try {
        const { deleteFromR2 } = await import("@/lib/r2");
        await deleteFromR2(existing.imageUrl);
      } catch (r2Err) {
        console.warn("Failed to delete activity image from R2:", r2Err);
      }
    }

    return deleted;
  }
};

