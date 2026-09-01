import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { formTemplate } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { createFormSpreadsheet } from '@/lib/googleSheets';

export async function POST(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const formId = parseInt(id, 10);

    const form = await db.query.formTemplate.findFirst({
      where: eq(formTemplate.id, formId),
    });

    if (!form) {
      return NextResponse.json({ error: 'Form tidak ditemukan' }, { status: 404 });
    }

    // Buat Google Spreadsheet baru
    const sheetRes = await createFormSpreadsheet(form.title, form.questions);

    const [updatedForm] = await db.update(formTemplate)
      .set({
        spreadsheetId: sheetRes.spreadsheetId,
        spreadsheetUrl: sheetRes.spreadsheetUrl,
        updatedAt: new Date(),
      })
      .where(eq(formTemplate.id, formId))
      .returning();

    return NextResponse.json({
      success: true,
      spreadsheetId: sheetRes.spreadsheetId,
      spreadsheetUrl: sheetRes.spreadsheetUrl,
      form: updatedForm,
    });
  } catch (error) {
    console.error('Error connecting Google Sheet to form:', error);
    return NextResponse.json({ error: error.message || 'Gagal membuat Google Spreadsheet' }, { status: 500 });
  }
}
