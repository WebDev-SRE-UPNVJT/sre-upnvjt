"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FileText, Search, FolderOpen, ArrowRight, Download, Clock, User, 
  Filter, ExternalLink, HelpCircle, Sparkles, Folder, Layers,
  ChevronRight, Check
} from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";

export default function DokumenClient({ initialCategories, initialDocuments, user }) {
  const { t, language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  const categories = initialCategories || [];
  const documents = initialDocuments || [];

  // Filter documents
  const filteredDocs = useMemo(() => {
    return documents.filter(doc => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        doc.title.toLowerCase().includes(q) || 
        (doc.description && doc.description.toLowerCase().includes(q)) ||
        (doc.category?.name && doc.category.name.toLowerCase().includes(q));
      
      const matchesCategory = activeCategory === "all" || doc.categoryId?.toString() === activeCategory?.toString();
      return matchesSearch && matchesCategory;
    });
  }, [documents, searchQuery, activeCategory]);

  return (
    <div className="w-full relative space-y-8 select-none transition-colors duration-500 pb-20">
      {/* Background Ambience */}
      <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none mix-blend-multiply dark:mix-blend-screen" />
      <div className="absolute top-40 left-10 w-[400px] h-[400px] bg-blue-500/5 dark:bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-white dark:bg-[#08120e] border border-slate-200 dark:border-white/5 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row md:items-end justify-between relative overflow-hidden shadow-xl dark:shadow-2xl gap-6"
      >
        <div className="absolute -left-16 -top-16 w-48 h-48 rounded-full bg-emerald-500/20 dark:bg-emerald-500/10 blur-[50px] pointer-events-none" />

        <div className="relative z-10 flex-1">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
              <FileText className="w-5 h-5" />
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-bold text-emerald-500 uppercase tracking-widest">
              {t("documents.badge") || "RE-Core Administrasi"}
            </span>
          </div>

          <h1 className="text-3xl md:text-5xl font-display font-black tracking-tighter text-slate-900 dark:text-white leading-tight">
            {t("documents.title_doc")} <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400">
              {t("documents.title_sre")}
            </span>
          </h1>
          <p className="text-slate-500 dark:text-white/60 text-sm md:text-base font-medium mt-3 max-w-xl leading-relaxed">
            {t("documents.desc")}
          </p>
        </div>

        <div className="relative z-10 w-full md:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Tombol Konsultasi Administrasi Google Drive */}
          <a
            href="https://drive.google.com/drive/folders/15sMY8AdyF2f2Sk_4lfvmT2yTBen7JEGh"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs md:text-sm tracking-wide shadow-[0_4px_20px_rgba(16,185,129,0.3)] hover:shadow-[0_6px_25px_rgba(16,185,129,0.45)] hover:scale-[1.02] active:scale-95 transition-all shrink-0 cursor-pointer group"
          >
            <FolderOpen className="w-4 h-4 text-emerald-100 group-hover:scale-110 transition-transform" />
            <span>{t("documents.consultation") || "Konsultasi Administrasi"}</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </a>

          {/* Search Bar */}
          <div className="relative flex-1 sm:w-72 md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-white/30" />
            <input
              type="text"
              placeholder={t("documents.search_ph") || "Cari berkas dokumen..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 dark:bg-[#0a1610] border border-slate-200 dark:border-white/10 rounded-2xl pl-11 pr-4 py-3.5 text-xs md:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all shadow-sm"
            />
          </div>
        </div>
      </motion.div>

      {/* Categories Filter - Responsive Modern Pill Carousel */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="w-full bg-white/60 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/5 rounded-2xl p-2.5 md:p-3 backdrop-blur-xl shadow-sm"
      >
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1 px-1">
          {/* Label Filter */}
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-2 text-xs font-black uppercase tracking-wider text-slate-400 dark:text-white/40 shrink-0 border-r border-slate-200 dark:border-white/10 mr-1">
            <Filter className="w-3.5 h-3.5 text-emerald-500" />
            <span>{t("documents.category_label") || "Kategori:"}</span>
          </div>

          {/* Pill 1: Semua Dokumen */}
          <button
            type="button"
            onClick={() => setActiveCategory("all")}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition-all shrink-0 cursor-pointer ${
              activeCategory === "all"
                ? "bg-emerald-500 text-slate-950 font-black shadow-[0_0_15px_rgba(16,185,129,0.35)] scale-[1.02]"
                : "bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-white/70 hover:bg-slate-200 dark:hover:bg-white/10 border border-transparent dark:border-white/5"
            }`}
          >
            <Layers className="w-3.5 h-3.5 shrink-0" />
            <span>{t("documents.all_doc") || "Semua Dokumen"}</span>
            <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${
              activeCategory === "all" ? "bg-black/20 text-slate-950" : "bg-slate-200 dark:bg-white/10 text-slate-500 dark:text-white/40"
            }`}>
              {documents.length}
            </span>
          </button>

          {/* Category Pills with Truncation */}
          {categories.map((cat) => {
            const count = documents.filter(d => d.categoryId?.toString() === cat.id?.toString()).length;
            const isSelected = activeCategory === cat.id?.toString();

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id?.toString())}
                title={cat.name}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs md:text-sm font-bold transition-all shrink-0 max-w-[200px] sm:max-w-[260px] md:max-w-[300px] cursor-pointer ${
                  isSelected
                    ? "bg-emerald-500 text-slate-950 font-black shadow-[0_0_15px_rgba(16,185,129,0.35)] scale-[1.02]"
                    : "bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-white/70 hover:bg-slate-200 dark:hover:bg-white/10 border border-transparent dark:border-white/5"
                }`}
              >
                <FolderOpen className="w-3.5 h-3.5 shrink-0 opacity-80" />
                <span className="truncate">{cat.name}</span>
                <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-black shrink-0 ${
                  isSelected ? "bg-black/20 text-slate-950" : "bg-slate-200 dark:bg-white/10 text-slate-500 dark:text-white/40"
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Documents Grid */}
      {filteredDocs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredDocs.map((doc, index) => (
              <motion.div
                key={doc.id}
                layout
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3, delay: index * 0.04 }}
                className="bg-white dark:bg-[#08120e] border border-slate-200 dark:border-white/5 hover:border-emerald-500/30 rounded-3xl p-6 group relative overflow-hidden shadow-sm hover:shadow-xl dark:hover:shadow-[0_10px_30px_rgba(16,185,129,0.1)] transition-all duration-300 flex flex-col justify-between"
              >
                <div className="relative z-10 flex flex-col h-full justify-between">
                  <div>
                    {/* Card Header: Icon & Category Badge */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-colors duration-300 shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      
                      {/* Truncated Category Badge */}
                      <span 
                        className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5 text-slate-600 dark:text-white/60 max-w-[180px] sm:max-w-[200px] truncate group-hover:border-emerald-500/20 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors"
                        title={doc.category?.name || (t("documents.uncategorized") || "Uncategorized")}
                      >
                        <Folder className="w-3 h-3 shrink-0 opacity-70" />
                        <span className="truncate">{doc.category?.name || (t("documents.uncategorized") || "Uncategorized")}</span>
                      </span>
                    </div>

                    {/* Title & Description */}
                    <h3 className="text-base md:text-lg font-bold text-slate-900 dark:text-white leading-snug mb-2 group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors line-clamp-2">
                      {doc.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-white/50 line-clamp-2 mb-4 leading-relaxed">
                      {doc.description || (t("documents.no_description") || "Tidak ada deskripsi berkas.")}
                    </p>
                  </div>

                  {/* Card Footer: Metadata & Download */}
                  <div className="pt-4 border-t border-slate-100 dark:border-white/5 flex items-center justify-between gap-3 mt-2">
                    <div className="flex flex-col gap-1 text-[11px] text-slate-400 dark:text-white/40">
                      <div className="flex items-center gap-1.5 font-medium text-slate-600 dark:text-white/60">
                        <User className="w-3.5 h-3.5 text-emerald-500/70" />
                        <span>{doc.authorName || doc.uploadedBy?.name || "Staff"}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3 h-3 opacity-70" />
                        <span>{doc.createdAt ? new Date(doc.createdAt).toLocaleDateString(language === "en" ? "en-US" : "id-ID", { day: "numeric", month: "short", year: "numeric" }) : "-"}</span>
                      </div>
                    </div>

                    {/* Download Action Button */}
                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500 hover:text-black text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-bold transition-all shadow-sm shrink-0"
                      title={t("documents.download") || "Buka / Unduh Dokumen"}
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{t("documents.download") || "Unduh"}</span>
                    </a>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="w-full p-12 flex flex-col items-center justify-center bg-white/50 dark:bg-white/5 border border-dashed border-slate-300 dark:border-white/10 rounded-3xl"
        >
          <FileText className="w-12 h-12 text-slate-300 dark:text-white/20 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
            {t("documents.empty_title") || "Dokumen Tidak Ditemukan"}
          </h3>
          <p className="text-sm text-slate-500 dark:text-white/50 text-center max-w-sm">
            {searchQuery
              ? (t("documents.empty_search_desc") || "Tidak ada berkas dokumen yang cocok dengan pencarian Anda.")
              : (t("documents.empty_cat_desc") || "Belum ada berkas dokumen dalam kategori ini.")}
          </p>
          {activeCategory !== "all" && (
            <button
              type="button"
              onClick={() => setActiveCategory("all")}
              className="mt-4 px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-500 text-xs font-bold hover:bg-emerald-500/20 transition-colors"
            >
              {t("documents.view_all_docs") || "Lihat Semua Dokumen"}
            </button>
          )}
        </motion.div>
      )}
    </div>
  );
}
