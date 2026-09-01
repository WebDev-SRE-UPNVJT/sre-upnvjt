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
    const formId = parseInt(id, 10);

    if (isNaN(formId)) {
      return NextResponse.json({ error: 'Invalid form ID' }, { status: 400 });
    }

    const form = await db.query.formTemplate.findFirst({
      where: eq(formTemplate.id, formId),
    });

    if (!form) {
      return NextResponse.json({ error: 'Formulir tidak ditemukan' }, { status: 404 });
    }

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
