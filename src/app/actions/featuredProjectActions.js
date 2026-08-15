"use server";

import { revalidatePath } from "next/cache";
import { featuredProjectService } from "@/lib/services/featuredProjectService";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import sharp from "sharp";

const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || "https://cdn.webly.biz.id/";

async function processAndUploadImage(file) {
  if (!file || file.size === 0) return null;
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const filename = `featured-projects/${Date.now()}-${Math.random().toString(36).substring(7)}.webp`;
    const processedBuffer = await sharp(buffer).webp({ quality: 82 }).toBuffer();
    const { uploadToR2 } = await import("@/lib/r2");
    const key = await uploadToR2(processedBuffer, filename, "image/webp");
    const base = R2_PUBLIC_URL.endsWith("/") ? R2_PUBLIC_URL : R2_PUBLIC_URL + "/";
    return `${base}${key}`;
  } catch (err) {
    console.error("Image upload to R2 failed:", err);
    throw new Error("Gagal mengupload gambar. Pastikan konfigurasi R2 sudah benar.");
  }
}

export async function getFeaturedProjects() {
  try {
    const data = await featuredProjectService.getAllProjects();
    return { success: true, data };
  } catch (error) {
    console.error("Error fetching featured projects:", error);
    return { success: false, error: "Failed to fetch featured projects" };
  }
}

export async function getPublishedFeaturedProjects() {
  try {
    const data = await featuredProjectService.getPublishedProjects();
    return { success: true, data };
  } catch (error) {
    console.error("Error fetching published featured projects:", error);
    return { success: false, error: "Failed to fetch featured projects" };
  }
}

export async function createFeaturedProjectAction(formData) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Unauthorized");
    if (session.user.roleName !== "SUPER_ADMIN" && session.user.roleName !== "ADMIN") {
      throw new Error("Unauthorized: Insufficient permissions.");
    }

    const data = {
      title: formData.get("title"),
      category: formData.get("category"),
      status: formData.get("status") || "ONGOING",
      description: formData.get("description"),
      isPublished: formData.get("isPublished") === "true",
      order: parseInt(formData.get("order") || "0", 10),
      createdById: session.user.id,
    };

    if (!data.title || !data.category || !data.description) {
      throw new Error("Title, category, and description are required.");
    }

    const imageFile = formData.get("image");
    if (imageFile && imageFile.size > 0) {
      data.imageUrl = await processAndUploadImage(imageFile);
    }

    const newProject = await featuredProjectService.createProject(data);
    revalidatePath("/featured-projects");
    revalidatePath("/");
    return { success: true, project: newProject };
  } catch (error) {
    console.error("Error creating featured project:", error);
    return { success: false, error: error.message || "Failed to create project" };
  }
}

export async function updateFeaturedProjectAction(id, formData) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Unauthorized");
    if (session.user.roleName !== "SUPER_ADMIN" && session.user.roleName !== "ADMIN") {
      throw new Error("Unauthorized: Insufficient permissions.");
    }

    const data = {
      title: formData.get("title"),
      category: formData.get("category"),
      status: formData.get("status") || "ONGOING",
      description: formData.get("description"),
      isPublished: formData.get("isPublished") === "true",
      order: parseInt(formData.get("order") || "0", 10),
    };

    if (!data.title || !data.category || !data.description) {
      throw new Error("Title, category, and description are required.");
    }

    const imageFile = formData.get("image");
    if (imageFile && imageFile.size > 0) {
      data.imageUrl = await processAndUploadImage(imageFile);
    }

    const updated = await featuredProjectService.updateProject(id, data);
    revalidatePath("/featured-projects");
    revalidatePath("/");
    return { success: true, project: updated };
  } catch (error) {
    console.error("Error updating featured project:", error);
    return { success: false, error: error.message || "Failed to update project" };
  }
}

export async function deleteFeaturedProjectAction(id) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Unauthorized");
    if (session.user.roleName !== "SUPER_ADMIN" && session.user.roleName !== "ADMIN") {
      throw new Error("Unauthorized: Insufficient permissions.");
    }

    await featuredProjectService.deleteProject(id);
    revalidatePath("/featured-projects");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error deleting featured project:", error);
    return { success: false, error: error.message || "Failed to delete project" };
  }
}
