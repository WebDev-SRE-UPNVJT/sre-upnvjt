import { withAuth } from "next-auth/middleware";
import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";

export default async function middleware(req, event) {
  const token = await getToken({ req });
  const isAuth = !!token;
  const isAuthPage = req.nextUrl.pathname.startsWith("/login");
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
    // Redirect MEMBERs trying to access non-member protected routes (like /dashboard) to /member
    if (isMemberRole && !req.nextUrl.pathname.startsWith("/member")) {
      return NextResponse.redirect(new URL("/member", req.url));
    }
    // Redirect STAFFs trying to access non-staff protected routes to /officer
    if (isStaffRole && !req.nextUrl.pathname.startsWith("/officer")) {
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

export const config = {
  // Only routes that REQUIRE authentication are listed here.
  // Public routes (/articles, /about, /merchandise, etc.) must NOT appear here.
  matcher: [
    "/dashboard/:path*",
    "/roles/:path*",
    "/users/:path*",
    "/departments/:path*",
    "/merch/:path*",
    "/settings/:path*",
    // Previously unprotected — now fixed
    "/content/:path*",
    "/forms/:path*",
    "/partners/:path*",
    // New operational modules
    "/literature/:path*",
    "/ppt/:path*",
    "/quiz/:path*",
    "/tasks/:path*",
    "/leaderboard/:path*",
    "/attendance/:path*",
    "/events-admin/:path*",
    "/member/:path*",
    "/officer/:path*",
  ],
};

