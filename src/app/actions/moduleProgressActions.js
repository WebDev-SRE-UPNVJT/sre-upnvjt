"use server";

import { db } from "@/lib/db";
import {
  pptModule,
  pptSlide,
  pptPhase,
  pptModuleProgress,
  user,
  mentorGroup,
  mentorGroupMember,
} from "@/db/schema";
import { desc, asc, eq, and, inArray, or } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { hasAccess } from "@/lib/permissions";

/**
 * Fetch Module Progress Monitoring Data
 * Scoped to Mentor's group(s) if user has MENTOR role, or global if Admin / Super Admin.
 */
export async function getModuleProgressMonitoringData() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const currentUserId = parseInt(session.user.id);
    const roleName = session.user.roleName || "";
    const isSuperAdmin = roleName === "SUPER_ADMIN";
    const isMentor = (roleName || "").toUpperCase().includes("MENTOR");

    // Check permissions
    const canAccess =
      hasAccess(session.user, "module_progress", "read") ||
      hasAccess(session.user, "ppt", "read") ||
      isMentor ||
      isSuperAdmin;

    if (!canAccess) {
      return { success: false, error: "Forbidden: Anda tidak memiliki hak akses memantau progres modul." };
    }

    // 1. Fetch all Published Modules with Slides and Phase
    const allModules = await db.query.pptModule.findMany({
      where: eq(pptModule.isPublished, true),
      orderBy: [asc(pptModule.phaseId), asc(pptModule.createdAt)],
      with: {
        phase: true,
        slides: {
          columns: { id: true, order: true, title: true },
          orderBy: [asc(pptSlide.order)],
        },
        tasks: {
          columns: { id: true, title: true, rewardXp: true, category: true },
        },
      },
    });

    // 2. Fetch all Phases
    const allPhases = await db.query.pptPhase.findMany({
      orderBy: [asc(pptPhase.order), asc(pptPhase.id)],
    });

    // 3. Fetch all Mentor Groups with members for group metadata & filter
    const allMentorGroups = await db.query.mentorGroup.findMany({
      orderBy: [asc(mentorGroup.name)],
      with: {
        mentor: { columns: { id: true, name: true } },
        coMentor: { columns: { id: true, name: true } },
        members: {
          with: {
            user: {
              columns: { id: true, name: true, npm: true, email: true, profilePictureUrl: true },
              with: {
                department: { columns: { name: true, code: true } },
                division: { columns: { name: true } },
                role: { columns: { name: true } },
              },
            },
          },
        },
      },
    });

    // Build user -> group mapping
    const userToGroupMap = new Map();
    allMentorGroups.forEach((g) => {
      (g.members || []).forEach((m) => {
        userToGroupMap.set(m.userId, {
          groupId: g.id,
          groupName: g.name,
          groupCode: g.code,
        });
      });
    });

    // 4. Determine Member Scope
    let targetMembers = [];
    let isRestrictedMentor = false;
    let myMentorGroups = [];

    if (isMentor && !isSuperAdmin) {
      isRestrictedMentor = true;
      myMentorGroups = allMentorGroups.filter(
        (g) => g.mentorId === currentUserId || g.coMentorId === currentUserId
      );

      const memberIdsSet = new Set();
      myMentorGroups.forEach((g) => {
        (g.members || []).forEach((m) => {
          if (m.user) {
            const roleName = (m.user.role?.name || "").trim().toUpperCase();
            // Strictly include only users with role MEMBER
            if (roleName === "MEMBER") {
              memberIdsSet.add(m.user.id);
              if (!targetMembers.some((u) => u.id === m.user.id)) {
                targetMembers.push(m.user);
              }
            }
          }
        });
      });

      if (targetMembers.length === 0) {
        return {
          success: true,
          data: {
            modules: allModules,
            phases: allPhases,
            members: [],
            mentorGroups: myMentorGroups,
            isRestrictedMentor: true,
            myGroupsCount: myMentorGroups.length,
            myMembersCount: 0,
          },
        };
      }
    } else {
      // Admin / Super Admin: Fetch all active users strictly with role MEMBER
      const allActiveUsers = await db.query.user.findMany({
        where: eq(user.isActive, true),
        orderBy: [asc(user.name)],
        columns: {
          id: true,
          name: true,
          email: true,
          npm: true,
          profilePictureUrl: true,
        },
        with: {
          role: { columns: { name: true } },
          department: { columns: { name: true, code: true } },
          division: { columns: { name: true } },
        },
      });

      // Filter STRICTLY only users with role 'MEMBER'
      targetMembers = allActiveUsers.filter((u) => {
        const rName = (u.role?.name || "").trim().toUpperCase();
        return rName === "MEMBER";
      });
    }

    const memberIds = targetMembers.map((m) => m.id);

    // 5. Fetch all pptModuleProgress for target members
    let allProgressRecords = [];
    if (memberIds.length > 0) {
      allProgressRecords = await db.query.pptModuleProgress.findMany({
        where: inArray(pptModuleProgress.userId, memberIds),
        orderBy: [desc(pptModuleProgress.lastAccessedAt)],
      });
    }

    // Build Progress Index: `${userId}_${moduleId}` -> progressRecord
    const progressMap = new Map();
    allProgressRecords.forEach((pr) => {
      progressMap.set(`${pr.userId}_${pr.moduleId}`, pr);
    });

    // 6. Aggregate Progress for each Member
    const formattedMembers = targetMembers.map((mem) => {
      const userGroup = userToGroupMap.get(mem.id) || null;
      let totalCompletedModules = 0;
      let totalPercentSum = 0;
      let latestAccessDate = null;

      const moduleProgressDict = {};

      allModules.forEach((mod) => {
        const pr = progressMap.get(`${mem.id}_${mod.id}`);
        const totalSlides = (mod.slides || []).length;

        let isCompleted = false;
        let currentSlide = 0;
        let maxSlide = 0;
        let completedAt = null;
        let lastAccessedAt = null;
        let progressPct = 0;

        if (pr) {
          isCompleted = !!pr.isCompleted;
          currentSlide = pr.currentSlideIdx || 0;
          maxSlide = pr.maxSlideIdx || 0;
          completedAt = pr.completedAt;
          lastAccessedAt = pr.lastAccessedAt;

          if (isCompleted) {
            progressPct = 100;
          } else if (totalSlides > 0) {
            progressPct = Math.min(100, Math.round(((maxSlide + 1) / totalSlides) * 100));
          }

          if (lastAccessedAt) {
            const accDate = new Date(lastAccessedAt);
            if (!latestAccessDate || accDate > latestAccessDate) {
              latestAccessDate = accDate;
            }
          }
        }

        if (isCompleted || progressPct === 100) {
          totalCompletedModules += 1;
        }

        totalPercentSum += progressPct;

        moduleProgressDict[mod.id] = {
          moduleId: mod.id,
          moduleTitle: mod.title,
          totalSlides,
          currentSlideIdx: currentSlide,
          maxSlideIdx: maxSlide,
          isCompleted,
          completedAt,
          lastAccessedAt,
          progressPct,
        };
      });

      const totalModulesCount = allModules.length;
      const overallProgressPct =
        totalModulesCount > 0 ? Math.round(totalPercentSum / totalModulesCount) : 0;

      return {
        ...mem,
        group: userGroup,
        totalCompletedModules,
        totalModulesCount,
        overallProgressPct,
        latestAccessDate,
        moduleProgress: moduleProgressDict,
      };
    });

    return {
      success: true,
      data: {
        modules: allModules,
        phases: allPhases,
        members: formattedMembers,
        mentorGroups: isRestrictedMentor ? myMentorGroups : allMentorGroups,
        isRestrictedMentor,
        myGroupsCount: isRestrictedMentor ? myMentorGroups.length : allMentorGroups.length,
        myMembersCount: targetMembers.length,
      },
    };
  } catch (error) {
    console.error("Error in getModuleProgressMonitoringData:", error);
    return { success: false, error: error.message };
  }
}
