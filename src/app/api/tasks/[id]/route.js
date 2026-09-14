import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { task, taskSubmission } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function PUT(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id);
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

    let spreadsheetId = body.spreadsheetId !== undefined ? body.spreadsheetId : undefined;
    let spreadsheetUrl = body.spreadsheetUrl !== undefined ? body.spreadsheetUrl : undefined;

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
        console.warn("[Tasks PUT] Failed to auto-create Google Spreadsheet:", sheetErr.message);
      }
    }

    const updateData = {
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
      submissionType: submissionType || "FILE",
      maxUploadSizeMb: maxUploadSizeMb ? parseInt(maxUploadSizeMb) : 10,
      allowMultipleFiles: Boolean(allowMultipleFiles),
    };

    if (spreadsheetId !== undefined) updateData.spreadsheetId = spreadsheetId;
    if (spreadsheetUrl !== undefined) updateData.spreadsheetUrl = spreadsheetUrl;

    const [updated] = await db.update(task)
      .set(updateData)
      .where(eq(task.id, id))
      .returning();

    return NextResponse.json({ success: true, task: updated });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id);

    // Fetch submissions to delete files from R2
    const submissions = await db.query.taskSubmission.findMany({
      where: eq(taskSubmission.taskId, id),
    });

    try {
      const { deleteFromR2 } = await import("@/lib/r2");
      for (const sub of submissions) {
        if (sub.fileUrl) {
          await deleteFromR2(sub.fileUrl);
        }
      }
    } catch (r2Err) {
      console.warn("Failed to delete task submission files from R2:", r2Err);
    }

    // Delete submissions first (FK constraint)
    await db.delete(taskSubmission).where(eq(taskSubmission.taskId, id));
    await db.delete(task).where(eq(task.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
