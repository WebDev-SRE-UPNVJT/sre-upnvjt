"use server";

import { db } from "@/lib/db";
import { task, taskSubmission, memberProfile, xpTransaction, mentorGroup, mentorGroupMember, user } from "@/db/schema";
import { eq, and, desc, asc, inArray, or } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { hasAccess } from "@/lib/permissions";
import { revalidatePath } from "next/cache";
import { calculateSpeedBonusXp } from "@/lib/xpUtils";
import { google } from "googleapis";

/**
 * Helper to determine if a user is restricted to their Mentor groups only.
 * Mentors only see members in the groups where they are assigned as mentor or coMentor.
 * Super Admins or users with wildcard access see all.
 */
async function getMentorScope(userId, roleName) {
  const isSuperAdmin = roleName === "SUPER_ADMIN";
  const isMentor = (roleName || "").toUpperCase().includes("MENTOR");

  if (isSuperAdmin) {
    return { isRestrictedMentor: false, myGroupIds: [], allowedMemberUserIds: [] };
  }

  // If role has MENTOR in title or is mentor
  if (isMentor) {
    const myGroups = await db.query.mentorGroup.findMany({
      where: or(
        eq(mentorGroup.mentorId, userId),
        eq(mentorGroup.coMentorId, userId)
      ),
      with: {
        members: {
          with: {
            user: {
              with: {
                role: { columns: { name: true } },
              },
            },
          },
        },
      },
    });

    const myGroupIds = myGroups.map((g) => g.id);
    const allowedMemberUserIds = new Set();
    myGroups.forEach((g) => {
      (g.members || []).forEach((m) => {
        const rName = (m.user?.role?.name || "").trim().toUpperCase();
        if (rName === "MEMBER") {
          allowedMemberUserIds.add(m.userId);
        }
      });
    });

    return {
      isRestrictedMentor: true,
      myGroups,
      myGroupIds,
      allowedMemberUserIds: Array.from(allowedMemberUserIds),
    };
  }

  return { isRestrictedMentor: false, myGroupIds: [], allowedMemberUserIds: [] };
}

/**
 * Get Submissions data tailored for the current user (filtered by mentor group if role is MENTOR)
 */
