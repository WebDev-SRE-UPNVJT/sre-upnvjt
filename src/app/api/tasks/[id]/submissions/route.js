import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { taskSubmission, task, memberProfile, xpTransaction } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getServerSession } from "next-auth/next";
import { google } from "googleapis";
import { Readable } from "stream";
import { calculateSpeedBonusXp } from "@/lib/xpUtils";

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

    const [updated] = await db.update(taskSubmission)
      .set({
        status,
        feedback: feedback || null,
        reviewedById: session.user.id,
      })
      .where(eq(taskSubmission.id, parseInt(submissionId)))
      .returning();

    // Reward XP if transitioned to APPROVED or if bonusXp > 0
    const parsedBonusXp = parseInt(bonusXp) || 0;
    let totalGainedXp = 0;
    let reasons = [];
    let speedBonusXp = 0;

    if (nowApproved && !wasApproved) {
      speedBonusXp = calculateSpeedBonusXp(
        submission.task?.createdAt,
        submission.task?.deadline,
        submission.submittedAt
      );

      if (submission.task?.rewardXp > 0) {
        totalGainedXp += submission.task.rewardXp;
        reasons.push(`Penyelesaian Tugas: ${submission.task.title} (+${submission.task.rewardXp} XP)`);
      }

      if (speedBonusXp > 0) {
        totalGainedXp += speedBonusXp;
        reasons.push(`Bonus Kecepatan: +${speedBonusXp} XP`);
      }
    }

    if (parsedBonusXp > 0) {
      totalGainedXp += parsedBonusXp;
      reasons.push(`Bonus Admin: +${parsedBonusXp} XP`);
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
        await db.update(memberProfile)
          .set({ xp: nextXp, level: nextLevel })
          .where(eq(memberProfile.userId, submission.memberId));
      }

      await db.insert(xpTransaction).values({
        userId: submission.memberId,
        amount: totalGainedXp,
        reason: reasons.join(" | "),
        sourceType: "task",
        sourceId: submission.id,
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

    return NextResponse.json({ success: true, submission: result }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

