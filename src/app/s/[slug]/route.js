import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { shortlink } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';

export async function GET(req, { params }) {
  const { slug } = await params;

  try {
    const link = await db.select().from(shortlink).where(eq(shortlink.slug, slug)).limit(1);

    if (link.length === 0) {
      // If not found, redirect to a 404 page or home
      return NextResponse.redirect(new URL('/404', req.url));
    }

    const { originalUrl, id, isActive } = link[0];

    // Check if shortlink has been suspended by Admin
    if (isActive === false) {
      const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tautan Ditangguhkan | SRE UPNVJT</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    body { background-color: #07130e; color: #ffffff; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 20px; }
    .card { background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 24px; max-width: 500px; width: 100%; padding: 40px 32px; text-align: center; backdrop-filter: blur(20px); box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); }
    .icon-box { width: 64px; height: 64px; background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 24px; color: #ef4444; }
    h1 { font-size: 24px; font-weight: 800; margin-bottom: 12px; color: #ffffff; letter-spacing: -0.5px; }
    p { font-size: 14px; color: rgba(255, 255, 255, 0.7); line-height: 1.6; margin-bottom: 28px; }
    .badge { display: inline-block; background: rgba(239, 68, 68, 0.2); color: #f87171; font-weight: 700; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; padding: 4px 12px; border-radius: 9999px; margin-bottom: 16px; border: 1px solid rgba(239, 68, 68, 0.3); }
    .btn { display: inline-block; background: #0bb882; color: #ffffff; font-weight: 700; font-size: 13px; text-decoration: none; padding: 12px 28px; border-radius: 12px; transition: all 0.2s; text-transform: uppercase; letter-spacing: 0.5px; }
    .btn:hover { background: #099c6d; transform: translateY(-2px); box-shadow: 0 10px 20px -5px rgba(11, 184, 130, 0.4); }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon-box">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
      </svg>
    </div>
    <div><span class="badge">Shortlink Suspended</span></div>
    <h1>Tautan Ditangguhkan</h1>
    <p>Tautan <strong>/s/${slug}</strong> telah dinonaktifkan atau ditangguhkan sementara oleh administrator SRE UPN Veteran Jawa Timur karena alasan kebijakan.</p>
    <a href="https://sreupnjatim.com" class="btn">Kembali ke Beranda</a>
  </div>
</body>
</html>`;
      return new NextResponse(html, {
        status: 403,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }

    // Increment clicks
    await db.update(shortlink)
      .set({ clicks: sql`COALESCE(${shortlink.clicks}, 0) + 1` })
      .where(eq(shortlink.id, id));

    // Redirect to original URL
    return NextResponse.redirect(originalUrl);
  } catch (error) {
    console.error('Error redirecting shortlink:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
