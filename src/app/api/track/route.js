import { NextResponse } from 'next/server';
import { UAParser } from 'ua-parser-js';
import { db } from '@/lib/db';
import { pageView } from '@/db/schema';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// Pola bot yang umum — tidak perlu terlalu ketat, cukup untuk filter traffic non-manusia
const BOT_PATTERN = /googlebot|bingbot|slurp|duckduckbot|facebookexternalhit|twitterbot|linkedinbot|whatsapp|applebot|yandex|baidu|curl|wget|python-requests|axios|node-fetch|go-http/i;

export async function POST(request) {
  try {
    const ua = request.headers.get('user-agent') || '';

    // Abaikan bot
    if (BOT_PATTERN.test(ua)) {
      return NextResponse.json({}, { status: 200 });
    }

    const body = await request.json().catch(() => ({}));
    const path = body.path || '/';

    // Parse User-Agent
    const parser = new UAParser(ua);
    const result = parser.getResult();

    const rawDevice = result.device.type; // 'mobile' | 'tablet' | undefined (desktop)
    const deviceType = rawDevice ?? 'desktop';
    const browser = result.browser.name ?? 'unknown';

    // Baca atau buat visitorId dari cookie
    const cookieStore = request.cookies;
    let visitorId = cookieStore.get('sre_vid')?.value;
    let isNewVisitor = false;

    if (!visitorId) {
      visitorId = crypto.randomUUID();
      isNewVisitor = true;
    }

    // Ambil session user kalau ada
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id ? parseInt(session.user.id, 10) : null;

    const referrer = request.headers.get('referer') ?? null;

    // Insert non-blocking — tidak perlu await, tapi tangkap error kalau ada
    db.insert(pageView).values({
      path,
      visitorId,
      userId,
      deviceType,
      browser,
      referrer,
    }).catch(err => {
      console.error('[track] insert error:', err.message);
    });

    // Set cookie kalau visitor baru
    const response = NextResponse.json({}, { status: 200 });
    if (isNewVisitor) {
      response.cookies.set('sre_vid', visitorId, {
        maxAge: 60 * 60 * 24 * 365, // 1 tahun
        path: '/',
        httpOnly: false,
        sameSite: 'lax',
      });
    }

    return response;
  } catch (err) {
    // Jangan ekspos error detail ke client
    console.error('[track] handler error:', err.message);
    return NextResponse.json({}, { status: 200 });
  }
}
