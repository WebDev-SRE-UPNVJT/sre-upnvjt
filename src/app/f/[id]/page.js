import React from 'react';
import { db } from '@/lib/db';
import { formTemplate } from '@/db/schema';
import { eq, or } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import PublicFormClient from './PublicFormClient';
import { notFound } from 'next/navigation';

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
