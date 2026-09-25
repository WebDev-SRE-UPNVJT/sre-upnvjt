import React from "react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { user, memberProfile, task, taskSubmission, attendance, pptModule, literatureItem, xpTransaction, division, pptPhase, pptModuleProgress, role, department } from "@/db/schema";
import { eq, desc, asc, and, sql } from "drizzle-orm";
import MemberDashboardClient from "./MemberDashboardClient";

export const dynamic = "force-dynamic";

export default async function MemberDashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    redirect("/login");
  }

  const userIdInt = parseInt(session.user.id);
  if (isNaN(userIdInt)) {
    redirect("/login");
  }

  // Ensure memberProfile exists safely without race condition
  let profile = await db.query.memberProfile.findFirst({
    where: eq(memberProfile.userId, userIdInt),
  });

  if (!profile) {
    try {
      await db.insert(memberProfile).values({
        userId: userIdInt,
        xp: 0,
        level: 1,
      }).onConflictDoNothing();

      profile = await db.query.memberProfile.findFirst({
        where: eq(memberProfile.userId, userIdInt),
      }) || { userId: userIdInt, xp: 0, level: 1 };
    } catch (e) {
      profile = { userId: userIdInt, xp: 0, level: 1 };
    }
  }

  // Fetch all parallel queries concurrently to optimize execution time
  const [
    currentUser,
    higherRankCount,
    allTasks,
    submissions,
    attendanceLogs,
    allPublishedModules,
    allModuleProgress,
    allPhases,
    latestLiterature,
    xpLogs,
  ] = await Promise.all([
    db.query.user.findFirst({
      where: eq(user.id, userIdInt),
      columns: {
        id: true,
        name: true,
        email: true,
        npm: true,
        profilePictureUrl: true,
      },
      with: {
        role: {
          columns: {
            id: true,
            name: true,
          },
        },
        department: {
          columns: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    }),
    db
      .select({
        count: sql`COUNT(*)::int`,
      })
      .from(memberProfile)
      .innerJoin(user, eq(user.id, memberProfile.userId))
      .leftJoin(role, eq(role.id, user.roleId))
      .leftJoin(department, eq(department.id, user.departmentId))
      .leftJoin(division, eq(division.id, user.divisionId))
      .where(
        and(
          sql`LOWER(${role.name}) = 'member'`,
          sql`COALESCE(LOWER(${department.code}), '') NOT IN ('sys', 'system')`,
          sql`COALESCE(LOWER(${department.name}), '') NOT LIKE '%sys%'`,
          sql`COALESCE(LOWER(${division.name}), '') NOT LIKE '%sys%'`,
          sql`${memberProfile.xp} > ${profile.xp || 0}`
        )
      ),
    db.query.task.findMany({
      orderBy: [asc(task.deadline)],
      columns: {
        id: true,
        title: true,
        rewardXp: true,
        category: true,
        prerequisiteTaskId: true,
        pptModuleId: true,
        deadline: true,
      },
    }),
    db.query.taskSubmission.findMany({
      where: eq(taskSubmission.memberId, userIdInt),
      columns: {
        id: true,
        taskId: true,
        status: true,
      },
    }),
    db.query.attendance.findMany({
      where: eq(attendance.memberId, userIdInt),
      orderBy: [desc(attendance.createdAt)],
      columns: {
        id: true,
        status: true,
      },
    }),
    db.query.pptModule.findMany({
      where: eq(pptModule.isPublished, true),
      orderBy: [asc(pptModule.createdAt)],
      columns: {
        id: true,
        title: true,
        phaseId: true,
        createdAt: true,
      },
      with: {
        slides: {
          columns: {
            id: true,
          },
        },
      },
    }),
    db.query.pptModuleProgress.findMany({
      where: eq(pptModuleProgress.userId, userIdInt),
      columns: {
        moduleId: true,
        currentSlideIdx: true,
        maxSlideIdx: true,
        isCompleted: true,
      },
    }),
    db.query.pptPhase.findMany({
      orderBy: [asc(pptPhase.order), asc(pptPhase.id)],
      columns: {
        id: true,
        name: true,
        description: true,
        order: true,
      },
    }),
    db.query.literatureItem.findFirst({
      where: eq(literatureItem.isPublished, true),
      orderBy: [desc(literatureItem.createdAt)],
      columns: {
        id: true,
        title: true,
        description: true,
        coverUrl: true,
        fileUrl: true,
        createdAt: true,
      },
      with: {
        category: {
          columns: {
            id: true,
            name: true,
          },
        },
      },
    }),
    db.query.xpTransaction.findMany({
      where: eq(xpTransaction.userId, userIdInt),
      orderBy: [desc(xpTransaction.createdAt)],
      limit: 5,
      columns: {
        id: true,
        amount: true,
        reason: true,
        sourceType: true,
        createdAt: true,
      },
    }),
  ]);

  if (!currentUser) redirect("/login");

  const currentRank = (higherRankCount[0]?.count || 0) + 1;

  // Calculate completed tasks
  const completedTasksCount = submissions.filter(s => s.status === "APPROVED").length;

  // Calculate attendance logs and streak
  const presentCount = attendanceLogs.filter(a => a.status === "PRESENT" || a.status === "LATE").length;

  // Latest PPT module for banner
  const latestPpt = allPublishedModules[allPublishedModules.length - 1] || null;

  // Construct Phase Progress Hierarchy
  const phaseHierarchy = allPhases.map((phase) => {
    const phaseModules = allPublishedModules.filter((m) => m.phaseId === phase.id);
    let totalPhaseItems = 0;
    let completedPhaseItems = 0;

    const modulesWithTasks = phaseModules.map((mod) => {
      const userModProg = allModuleProgress.find((p) => p.moduleId === mod.id);
      const isModuleCompleted =
        !!userModProg?.isCompleted ||
        (mod.slides?.length > 0 && (userModProg?.maxSlideIdx || 0) >= mod.slides.length - 1);

      totalPhaseItems += 1;
      if (isModuleCompleted) completedPhaseItems += 1;

      // Tasks linked to this module
      const modTasks = allTasks.filter((t) => t.pptModuleId === mod.id);
      const tasksWithSub = modTasks.map((t) => {
        const sub = submissions.find((s) => s.taskId === t.id);
        const isApproved = sub?.status === "APPROVED";
        const isLocked = t.prerequisiteTaskId
          ? !submissions.some((s) => s.taskId === t.prerequisiteTaskId && s.status === "APPROVED")
          : false;

        totalPhaseItems += 1;
        if (isApproved) completedPhaseItems += 1;

        return {
          id: t.id,
          title: t.title,
          rewardXp: t.rewardXp,
          category: t.category,
          prerequisiteTaskId: t.prerequisiteTaskId,
          isLocked,
          submission: sub || null,
          isApproved,
        };
      });

      // Sort tasks: Main Quest first
      tasksWithSub.sort((a, b) => {
        const isMainA =
          a.category === "MAIN" ||
          (!a.category && ((a.rewardXp || 0) >= 50 || (a.title || "").toLowerCase().includes("main")));
        const isMainB =
          b.category === "MAIN" ||
          (!b.category && ((b.rewardXp || 0) >= 50 || (b.title || "").toLowerCase().includes("main")));
        if (isMainA && !isMainB) return -1;
        if (!isMainA && isMainB) return 1;
        return 0;
      });

      return {
        id: mod.id,
        title: mod.title,
        slideCount: mod.slides?.length || 0,
        isCompleted: isModuleCompleted,
        progressPct:
          mod.slides?.length > 1
            ? Math.round(((userModProg?.currentSlideIdx || 0) / (mod.slides.length - 1)) * 100)
            : isModuleCompleted
            ? 100
            : 0,
        tasks: tasksWithSub,
      };
    });

    const progressPct =
      totalPhaseItems > 0 ? Math.round((completedPhaseItems / totalPhaseItems) * 100) : 0;

    return {
      id: phase.id,
      name: phase.name,
      description: phase.description,
      order: phase.order,
      modules: modulesWithTasks,
      totalItems: totalPhaseItems,
      completedItems: completedPhaseItems,
      progressPct,
    };
  });

  // If there are unphased modules, add them
  const unphasedModules = allPublishedModules.filter((m) => !m.phaseId);
  if (unphasedModules.length > 0) {
    let unphasedTotal = 0;
    let unphasedCompleted = 0;

    const modulesWithTasks = unphasedModules.map((mod) => {
      const userModProg = allModuleProgress.find((p) => p.moduleId === mod.id);
      const isModuleCompleted =
        !!userModProg?.isCompleted ||
        (mod.slides?.length > 0 && (userModProg?.maxSlideIdx || 0) >= mod.slides.length - 1);

      unphasedTotal += 1;
      if (isModuleCompleted) unphasedCompleted += 1;

      const modTasks = allTasks.filter((t) => t.pptModuleId === mod.id);
      const tasksWithSub = modTasks.map((t) => {
        const sub = submissions.find((s) => s.taskId === t.id);
        const isApproved = sub?.status === "APPROVED";
        const isLocked = t.prerequisiteTaskId
          ? !submissions.some((s) => s.taskId === t.prerequisiteTaskId && s.status === "APPROVED")
          : false;

        unphasedTotal += 1;
        if (isApproved) unphasedCompleted += 1;

        return {
          id: t.id,
          title: t.title,
          rewardXp: t.rewardXp,
          category: t.category,
          prerequisiteTaskId: t.prerequisiteTaskId,
          isLocked,
          submission: sub || null,
          isApproved,
        };
      });

      // Sort tasks: Main Quest first
      tasksWithSub.sort((a, b) => {
        const isMainA =
          a.category === "MAIN" ||
          (!a.category && ((a.rewardXp || 0) >= 50 || (a.title || "").toLowerCase().includes("main")));
        const isMainB =
          b.category === "MAIN" ||
          (!b.category && ((b.rewardXp || 0) >= 50 || (b.title || "").toLowerCase().includes("main")));
        if (isMainA && !isMainB) return -1;
        if (!isMainA && isMainB) return 1;
        return 0;
      });

      return {
        id: mod.id,
        title: mod.title,
        slideCount: mod.slides?.length || 0,
        isCompleted: isModuleCompleted,
        progressPct:
          mod.slides?.length > 1
            ? Math.round(((userModProg?.currentSlideIdx || 0) / (mod.slides.length - 1)) * 100)
            : isModuleCompleted
            ? 100
            : 0,
        tasks: tasksWithSub,
      };
    });

    phaseHierarchy.push({
      id: "unphased",
      name: "Modul Tambahan / Umum",
      description: "Materi dan quest pelengkap",
      order: 999,
      modules: modulesWithTasks,
      totalItems: unphasedTotal,
      completedItems: unphasedCompleted,
      progressPct: unphasedTotal > 0 ? Math.round((unphasedCompleted / unphasedTotal) * 100) : 0,
    });
  }

  return (
    <MemberDashboardClient
      user={currentUser}
      profile={profile}
      rank={currentRank}
      tasks={allTasks.slice(0, 6)}
      submissions={submissions}
      completedTasksCount={completedTasksCount}
      presentCount={presentCount}
      latestPpt={latestPpt}
      latestLiterature={latestLiterature}
      xpLogs={xpLogs}
      phaseHierarchy={phaseHierarchy}
    />
  );
}
