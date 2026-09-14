import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { formTemplate, formSubmission, task, taskSubmission } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { createTaskSpreadsheet, syncAllTaskSubmissionsToSheet, appendFormResponseToSheet } from '@/lib/googleSheets';

export async function POST(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const taskId = parseInt(id, 10);

    const tk = await db.query.task.findFirst({
      where: eq(task.id, taskId),
    });

    if (!tk) {
      return NextResponse.json({ error: 'Tugas tidak ditemukan' }, { status: 404 });
    }

    // Ambil pertanyaan form jika task terhubung dengan Form Builder
    let formQuestions = [];
    if (tk.formTemplateId) {
      const formRecord = await db.query.formTemplate.findFirst({
        where: eq(formTemplate.id, tk.formTemplateId),
      });
      if (formRecord && Array.isArray(formRecord.questions)) {
        formQuestions = formRecord.questions;
      }
    }

    // 1. Buat Google Spreadsheet Multi-Tab terpadu (Tab 1: Submisi Tugas, Tab 2: Respon Form Detail)
    const sheetRes = await createTaskSpreadsheet(tk.title, formQuestions);

    // 2. Ambil seluruh submisi tugas saat ini jika ada untuk auto-cloning awal ke Tab 1
    const submissions = await db.query.taskSubmission.findMany({
      where: eq(taskSubmission.taskId, taskId),
      with: {
        member: {
          with: {
            department: true,
            division: true,
          }
        },
        task: true,
      }
    });

    if (submissions.length > 0) {
      await syncAllTaskSubmissionsToSheet(sheetRes.spreadsheetId, submissions);
    }

    // 3. Jika ada respon form terdahulu, clone juga ke Tab 2 ("Respon Form Detail")
    if (tk.formTemplateId && formQuestions.length > 0) {
      try {
        const existingFormSubs = await db.query.formSubmission.findMany({
          where: eq(formSubmission.formTemplateId, tk.formTemplateId),
          orderBy: (fs, { asc }) => [asc(fs.submittedAt)],
        });

        for (const fSub of existingFormSubs) {
          await appendFormResponseToSheet(
            sheetRes.spreadsheetId,
            {
              timestamp: fSub.submittedAt,
              answers: fSub.answers,
            },
            formQuestions
          );
        }

        // Sinkronkan spreadsheetId ke formTemplate agar form builder & task berbagi 1 spreadsheet yang sama
        await db.update(formTemplate)
          .set({
            spreadsheetId: sheetRes.spreadsheetId,
            spreadsheetUrl: sheetRes.spreadsheetUrl,
          })
          .where(eq(formTemplate.id, tk.formTemplateId));
      } catch (cloneFormErr) {
        console.warn('[CreateSheet] Warning syncing past form responses to Tab 2:', cloneFormErr.message);
      }
    }

    // 4. Simpan ke database Task
    const [updatedTask] = await db.update(task)
      .set({
        spreadsheetId: sheetRes.spreadsheetId,
        spreadsheetUrl: sheetRes.spreadsheetUrl,
      })
      .where(eq(task.id, taskId))
      .returning();

    return NextResponse.json({
      success: true,
      spreadsheetId: sheetRes.spreadsheetId,
      spreadsheetUrl: sheetRes.spreadsheetUrl,
      task: updatedTask,
      syncedCount: submissions.length,
    });
  } catch (error) {
    console.error('Error connecting Google Sheet to task:', error);
    return NextResponse.json({ error: error.message || 'Gagal membuat Google Spreadsheet untuk tugas' }, { status: 500 });
  }
}
