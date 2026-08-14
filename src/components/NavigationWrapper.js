"use client";

import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
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
  "/officer",
  "/coming-soon",
  "/maintenance",
];

function isHiddenHeaderRoute(pathname) {
  if (!pathname) return false;
  return hiddenHeaderRoutes.some(route => pathname === route || pathname.startsWith(`${route}/`));
}

function useGateCheck(pathname) {
  const [isGateHidden, setIsGateHidden] = useState(false);

  useEffect(() => {
    if (typeof document !== "undefined") {
      const cookies = document.cookie;
      const isGateCookie = cookies.includes("site_gate_active=true");
      const hasTeamCookie = cookies.includes("team_access=");
      setIsGateHidden(isGateCookie && !hasTeamCookie);
    }
  }, [pathname]);

  return isGateHidden || isHiddenHeaderRoute(pathname);
}

export function HeaderWrapper() {
  const pathname = usePathname();
  const shouldHide = useGateCheck(pathname);
  if (shouldHide) return null;
  return <Header />;
}

export function FooterWrapper() {
  const pathname = usePathname();
  const shouldHide = useGateCheck(pathname);
  if (shouldHide) return null;
  return <Footer />;
}

export function VisitorTrackerWrapper() {
  const pathname = usePathname();
  const shouldHide = useGateCheck(pathname);
  if (shouldHide) return null;
  return <VisitorTracker />;
}

