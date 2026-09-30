import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { taskSubmission, task, memberProfile, xpTransaction } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getServerSession } from "next-auth/next";
import { google } from "googleapis";
import { Readable } from "stream";
import { calculateSpeedBonusXp } from "@/lib/xpUtils";
import { calculateLevel } from "@/lib/leveling";

export const dynamic = "force-dynamic";
export const maxDuration = 120; // 2 minutes timeout for large file uploads to Google Drive

export async function GET(req, { params }) {
  try {
    const p = await params;
    const taskId = parseInt(p.id);
    const submissions = await db.query.taskSubmission.findMany({
      where: (t, { eq }) => eq(t.taskId, taskId),
      with: {
        member: { columns: { id: true, name: true } },
      },
    });

    return NextResponse.json(submissions);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const p = await params;
    const taskId = parseInt(p.id);
    const body = await req.json();
    const { submissionId, status, feedback, bonusXp = 0 } = body; // status: 'APPROVED' | 'REJECTED'

    if (!submissionId || !status) {
      return NextResponse.json({ error: "ID submisi dan status wajib diisi" }, { status: 400 });
    }

    // Fetch submission & task to verify and get reward details
    const submission = await db.query.taskSubmission.findFirst({
      where: (t, { eq, and }) => and(eq(t.id, parseInt(submissionId)), eq(t.taskId, taskId)),
      with: {
        task: true,
        member: {
          with: {
            department: true,
            division: true,
          }
        },
      },
    });

    if (!submission) {
      return NextResponse.json({ error: "Submisi tidak ditemukan" }, { status: 404 });
    }

    const wasApproved = submission.status === "APPROVED";
    const nowApproved = status === "APPROVED";
    const nowRejected = status === "REJECTED";

    // Delete files from Google Drive if status is changed to REJECTED
    if (nowRejected && submission.fileUrl) {
      try {
        const oauth2Client = new google.auth.OAuth2(
          process.env.GOOGLE_CLIENT_ID,
          process.env.GOOGLE_CLIENT_SECRET,
          'https://developers.google.com/oauthplayground'
        );
        oauth2Client.setCredentials({
          refresh_token: process.env.GOOGLE_REFRESH_TOKEN
        });
        const drive = google.drive({ version: 'v3', auth: oauth2Client });

        const urls = submission.fileUrl.split(",").map(u => u.trim());
        for (const url of urls) {
          if (url.includes("drive.google.com")) {
            // Extract Google Drive File ID using regex
            const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/id=([a-zA-Z0-9_-]+)/);
            if (match && match[1]) {
              const fileId = match[1];
              try {
                await drive.files.delete({ fileId, supportsAllDrives: true });
                console.log(`Successfully deleted Google Drive file ${fileId} on REJECT`);
              } catch (driveErr) {
                console.error(`Error deleting Google Drive file ${fileId}:`, driveErr);
              }
            }
          }
        }
      } catch (err) {
        console.error("Google Drive client error during deletion on REJECT:", err);
      }
    }

    // Hitung total target XP yang seharusnya didapatkan untuk submisi ini
    const parsedBonusXp = parseInt(bonusXp) || 0;
    const isSpeedBonusEnabled = submission.task?.enableSpeedBonus !== false;
    let speedBonusXp = 0;
    if (isSpeedBonusEnabled && (submission.task?.rewardXp || 0) > 0) {
      speedBonusXp = calculateSpeedBonusXp(
        submission.task?.createdAt,
        submission.task?.deadline,
        submission.submittedAt
      );
    }

    let baseTaskXp = submission.task?.rewardXp || 0;
    if (
      (submission.task?.submissionType === "FORM" || submission.task?.formTemplateId) &&
      submission.score !== null &&
      submission.score !== undefined
    ) {
      const scoringMode = submission.task?.formScoringMode || "COMPLETION";
      if (scoringMode === "PROPORTIONAL") {
        baseTaskXp = Math.round(((submission.score || 0) / 100) * baseTaskXp);
      } else if (scoringMode === "PERFECT") {
        baseTaskXp = submission.score === 100 ? baseTaskXp : 0;
      }
    } else if (
      (submission.task?.submissionType === "TTS" || submission.task?.ttsCrosswordId) &&
      submission.score !== null &&
      submission.score !== undefined
    ) {
      const scoringMode = submission.task?.ttsScoringMode || "COMPLETION";
      if (scoringMode === "PROPORTIONAL") {
        baseTaskXp = Math.round(((submission.score || 0) / 100) * baseTaskXp);
      } else if (scoringMode === "PERFECT") {
        baseTaskXp = (submission.score === 100 && (submission.wrongCount || 0) === 0) ? baseTaskXp : 0;
      }
    }

    const targetTotalXp = nowApproved ? (baseTaskXp + speedBonusXp + parsedBonusXp) : 0;

    // Ambil histori seluruh transaksi XP untuk submisi ini guna menghitung net XP yang saat ini telah diberikan
    const prevTransactions = await db.query.xpTransaction.findMany({
      where: (tx, { eq, and }) => and(
        eq(tx.userId, submission.memberId),
        eq(tx.sourceId, submission.id)
      ),
    });

    const validTxList = prevTransactions.filter(
      tx => tx.sourceType === "task" || tx.sourceType === "task_import" || tx.sourceType === "task_revocation"
    );

    const currentAwardedXp = validTxList.length > 0
      ? validTxList.reduce((sum, tx) => sum + tx.amount, 0)
      : (wasApproved ? (submission.xpEarned || 0) : 0);

    const deltaXp = targetTotalXp - currentAwardedXp;

    if (deltaXp !== 0) {
      const profile = await db.query.memberProfile.findFirst({
        where: eq(memberProfile.userId, submission.memberId),
      });

      const currentProfileXp = profile ? profile.xp : 0;
      const nextXp = Math.max(0, currentProfileXp + deltaXp);
      const nextLevel = calculateLevel(nextXp);

      if (!profile) {
        if (nextXp > 0) {
          await db.insert(memberProfile).values({
            userId: submission.memberId,
            xp: nextXp,
            level: nextLevel,
          });
        }
      } else {
        await db.update(memberProfile)
          .set({ xp: nextXp, level: nextLevel })
          .where(eq(memberProfile.userId, submission.memberId));
      }

      let reason = "";
      let txSourceType = "task";

      if (!nowApproved && wasApproved) {
        reason = `Pembatalan Persetujuan Tugas: ${submission.task?.title || "Tugas"} (${deltaXp} XP)`;
        txSourceType = "task_revocation";
      } else if (nowApproved && !wasApproved) {
        const parts = [];
        if (baseTaskXp > 0) parts.push(`Penyelesaian Tugas (+${baseTaskXp} XP)`);
        if (speedBonusXp > 0) parts.push(`Bonus Kecepatan (+${speedBonusXp} XP)`);
        if (parsedBonusXp > 0) parts.push(`Bonus Admin (+${parsedBonusXp} XP)`);
        reason = parts.length > 0 ? parts.join(" | ") : `Penilaian Tugas: ${submission.task?.title || "Tugas"} (+${deltaXp} XP)`;
      } else {
        // Penyesuaian / Edit nilai saat status tetap APPROVED
        reason = deltaXp > 0
          ? `Penyesuaian Nilai Tugas: ${submission.task?.title || "Tugas"} (+${deltaXp} XP)`
          : `Koreksi Pengurangan Nilai Tugas: ${submission.task?.title || "Tugas"} (${deltaXp} XP)`;
      }

      await db.insert(xpTransaction).values({
        userId: submission.memberId,
        amount: deltaXp,
        reason,
        sourceType: txSourceType,
        sourceId: submission.id,
        grantedById: session.user.id,
      });
    }

    const updatePayload = {
      status,
      feedback: feedback || null,
      reviewedById: session.user.id,
      xpEarned: targetTotalXp,
    };

    const [updated] = await db.update(taskSubmission)
      .set(updatePayload)
      .where(eq(taskSubmission.id, parseInt(submissionId)))
      .returning();

    // Realtime Sync to Google Spreadsheet if connected
    if (submission.task?.spreadsheetId) {
      const { appendOrUpdateTaskSubmissionToSheet } = await import("@/lib/googleSheets");
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
      }).catch(sheetErr => {
        console.warn("[Task Review] Background Sheet sync error:", sheetErr.message);
      });
    }

    return NextResponse.json({ success: true, submission: updated });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const p = await params;
    const taskId = parseInt(p.id);
    let finalFileUrl = "";

    const taskData = await db.query.task.findFirst({
      where: (t, { eq }) => eq(t.id, taskId)
    });

    if (!taskData) {
      return NextResponse.json({ error: "Tugas tidak ditemukan" }, { status: 404 });
    }

    // Validasi Tenggat Waktu jika pengumpulan terlambat tidak diizinkan
    if (taskData.allowLateSubmission === false && taskData.deadline && new Date() > new Date(taskData.deadline)) {
      return NextResponse.json(
        { error: "Tenggat waktu pengumpulan tugas ini telah berakhir. Submisi sudah ditutup." },
        { status: 400 }
      );
    }

    // Validasi Prasyarat Main Quest jika tugas ini adalah Side Quest terkunci
    if (taskData.prerequisiteTaskId) {
      const prereqSub = await db.query.taskSubmission.findFirst({
        where: (s, { and, eq }) => and(
          eq(s.taskId, taskData.prerequisiteTaskId),
          eq(s.memberId, parseInt(session.user.id)),
          eq(s.status, "APPROVED")
        ),
      });

      if (!prereqSub) {
        return NextResponse.json(
          { error: "Side Quest ini masih terkunci. Anda harus menyelesaikan dan menunggu persetujuan (APPROVED) pada Main Quest prasyarat terlebih dahulu." },
          { status: 403 }
        );
      }
    }

    const targetFolderId = taskData.folderId || process.env.GOOGLE_DRIVE_FOLDER_ID;

    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const type = formData.get("type"); // "link" or "file"

      if (type === "link") {
        finalFileUrl = formData.get("fileUrl");
      } else if (type === "file") {
        const files = formData.getAll("file");
        if (!files || files.length === 0) {
          return NextResponse.json({ error: "File tidak ditemukan" }, { status: 400 });
        }
        
        const oauth2Client = new google.auth.OAuth2(
          process.env.GOOGLE_CLIENT_ID,
          process.env.GOOGLE_CLIENT_SECRET,
          'https://developers.google.com/oauthplayground'
        );

        oauth2Client.setCredentials({
          refresh_token: process.env.GOOGLE_REFRESH_TOKEN
        });

        const drive = google.drive({ version: 'v3', auth: oauth2Client });
        let uploadedLinks = [];
        
        for (const file of files) {
          if (typeof file === "string") continue;
          
          const bytes = await file.arrayBuffer();
          const buffer = Buffer.from(bytes);
          const stream = Readable.from(buffer);
          
          const newFileName = `${session.user.name.replace(/[^a-zA-Z0-9]/g, '_')}_Task${taskId}_${file.name}`;
          
          const fileMetadata = {
            name: newFileName,
            parents: [targetFolderId]
          };

          const media = {
            mimeType: file.type,
            body: stream,
          };

          const uploadedFile = await drive.files.create({
            requestBody: fileMetadata,
            media: media,
            fields: 'id, webViewLink',
            supportsAllDrives: true
          });

          const fileId = uploadedFile.data.id;

          // Make it readable to anyone with link
          await drive.permissions.create({
            fileId: fileId,
            requestBody: {
              role: 'reader',
              type: 'anyone'
            },
            supportsAllDrives: true
          });
          
          uploadedLinks.push(uploadedFile.data.webViewLink);
        }

        if (uploadedLinks.length === 0) {
          return NextResponse.json({ error: "File tidak valid" }, { status: 400 });
        }
        
        finalFileUrl = uploadedLinks.join(", ");
      }
    } else {
      // Fallback for JSON
      const body = await req.json();
      finalFileUrl = body.fileUrl;
    }

    if (!finalFileUrl) {
      return NextResponse.json({ error: "Link atau file submisi wajib diisi" }, { status: 400 });
    }

    // Check if submission already exists
    const existing = await db.query.taskSubmission.findFirst({
      where: (t, { eq, and }) => and(eq(t.taskId, taskId), eq(t.memberId, parseInt(session.user.id))),
    });

    let result;
    if (existing) {
      const [updated] = await db.update(taskSubmission)
        .set({
          fileUrl: finalFileUrl,
          status: "PENDING",
          feedback: null,
          reviewedById: null,
          submittedAt: new Date(),
        })
        .where(eq(taskSubmission.id, existing.id))
        .returning();
      result = updated;
    } else {
      const [inserted] = await db.insert(taskSubmission).values({
        taskId,
        memberId: parseInt(session.user.id),
        fileUrl: finalFileUrl,
        status: "PENDING",
        submittedAt: new Date(),
      }).returning();
      result = inserted;
    }

    // Realtime sync to Google Spreadsheet if task is connected
    if (taskData?.spreadsheetId) {
      const userRecord = await db.query.user.findFirst({
        where: (u, { eq }) => eq(u.id, parseInt(session.user.id)),
        with: {
          department: true,
          division: true,
        },
      });

      const { appendOrUpdateTaskSubmissionToSheet } = await import("@/lib/googleSheets");
      appendOrUpdateTaskSubmissionToSheet(taskData.spreadsheetId, {
        id: result.id,
        memberId: result.memberId,
        memberName: userRecord?.name || session.user.name,
        memberEmail: userRecord?.email || session.user.email,
        departmentName: userRecord?.department?.name || "-",
        divisionName: userRecord?.division?.name || "-",
        status: result.status,
        fileUrl: result.fileUrl,
        feedback: result.feedback,
        submittedAt: result.submittedAt,
        taskDeadline: taskData.deadline,
      }).catch(sheetErr => {
        console.warn("[Task Submit] Background Sheet sync error:", sheetErr.message);
      });
    }

    return NextResponse.json({ success: true, submission: result }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

