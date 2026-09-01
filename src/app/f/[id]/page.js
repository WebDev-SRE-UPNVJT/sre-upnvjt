import React from 'react';
import { db } from '@/lib/db';
import { formTemplate } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import PublicFormClient from './PublicFormClient';
import { notFound } from 'next/navigation';

export async function generateMetadata({ params }) {
  const { id } = await params;
  const formId = parseInt(id, 10);
  if (isNaN(formId)) return { title: 'Formulir | SRE UPNVJT' };

  const form = await db.query.formTemplate.findFirst({
    where: eq(formTemplate.id, formId),
  });

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
  const formId = parseInt(id, 10);

  if (isNaN(formId)) {
    notFound();
  }

  const form = await db.query.formTemplate.findFirst({
    where: eq(formTemplate.id, formId),
  });

  if (!form) {
    notFound();
  }

  let sessionUser = null;
  try {
    const session = await getServerSession(authOptions);
    if (session?.user) {
      sessionUser = {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
      };
    }
  } catch (e) {
    // Abaikan
  }

  return <PublicFormClient form={form} user={sessionUser} />;
}