export async function getSubmissionsForReview() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const currentUserId = parseInt(session.user.id);
    const roleName = session.user.roleName || "";

    // Check permissions
    const canAccessSubmissions =
      hasAccess(session.user, "submissions", "read") ||
      hasAccess(session.user, "tasks", "read") ||
      roleName.toUpperCase().includes("MENTOR");

    if (!canAccessSubmissions) {
      return { success: false, error: "Forbidden: Anda tidak memiliki akses ke penilaian submisi." };
    }

    // Check mentor scope
    const mentorScope = await getMentorScope(currentUserId, roleName);

    // Fetch all tasks for filtering & context
    const allTasks = await db.query.task.findMany({
      orderBy: [desc(task.createdAt)],
      columns: {
        id: true,
        title: true,
        category: true,
        rewardXp: true,
        deadline: true,
        submissionType: true,
        enableSpeedBonus: true,
        createdAt: true,
      },
    });

    // Fetch all mentor groups with members for group badges & filter dropdown
    const allMentorGroups = await db.query.mentorGroup.findMany({
      orderBy: [asc(mentorGroup.name)],
      with: {
        mentor: { columns: { id: true, name: true } },
        coMentor: { columns: { id: true, name: true } },
        members: {
          with: {
            user: { columns: { id: true, name: true, npm: true } },
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

    // Fetch Submissions
    let rawSubmissions = [];

    if (mentorScope.isRestrictedMentor) {
      if (mentorScope.allowedMemberUserIds.length === 0) {
        // Mentor has no members in their assigned groups
        return {
          success: true,
          data: {
            submissions: [],
            tasks: allTasks,
            mentorGroups: mentorScope.myGroups || [],
            isRestrictedMentor: true,
            myGroupsCount: mentorScope.myGroups?.length || 0,
            myMembersCount: 0,
          },
        };
      }

      rawSubmissions = await db.query.taskSubmission.findMany({
        where: inArray(taskSubmission.memberId, mentorScope.allowedMemberUserIds),
        with: {
          member: {
            columns: { id: true, name: true, email: true, npm: true, profilePictureUrl: true },
            with: {
              role: { columns: { name: true } },
              department: { columns: { name: true, code: true } },
              division: { columns: { name: true } },
            },
          },
          task: true,
          reviewer: {
            columns: { id: true, name: true, email: true },
          },
        },
        orderBy: [desc(taskSubmission.submittedAt)],
      });
    } else {
      // Super Admin or Full Access: Fetch submissions
      rawSubmissions = await db.query.taskSubmission.findMany({
        with: {
          member: {
            columns: { id: true, name: true, email: true, npm: true, profilePictureUrl: true },
            with: {
              role: { columns: { name: true } },
              department: { columns: { name: true, code: true } },
              division: { columns: { name: true } },
            },
          },
          task: true,
          reviewer: {
            columns: { id: true, name: true, email: true },
          },
        },
        orderBy: [desc(taskSubmission.submittedAt)],
      });

      // Filter strictly only submissions from users with role 'MEMBER'
      rawSubmissions = rawSubmissions.filter((s) => {
        const rName = (s.member?.role?.name || "").trim().toUpperCase();
        return rName === "MEMBER";
      });
    }

    // Attach XP Transaction / Bonus info and Mentor Group details
    const subIds = rawSubmissions.map((s) => s.id);
    let txMap = new Map();

    if (subIds.length > 0) {
      const transactions = await db.query.xpTransaction.findMany({
        where: inArray(xpTransaction.sourceId, subIds),
      });
      transactions.forEach((tx) => {
        if (tx.sourceType === "task" || tx.sourceType === "task_import") {
          txMap.set(tx.sourceId, tx);
        }
      });
    }

    const formattedSubmissions = rawSubmissions.map((s) => {
      const tx = txMap.get(s.id);
      let bonusXp = 0;
      if (tx) {
        const match = (tx.reason || "").match(/Bonus XP: \+(\d+) XP/);
        if (match) {
          bonusXp = parseInt(match[1]);
        } else if (tx.amount > (s.task?.rewardXp || 0)) {
          bonusXp = tx.amount - (s.task?.rewardXp || 0);
        }
      }

      const grp = userToGroupMap.get(s.memberId) || null;

      return {
        ...s,
        bonusXp,
        group: grp,
      };
    });

    return {
      success: true,
      data: {
        submissions: formattedSubmissions,
        tasks: allTasks,
        mentorGroups: mentorScope.isRestrictedMentor ? (mentorScope.myGroups || []) : allMentorGroups,
        isRestrictedMentor: mentorScope.isRestrictedMentor,
        myGroupsCount: mentorScope.isRestrictedMentor ? (mentorScope.myGroups?.length || 0) : allMentorGroups.length,
        myMembersCount: mentorScope.isRestrictedMentor ? mentorScope.allowedMemberUserIds.length : allMentorGroups.reduce((acc, g) => acc + (g.members?.length || 0), 0),
      },
    };
  } catch (error) {
    console.error("Error fetching submissions for review:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Review a single submission (Approve / Reject / Revoke + Score / Bonus XP + Feedback)
 */
export async function reviewTaskSubmissionAction(submissionId, { status, feedback, bonusXp = 0 }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const currentUserId = parseInt(session.user.id);
    const roleName = session.user.roleName || "";

    const canReview =
      hasAccess(session.user, "submissions", "update") ||
      hasAccess(session.user, "tasks", "update") ||
      roleName.toUpperCase().includes("MENTOR");

    if (!canReview) {
      return { success: false, error: "Forbidden: Anda tidak memiliki hak akses meninjau submisi." };
    }

    const subId = parseInt(submissionId);
    if (!subId || !status) {
      return { success: false, error: "ID submisi dan status wajib diisi" };
    }

    // Fetch submission with task and member
    const submission = await db.query.taskSubmission.findFirst({
      where: eq(taskSubmission.id, subId),
      with: {
        task: true,
        member: {
          with: {
            department: true,
            division: true,
          },
        },
      },
    });

    if (!submission) {
      return { success: false, error: "Submisi tidak ditemukan" };
    }

    // Check mentor scope: verify if submission.memberId belongs to one of this mentor's groups
    const mentorScope = await getMentorScope(currentUserId, roleName);
    if (mentorScope.isRestrictedMentor) {
      if (!mentorScope.allowedMemberUserIds.includes(submission.memberId)) {
        return {
          success: false,
          error: "Forbidden: Anda hanya dapat menilai tugas dari anggota kelompok mentoring Anda.",
        };
      }
    }

    const wasApproved = submission.status === "APPROVED";
    const nowApproved = status === "APPROVED";
    const nowRejected = status === "REJECTED";

    // If status changed to REJECTED and file was uploaded to Google Drive, optionally handle deletion
    if (nowRejected && submission.fileUrl) {
      try {
        if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_REFRESH_TOKEN) {
          const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            "https://developers.google.com/oauthplayground"
          );
          oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
          const drive = google.drive({ version: "v3", auth: oauth2Client });

          const urls = submission.fileUrl.split(",").map((u) => u.trim());
          for (const url of urls) {
            if (url.includes("drive.google.com")) {
              const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/id=([a-zA-Z0-9_-]+)/);
              if (match && match[1]) {
                const fileId = match[1];
                try {
                  await drive.files.delete({ fileId, supportsAllDrives: true });
                } catch (driveErr) {
                  console.error(`Error deleting Google Drive file ${fileId}:`, driveErr);
                }
              }
            }
          }
        }
      } catch (err) {
        console.error("Google Drive client error during deletion on REJECT:", err);
      }
    }

    // Handle XP revocation if previously APPROVED and now changed to REJECTED or PENDING
    if (wasApproved && !nowApproved) {
      const prevTransactions = await db.query.xpTransaction.findMany({
        where: and(
          eq(xpTransaction.userId, submission.memberId),
          eq(xpTransaction.sourceId, submission.id)
        ),
      });

      const netAwardedXp = prevTransactions
        .filter(
          (tx) =>
            tx.sourceType === "task" ||
            tx.sourceType === "task_import" ||
            tx.sourceType === "task_revocation"
        )
        .reduce((sum, tx) => sum + tx.amount, 0);

      const revokeAmount = netAwardedXp > 0 ? netAwardedXp : submission.xpEarned || 0;

      if (revokeAmount > 0) {
        const profile = await db.query.memberProfile.findFirst({
          where: eq(memberProfile.userId, submission.memberId),
        });

        if (profile) {
          const nextXp = Math.max(0, profile.xp - revokeAmount);
          const nextLevel = Math.max(1, Math.floor(nextXp / 100) + 1);
          await db
            .update(memberProfile)
            .set({ xp: nextXp, level: nextLevel })
            .where(eq(memberProfile.userId, submission.memberId));
        }

        await db.insert(xpTransaction).values({
          userId: submission.memberId,
          amount: -revokeAmount,
          reason: `Pembatalan Persetujuan Tugas: ${submission.task?.title || "Tugas"} (-${revokeAmount} XP)`,
          sourceType: "task_revocation",
          sourceId: submission.id,
          grantedById: currentUserId,
        });
      }
    }

    // Reward XP if transitioned to APPROVED or if additional bonusXp > 0 while remaining APPROVED
    const parsedBonusXp = parseInt(bonusXp) || 0;
    let totalGainedXp = 0;
    let reasons = [];
    let speedBonusXp = 0;

    if (nowApproved && !wasApproved) {
      const isSpeedBonusEnabled = submission.task?.enableSpeedBonus !== false;
      if (isSpeedBonusEnabled) {
        speedBonusXp = calculateSpeedBonusXp(
          submission.task?.createdAt,
          submission.task?.deadline,
          submission.submittedAt
        );
      }

      if (submission.task?.rewardXp > 0) {
        totalGainedXp += submission.task.rewardXp;
        reasons.push(`Penyelesaian Tugas: ${submission.task.title} (+${submission.task.rewardXp} XP)`);
      }

      if (speedBonusXp > 0) {
        totalGainedXp += speedBonusXp;
        reasons.push(`Bonus Kecepatan: +${speedBonusXp} XP`);
      }

      if (parsedBonusXp > 0) {
        totalGainedXp += parsedBonusXp;
        reasons.push(`Bonus Penilai: +${parsedBonusXp} XP`);
      }
    } else if (wasApproved && nowApproved && parsedBonusXp > 0) {
      totalGainedXp += parsedBonusXp;
      reasons.push(`Bonus Tambahan Penilai: +${parsedBonusXp} XP`);
    }

    if (totalGainedXp > 0) {
      const profile = await db.query.memberProfile.findFirst({
        where: eq(memberProfile.userId, submission.memberId),
      });

      if (!profile) {
        await db.insert(memberProfile).values({
          userId: submission.memberId,
          xp: totalGainedXp,
          level: Math.floor(totalGainedXp / 100) + 1,
        });
      } else {
        const nextXp = profile.xp + totalGainedXp;
        const nextLevel = Math.floor(nextXp / 100) + 1;
        await db
          .update(memberProfile)
          .set({ xp: nextXp, level: nextLevel })
          .where(eq(memberProfile.userId, submission.memberId));
      }

      await db.insert(xpTransaction).values({
        userId: submission.memberId,
        amount: totalGainedXp,
        reason: reasons.join(" | "),
        sourceType: "task",
        sourceId: submission.id,
        grantedById: currentUserId,
      });
    }

    const updatePayload = {
      status,
      feedback: feedback || null,
      reviewedById: currentUserId,
    };

    if (nowApproved && !wasApproved) {
      updatePayload.xpEarned = totalGainedXp;
    } else if (wasApproved && !nowApproved) {
      updatePayload.xpEarned = 0;
    } else if (wasApproved && nowApproved && parsedBonusXp > 0) {
      updatePayload.xpEarned = (submission.xpEarned || 0) + parsedBonusXp;
    }

    const [updated] = await db
      .update(taskSubmission)
      .set(updatePayload)
      .where(eq(taskSubmission.id, subId))
      .returning();

    // Background Spreadsheet sync if configured on task
    if (submission.task?.spreadsheetId) {
      import("@/lib/googleSheets")
        .then(({ appendOrUpdateTaskSubmissionToSheet }) => {
          appendOrUpdateTaskSubmissionToSheet(submission.task.spreadsheetId, {
            id: updated.id,
            memberId: submission.memberId,
            memberName: submission.member?.name || `User ${submission.memberId}`,
            memberEmail: submission.member?.email || "",
            departmentName: submission.member?.department?.name || "-",
            divisionName: submission.member?.division?.name || "-",
            status: updated.status,
            fileUrl: updated.fileUrl,
            feedback: updated.feedback,
            submittedAt: submission.submittedAt,
            taskDeadline: submission.task?.deadline,
          }).catch((sheetErr) => {
            console.warn("[Submissions Review] Sheet sync error:", sheetErr.message);
          });
        })
        .catch(() => {});
    }

    revalidatePath("/submissions");
    revalidatePath("/tasks");

    return {
      success: true,
      data: {
        ...updated,
        reviewer: { id: currentUserId, name: session.user.name, email: session.user.email },
      },
    };
  } catch (error) {
    console.error("Error in reviewTaskSubmissionAction:", error);
    return { success: false, error: error.message };
  }
}
