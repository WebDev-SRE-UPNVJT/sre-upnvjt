import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { shortlink } from '@/db/schema';
import { sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const slug = req.nextUrl?.searchParams?.get('slug') || new URL(req.url, 'http://localhost').searchParams.get('slug');

    if (!slug) {
      return NextResponse.json({ available: false }, { status: 400 });
    }

    const cleanSlug = slug.trim().toLowerCase();

    // Check if slug exists (case-insensitive)
    const existing = await db
      .select({ id: shortlink.id })
      .from(shortlink)
      .where(sql`LOWER(${shortlink.slug}) = LOWER(${cleanSlug})`)
      .limit(1);
    
    return NextResponse.json({ available: existing.length === 0 });
  } catch (error) {
    console.error('Error checking shortlink availability:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
