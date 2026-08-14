import { withAuth } from "next-auth/middleware";
import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";

// Protected routes requiring NextAuth session
const PROTECTED_ROUTES = [
  "/dashboard",
  "/roles",
  "/users",
  "/departments",
  "/merch",
  "/settings",
  "/content",
  "/forms",
  "/partners",
  "/literature",
  "/ppt",
  "/quiz",
  "/tasks",
  "/leaderboard",
  "/attendance",
  "/events-admin",
  "/member",
  "/officer",
];

export default async function middleware(req, event) {
  const { pathname, searchParams } = req.nextUrl;

  // -------------------------------------------------------------
  // 1. SITE GATE (COMING SOON & MAINTENANCE MODES)
  // -------------------------------------------------------------
  const siteStatus = (process.env.SITE_STATUS || process.env.COMING_SOON_MODE || "off").toLowerCase();
  const siteSecret = process.env.SITE_GATE_SECRET || process.env.COMING_SOON_SECRET || "secret123";

  const isGateActive = siteStatus === "coming-soon" || siteStatus === "maintenance" || siteStatus === "true";

  if (isGateActive) {
    const accessParam = searchParams.get("access");
    const cookieSecret = req.cookies.get("team_access")?.value;
    const hasValidCookie = cookieSecret === siteSecret || cookieSecret === "granted";

    // Scenario A: Secret access link opened (e.g., yoursite.com?access=secret123)
    if (accessParam === siteSecret) {
      const cleanUrl = req.nextUrl.clone();
      cleanUrl.searchParams.delete("access");

      const response = NextResponse.redirect(cleanUrl);
      response.cookies.set("team_access", siteSecret, {
        path: "/",
        maxAge: 60 * 60 * 24 * 30, // 30 days
        httpOnly: true,
        sameSite: "lax",
      });
      return response;
    }

    // Scenario B: Visitor without secret cookie
    if (!hasValidCookie) {
      const isApiRoute = pathname.startsWith("/api");
      const isStatusPage = pathname === "/coming-soon" || pathname === "/maintenance";

      if (!isApiRoute && !isStatusPage) {
        const targetPath = siteStatus === "maintenance" ? "/maintenance" : "/coming-soon";
        // Rewrite the request so the address bar URL does NOT change
        const response = NextResponse.rewrite(new URL(targetPath, req.url));
        response.cookies.set("site_gate_active", "true", { path: "/", httpOnly: false });
        return response;
      }
    }
  }

  // -------------------------------------------------------------
  // 2. NEXTAUTH AUTHENTICATION & ROLE PROTECTION
  // -------------------------------------------------------------
  const isAuthPage = pathname.startsWith("/login");
  const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
    pathname === route || pathname.startsWith(`${route}/`)
  );

  if (isAuthPage || isProtectedRoute) {
    const token = await getToken({ req });
    const isAuth = !!token;
    const isMemberRole = token?.roleName === "MEMBER";
    const isStaffRole = token?.roleName === "STAFF";

    if (isAuthPage) {
      if (isAuth) {
        if (isMemberRole) {
          return NextResponse.redirect(new URL("/member", req.url));
        } else if (isStaffRole) {
          return NextResponse.redirect(new URL("/officer", req.url));
        }
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
      return NextResponse.next();
    }

    if (isAuth) {
      if (isMemberRole && !pathname.startsWith("/member")) {
        return NextResponse.redirect(new URL("/member", req.url));
      }
      if (isStaffRole && !pathname.startsWith("/officer")) {
        return NextResponse.redirect(new URL("/officer", req.url));
      }
    }

    const authMiddleware = withAuth({
      callbacks: {
        authorized: ({ token }) => !!token,
      },
    });

    return authMiddleware(req, event);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets (.svg, .png, .jpg, .jpeg, .gif, .webp, .ico, .css, .js)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)",
  ],
};


