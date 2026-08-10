"use client";

import { usePathname } from "next/navigation";
import Header from "./Header";
import Footer from "./Footer";
import VisitorTracker from "./VisitorTracker";

// Daftar path yang tidak akan menampilkan Header dan Footer publik
const hiddenHeaderRoutes = [
  "/dashboard",
  "/departments",
  "/users",
  "/roles",
  "/finance",
  "/inventory",
  "/documents",
  "/activities",
  "/merch",
  "/settings",
  "/partners",
  "/content",
  "/leaderboard",
  "/appraisals",
  "/achievements",
  "/achievements/verify",
  "/login",
  "/register",
  "/forms",
  "/member",
  "/literature",
  "/ppt",
  "/quiz",
  "/tasks",
  "/attendance",
  "/events-admin",
  "/applications",
  "/testimonials",
  "/staff",
];

function isHiddenHeaderRoute(pathname) {
  if (!pathname) return false;
  return hiddenHeaderRoutes.some(route => pathname === route || pathname.startsWith(`${route}/`));
}

export function HeaderWrapper() {
  const pathname = usePathname();
  if (isHiddenHeaderRoute(pathname)) return null;
  return <Header />;
}

export function FooterWrapper() {
  const pathname = usePathname();
  if (isHiddenHeaderRoute(pathname)) return null;
  return <Footer />;
}

export function VisitorTrackerWrapper() {
  const pathname = usePathname();
  // Hanya tracking halaman publik, bukan dashboard/member/staff/login
  if (isHiddenHeaderRoute(pathname)) return null;
  return <VisitorTracker />;
}
