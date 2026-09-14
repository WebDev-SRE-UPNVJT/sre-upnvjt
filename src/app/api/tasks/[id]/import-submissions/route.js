import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { taskSubmission, memberProfile, xpTransaction } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { calculateSpeedBonusXp } from "@/lib/xpUtils";

export async function POST(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const taskId = parseInt(resolvedParams.id);
    const body = await req.json();
    const { items } = body;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Data import tidak ditemukan" }, { status: 400 });
    }

    const taskData = await db.query.task.findFirst({
      where: (t, { eq }) => eq(t.id, taskId),
    });

    if (!taskData) {
      return NextResponse.json({ error: "Tugas tidak ditemukan" }, { status: 404 });
    }

    const updatedSubmissions = [];
    const bonusXpMap = new Map();
    let updatedCount = 0;

    for (const item of items) {
      const { submissionId, memberId, status, feedback, bonusXp = 0 } = item;

      // Find submission by submissionId or memberId + taskId
      let sub;
      if (submissionId && !isNaN(submissionId)) {
        sub = await db.query.taskSubmission.findFirst({
          where: (s, { eq, and }) => and(eq(s.id, parseInt(submissionId)), eq(s.taskId, taskId)),
        });
      }
      if (!sub && memberId && !isNaN(memberId)) {
        sub = await db.query.taskSubmission.findFirst({
          where: (s, { eq, and }) => and(eq(s.memberId, parseInt(memberId)), eq(s.taskId, taskId)),
        });
      }

      if (!sub) continue;

      const wasApproved = sub.status === "APPROVED";
      const nowApproved = status === "APPROVED";

      // Update submission record
      const [updated] = await db.update(taskSubmission)
        .set({
          status,
          feedback: feedback || null,
          reviewedById: session.user.id,
        })
        .where(eq(taskSubmission.id, sub.id))
        .returning();

      // Fetch member profile
      const profile = await db.query.memberProfile.findFirst({
        where: eq(memberProfile.userId, sub.memberId),
      });

      // Calculate XP gains (Base XP + Speed Bonus 0-10 XP + Admin Bonus XP)
      let totalGainedXp = 0;
      let reasons = [];
      let speedBonusXp = 0;

      if (nowApproved && !wasApproved) {
        const isSpeedBonusEnabled = taskData.enableSpeedBonus !== false;
        if (isSpeedBonusEnabled) {
          speedBonusXp = calculateSpeedBonusXp(
            taskData.createdAt,
            taskData.deadline,
            sub.submittedAt
          );
        }

        if (taskData.rewardXp > 0) {
          totalGainedXp += taskData.rewardXp;
          reasons.push(`Penyelesaian Tugas: ${taskData.title} (+${taskData.rewardXp} XP)`);
        }

        if (speedBonusXp > 0) {
          totalGainedXp += speedBonusXp;
          reasons.push(`Bonus Kecepatan: +${speedBonusXp} XP`);
        }
      }

      const parsedBonusXp = parseInt(bonusXp) || 0;
      if (parsedBonusXp > 0) {
        totalGainedXp += parsedBonusXp;
        reasons.push(`Bonus Admin: +${parsedBonusXp} XP`);
        bonusXpMap.set(sub.id, parsedBonusXp);
      }

      if (totalGainedXp > 0) {
        if (!profile) {
          await db.insert(memberProfile).values({
            userId: sub.memberId,
            xp: totalGainedXp,
            level: Math.floor(totalGainedXp / 100) + 1,
          });
        } else {
          const nextXp = profile.xp + totalGainedXp;
          const nextLevel = Math.floor(nextXp / 100) + 1;
          await db.update(memberProfile)
            .set({ xp: nextXp, level: nextLevel })
            .where(eq(memberProfile.userId, sub.memberId));
        }

        await db.insert(xpTransaction).values({
          userId: sub.memberId,
          amount: totalGainedXp,
          reason: reasons.join(" | "),
          sourceType: "task_import",
          sourceId: sub.id,
        });
      }

      updatedSubmissions.push(updated);
      updatedCount++;
    }

    // Refetch updated submissions with member and task details
    const fullSubmissions = await db.query.taskSubmission.findMany({
      where: (s, { eq }) => eq(s.taskId, taskId),
      with: {
        member: { columns: { id: true, name: true } },
        task: { columns: { id: true, title: true, rewardXp: true } },
      },
    });

    const finalSubmissions = fullSubmissions.map(s => ({
      ...s,
      bonusXp: bonusXpMap.get(s.id) || 0,
    }));

    // Sync with Google Spreadsheet if connected
    if (taskData.spreadsheetId) {
      const { syncAllTaskSubmissionsToSheet } = await import("@/lib/googleSheets");
      syncAllTaskSubmissionsToSheet(taskData.spreadsheetId, fullSubmissions).catch(sheetErr => {
        console.warn("[Import Submissions] Background Sheet sync error:", sheetErr.message);
      });
    }

    return NextResponse.json({
      success: true,
      message: `Berhasil memperbarui ${updatedCount} submisi dari file Excel!`,
      updatedSubmissions: finalSubmissions,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
