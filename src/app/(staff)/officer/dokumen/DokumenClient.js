"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FileText, Search, FolderOpen, ArrowRight, Download, Clock, User, Filter
} from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";

export default function DokumenClient({ initialCategories, initialDocuments, user }) {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  // Filter documents
  const filteredDocs = initialDocuments.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          doc.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === "all" || doc.categoryId === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="w-full relative space-y-8 select-none transition-colors duration-500 pb-20">
      {/* Background Ambience */}
      <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none mix-blend-multiply dark:mix-blend-screen" />

      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-white dark:bg-[#08120e] border border-slate-200 dark:border-white/5 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row md:items-end justify-between relative overflow-hidden shadow-xl dark:shadow-2xl gap-6"
      >
        <div className="absolute -left-16 -top-16 w-48 h-48 rounded-full bg-emerald-500/20 dark:bg-emerald-500/10 blur-[50px] pointer-events-none" />

        <div className="relative z-10 flex-1">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
              <FileText className="w-6 h-6" />
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-bold text-emerald-500 uppercase tracking-widest">
              RE-Core
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-black tracking-tighter text-slate-900 dark:text-white leading-tight">
            {t("documents.title_doc")} <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-emerald-500">
              {t("documents.title_sre")}
            </span>
          </h1>
          <p className="text-slate-500 dark:text-white/60 text-sm md:text-base font-medium mt-4 max-w-lg leading-relaxed">
            {t("documents.desc")}
          </p>
        </div>

        <div className="relative z-10 w-full md:w-auto flex flex-col sm:flex-row gap-3">
          {/* Search Bar */}
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-white/30" />
            <input
              type="text"
              placeholder={t("documents.search_ph")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-[#0a1610] border border-slate-200 dark:border-white/10 rounded-2xl pl-12 pr-4 py-3.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all shadow-sm"
            />
          </div>
        </div>
      </motion.div>

      {/* Categories Filter */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="flex flex-wrap gap-2 items-center"
      >
        <div className="flex items-center gap-2 pr-4 border-r border-slate-200 dark:border-white/10">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Filter
          </span>
        </div>

        <button
          onClick={() => setActiveCategory("all")}
          className={`w-full md:w-auto flex items-center justify-between p-4 px-6 rounded-2xl border transition-all ${
            activeCategory === "all"
              ? "bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/25"
              : "bg-slate-50 dark:bg-[#0a1610] border-slate-200 dark:border-white/10 text-slate-600 dark:text-white/60 hover:border-emerald-500/50 hover:bg-emerald-50 dark:hover:bg-emerald-500/10"
          }`}
        >
          <div className="flex items-center gap-3">
            <FolderOpen className="w-5 h-5" />
            <span className="font-bold">{t("documents.all_doc")}</span>
          </div>
        </button>

        {initialCategories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeCategory === cat.id
                ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
                : "bg-white dark:bg-[#08120e] text-slate-600 dark:text-white/60 border border-slate-200 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/10"
            }`}
          >
            <FolderOpen className="w-3.5 h-3.5" />
            {cat.name}
          </button>
        ))}
      </motion.div>

      {/* Documents Grid */}
      {filteredDocs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredDocs.map((doc, index) => (
              <motion.div
                key={doc.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="bg-white dark:bg-[#08120e] border border-slate-200 dark:border-white/5 rounded-3xl p-6 group relative overflow-hidden shadow-sm hover:shadow-xl dark:shadow-none transition-all duration-300"
              >
                <div className="relative z-10 flex flex-col h-full justify-between">
                  <div>
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-3 rounded-2xl bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-white/70 group-hover:bg-emerald-500 group-hover:text-white transition-colors duration-300">
                        <FileText className="w-6 h-6" />
                      </div>
                      <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-white/50 border border-slate-200 dark:border-white/5">
                        {doc.category?.name || "Uncategorized"}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight mb-2 group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors">
                      {doc.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-white/50 line-clamp-2 mb-4">
                      {doc.description || "Tidak ada deskripsi."}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-4 text-xs font-medium text-slate-500 dark:text-white/40">
                        <div className="flex items-center gap-1.5">
                          <User className="w-4 h-4" />
                          {t("documents.by")} {doc.authorName || "Staff"}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4" />
                          {new Date(doc.createdAt).toLocaleDateString("id-ID")}
                        </div>
                      </div>
                    </div>

                    {/* Download Action */}
                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-4 bg-slate-50 dark:bg-white/5 border-l border-slate-200 dark:border-white/5 hover:bg-emerald-50 dark:hover:bg-emerald-500/20 hover:text-emerald-500 transition-colors flex flex-col items-center justify-center gap-2"
                      title={t("documents.download")}
                    >
                      <Download className="w-6 h-6" />
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
            {t("documents.empty")}
          </h3>
          <p className="text-sm text-slate-500 dark:text-white/50 text-center max-w-sm">
            {searchQuery
              ? "Tidak ada dokumen yang cocok dengan pencarian Anda."
              : "Belum ada dokumen yang diunggah dalam kategori ini."}
          </p>
        </motion.div>
      )}
    </div>
  );
}
