import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { task, taskSubmission } from "@/db/schema";
import { asc, desc, eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

export async function GET() {
  try {
    const rawTasks = await db.query.task.findMany({
      orderBy: [asc(task.deadline)],
      with: {
        submissions: {
          columns: { id: true }
        },
        ttsCrossword: {
          columns: { id: true, title: true, slug: true, timeLimitMinutes: true, rewardXp: true }
        },
        formTemplate: {
          columns: { id: true, title: true }
        },
        prerequisiteTask: {
          columns: { id: true, title: true }
        }
      }
    });

    const tasks = rawTasks.map(t => ({
      id: t.id,
      title: t.title,
      description: t.description,
      rewardXp: t.rewardXp,
      category: t.category || "MAIN",
      isRequired: t.isRequired ?? true,
      deadline: t.deadline,
      folderId: t.folderId,
      spreadsheetId: t.spreadsheetId,
      spreadsheetUrl: t.spreadsheetUrl,
      maxUploadSizeMb: t.maxUploadSizeMb,
      allowMultipleFiles: t.allowMultipleFiles,
      submissionType: t.submissionType,
      formTemplateId: t.formTemplateId,
      ttsCrosswordId: t.ttsCrosswordId,
      ttsScoringMode: t.ttsScoringMode || "COMPLETION",
      ttsCrossword: t.ttsCrossword,
      formTemplate: t.formTemplate,
      prerequisiteTaskId: t.prerequisiteTaskId,
      prerequisiteTask: t.prerequisiteTask,
      createdById: t.createdById,
      createdAt: t.createdAt,
      submissionCount: t.submissions?.length || 0,
    }));

    return NextResponse.json(tasks);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      title,
      description,
      rewardXp,
      category,
      isRequired,
      deadline,
      folderId,
      submissionType,
      formTemplateId,
      ttsCrosswordId,
      ttsScoringMode,
      prerequisiteTaskId,
      maxUploadSizeMb,
      allowMultipleFiles,
      enableSpeedBonus,
      allowLateSubmission,
      createSpreadsheet,
    } = body;

    if (!title || !description || !deadline) {
      return NextResponse.json({ error: "Judul, deskripsi, dan tenggat waktu wajib diisi" }, { status: 400 });
    }

    let spreadsheetId = body.spreadsheetId || null;
    let spreadsheetUrl = body.spreadsheetUrl || null;

    if (createSpreadsheet && !spreadsheetId) {
      try {
        let formQuestions = [];
        if (formTemplateId) {
          const { formTemplate } = await import("@/db/schema");
          const formRec = await db.query.formTemplate.findFirst({
            where: eq(formTemplate.id, parseInt(formTemplateId)),
          });
          if (formRec && Array.isArray(formRec.questions)) {
            formQuestions = formRec.questions;
          }
        }

        const { createTaskSpreadsheet } = await import("@/lib/googleSheets");
        const sheetRes = await createTaskSpreadsheet(title, formQuestions);
        spreadsheetId = sheetRes.spreadsheetId;
        spreadsheetUrl = sheetRes.spreadsheetUrl;

        // Sync to formTemplate as well if linked
        if (formTemplateId && spreadsheetId) {
          const { formTemplate } = await import("@/db/schema");
          await db.update(formTemplate)
            .set({ spreadsheetId, spreadsheetUrl })
            .where(eq(formTemplate.id, parseInt(formTemplateId)));
        }
      } catch (sheetErr) {
        console.warn("[Tasks POST] Failed to auto-create Google Spreadsheet:", sheetErr.message);
      }
    }

    const [result] = await db.insert(task).values({
      title,
      description,
      rewardXp: rewardXp ? parseInt(rewardXp) : 0,
      category: category ? String(category).toUpperCase() : "MAIN",
      isRequired: isRequired !== undefined ? Boolean(isRequired) : true,
      formTemplateId: formTemplateId ? parseInt(formTemplateId) : null,
      ttsCrosswordId: ttsCrosswordId ? parseInt(ttsCrosswordId) : null,
      ttsScoringMode: ttsScoringMode ? String(ttsScoringMode).toUpperCase() : "COMPLETION",
      prerequisiteTaskId: (category === "SIDE" && prerequisiteTaskId) ? parseInt(prerequisiteTaskId) : null,
      deadline: new Date(deadline),
      enableSpeedBonus: enableSpeedBonus !== undefined ? Boolean(enableSpeedBonus) : true,
      allowLateSubmission: allowLateSubmission !== undefined ? Boolean(allowLateSubmission) : true,
      folderId: folderId ? String(folderId).trim() : null,
      spreadsheetId,
      spreadsheetUrl,
      submissionType: submissionType || "FILE",
      maxUploadSizeMb: maxUploadSizeMb ? parseInt(maxUploadSizeMb) : 10,
      allowMultipleFiles: Boolean(allowMultipleFiles),
      createdById: session.user.id,
    }).returning();

    return NextResponse.json({ success: true, task: { ...result, submissionCount: 0 } }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
