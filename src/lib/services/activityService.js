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
    }).returning();
    return newActivity;
  },

  updateActivity: async (id, data) => {
    const updateData = {
      ...data,
      updatedAt: new Date(),
    };
    if (data.location !== undefined) updateData.location = data.location;
    if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;
    if (data.isPriority !== undefined) updateData.isPriority = data.isPriority;
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
    const [deleted] = await db.delete(activity)
      .where(eq(activity.id, id))
      .returning();
    return deleted;
  }
};
