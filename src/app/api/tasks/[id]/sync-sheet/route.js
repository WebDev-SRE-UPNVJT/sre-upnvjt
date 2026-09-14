import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { task, taskSubmission } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { syncAllTaskSubmissionsToSheet, createTaskSpreadsheet } from '@/lib/googleSheets';

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

    let spreadsheetId = tk.spreadsheetId;
    let spreadsheetUrl = tk.spreadsheetUrl;

    // Jika belum ada spreadsheet, buatkan terlebih dahulu
    if (!spreadsheetId) {
      const sheetRes = await createTaskSpreadsheet(tk.title);
      spreadsheetId = sheetRes.spreadsheetId;
      spreadsheetUrl = sheetRes.spreadsheetUrl;

      await db.update(task)
        .set({
          spreadsheetId,
          spreadsheetUrl,
        })
        .where(eq(task.id, taskId));
    }

    // Ambil seluruh submisi tugas
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

    const success = await syncAllTaskSubmissionsToSheet(spreadsheetId, submissions);

    if (!success) {
      return NextResponse.json({ error: 'Gagal melakukan sinkronisasi ke Google Spreadsheet' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      spreadsheetId,
      spreadsheetUrl,
      syncedCount: submissions.length,
    });
  } catch (error) {
    console.error('Error syncing Google Sheet with task:', error);
    return NextResponse.json({ error: error.message || 'Gagal sinkronisasi Google Spreadsheet' }, { status: 500 });
  }
}
