"use client";

import React, { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LayoutDashboard, Users, FileText, CheckSquare, Shield,
  Settings, LogOut, Menu, X, CreditCard, Box, ChevronLeft, ChevronRight, FolderKanban, ClipboardCheck, FolderOpen, Newspaper, Presentation, ShoppingBag, Handshake, Activity, Trophy, Star, Target, ShieldCheck, Link2, BarChart2, Rocket
} from "lucide-react";

import { hasAccess } from "@/lib/permissions";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useLanguage } from "@/i18n/LanguageProvider";

export default function DashboardLayout({ children }) {
  const { t } = useLanguage();
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  React.useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#07130e] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  const role = session?.user?.roleName;

  const navItems = [
    { name: t("sidebar.overview"), icon: LayoutDashboard, href: "/dashboard", module: "overview" },
    
    // Organization & Team
    { name: t("sidebar.departments"), icon: FileText, href: "/departments", module: "departments" },
    { name: t("sidebar.users"), icon: Users, href: "/users", module: "users" },
    { name: t("sidebar.roles"), icon: Shield, href: "/roles", module: "roles" },
    { name: "Form Builder", icon: ClipboardCheck, href: "/forms", module: "forms" },
    
    // Public & Media
    { name: t("sidebar.articles") || "Content / Berita", icon: Newspaper, href: "/content", module: "content" },
    { name: t("sidebar.analytics") || "Analytics", icon: BarChart2, href: "/dashboard/analytics", module: "analytics" },
    { name: "Testimonials", icon: Star, href: "/testimonials", module: "content" },
    { name: t("sidebar.merch"), icon: ShoppingBag, href: "/merch", module: "merchandise" },
    { name: t("sidebar.partners"), icon: Handshake, href: "/partners", module: "partners" },
    { name: "Featured Projects", icon: Rocket, href: "/featured-projects", module: "featured-projects" },

    // Member Operations
    { name: "Literature Bank", icon: FolderOpen, href: "/literature", module: "literature" },
    { name: "Dokumen Internal", icon: FileText, href: "/documents", module: "documents" },
    { name: "PPT Modules", icon: Presentation, href: "/ppt", module: "ppt" },
    { name: "Quiz", icon: Target, href: "/quiz", module: "quiz" },
    { name: "Tasks", icon: FolderKanban, href: "/tasks", module: "tasks" },
    { name: "Activities", icon: Activity, href: "/activities", module: "activities" },
    { name: "Leaderboard", icon: Trophy, href: "/leaderboard", module: "leaderboard" },
    { name: "Attendance", icon: ShieldCheck, href: "/attendance", module: "attendance" },
    { name: "Events (Admin)", icon: Activity, href: "/events-admin", module: "events" },
    { name: "Applications", icon: ShieldCheck, href: "/applications", module: "users" },
    
    // System
    { name: t("sidebar.settings"), icon: Settings, href: "/settings", module: "settings" },
  ];

  const allowedNavItems = navItems.filter(item => {
    if (item.module === "overview" || item.module === "settings") return true;
    if (item.module === "partners") return role === "SUPER_ADMIN";
    if (item.module === "featured-projects") return role === "SUPER_ADMIN" || role === "ADMIN";
    if (item.module === "documents") return hasAccess(session?.user, "documents", "read") || role === "SUPER_ADMIN" || role === "ADMIN";
    return hasAccess(session?.user, item.module, "read");
  }).sort((a, b) => {
    if (a.module === "overview") return -1;
    if (b.module === "overview") return 1;
    return a.name.localeCompare(b.name);
  });

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white/80 dark:bg-[#050e0a]/80 backdrop-blur-2xl p-6 relative overflow-hidden rounded-3xl border border-gray-200 dark:border-white/10">
  
      <div className="absolute top-0 left-0 w-full h-40 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />
      <div className="absolute -left-20 top-20 w-40 h-40 bg-primary/20 blur-[100px] pointer-events-none" />

      <div className={`mb-6 flex items-center relative z-10 transition-all duration-300 ${isSidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
        <Link href="/" className="font-display font-black text-[28px] tracking-tighter text-gray-900 dark:text-white flex items-center gap-1 group">
          <div className={`bg-primary dark:bg-white transition-all duration-300 ${isSidebarCollapsed ? 'h-10 w-10' : 'h-12 w-40'}`} style={{ WebkitMaskImage: "url(/images/logo.png)", WebkitMaskSize: "contain", WebkitMaskRepeat: "no-repeat", WebkitMaskPosition: "left center", maskImage: "url(/images/logo.png)", maskSize: "contain", maskRepeat: "no-repeat", maskPosition: "left center" }}></div>
          
        </Link>
        {isMobileMenuOpen && (
          <button onClick={() => setIsMobileMenuOpen(false)} className="lg:hidden text-gray-500 dark:text-white/50 hover:text-gray-900 dark:hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* User Info Card */}
      <AnimatePresence>
        {!isSidebarCollapsed && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }} 
            animate={{ opacity: 1, height: "auto" }} 
            exit={{ opacity: 0, height: 0, overflow: "hidden" }} 
            className="mb-4 p-3.5 rounded-xl bg-gradient-to-br from-gray-100 to-white dark:from-white/10 dark:to-white/5 border border-gray-200 dark:border-white/10 relative z-10 group shadow-sm dark:shadow-none"
          >
            <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl" />
            <div className="text-[13px] font-bold text-gray-900 dark:text-white leading-tight tracking-wide">{session?.user?.name}</div>
            <div className="text-[11px] text-gray-500 dark:text-white/40 truncate">{session?.user?.email}</div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              <span className="text-[8px] uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-primary/10 dark:bg-primary/20 text-primary border border-primary/20">
                {role?.replace("_", " ") || "No Role"}
              </span>
              <span className="text-[8px] uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-white/70 border border-gray-200 dark:border-white/5">
                {session?.user?.departmentName || "No Dept"}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-2 relative z-10 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-white/10 scrollbar-track-transparent pr-2 pb-4">
        {!isSidebarCollapsed && <div className="text-[10px] uppercase font-bold tracking-[0.2em] text-gray-400 dark:text-white/30 mb-4 pl-2 shrink-0">Menu</div>}
        {allowedNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (pathname.startsWith(item.href + '/') && item.href !== '/achievements');
          return (
            <Link 
              key={item.name} 
              href={item.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center gap-4 py-3.5 rounded-xl text-[14px] font-medium transition-all duration-300 group relative overflow-hidden shrink-0 ${isSidebarCollapsed ? 'justify-center px-0' : 'px-4'} ${isActive ? 'bg-primary/10 text-primary border border-primary/20 shadow-[0_0_15px_rgba(16,185,129,0.05)] dark:shadow-[0_0_15px_rgba(16,185,129,0.15)]' : 'text-gray-500 dark:text-white/50 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5'}`}
              title={isSidebarCollapsed ? item.name : undefined}
            >
              {!isActive && <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />}
              <Icon className={`w-5 h-5 transition-colors duration-300 relative z-10 shrink-0 ${isActive ? 'text-primary drop-shadow-[0_0_8px_rgba(16,185,129,0.5)] scale-110' : 'group-hover:text-primary group-hover:scale-110'}`} />
              <AnimatePresence>
                {!isSidebarCollapsed && (
                  <motion.span 
                    initial={{ opacity: 0, width: 0 }} 
                    animate={{ opacity: 1, width: "auto" }} 
                    exit={{ opacity: 0, width: 0 }} 
                    className="relative z-10 whitespace-nowrap"
                  >
                    {item.name}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          );
        })}
      </nav>

      {/* Footer Tools: Logout */}
      <div className="mt-auto pt-4 border-t border-gray-200 dark:border-white/5 relative z-10">
        <button 
          onClick={() => signOut({ callbackUrl: '/login' })}
          className={`flex items-center gap-4 py-3.5 rounded-xl text-[14px] font-medium text-red-500/80 dark:text-red-400/80 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all duration-300 group ${isSidebarCollapsed ? 'w-12 h-12 justify-center px-0 mx-auto' : 'w-full px-4'}`}
          title={isSidebarCollapsed ? t("sidebar.logout") : undefined}
        >
          <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform shrink-0" />
          <AnimatePresence>
            {!isSidebarCollapsed && (
              <motion.span 
                initial={{ opacity: 0, width: 0 }} 
                animate={{ opacity: 1, width: "auto" }} 
                exit={{ opacity: 0, width: 0 }} 
                className="whitespace-nowrap"
              >
                {t("sidebar.logout")}
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 w-screen h-screen bg-gray-50 dark:bg-[#020806] text-gray-900 dark:text-white overflow-hidden selection:bg-primary/30 transition-colors duration-500 flex overscroll-none">
      <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      
      {/* Desktop Sidebar (Floating & Fixed Height) */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarCollapsed ? 96 : 300 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="hidden lg:block shrink-0 h-[calc(100vh-32px)] my-4 ml-4 mr-2 relative z-40 shadow-[20px_0_40px_rgba(0,0,0,0.05)] dark:shadow-[20px_0_40px_rgba(0,0,0,0.5)] rounded-3xl"
      >
        <SidebarContent />
        
        {/* Collapse Toggle Button */}
        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="absolute top-12 -right-4 bg-white dark:bg-[#112a20] border border-gray-200 dark:border-white/10 p-2 rounded-full text-gray-500 dark:text-white/70 hover:text-primary dark:hover:text-white hover:bg-gray-50 dark:hover:bg-primary/40 transition-all z-50 shadow-xl group flex items-center justify-center"
        >
          {isSidebarCollapsed ? (
            <ChevronRight className="w-4 h-4 group-hover:scale-110" />
          ) : (
            <ChevronLeft className="w-4 h-4 group-hover:scale-110" />
          )}
        </button>
      </motion.aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.aside 
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", bounce: 0, duration: 0.4 }}
            className="fixed inset-y-0 left-0 z-50 lg:hidden w-[280px] h-[100dvh]"
          >
            <div className="h-full w-full bg-white/95 dark:bg-[#050e0a]/95 backdrop-blur-3xl flex flex-col p-6 pt-[100px] relative overflow-hidden border-r border-gray-200 dark:border-white/10">
              {/* Decorative Glow */}
              <div className="absolute top-0 left-0 w-full h-40 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />
              <div className="absolute -left-20 top-20 w-40 h-40 bg-primary/20 blur-[100px] pointer-events-none" />

              {/* User Info Card */}
              <div className="mb-10 p-5 rounded-2xl bg-gradient-to-br from-gray-100 to-white dark:from-white/10 dark:to-white/5 border border-gray-200 dark:border-white/10 relative z-10 shrink-0">
                <div className="text-[15px] font-bold text-gray-900 dark:text-white mb-1 tracking-wide">{session?.user?.name}</div>
                <div className="text-[12px] text-gray-500 dark:text-white/40 mb-3 truncate">{session?.user?.email}</div>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="text-[9px] uppercase font-bold tracking-widest px-2.5 py-1.5 rounded-md bg-primary/10 dark:bg-primary/20 text-primary border border-primary/20">
                    {role?.replace("_", " ") || "No Role"}
                  </span>
                </div>
              </div>

              {/* Navigation */}
              <nav className="flex-1 flex flex-col gap-2 relative z-10 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-white/10 pb-4">
                <div className="text-[10px] uppercase font-bold tracking-[0.2em] text-gray-400 dark:text-white/30 mb-4 pl-2 shrink-0">Menu</div>
                {allowedNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href || (pathname.startsWith(item.href + '/') && item.href !== '/achievements');
                  return (
                    <Link 
                      key={item.name} 
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center gap-4 py-3.5 px-4 rounded-xl text-[14px] font-medium transition-all duration-300 ${isActive ? 'bg-primary/10 text-primary border border-primary/20' : 'text-gray-500 dark:text-white/50 hover:bg-gray-100 dark:hover:bg-white/5'}`}
                    >
                      <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-primary' : ''}`} />
                      <span className="whitespace-nowrap">{item.name}</span>
                    </Link>
                  );
                })}
              </nav>

              {/* Footer Tools: Logout */}
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-white/5 relative z-10 shrink-0 pb-6 flex flex-col gap-2">
                <div className="p-2">
                  <button 
                    onClick={() => signOut({ callbackUrl: '/login' })}
                    className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 font-bold transition-all text-sm"
                  >
                    <LogOut className="w-5 h-5 shrink-0" />
                    {t("sidebar.logout")}
                  </button>
                </div>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-y-auto overscroll-contain relative">
        {/* Top Action Bar (Desktop Theme Toggle on Top-Right Corner) */}
        <div className="hidden lg:flex justify-end items-center px-6 md:px-10 pt-5 pb-1 sticky top-0 z-30 pointer-events-none">
          <div className="pointer-events-auto flex items-center gap-2.5 px-3 py-1.5 rounded-2xl bg-white/80 dark:bg-[#08120e]/80 backdrop-blur-xl border border-gray-200 dark:border-white/10 shadow-sm hover:border-primary/30 transition-all duration-300">
            <ThemeToggle />
            <span className="text-[13px] font-medium text-gray-700 dark:text-white/80 select-none pr-1">
              Tema Tampilan
            </span>
          </div>
        </div>

        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between p-4 bg-white/80 dark:bg-[#050e0a]/80 backdrop-blur-xl border-b border-gray-200 dark:border-white/10 sticky top-0 z-[60] transition-colors duration-500">
          <div className="font-display font-bold text-xl tracking-tight flex items-center gap-1 text-gray-900 dark:text-white">
            <div className="h-16 w-48 bg-primary dark:bg-white transition-all duration-300" style={{ WebkitMaskImage: "url(/images/logo.png)", WebkitMaskSize: "contain", WebkitMaskRepeat: "no-repeat", WebkitMaskPosition: "left center", maskImage: "url(/images/logo.png)", maskSize: "contain", maskRepeat: "no-repeat", maskPosition: "left center" }}></div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 px-2 py-1 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10">
              <ThemeToggle />
            </div>
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-gray-500 dark:text-white/70">
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Page Content */}
        <div className="p-6 md:p-10 pt-2 md:pt-4 flex-1">
          {children}
        </div>
      </main>
    </div>
  );
}

