"use server";

import { db } from "@/lib/db";
import { mentorGroup, mentorGroupMember, user } from "@/db/schema";
import { eq, desc, asc, and, inArray } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { hasAccess } from "@/lib/permissions";
import { revalidatePath } from "next/cache";

/**
 * Get all mentor groups with their assigned mentor, co-mentor, and members
 */
export async function getMentorGroups() {
  try {
    const groups = await db.query.mentorGroup.findMany({
      orderBy: [desc(mentorGroup.createdAt)],
      with: {
        mentor: {
          columns: { id: true, name: true, email: true, profilePictureUrl: true, positionName: true, npm: true },
          with: {
            role: { columns: { name: true } },
            department: { columns: { name: true, code: true } },
          },
        },
        coMentor: {
          columns: { id: true, name: true, email: true, profilePictureUrl: true, positionName: true, npm: true },
          with: {
            role: { columns: { name: true } },
            department: { columns: { name: true, code: true } },
          },
        },
        members: {
          orderBy: [asc(mentorGroupMember.joinedAt)],
          with: {
            user: {
              columns: { id: true, name: true, email: true, npm: true, profilePictureUrl: true, positionName: true },
              with: {
                role: { columns: { name: true } },
                department: { columns: { name: true, code: true } },
              },
            },
          },
        },
      },
    });

    return { success: true, data: groups };
  } catch (error) {
    console.error("Error fetching mentor groups:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Get active users list for selecting mentors and assigning members
 */
export async function getUsersForMentoring() {
  try {
    const users = await db.query.user.findMany({
      where: eq(user.isActive, true),
      orderBy: [asc(user.name)],
      columns: {
        id: true,
        name: true,
        email: true,
        npm: true,
        profilePictureUrl: true,
        positionName: true,
      },
      with: {
        role: { columns: { id: true, name: true } },
        department: { columns: { id: true, name: true, code: true } },
      },
    });

    return { success: true, data: users };
  } catch (error) {
    console.error("Error fetching users for mentoring:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Create a new Mentor Group
 */
export async function createMentorGroup(data) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  if (!hasAccess(session.user, "groups", "create")) {
    return { success: false, error: "Forbidden: Anda tidak memiliki hak akses membuat kelompok." };
  }

  try {
    const { name, code, description, mentorId, coMentorId, batch, whatsappGroupUrl } = data;

    if (!name?.trim()) {
      return { success: false, error: "Nama kelompok wajib diisi." };
    }

    const [newGroup] = await db
      .insert(mentorGroup)
      .values({
        name: name.trim(),
        code: code?.trim() || null,
        description: description?.trim() || null,
        mentorId: mentorId ? parseInt(mentorId) : null,
        coMentorId: coMentorId ? parseInt(coMentorId) : null,
        batch: batch?.trim() || "Batch 2025/2026",
        whatsappGroupUrl: whatsappGroupUrl?.trim() || null,
        updatedAt: new Date(),
      })
      .returning();

    revalidatePath("/groups");
    return { success: true, data: newGroup };
  } catch (error) {
    console.error("Error creating mentor group:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Update an existing Mentor Group
 */
export async function updateMentorGroup(id, data) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  if (!hasAccess(session.user, "groups", "update")) {
    return { success: false, error: "Forbidden: Anda tidak memiliki hak akses memperbarui kelompok." };
  }

  try {
    const groupId = parseInt(id);
    const { name, code, description, mentorId, coMentorId, batch, whatsappGroupUrl, isActive } = data;

    if (!name?.trim()) {
      return { success: false, error: "Nama kelompok wajib diisi." };
    }

    const [updated] = await db
      .update(mentorGroup)
      .set({
        name: name.trim(),
        code: code?.trim() || null,
        description: description?.trim() || null,
        mentorId: mentorId ? parseInt(mentorId) : null,
        coMentorId: coMentorId ? parseInt(coMentorId) : null,
        batch: batch?.trim() || "Batch 2025/2026",
        whatsappGroupUrl: whatsappGroupUrl?.trim() || null,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
        updatedAt: new Date(),
      })
      .where(eq(mentorGroup.id, groupId))
      .returning();

    revalidatePath("/groups");
    return { success: true, data: updated };
  } catch (error) {
    console.error("Error updating mentor group:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Delete a Mentor Group
 */
export async function deleteMentorGroup(id) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  if (!hasAccess(session.user, "groups", "delete")) {
    return { success: false, error: "Forbidden: Anda tidak memiliki hak akses menghapus kelompok." };
  }

  try {
    const groupId = parseInt(id);
    await db.delete(mentorGroup).where(eq(mentorGroup.id, groupId));

    revalidatePath("/groups");
    return { success: true };
  } catch (error) {
    console.error("Error deleting mentor group:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Assign members to a group
 */
export async function assignMembersToGroup(groupId, userIds = []) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  if (!hasAccess(session.user, "groups", "update")) {
    return { success: false, error: "Forbidden: Anda tidak memiliki hak akses mengubah anggota kelompok." };
  }

  try {
    const gId = parseInt(groupId);
    if (!userIds || userIds.length === 0) {
      return { success: true, message: "No members to add." };
    }

    // Get existing members to prevent duplicate insert
    const existing = await db.query.mentorGroupMember.findMany({
      where: eq(mentorGroupMember.groupId, gId),
      columns: { userId: true },
    });
    const existingUserIds = new Set(existing.map((e) => e.userId));

    const toInsert = userIds
      .map((uid) => parseInt(uid))
      .filter((uid) => !existingUserIds.has(uid))
      .map((uid) => ({
        groupId: gId,
        userId: uid,
        role: "MEMBER",
        joinedAt: new Date(),
      }));

    if (toInsert.length > 0) {
      await db.insert(mentorGroupMember).values(toInsert);
    }

    revalidatePath("/groups");
    return { success: true, insertedCount: toInsert.length };
  } catch (error) {
    console.error("Error assigning members to group:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Remove a member from a group
 */
export async function removeMemberFromGroup(groupId, userId) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  if (!hasAccess(session.user, "groups", "update")) {
    return { success: false, error: "Forbidden: Anda tidak memiliki hak akses mengubah anggota kelompok." };
  }

  try {
    const gId = parseInt(groupId);
    const uId = parseInt(userId);

    await db
      .delete(mentorGroupMember)
      .where(
        and(
          eq(mentorGroupMember.groupId, gId),
          eq(mentorGroupMember.userId, uId)
        )
      );

    revalidatePath("/groups");
    return { success: true };
  } catch (error) {
    console.error("Error removing member from group:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Toggle member role in group (LEADER vs MEMBER)
 */
export async function toggleMemberLeaderRole(groupId, userId, isLeader) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  if (!hasAccess(session.user, "groups", "update")) {
    return { success: false, error: "Forbidden: Anda tidak memiliki hak akses mengubah peran anggota." };
  }

  try {
    const gId = parseInt(groupId);
    const uId = parseInt(userId);

    await db
      .update(mentorGroupMember)
      .set({
        role: isLeader ? "LEADER" : "MEMBER",
      })
      .where(
        and(
          eq(mentorGroupMember.groupId, gId),
          eq(mentorGroupMember.userId, uId)
        )
      );

    revalidatePath("/groups");
    return { success: true };
  } catch (error) {
    console.error("Error updating member role:", error);
    return { success: false, error: error.message };
  }
}
