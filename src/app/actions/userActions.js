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

// Bulk import users from Excel data
export async function importUsers(rows) {
  try {
    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return { success: false, error: "Tidak ada baris data pengguna yang valid untuk diimpor." };
    }

    // Fetch existing lookup reference data
    const allRoles = await db.query.role.findMany();
    const allDepartments = await db.query.department.findMany();
    const allDivisions = await db.query.division.findMany();
    const existingUsers = await db.query.user.findMany({
      columns: { id: true, email: true, npm: true },
    });

    const existingEmails = new Set(existingUsers.map((u) => u.email.toLowerCase().trim()));
    const existingNpms = new Set(existingUsers.filter((u) => u.npm).map((u) => u.npm.trim()));

    // Role lookup maps
    const roleMap = new Map();
    allRoles.forEach((r) => {
      roleMap.set(r.name.toLowerCase().trim(), r.id);
      roleMap.set(r.name.toLowerCase().replace(/_/g, " ").trim(), r.id);
      roleMap.set(String(r.id), r.id);
    });
    const defaultRoleId = roleMap.get("member") || allRoles[0]?.id || 1;

    // Department lookup maps
    const deptMap = new Map();
    allDepartments.forEach((d) => {
      deptMap.set(d.name.toLowerCase().trim(), d.id);
      deptMap.set(d.code?.toLowerCase().trim(), d.id);
      deptMap.set(String(d.id), d.id);
    });

    // Division lookup maps
    const divMap = new Map();
    allDivisions.forEach((d) => {
      divMap.set(`${d.departmentId}_${d.name.toLowerCase().trim()}`, d.id);
      divMap.set(d.name.toLowerCase().trim(), d.id);
      divMap.set(String(d.id), d.id);
    });

    const results = {
      total: rows.length,
      imported: 0,
      skipped: 0,
      errors: [],
    };

    const usersToInsert = [];
    const seenEmailsInBatch = new Set();
    const seenNpmsInBatch = new Set();

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2;

      const name = row.name?.toString()?.trim();
      const email = row.email?.toString()?.toLowerCase()?.trim();
      const rawPassword = row.password?.toString()?.trim() || "SRE12345!";
      const npm = row.npm ? row.npm.toString().trim() : null;
      const positionName = row.positionName?.toString()?.trim() || row.position?.toString()?.trim() || null;
      
      const rawIsActive = row.isActive !== undefined ? row.isActive : (row.status !== undefined ? row.status : true);
      let isActive = true;
      if (typeof rawIsActive === "boolean") {
        isActive = rawIsActive;
      } else if (rawIsActive) {
        const strVal = String(rawIsActive).toLowerCase().trim();
        isActive = strVal !== "false" && strVal !== "nonaktif" && strVal !== "inactive" && strVal !== "0";
      }

      if (!name) {
        results.skipped++;
        results.errors.push(`Baris ${rowNum}: Nama lengkap tidak boleh kosong`);
        continue;
      }

      if (!email || !email.includes("@")) {
        results.skipped++;
        results.errors.push(`Baris ${rowNum} (${name}): Format email tidak valid`);
        continue;
      }

      if (existingEmails.has(email) || seenEmailsInBatch.has(email)) {
        results.skipped++;
        results.errors.push(`Baris ${rowNum} (${email}): Email sudah terdaftar di database`);
        continue;
      }

      if (npm && (existingNpms.has(npm) || seenNpmsInBatch.has(npm))) {
        results.skipped++;
        results.errors.push(`Baris ${rowNum} (NPM ${npm}): NPM sudah terdaftar di database`);
        continue;
      }

      // Resolve role
      let roleId = defaultRoleId;
      const rawRole = row.role?.toString()?.toLowerCase()?.trim() || row.roleName?.toString()?.toLowerCase()?.trim();
      if (rawRole && roleMap.has(rawRole)) {
        roleId = roleMap.get(rawRole);
      }

      // Resolve department
      let departmentId = null;
      const rawDept = row.department?.toString()?.toLowerCase()?.trim() || row.departmentName?.toString()?.toLowerCase()?.trim();
      if (rawDept && deptMap.has(rawDept)) {
        departmentId = deptMap.get(rawDept);
      }

      // Resolve division
      let divisionId = null;
      const rawDiv = row.division?.toString()?.toLowerCase()?.trim() || row.divisionName?.toString()?.toLowerCase()?.trim();
      if (rawDiv) {
        if (departmentId && divMap.has(`${departmentId}_${rawDiv}`)) {
          divisionId = divMap.get(`${departmentId}_${rawDiv}`);
        } else if (divMap.has(rawDiv)) {
          divisionId = divMap.get(rawDiv);
        }
      }

      const hashedPassword = await bcrypt.hash(rawPassword, 10);

      seenEmailsInBatch.add(email);
      if (npm) seenNpmsInBatch.add(npm);

      usersToInsert.push({
        name,
        email,
        password: hashedPassword,
        npm: npm || null,
        positionName: positionName || null,
        isActive,
        roleId,
        departmentId,
        divisionId,
      });
    }

    if (usersToInsert.length > 0) {
      const chunkSize = 50;
      for (let i = 0; i < usersToInsert.length; i += chunkSize) {
        const chunk = usersToInsert.slice(i, i + chunkSize);
        await db.insert(user).values(chunk);
      }
      results.imported = usersToInsert.length;
    }

    revalidatePath("/users");
    return { success: true, data: results };
  } catch (err) {
    console.error("[userActions] importUsers error:", err);
    return { success: false, error: err.message || "Gagal mengimpor data pengguna" };
  }
}

