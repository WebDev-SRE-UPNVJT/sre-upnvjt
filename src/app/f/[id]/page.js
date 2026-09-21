import React from 'react';
import { db } from '@/lib/db';
import { formTemplate } from '@/db/schema';
import { eq, or } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import PublicFormClient from './PublicFormClient';
import { notFound, redirect } from 'next/navigation';

async function getFormByIdOrUuid(idOrUuid) {
  if (!idOrUuid) return null;

  // 1. Coba cari berdasarkan UUID terlebih dahulu
  let form = await db.query.formTemplate.findFirst({
    where: eq(formTemplate.uuid, String(idOrUuid)),
  });

  // 2. Jika tidak ditemukan dan parameternya berupa angka (legacy integer ID)
  if (!form) {
    const numId = parseInt(idOrUuid, 10);
    if (!isNaN(numId)) {
      form = await db.query.formTemplate.findFirst({
        where: eq(formTemplate.id, numId),
      });
    }
  }

  return form;
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const form = await getFormByIdOrUuid(id);

  if (!form) return { title: 'Formulir Tidak Ditemukan | SRE UPNVJT' };

  return {
    title: `${form.title} | Formulir SRE UPNVJT`,
    description: form.description || 'Isi formulir resmi dari SRE UPN Veteran Jawa Timur.',
    openGraph: {
      title: `${form.title} | Formulir SRE UPNVJT`,
      description: form.description || 'Isi formulir resmi dari SRE UPN Veteran Jawa Timur.',
    },
  };
}

export default async function PublicFormPage({ params }) {
  const { id } = await params;
  const form = await getFormByIdOrUuid(id);

  if (!form) {
    notFound();
  }

  let sessionUser = null;
  let existingSubmission = null;

  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.id) {
      const uId = parseInt(session.user.id, 10);
      let dbUser = null;
      try {
        const { user } = await import('@/db/schema');
        dbUser = await db.query.user.findFirst({
          where: eq(user.id, uId),
          columns: { id: true, name: true, email: true, npm: true, profilePictureUrl: true },
        });
      } catch (e) {
        // Fallback to session user
      }

      sessionUser = {
        id: dbUser?.id || session.user.id,
        name: dbUser?.name || session.user.name,
        email: dbUser?.email || session.user.email,
        npm: dbUser?.npm || session.user.npm || null,
        image: dbUser?.profilePictureUrl || session.user.image || null,
      };

      // Cek apakah user sudah pernah mengisi formulir ini jika limitOneResponse aktif
      if (form.limitOneResponse) {
        const { formSubmission } = await import('@/db/schema');
        const { and } = await import('drizzle-orm');

        let sub = await db.query.formSubmission.findFirst({
          where: and(
            eq(formSubmission.formTemplateId, form.id),
            eq(formSubmission.memberId, sessionUser.id)
          ),
          orderBy: (sub, { desc }) => [desc(sub.submittedAt)],
        });

        if (!sub && sessionUser.email) {
          sub = await db.query.formSubmission.findFirst({
            where: and(
              eq(formSubmission.formTemplateId, form.id),
              eq(formSubmission.responderEmail, sessionUser.email)
            ),
            orderBy: (sub, { desc }) => [desc(sub.submittedAt)],
          });
        }

        if (sub) {
          existingSubmission = {
            id: sub.id,
            submittedAt: sub.submittedAt,
            score: sub.score,
            answers: sub.answers,
          };
        }
      }
    }
  } catch (e) {
    // Abaikan
  }

  // Jika formulir disetel merekam data akun atau dibatasi 1 respon per akun, wajibkan login
  if ((form.collectUserData || form.limitOneResponse) && !sessionUser) {
    const callbackUrl = `/f/${form.uuid || form.id || id}`;
    redirect(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }

  return <PublicFormClient form={form} user={sessionUser} existingSubmission={existingSubmission} />;
}
