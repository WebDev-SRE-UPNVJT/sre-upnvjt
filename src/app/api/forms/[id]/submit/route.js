import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { formTemplate, formSubmission } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { appendFormResponseToSheet } from '@/lib/googleSheets';

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

    // 1. Simpan ke database PostgreSQL
    const [inserted] = await db.insert(formSubmission).values({
      formTemplateId: formId,
      memberId: memberId || null,
      responderName: responderName ? String(responderName).trim() : null,
      responderEmail: responderEmail ? String(responderEmail).trim() : null,
      answers: answers || [],
      submittedAt: new Date(),
    }).returning();

    // 2. Realtime Append ke Google Spreadsheet (jika terhubung)
    if (form.spreadsheetId) {
      // Jalankan sinkronisasi spreadsheet
      appendFormResponseToSheet(
        form.spreadsheetId,
        {
          timestamp: new Date(),
          answers,
        },
        form.questions
      ).catch((sheetErr) => {
        console.error('[FormSubmit] Background Sheet sync error:', sheetErr);
      });
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
