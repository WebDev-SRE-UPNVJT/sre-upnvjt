import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { shortlink, user, department } from '@/db/schema';
import { eq, desc, sql } from 'drizzle-orm';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const links = await db.select({
      id: shortlink.id,
      slug: shortlink.slug,
      originalUrl: shortlink.originalUrl,
      description: shortlink.description,
      clicks: shortlink.clicks,
      isActive: shortlink.isActive,
      createdAt: shortlink.createdAt,
      creatorName: user.name,
      creatorEmail: user.email,
      departmentName: department.name,
    })
    .from(shortlink)
    .leftJoin(user, eq(shortlink.createdById, user.id))
    .leftJoin(department, eq(user.departmentId, department.id))
    .orderBy(desc(shortlink.createdAt));

    const formattedLinks = (links || []).map(link => ({
      ...link,
      clicks: Number(link.clicks) || 0,
      isActive: link.isActive !== undefined && link.isActive !== null ? Boolean(link.isActive) : true,
      createdAt: link.createdAt ? (link.createdAt instanceof Date ? link.createdAt.toISOString() : new Date(link.createdAt).toISOString()) : null,
    }));

    return NextResponse.json(formattedLinks);
  } catch (error) {
    console.error('Error fetching shortlinks:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id ? parseInt(session.user.id, 10) : null;
    if (!userId || isNaN(userId)) {
      return NextResponse.json({ error: 'Sesi login tidak valid. Silakan login ulang.' }, { status: 401 });
    }

    const { slug, originalUrl, description, isActive } = await req.json();

    if (!slug || !originalUrl) {
      return NextResponse.json({ error: 'Slug dan URL Tujuan wajib diisi' }, { status: 400 });
    }

    const cleanSlug = slug.trim().toLowerCase();

    // Check if slug exists (case-insensitive)
    const existing = await db
      .select({ id: shortlink.id })
      .from(shortlink)
      .where(sql`LOWER(${shortlink.slug}) = LOWER(${cleanSlug})`)
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json({ error: 'Slug ini sudah dipakai! Silakan pilih slug yang lain.' }, { status: 409 });
    }

    const newLink = await db.insert(shortlink).values({
      slug: cleanSlug,
      originalUrl: originalUrl.trim(),
      description: description ? description.trim() : null,
      isActive: isActive !== undefined ? Boolean(isActive) : true,
      createdById: userId,
    }).returning();

    const created = {
      ...newLink[0],
      clicks: 0,
      creatorName: session.user.name || 'Staff',
      createdAt: newLink[0].createdAt ? (newLink[0].createdAt instanceof Date ? newLink[0].createdAt.toISOString() : new Date(newLink[0].createdAt).toISOString()) : new Date().toISOString(),
    };

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('Error creating shortlink:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
