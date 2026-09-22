import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { shortlink } from '@/db/schema';
import { sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(req, { params }) {
  const { slug } = await params;
  const cleanSlug = decodeURIComponent(slug || '').trim().toLowerCase();

  try {
    // Case-insensitive lookup for slug
    const link = await db
      .select()
      .from(shortlink)
      .where(sql`LOWER(${shortlink.slug}) = LOWER(${cleanSlug})`)
      .limit(1);

    const noCacheHeaders = {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0',
    };

    // 1. Not Found State (404)
    if (!link || link.length === 0) {
      const notFoundHtml = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tautan Tidak Ditemukan | SRE UPN Veteran Jawa Timur</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #f8faf9;
      background: radial-gradient(circle at 50% 20%, #ebf8f2 0%, #f7fbf9 60%, #eef6f2 100%);
      color: #131f1c;
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      min-height: 100vh;
      min-height: 100dvh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 24px;
      text-align: center;
    }
    .logo-box { margin-bottom: 20px; }
    .logo-img { height: 38px; width: auto; }
    h1 { font-size: 22px; font-weight: 800; color: #131f1c; margin-bottom: 8px; }
    p { font-size: 13.5px; color: #64748b; max-width: 320px; line-height: 1.5; margin-bottom: 24px; }
    .btn {
      display: inline-block;
      background: #10b981;
      color: #ffffff;
      font-weight: 700;
      font-size: 13px;
      padding: 10px 22px;
      border-radius: 10px;
      text-decoration: none;
      box-shadow: 0 4px 14px rgba(16, 185, 129, 0.3);
      transition: all 0.2s;
    }
    .btn:hover { transform: translateY(-2px); box-shadow: 0 6px 18px rgba(16, 185, 129, 0.4); }
  </style>
</head>
<body>
  <div class="logo-box">
    <img src="/images/logo.png" alt="SRE UPN Veteran Jawa Timur" class="logo-img" onerror="this.src='/images/logo.webp'">
  </div>
  <h1>Tautan Tidak Ditemukan</h1>
  <p>Tautan shortlink <strong>/s/${escapeHtml(cleanSlug)}</strong> tidak ditemukan atau sudah dinonaktifkan.</p>
  <a href="https://sreupnjatim.com" class="btn">Kembali ke Beranda</a>
</body>
</html>`;
      return new NextResponse(notFoundHtml, {
        status: 404,
        headers: noCacheHeaders,
      });
    }

    const { originalUrl, id, isActive } = link[0];

    // 2. Suspended State (403)
    if (isActive === false) {
      const suspendedHtml = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tautan Ditangguhkan | SRE UPN Veteran Jawa Timur</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #f8faf9;
      background: radial-gradient(circle at 50% 20%, #ebf8f2 0%, #f7fbf9 60%, #eef6f2 100%);
      color: #131f1c;
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      min-height: 100vh;
      min-height: 100dvh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 24px;
      text-align: center;
    }
    .logo-box { margin-bottom: 20px; }
    .logo-img { height: 38px; width: auto; }
    h1 { font-size: 22px; font-weight: 800; color: #131f1c; margin-bottom: 8px; }
    p { font-size: 13.5px; color: #64748b; max-width: 320px; line-height: 1.5; margin-bottom: 24px; }
    .btn {
      display: inline-block;
      background: #64748b;
      color: #ffffff;
      font-weight: 700;
      font-size: 13px;
      padding: 10px 22px;
      border-radius: 10px;
      text-decoration: none;
      box-shadow: 0 4px 14px rgba(0,0,0,0.1);
    }
  </style>
</head>
<body>
  <div class="logo-box">
    <img src="/images/logo.png" alt="SRE UPN Veteran Jawa Timur" class="logo-img" onerror="this.src='/images/logo.webp'">
  </div>
  <h1>Tautan Ditangguhkan</h1>
  <p>Tautan <strong>/s/${escapeHtml(cleanSlug)}</strong> telah dinonaktifkan sementara oleh administrator SRE UPN Veteran Jawa Timur.</p>
  <a href="https://sreupnjatim.com" class="btn">Kembali ke Beranda</a>
</body>
</html>`;
      return new NextResponse(suspendedHtml, {
        status: 403,
        headers: noCacheHeaders,
      });
    }

    // Safely increment clicks in background
    db.update(shortlink)
      .set({ clicks: sql`COALESCE(${shortlink.clicks}, 0) + 1` })
      .where(sql`${shortlink.id} = ${id}`)
      .catch((err) => console.error('Error updating clicks count:', err));

    // Normalize destination URL
    let targetUrl = (originalUrl || '').trim();
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      if (targetUrl.startsWith('/')) {
        targetUrl = `https://sreupnjatim.com${targetUrl}`;
      } else {
        targetUrl = `https://${targetUrl}`;
      }
    }

    let targetHost = '';
    try {
      targetHost = new URL(targetUrl).hostname;
    } catch (e) {
      targetHost = targetUrl;
    }

    // 3. Render Light Theme Confirmation Page with Landing Page Tone
    const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
  <meta http-equiv="Pragma" content="no-cache">
  <meta http-equiv="Expires" content="0">
  <title>Confirm your destination | SRE UPN Veteran Jawa Timur</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800;900&family=JetBrains+Mono:wght@600;700&display=swap" rel="stylesheet">
  <link rel="icon" type="image/png" href="/favicon.png">
  <style>
    :root {
      --primary: #10b981;
      --primary-dark: #059669;
      --primary-light: #ecfdf5;
      --ink: #131f1c;
      --ink-muted: #52665e;
      --canvas: #f8fbf9;
      --accent-yellow: #f59e0b;
      --accent-yellow-light: #fef3c7;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      background-color: var(--canvas);
      background-image: 
        radial-gradient(at 15% 15%, rgba(16, 185, 129, 0.08) 0px, transparent 50%),
        radial-gradient(at 85% 85%, rgba(20, 184, 166, 0.08) 0px, transparent 50%),
        radial-gradient(at 50% 30%, rgba(245, 158, 11, 0.04) 0px, transparent 60%);
      color: var(--ink);
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      min-height: 100vh;
      min-height: 100dvh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 20px 16px;
      position: relative;
      overflow: hidden;
      text-align: center;
      user-select: none;
    }

    /* Subtle Geometric Energy Grid */
    .bg-grid-pattern {
      position: absolute;
      inset: 0;
      background-image: 
        linear-gradient(rgba(19, 31, 28, 0.025) 1px, transparent 1px),
        linear-gradient(90deg, rgba(19, 31, 28, 0.025) 1px, transparent 1px);
      background-size: 32px 32px;
      pointer-events: none;
      z-index: 1;
    }

    /* Unique SRE Modern Floating Elements (Leaves, Sun Sparks, Energy Orbs) */
    .floating-accent {
      position: absolute;
      pointer-events: none;
      z-index: 2;
    }

    /* Top Left: Clean modern energy pulse */
    .accent-sparkle-1 {
      top: 36px;
      left: 28px;
      width: 22px;
      height: 22px;
      color: var(--primary);
      opacity: 0.85;
      animation: floatSlow 4s ease-in-out infinite alternate;
    }

    /* Top Right: Gentle gold spark */
    .accent-sparkle-2 {
      top: 48px;
      right: 32px;
      width: 26px;
      height: 26px;
      color: var(--accent-yellow);
      opacity: 0.9;
      animation: floatSlow 3.5s ease-in-out -1.5s infinite alternate;
    }

    /* Middle Floating Leaf / Energy Ring */
    .accent-ring {
      top: 38%;
      left: 14px;
      width: 38px;
      height: 38px;
      border: 1.5px dashed rgba(16, 185, 129, 0.35);
      border-radius: 50%;
      animation: spinSlow 24s linear infinite;
    }

    .accent-ring-right {
      top: 60%;
      right: 18px;
      width: 28px;
      height: 28px;
      border: 1.5px solid rgba(245, 158, 11, 0.25);
      border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%;
      animation: spinSlow 18s linear infinite reverse;
    }

    @keyframes floatSlow {
      0% { transform: translateY(0px) rotate(0deg) scale(0.96); }
      100% { transform: translateY(-7px) rotate(8deg) scale(1.06); }
    }

    @keyframes spinSlow {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    /* Main Content Wrapper */
    .container {
      position: relative;
      z-index: 10;
      max-width: 380px;
      width: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      margin: auto 0;
      padding: 10px 0;
    }

    /* SRE Logo with Clean Energy Rays */
    .logo-hero {
      position: relative;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 24px;
    }

    /* Subtle custom SRE energetic spark above logo */
    .logo-glow-halo {
      position: absolute;
      width: 90px;
      height: 45px;
      background: radial-gradient(circle, rgba(16, 185, 129, 0.18) 0%, transparent 70%);
      filter: blur(12px);
      top: -5px;
      left: -5px;
      pointer-events: none;
    }

    .logo-wrapper {
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      z-index: 2;
    }

    /* Filter to render dark logo cleanly on light background */
    .logo-image {
      height: 38px;
      width: auto;
      max-width: 250px;
      object-fit: contain;
      filter: invert(1) hue-rotate(180deg) brightness(0.15);
    }

    /* Headline */
    .headline {
      font-size: 24px;
      font-weight: 900;
      color: var(--ink);
      margin-bottom: 8px;
      letter-spacing: -0.02em;
      line-height: 1.25;
    }

    @media (max-width: 360px) {
      .headline {
        font-size: 21px;
      }
    }

    /* Subtext */
    .message {
      font-size: 13.5px;
      font-weight: 500;
      color: var(--ink-muted);
      line-height: 1.5;
      margin-bottom: 24px;
      max-width: 330px;
      word-break: break-word;
    }

    .target-domain-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 12.5px;
      font-weight: 700;
      color: var(--primary-dark);
      background: var(--primary-light);
      border: 1px solid rgba(16, 185, 129, 0.25);
      padding: 2px 8px;
      border-radius: 6px;
      margin-top: 4px;
    }

    /* Button Group */
    .btn-group {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      width: 100%;
      max-width: 290px;
      margin-bottom: 10px;
    }

    .btn-cancel {
      flex: 1;
      background: #ffffff;
      color: #334155;
      font-family: inherit;
      font-size: 13.5px;
      font-weight: 700;
      padding: 11px 16px;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      cursor: pointer;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .btn-cancel:hover {
      background: #f1f5f9;
      color: #0f172a;
      border-color: #cbd5e1;
      transform: translateY(-1.5px);
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.07);
    }

    .btn-cancel:active {
      transform: translateY(0);
      scale: 0.98;
    }

    .btn-continue {
      flex: 1;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: #ffffff;
      font-family: inherit;
      font-size: 13.5px;
      font-weight: 700;
      padding: 11px 16px;
      border-radius: 12px;
      border: 1px solid rgba(16, 185, 129, 0.3);
      cursor: pointer;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 14px rgba(16, 185, 129, 0.28);
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .btn-continue:hover {
      background: linear-gradient(135deg, #34d399 0%, #10b981 100%);
      color: #022014;
      transform: translateY(-1.5px);
      box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
    }

    .btn-continue:active {
      transform: translateY(0);
      scale: 0.98;
    }

    /* Refined SRE Organic Accent Underline */
    .brush-underline {
      width: 190px;
      height: 10px;
      margin-top: 2px;
      pointer-events: none;
      opacity: 0.85;
    }
  </style>
</head>
<body>

  <!-- Background Grid Pattern -->
  <div class="bg-grid-pattern"></div>

  <!-- Unique SRE Floating Modern Ambient Accents -->
  <svg class="floating-accent accent-sparkle-1" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z"/>
  </svg>
  <svg class="floating-accent accent-sparkle-2" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C12 7.5 16.5 12 22 12C16.5 12 12 16.5 12 22C12 16.5 7.5 12 2 12C7.5 12 12 7.5 12 2Z"/>
  </svg>
  <div class="floating-accent accent-ring"></div>
  <div class="floating-accent accent-ring-right"></div>

  <!-- Main Content Box -->
  <main class="container">
    
    <!-- Logo with Soft Ambient Halo -->
    <div class="logo-hero">
      <div class="logo-glow-halo"></div>
      <div class="logo-wrapper">
        <img 
          src="/images/logo.png" 
          alt="SRE UPN Veteran Jawa Timur" 
          class="logo-image"
          onerror="this.src='/images/logo.webp'"
        >
      </div>
    </div>

    <!-- Main Heading -->
    <h1 class="headline">Confirm your destination</h1>

    <!-- Description Message -->
    <p class="message">
      You are leaving SRE UPN Veteran Jawa Timur for<br>
      <span class="target-domain-badge">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="2" y1="12" x2="22" y2="12"></line>
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
        </svg>
        ${escapeHtml(targetHost)}
      </span>
    </p>

    <!-- Side-by-Side Action Buttons -->
    <div class="btn-group">
      <a href="https://sreupnjatim.com" class="btn-cancel">
        Cancel
      </a>
      <a href="${escapeHtml(targetUrl)}" class="btn-continue">
        Continue
      </a>
    </div>

    <!-- Subtle Minimalist Accent Curve -->
    <svg class="brush-underline" viewBox="0 0 190 10" fill="none">
      <path d="M4 3 C50 1.5, 140 1.5, 186 4" stroke="#10b981" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M16 8 C65 7, 135 7.5, 174 8.5" stroke="#f59e0b" stroke-width="2" stroke-linecap="round"/>
    </svg>

  </main>

</body>
</html>`;

    return new NextResponse(html, {
      status: 200,
      headers: noCacheHeaders,
    });

  } catch (error) {
    console.error('Error in shortlink redirection:', error);
    return NextResponse.redirect(new URL('/', req.url));
  }
}

function escapeHtml(string) {
  if (!string) return '';
  return String(string)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
