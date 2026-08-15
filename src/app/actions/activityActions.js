"use server";

import { revalidatePath } from "next/cache";
import { activityService } from "@/lib/services/activityService";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { hasAccess } from "@/lib/permissions";
import sharp from "sharp";

const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || "https://cdn.webly.biz.id/";

async function processAndUploadImage(file) {
  if (!file || file.size === 0) return null;
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const filename = `activity/${Date.now()}-${Math.random().toString(36).substring(7)}.webp`;
    const processedBuffer = await sharp(buffer).webp({ quality: 80 }).toBuffer();
    const { uploadToR2 } = await import("@/lib/r2");
    const key = await uploadToR2(processedBuffer, filename, "image/webp");
    // Build full public URL
    const base = R2_PUBLIC_URL.endsWith("/") ? R2_PUBLIC_URL : R2_PUBLIC_URL + "/";
    return `${base}${key}`;
  } catch (err) {
    console.error("Image upload to R2 failed:", err);
    throw new Error("Gagal mengupload gambar. Pastikan konfigurasi R2 sudah benar.");
  }
}

// Action for fetching activities is often done server-side on the page directly, 
// but here is a wrapper if needed from client.
export async function getActivities() {
  try {
    const data = await activityService.getAllActivities();
    return { success: true, data };
  } catch (error) {
    console.error("Error fetching activities:", error);
    return { success: false, error: "Failed to fetch activities" };
  }
}

export async function createActivityAction(formData) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Unauthorized");
    if (!hasAccess(session.user, 'activities', 'create')) {
      throw new Error("Unauthorized: Insufficient permissions to create activities.");
    }

    const data = {
      name: formData.get("name"),
      description: formData.get("description"),
      location: formData.get("location"),
      date: formData.get("date"),
      type: formData.get("type"),
    };

    const imageFile = formData.get("image");
    if (imageFile && imageFile.size > 0) {
      data.imageUrl = await processAndUploadImage(imageFile);
    }

    if (!data.name || !data.date || !data.type) {
      throw new Error("Name, date, and type are required.");
    }

    const newActivity = await activityService.createActivity(data);
    revalidatePath("/activities");
    return { success: true, activity: newActivity };
  } catch (error) {
    console.error("Error creating activity:", error);
    return { success: false, error: error.message || "Failed to create activity" };
  }
}

export async function updateActivityAction(id, formData) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Unauthorized");
    if (!hasAccess(session.user, 'activities', 'update')) {
      throw new Error("Unauthorized: Insufficient permissions to update activities.");
    }

    const data = {
      name: formData.get("name"),
      description: formData.get("description"),
      location: formData.get("location"),
      date: formData.get("date"),
      type: formData.get("type"),
    };

    const imageFile = formData.get("image");
    if (imageFile && imageFile.size > 0) {
      data.imageUrl = await processAndUploadImage(imageFile);
    }

    if (!data.name || !data.date || !data.type) {
      throw new Error("Name, date, and type are required.");
    }

    const updated = await activityService.updateActivity(id, data);
    revalidatePath("/activities");
    return { success: true, activity: updated };
  } catch (error) {
    console.error("Error updating activity:", error);
    return { success: false, error: error.message || "Failed to update activity" };
  }
}

export async function deleteActivityAction(id) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Unauthorized");
    if (!hasAccess(session.user, 'activities', 'delete')) {
      throw new Error("Unauthorized: Insufficient permissions to delete activities.");
    }

    await activityService.deleteActivity(id);
    revalidatePath("/activities");
    return { success: true };
  } catch (error) {
    console.error("Error deleting activity:", error);
    return { success: false, error: error.message || "Failed to delete activity" };
  }
}
