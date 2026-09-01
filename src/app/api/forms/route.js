import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { formTemplate, formSubmission } from '@/db/schema';
import { eq, desc, count } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { createFormSpreadsheet } from '@/lib/googleSheets';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const forms = await db.query.formTemplate.findMany({
      orderBy: [desc(formTemplate.createdAt)],
      with: {
        submissions: {
          columns: { id: true },
        },
      },
    });

    const formattedForms = forms.map((f) => ({
      ...f,
      spreadsheetUrl:
        f.spreadsheetUrl ||
        (f.spreadsheetId
          ? `https://docs.google.com/spreadsheets/d/${f.spreadsheetId}/edit`
          : null),
      submissionCount: f.submissions?.length || 0,
    }));

    return NextResponse.json(formattedForms, {
      headers: {
        'Cache-Control': 'no-store, max-age=0, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Error fetching forms:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = parseInt(session.user.id, 10);

    const body = await req.json();
    const {
      title,
      description,
      questions = [],
      isPublished = true,
      createSpreadsheet = false,
      successMessage = 'Tanggapan Anda telah berhasil direkam.',
    } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Judul form wajib diisi' }, { status: 400 });
    }

    let spreadsheetId = body.spreadsheetId || null;
    let spreadsheetUrl = body.spreadsheetUrl || null;

    // Otomatis buat Google Spreadsheet jika opsi diaktifkan
    if (createSpreadsheet && !spreadsheetId) {
      try {
        const sheetRes = await createFormSpreadsheet(title, questions);
        spreadsheetId = sheetRes.spreadsheetId;
        spreadsheetUrl = sheetRes.spreadsheetUrl;
      } catch (sheetErr) {
        console.error('Failed to create Google Spreadsheet for form:', sheetErr);
        // Lanjutkan penyimpanan form dengan log peringatan
      }
    }

    const [newForm] = await db.insert(formTemplate).values({
      title: title.trim(),
      description: description?.trim() || null,
      questions: questions || [],
      isPublished: Boolean(isPublished),
      spreadsheetId,
      spreadsheetUrl,
      successMessage: successMessage || 'Tanggapan Anda telah berhasil direkam.',
      createdById: userId,
    }).returning();

    return NextResponse.json(newForm, { status: 201 });
  } catch (error) {
    console.error('Error creating form:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
