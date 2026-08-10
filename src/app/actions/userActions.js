"use server";

import { db } from "@/lib/db";
import { user } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

export async function getUsers() {
  try {
    const users = await db.query.user.findMany({
      with: {
        role: true,
        department: true,
        division: true
      },
      orderBy: [desc(user.createdAt)]
    });
    return { success: true, data: users };
  } catch (error) {
    return { success: false, error: "Failed to fetch users" };
  }
}

export async function createUser(data) {
  try {
    const { name, email, password, npm, positionName, isActive, roleId, departmentId, divisionId } = data;
    
    // Check duplicate email
    const existingEmail = await db.query.user.findFirst({ where: eq(user.email, email) });
    if (existingEmail) return { success: false, error: "Email sudah digunakan oleh pengguna lain." };

    // Check duplicate NPM
    if (npm && npm.trim() !== "") {
      const existingNpm = await db.query.user.findFirst({ where: eq(user.npm, npm) });
      if (existingNpm) return { success: false, error: "NPM sudah terdaftar pada akun pengguna lain." };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await db.insert(user).values({
      name,
      email,
      password: hashedPassword,
      npm: npm || null,
      positionName: positionName || null,
      isActive: isActive === "true" || isActive === true,
      roleId: parseInt(roleId),
      departmentId: departmentId ? parseInt(departmentId) : null,
      divisionId: divisionId ? parseInt(divisionId) : null,
    }).returning({ id: user.id });
    revalidatePath("/users");
    return { success: true, data: { id: result.id, name, email } };
  } catch (error) {
    if (error.code === '23505' || error.message?.includes('unique') || error.message?.includes('duplicate')) {
      if (error.message?.includes('email')) return { success: false, error: "Email sudah digunakan oleh pengguna lain." };
      if (error.message?.includes('npm')) return { success: false, error: "NPM sudah terdaftar pada akun pengguna lain." };
      return { success: false, error: "Data email atau NPM sudah terdaftar di sistem." };
    }
    return { success: false, error: "Gagal menambahkan pengguna. Silakan periksa kembali isian formulir." };
  }
}

export async function updateUser(id, data) {
  try {
    const { name, email, password, npm, positionName, isActive, roleId, departmentId, divisionId } = data;
    
    // Check duplicate email for another user
    const existingEmail = await db.query.user.findFirst({ 
      where: (u, { and, eq, ne }) => and(eq(u.email, email), ne(u.id, id)) 
    });
    if (existingEmail) return { success: false, error: "Email sudah digunakan oleh pengguna lain." };

    // Check duplicate NPM for another user
    if (npm && npm.trim() !== "") {
      const existingNpm = await db.query.user.findFirst({ 
        where: (u, { and, eq, ne }) => and(eq(u.npm, npm), ne(u.id, id)) 
      });
      if (existingNpm) return { success: false, error: "NPM sudah terdaftar pada akun pengguna lain." };
    }

    const updateData = {
      name,
      email,
      npm: npm || null,
      positionName: positionName || null,
      isActive: isActive === "true" || isActive === true,
      roleId: parseInt(roleId),
      departmentId: departmentId ? parseInt(departmentId) : null,
      divisionId: divisionId ? parseInt(divisionId) : null,
    };

    if (password && password.trim() !== "") {
      updateData.password = await bcrypt.hash(password, 10);
    }

    await db.update(user).set(updateData).where(eq(user.id, id));
    revalidatePath("/users");
    return { success: true, data: { id, name, email } };
  } catch (error) {
    if (error.code === '23505' || error.message?.includes('unique') || error.message?.includes('duplicate')) {
      if (error.message?.includes('email')) return { success: false, error: "Email sudah digunakan oleh pengguna lain." };
      if (error.message?.includes('npm')) return { success: false, error: "NPM sudah terdaftar pada akun pengguna lain." };
      return { success: false, error: "Data email atau NPM sudah terdaftar di sistem." };
    }
    return { success: false, error: "Gagal memperbarui data pengguna. Silakan periksa kembali isian formulir." };
  }
}

export async function deleteUser(id) {
  try {
    await db.delete(user).where(eq(user.id, id));
    revalidatePath("/users");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Gagal menghapus pengguna." };
  }
}
