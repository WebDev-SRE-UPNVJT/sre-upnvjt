import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { formTemplate, formSubmission } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { createFormSpreadsheet } from '@/lib/googleSheets';

export const dynamic = 'force-dynamic';

export async function GET(req, { params }) {
  try {
    const resolvedParams = await params;
    const formId = parseInt(resolvedParams?.id, 10);
    
    if (isNaN(formId)) {
      return NextResponse.json({ error: 'Invalid form ID' }, { status: 400 });
    }

    const form = await db.query.formTemplate.findFirst({
      where: eq(formTemplate.id, formId),
      with: {
        createdBy: {
          columns: { id: true, name: true, email: true },
        },
        submissions: true,
      },
    });

    if (!form) {
      return NextResponse.json({ error: 'Form tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({
      ...form,
      spreadsheetUrl:
        form.spreadsheetUrl ||
        (form.spreadsheetId
          ? `https://docs.google.com/spreadsheets/d/${form.spreadsheetId}/edit`
          : null),
      submissionCount: form.submissions?.length || 0,
    }, {
      headers: {
        'Cache-Control': 'no-store, max-age=0, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Error fetching form details:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const formId = parseInt(resolvedParams?.id, 10);

    if (isNaN(formId)) {
      return NextResponse.json({ error: 'Invalid form ID' }, { status: 400 });
    }

    const body = await req.json();
    const {
      title,
      description,
      questions,
      isPublished,
      createSpreadsheet,
      successMessage,
    } = body;

    let spreadsheetId = body.spreadsheetId;
    let spreadsheetUrl = body.spreadsheetUrl;

    // Jika diminta buat Google Spreadsheet dan belum ada
    if (createSpreadsheet && !spreadsheetId) {
      try {
        const sheetRes = await createFormSpreadsheet(title, questions);
        spreadsheetId = sheetRes.spreadsheetId;
        spreadsheetUrl = sheetRes.spreadsheetUrl;
      } catch (sheetErr) {
        console.error('Failed to create Google Spreadsheet for form:', sheetErr);
      }
    }

    const updateData = {
      updatedAt: new Date(),
    };

    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (questions !== undefined) updateData.questions = questions;
    if (isPublished !== undefined) updateData.isPublished = Boolean(isPublished);
    if (spreadsheetId !== undefined) updateData.spreadsheetId = spreadsheetId;
    if (spreadsheetUrl !== undefined) updateData.spreadsheetUrl = spreadsheetUrl;
    if (successMessage !== undefined) updateData.successMessage = successMessage;

    const [updatedForm] = await db.update(formTemplate)
      .set(updateData)
      .where(eq(formTemplate.id, formId))
      .returning();

    if (!updatedForm) {
      return NextResponse.json({ error: 'Form tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json(updatedForm);
  } catch (error) {
    console.error('Error updating form:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const formId = parseInt(id, 10);

    const [deletedForm] = await db.delete(formTemplate)
      .where(eq(formTemplate.id, formId))
      .returning();

    if (!deletedForm) {
      return NextResponse.json({ error: 'Form tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ success: true, deletedForm });
  } catch (error) {
    console.error('Error deleting form:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
