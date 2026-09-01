import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { formTemplate } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { createFormDriveFolder, uploadFormFileToDrive } from '@/lib/googleSheets';
import { validateFileRules } from '@/lib/fileValidation';

export const dynamic = 'force-dynamic';

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
      return NextResponse.json(
        { error: 'Formulir ini saat ini tidak menerima unggahan (Draft/Tutup).' },
        { status: 403 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file');
    const questionId = formData.get('questionId');

    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'File tidak ditemukan atau tidak valid' }, { status: 400 });
    }

    // Validasi aturan soal (format berkas & batas ukuran)
    if (questionId && Array.isArray(form.questions)) {
      const targetQuestion = form.questions.find((q) => String(q?.id) === String(questionId));
      if (targetQuestion) {
        const validation = validateFileRules(
          file,
          targetQuestion.allowedTypes,
          targetQuestion.maxSizeMb
        );
        if (!validation.valid) {
          return NextResponse.json({ error: validation.error }, { status: 400 });
        }
      }
    }

    // Pastikan folder Google Drive untuk form ini sudah ada
    let folderId = form.driveFolderId;
    let folderUrl = form.driveFolderUrl;

    if (!folderId) {
      try {
        const createdFolder = await createFormDriveFolder(form.title);
        folderId = createdFolder.folderId;
        folderUrl = createdFolder.folderUrl;

        await db
          .update(formTemplate)
          .set({
            driveFolderId: folderId,
            driveFolderUrl: folderUrl,
            updatedAt: new Date(),
          })
          .where(eq(formTemplate.id, formId));
      } catch (folderErr) {
        console.error('Failed to create Drive folder on demand:', folderErr);
      }
    }

    const uploaded = await uploadFormFileToDrive({
      file,
      folderId,
    });

    return NextResponse.json({
      success: true,
      file: {
        id: uploaded.fileId,
        name: file.name,
        url: uploaded.webViewLink,
        size: uploaded.fileSize,
      },
    });
  } catch (error) {
    console.error('Error handling form file upload:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal mengunggah file ke Google Drive' },
      { status: 500 }
    );
  }
}
