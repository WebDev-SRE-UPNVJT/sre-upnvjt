"use client";

import React from "react";
import Link from "next/link";
import { ChevronRight, ArrowLeft, Users, Zap, Sun, Wind } from "lucide-react";
import { OrgTreeSection } from "@/components/organization/OrgComponents";
import { useLanguage } from "@/i18n/LanguageProvider";

export default function DepartmentClient({ dept }) {
  const { t } = useLanguage();
  if (!dept) {
    return (
      <div className="min-h-screen bg-[#0bb37e] dark:bg-[#07130e] text-white flex items-center justify-center p-6">
        <div className="max-w-md text-center bg-white/10 dark:bg-emerald-950/20 border border-white/20 dark:border-emerald-500/20 p-8 rounded-3xl shadow-xl">
          <Users className="w-12 h-12 mx-auto text-yellow-300 dark:text-emerald-400 mb-4 animate-bounce" />
          <h2 className="text-2xl font-black uppercase mb-2">{t("visitor.org.dept_not_found")}</h2>
          <p className="text-sm text-emerald-50/70 dark:text-gray-400 mb-6">
            {t("visitor.org.dept_not_found_desc")}
          </p>
          <a
            href="/about#structure"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-yellow-300 dark:bg-emerald-500 text-slate-950 font-black rounded-full text-xs tracking-widest uppercase hover:scale-105 transition-all duration-300"
          >
            <ArrowLeft className="w-4 h-4" /> {t("visitor.org.back_about")}
          </a>
        </div>
      </div>
    );
  }

  // Determine if the department has no members at all (empty state check)
  const hasDirector = !!dept.director;
  const hasDivisions = dept.divisions && dept.divisions.length > 0;
  const hasManagers = hasDivisions && dept.divisions.some(div => div.manager);
  const hasStaff = hasDivisions && dept.divisions.some(div => div.staff && div.staff.length > 0);
  const isEmpty = !hasDirector && !hasManagers && !hasStaff && dept.code?.toUpperCase() !== "EXE";

  return (
    <div className="min-h-screen text-white selection:bg-yellow-300 selection:text-slate-950 antialiased overflow-x-hidden relative">
      {/* CSS Gradient helper */}
      <style dangerouslySetInnerHTML={{ __html: `
        .dept-detail-bg {
          background: linear-gradient(to bottom, #0aa373 0%, #099c6d 100%);
        }
        .dark .dept-detail-bg {
          background: linear-gradient(to bottom, #040e0a 0%, #020805 100%);
        }
      `}} />

      {/* ─── Header Section (Footer Color Background) ─── */}
      <header className="w-full bg-[#0bb37e] dark:bg-[#07130e] pt-32 pb-16 relative overflow-hidden border-b-2 border-white/20 dark:border-white/10 shadow-md z-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" aria-hidden="true" />
        <div className="w-full max-w-[1800px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-20 relative z-10">
          
          {/* Breadcrumbs & Back Nav (Hidden on Mobile, Visible on Desktop) */}
          <div className="hidden md:flex flex-wrap items-center gap-2.5 text-xs font-bold uppercase tracking-wider text-emerald-100/60 dark:text-white/30 mb-8">
            <Link href="/" className="hover:text-yellow-300 dark:hover:text-emerald-400 transition-colors">
              {t("visitor.navbar.home")}
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <a href="/about" className="hover:text-yellow-300 dark:hover:text-emerald-400 transition-colors">
              {t("visitor.navbar.about")}
            </a>
            <ChevronRight className="w-3.5 h-3.5" />
            <a href="/about#structure" className="hover:text-yellow-300 dark:hover:text-emerald-400 transition-colors">
              {t("visitor.about.org_structure")}
            </a>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-yellow-300 dark:text-emerald-400 truncate max-w-[200px] sm:max-w-none">
              {dept.name}
            </span>
          </div>

          {/* Back Button */}
          <a
            href="/about#structure"
            className="inline-flex items-center gap-2 text-xs font-black tracking-widest uppercase text-yellow-300 hover:text-white dark:text-emerald-400 dark:hover:text-white transition-colors duration-300 mb-12"
          >
            <ArrowLeft className="w-4 h-4" /> {t("visitor.org.back_depts")}
          </a>

          {/* Title block */}
          <div className="max-w-4xl">
            <span className="inline-block py-1.5 px-4 rounded-full bg-[#099c6d] dark:bg-white/5 border border-yellow-300/40 dark:border-white/10 text-xs font-black tracking-widest uppercase text-yellow-300 dark:text-emerald-400 mb-4 shadow-sm">
              {t("visitor.org.dept_directory")}
            </span>
            <h1 className="text-4xl sm:text-6xl font-display font-black leading-tight tracking-tight uppercase mb-4 text-white">
              {dept.name}
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-emerald-50/90 dark:text-gray-300 leading-relaxed font-bold max-w-3xl">
              {dept.description}
            </p>
          </div>
        </div>
      </header>

      {/* ─── Content Section (Unified Gradient Section) ─── */}
      <main className="w-full dept-detail-bg py-16 relative z-10">
        <div className="w-full max-w-[1800px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-20 relative z-10">
          {isEmpty ? (
            <div className="max-w-xl mx-auto text-center p-12 bg-white/10 dark:bg-emerald-950/20 border border-white/20 dark:border-emerald-500/20 rounded-3xl shadow-lg mt-12">
              <Users className="w-16 h-16 mx-auto text-yellow-300/60 dark:text-emerald-400/50 mb-4" />
              <h3 className="text-xl font-black text-white mb-2">{t("visitor.org.no_members")}</h3>
              <p className="text-sm text-emerald-50/60 dark:text-gray-400">
                {t("visitor.org.no_members_desc")}
              </p>
            </div>
          ) : (
            <div className="w-full">
              <OrgTreeSection dept={dept} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
