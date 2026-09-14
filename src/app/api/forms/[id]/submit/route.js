import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { formTemplate, formSubmission, task, taskSubmission } from '@/db/schema';
import { and, eq } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { appendFormResponseToSheet, appendOrUpdateTaskSubmissionToSheet } from '@/lib/googleSheets';

export async function POST(req, { params }) {
  try {
    const { id } = await params;
    let form = await db.query.formTemplate.findFirst({
      where: eq(formTemplate.uuid, String(id)),
    });

    if (!form) {
      const numId = parseInt(id, 10);
      if (!isNaN(numId)) {
        form = await db.query.formTemplate.findFirst({
          where: eq(formTemplate.id, numId),
        });
      }
    }

    if (!form) {
      return NextResponse.json({ error: 'Formulir tidak ditemukan' }, { status: 404 });
    }

    const formId = form.id;

    if (!form.isPublished) {
      return NextResponse.json({
        error: 'Formulir ini saat ini sedang tidak menerima tanggapan (Draft/Tutup).',
      }, { status: 403 });
    }

    // Cek session jika responden sedang login (hanya jalankan jika cookie auth ada)
    let memberId = null;
    let autoName = '';
    let autoEmail = '';
    const hasSessionCookie = req.cookies.get('next-auth.session-token') || req.cookies.get('__Secure-next-auth.session-token');
    if (hasSessionCookie) {
      try {
        const session = await getServerSession(authOptions);
        if (session?.user?.id) {
          memberId = parseInt(session.user.id, 10);
          autoName = session.user.name || '';
          autoEmail = session.user.email || '';
        }
      } catch (e) {
        // Abaikan jika token kedaluwarsa / invalid
      }
    }

    const body = await req.json();
    const {
      responderName = autoName || '',
      responderEmail = autoEmail || '',
      answers = [],
    } = body;

    // Validasi pertanyaan wajib (Server-Side Validation)
    if (Array.isArray(form.questions)) {
      for (const q of form.questions) {
        if (q && q.type !== 'page_break' && Boolean(q.required)) {
          const submittedAnswer = (answers || []).find((a) => String(a.questionId) === String(q.id));
          const val = submittedAnswer?.value;
          const isEmpty =
            val === undefined ||
            val === null ||
            (typeof val === 'string' && val.trim() === '') ||
            (Array.isArray(val) && val.length === 0);

          if (isEmpty) {
            return NextResponse.json(
              {
                error:
                  q.type === 'file'
                    ? `Berkas untuk "${q.question || 'soal'}" wajib diunggah.`
                    : `Pertanyaan "${q.question || 'soal'}" wajib diisi.`,
              },
              { status: 400 }
            );
          }
        }
      }
    }

    // 1. Simpan ke database PostgreSQL (Form Response)
    const [inserted] = await db.insert(formSubmission).values({
      formTemplateId: formId,
      memberId: memberId || null,
      responderName: responderName ? String(responderName).trim() : null,
      responderEmail: responderEmail ? String(responderEmail).trim() : null,
      answers: answers || [],
      submittedAt: new Date(),
    }).returning();

    // 2. Realtime Append ke Tab 2 ("Respon Form Detail") Google Spreadsheet (jika terhubung)
    if (form.spreadsheetId) {
      appendFormResponseToSheet(
        form.spreadsheetId,
        {
          timestamp: new Date(),
          answers,
        },
        form.questions
      ).catch((sheetErr) => {
        console.error('[FormSubmit] Background Tab 2 Sheet sync error:', sheetErr);
      });
    }

    // 3. Jika responden adalah Member login & Formulir terhubung dengan Task / Quest
    if (memberId) {
      try {
        const linkedTasks = await db.query.task.findMany({
          where: eq(task.formTemplateId, formId),
        });

        for (const lTask of linkedTasks) {
          // Cari apakah sudah pernah submit tugas ini
          const existingTaskSub = await db.query.taskSubmission.findFirst({
            where: and(
              eq(taskSubmission.taskId, lTask.id),
              eq(taskSubmission.memberId, memberId)
            ),
          });

          let taskSubRecord = existingTaskSub;
          const formResponseUrl = `/f/${form.uuid || form.id}`;

          if (!existingTaskSub) {
            const [createdSub] = await db.insert(taskSubmission).values({
              taskId: lTask.id,
              memberId: memberId,
              fileUrl: formResponseUrl,
              status: "PENDING",
              score: null,
              xpEarned: null,
              submittedAt: new Date(),
            }).returning();
            taskSubRecord = createdSub;
          } else {
            const [updatedSub] = await db.update(taskSubmission)
              .set({
                fileUrl: formResponseUrl,
                status: "PENDING",
                submittedAt: new Date(),
              })
              .where(eq(taskSubmission.id, existingTaskSub.id))
              .returning();
            taskSubRecord = updatedSub;
          }

          // Sinkronkan ke Tab 1 ("Submisi Tugas") Google Spreadsheet jika Task memiliki spreadsheet
          const targetSpreadsheetId = lTask.spreadsheetId || form.spreadsheetId;
          if (targetSpreadsheetId && taskSubRecord) {
            appendOrUpdateTaskSubmissionToSheet(targetSpreadsheetId, {
              id: taskSubRecord.id,
              memberId: memberId,
              memberName: responderName || autoName,
              memberEmail: responderEmail || autoEmail,
              status: "PENDING",
              fileUrl: formResponseUrl,
              feedback: taskSubRecord.feedback || "",
              submittedAt: taskSubRecord.submittedAt || new Date(),
              taskDeadline: lTask.deadline,
            }).catch((taskSheetErr) => {
              console.error('[FormSubmit] Background Tab 1 Sheet sync error:', taskSheetErr);
            });
          }
        }
      } catch (taskLinkErr) {
        console.warn('[FormSubmit] Task submission link warning:', taskLinkErr.message);
      }
    }

    return NextResponse.json({
      success: true,
      submissionId: inserted.id,
      message: form.successMessage || 'Tanggapan Anda telah berhasil direkam.',
    }, { status: 201 });
  } catch (error) {
    console.error('Error submitting form:', error);
    return NextResponse.json({ error: error.message || 'Gagal mengirim tanggapan formulir' }, { status: 500 });
  }
}
