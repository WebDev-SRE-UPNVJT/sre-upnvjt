"use server";

import { revalidatePath } from "next/cache";
import { activityService } from "@/lib/services/activityService";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { hasAccess } from "@/lib/permissions";

import { uploadToR2 } from "@/lib/r2";

const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || "https://cdn.webly.biz.id/";

async function getSharp() {
  try {
    const mod = await import("sharp");
    return mod.default || mod;
  } catch {
    return null;
  }
}

async function processAndUploadImage(file) {
  if (!file || file.size === 0) return null;
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    let processedBuffer = buffer;
    let filename = `activity/${Date.now()}-${Math.random().toString(36).substring(7)}`;
    let contentType = file.type || "image/jpeg";

    try {
      const sharpFn = await getSharp();
      if (sharpFn && typeof sharpFn === "function") {
        processedBuffer = await sharpFn(buffer).rotate().webp({ quality: 80, effort: 4 }).toBuffer();
        filename += ".webp";
        contentType = "image/webp";
      } else {
        const ext = file.name ? file.name.substring(file.name.lastIndexOf('.')) : '.jpg';
        filename += ext;
      }
    } catch (sharpErr) {
      console.error("Sharp processing error in activityAction, using original file:", sharpErr);
      const ext = file.name ? file.name.substring(file.name.lastIndexOf('.')) : '.jpg';
      filename += ext;
    }

    const key = await uploadToR2(processedBuffer, filename, contentType);
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
      link: formData.get("link") || null,
      linkType: formData.get("linkType") || "detail",
      isPriority: formData.get("isPriority") === "true" || formData.get("isPriority") === "on",
      isAnnouncementModal: formData.get("isAnnouncementModal") === "true" || formData.get("isAnnouncementModal") === "on",
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
      link: formData.get("link") || null,
      linkType: formData.get("linkType") || "detail",
      isPriority: formData.get("isPriority") === "true" || formData.get("isPriority") === "on",
      isAnnouncementModal: formData.get("isAnnouncementModal") === "true" || formData.get("isAnnouncementModal") === "on",
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
