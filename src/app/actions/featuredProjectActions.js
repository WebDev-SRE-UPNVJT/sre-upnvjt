"use server";

import { revalidatePath } from "next/cache";
import { featuredProjectService } from "@/lib/services/featuredProjectService";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import path from "path";
import { promises as fs } from "fs";
import sharp from "sharp";

async function processImage(file) {
  if (!file || file.size === 0) return null;
  const buffer = Buffer.from(await file.arrayBuffer());
  const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}.webp`;
  const uploadDir = path.join(process.cwd(), "public", "uploads", "featured-projects");
  await fs.mkdir(uploadDir, { recursive: true });
  const filepath = path.join(uploadDir, filename);
  await sharp(buffer).webp({ quality: 82 }).toFile(filepath);
  return `/uploads/featured-projects/${filename}`;
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
      data.imageUrl = await processImage(imageFile);
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
      data.imageUrl = await processImage(imageFile);
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
