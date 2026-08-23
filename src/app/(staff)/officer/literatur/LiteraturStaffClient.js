"use client";

import React, { useState, useEffect } from "react";
import { FolderOpen, Search, ExternalLink, Calendar, User, FileText, Sparkles, Filter, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/i18n/LanguageProvider";
import { resolveImageUrl } from "@/lib/imageUrl";

const TYPE_COLORS = {
  PDF:    "bg-red-500/10 text-red-400 border-red-500/20",
  SLIDES: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  DOC:    "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  VIDEO:  "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  OTHER:  "bg-gray-500/10 text-gray-400 border-gray-500/20",
};

export default function LiteraturStaffClient({ initialItems, categories }) {
  const { t } = useLanguage();
  const [items] = useState(initialItems || []);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState(null); // null = categories view, "all" = all items, id = specific category
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [filterType, setFilterType] = useState("ALL");
  const [minYear, setMinYear] = useState("");
  const [maxYear, setMaxYear] = useState("");
  const [sortOrder, setSortOrder] = useState("newest"); // newest, oldest, a-z

  const isCategoriesView = selectedCategoryId === null && searchQuery.trim() === "";

  const filteredItems = items.filter(item => {
    const q = searchQuery.toLowerCase();
    const matchSearch = !q ||
      (item.title || "").toLowerCase().includes(q) ||
      (item.author || "").toLowerCase().includes(q);
    const matchCat = (selectedCategoryId === null || selectedCategoryId === "all") 
      ? true 
      : (item.categoryId?.toString() === selectedCategoryId || item.category?.id?.toString() === selectedCategoryId);
    
    const matchType = filterType === "ALL" || item.type === filterType;
    
    const year = item.year || 0;
    const matchMin = minYear === "" || year >= parseInt(minYear);
    const matchMax = maxYear === "" || year <= parseInt(maxYear);
    const matchYear = matchMin && matchMax;

    return matchSearch && matchCat && matchType && matchYear;
  }).sort((a, b) => {
    if (sortOrder === "newest") return (b.year || 0) - (a.year || 0);
    if (sortOrder === "oldest") return (a.year || 0) - (b.year || 0);
    if (sortOrder === "a-z") return (a.title || "").localeCompare(b.title || "");
    return 0;
  });

  const getCategoryCount = (catId) => items.filter(i => i.categoryId === catId || i.category?.id === catId).length;

  return (
    <div className="w-full relative select-none">
      
      {/* Glow Ambience */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full blur-[80px] pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
        <div>
          <span className="px-3.5 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-xs font-bold text-emerald-600 dark:text-emerald-500 tracking-wide uppercase">
            RE-Search
          </span>
          <h1 className="text-4xl md:text-5xl font-display font-black tracking-tighter text-slate-900 dark:text-white mt-4 flex items-center gap-3">
            <FolderOpen className="w-9 h-9 text-emerald-500 animate-pulse" />
            {t('literatur.title')}
          </h1>
          <p className="text-slate-500 dark:text-white/50 max-w-xl font-medium text-sm mt-2 leading-relaxed">
            {t('literatur.desc')}
          </p>
        </div>
        
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-white/40" />
          <input
            type="text"
            placeholder={t('literatur.search_placeholder')}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 dark:bg-[#08120e] border border-slate-200 dark:border-white/5 rounded-2xl pl-10 pr-4 py-3 text-sm text-slate-700 dark:text-white focus:outline-none focus:border-emerald-500/50 shadow-inner placeholder:text-slate-400 dark:placeholder:text-white/40"
          />
        </div>
      </div>

      {/* Category or Items View */}
      {isCategoriesView ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            onClick={() => setSelectedCategoryId("all")}
            className="cursor-pointer group relative overflow-hidden rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#090d14] shadow-[0_4px_20px_rgba(0,0,0,0.06)] dark:shadow-none hover:shadow-[0_12px_30px_rgba(16,185,129,0.15)] hover:border-emerald-500/50 hover:-translate-y-1.5 transition-all duration-500"
          >
            <div className="aspect-[4/3] w-full overflow-hidden relative">
               <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-100 dark:from-emerald-900/20 to-slate-50 dark:to-[#090d14]">
                 <FolderOpen className="w-20 h-20 text-emerald-500/40 group-hover:scale-110 group-hover:text-emerald-500/70 transition-all duration-500" />
               </div>
               <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent" />
               <div className="absolute bottom-6 left-6 right-6">
                  <h3 className="text-2xl font-black text-white mb-2 group-hover:text-emerald-300 transition-colors">{t('literatur.all_categories')}</h3>
                  <p className="text-slate-200 text-sm line-clamp-2">{t('literatur.all_categories_desc')}</p>
               </div>
               <div className="absolute top-4 right-4 bg-emerald-500 text-white text-[10px] font-black uppercase px-3 py-1.5 rounded-full shadow-md">
                  {items.length} {t('literatur.total_literatur')}
               </div>
            </div>
          </motion.div>

          {categories.map((cat, index) => (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: (index + 1) * 0.05 }}
              key={cat.id}
              onClick={() => setSelectedCategoryId(cat.id.toString())}
              className="cursor-pointer group relative overflow-hidden rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#090d14] shadow-[0_4px_20px_rgba(0,0,0,0.06)] dark:shadow-none hover:shadow-[0_12px_30px_rgba(16,185,129,0.15)] hover:border-emerald-500/50 hover:-translate-y-1.5 transition-all duration-500"
            >
              <div className="aspect-[4/3] w-full overflow-hidden relative bg-slate-900">
                 {cat.imageUrl ? (
                   <img 
                     src={resolveImageUrl(cat.imageUrl)} 
                     alt={cat.name}
                     className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-90 group-hover:opacity-100" 
                   />
                 ) : (
                   <div className="w-full h-full bg-slate-900 flex items-center justify-center text-emerald-500/30">
                     <FileText className="w-16 h-16" />
                   </div>
                 )}
                 <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent" />
                 <div className="absolute bottom-6 left-6 right-6">
                    <h3 className="text-2xl font-black text-white mb-2 group-hover:text-emerald-300 transition-colors leading-tight break-words">{cat.name}</h3>
                    <p className="text-slate-200 text-sm line-clamp-2 leading-relaxed break-words">{cat.description || t('literatur.category_desc_fallback')}</p>
                 </div>
                 <div className="absolute top-4 right-4 bg-emerald-500 text-white text-[10px] font-black uppercase px-3 py-1.5 rounded-full shadow-md">
                    {getCategoryCount(cat.id)} {t('literatur.literatur_count')}
                 </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <>
          {/* Header & Filters for Items View */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
              <button
                onClick={() => { 
                  setSelectedCategoryId(null); 
                  setSearchQuery(""); 
                  setFilterType("ALL"); 
                  setMinYear(""); 
                  setMaxYear("");
                  setSortOrder("newest");
                }}
                className="px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all bg-white dark:bg-white/5 text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10 flex items-center gap-2 border border-slate-200 dark:border-white/10 shadow-sm"
              >
                ← {t('literatur.back')}
              </button>
              <div className="w-px h-6 bg-slate-300 dark:bg-white/10" />
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {searchQuery ? t('literatur.search_result').replace('{query}', searchQuery) : 
                  (selectedCategoryId === "all" ? t('literatur.all_categories') : 
                    (categories.find(c => c.id.toString() === selectedCategoryId)?.name || t('literatur.category')))}
              </h2>
            </div>
            
            {/* Filter Button */}
            <button
              onClick={() => setIsFilterModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 text-xs font-bold uppercase tracking-wider hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-all shadow-sm"
            >
              <Filter className="w-4 h-4" />
              {t('literatur.filter_sort')}
            </button>
          </div>

          {/* Filter Modal */}
          <AnimatePresence>
            {isFilterModalOpen && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsFilterModalOpen(false)}
                  className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md bg-white dark:bg-[#090d14] border border-slate-200 dark:border-white/10 rounded-3xl p-6 md:p-8 z-50 shadow-2xl"
                >
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <Filter className="w-5 h-5 text-emerald-500" />
                      {t('literatur.filter_title')}
                    </h3>
                    <button 
                      onClick={() => setIsFilterModalOpen(false)}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors p-2"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-6">
                    {/* Jenis Filter */}
                    <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-white/50 uppercase tracking-wider mb-3">
                        {t('literatur.filter_type')}
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { value: "ALL", label: t('literatur.type_all') },
                          { value: "PDF", label: t('literatur.type_pdf') },
                          { value: "DOC", label: t('literatur.type_doc') },
                          { value: "SLIDES", label: t('literatur.type_slides') },
                          { value: "VIDEO", label: t('literatur.type_video') },
                          { value: "OTHER", label: t('literatur.type_other') }
                        ].map(tObj => (
                          <button
                            key={tObj.value}
                            onClick={() => setFilterType(tObj.value)}
                            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                              filterType === t.value 
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 shadow-sm" 
                                : "bg-slate-50 dark:bg-black/20 text-slate-500 dark:text-white/50 border-slate-200 dark:border-white/5 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 hover:border-slate-300 dark:hover:border-white/10"
                            }`}
                          >
                            {tObj.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Tahun Range */}
                    <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-white/50 uppercase tracking-wider mb-2">
                        {t('literatur.filter_year')}
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="number"
                          placeholder="Min (Cth: 2010)"
                          value={minYear}
                          onChange={e => setMinYear(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-black/20 text-slate-700 dark:text-white border border-slate-200 dark:border-white/10 text-sm font-medium rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 transition-colors shadow-inner placeholder:text-slate-400 dark:placeholder:text-white/20"
                        />
                        <span className="text-slate-400 font-bold">-</span>
                        <input
                          type="number"
                          placeholder="Max (Cth: 2024)"
                          value={maxYear}
                          onChange={e => setMaxYear(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-black/20 text-slate-700 dark:text-white border border-slate-200 dark:border-white/10 text-sm font-medium rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 transition-colors shadow-inner placeholder:text-slate-400 dark:placeholder:text-white/20"
                        />
                      </div>
                    </div>

                    {/* Urutkan */}
                    <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-white/50 uppercase tracking-wider mb-3">
                        {t('literatur.filter_sort_by')}
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { value: "newest", label: t('literatur.sort_newest') },
                          { value: "oldest", label: t('literatur.sort_oldest') },
                          { value: "a-z", label: t('literatur.sort_az') }
                        ].map(s => (
                          <button
                            key={s.value}
                            onClick={() => setSortOrder(s.value)}
                            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                              sortOrder === s.value 
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 shadow-sm" 
                                : "bg-slate-50 dark:bg-black/20 text-slate-500 dark:text-white/50 border-slate-200 dark:border-white/5 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 hover:border-slate-300 dark:hover:border-white/10"
                            }`}
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 flex gap-3">
                    <button
                      onClick={() => {
                        setFilterType("ALL");
                        setMinYear("");
                        setMaxYear("");
                        setSortOrder("newest");
                      }}
                      className="flex-1 py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-white/70 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
                    >
                      {t('literatur.reset')}
                    </button>
                    <button
                      onClick={() => setIsFilterModalOpen(false)}
                      className="flex-1 py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider bg-emerald-500 text-white hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20"
                    >
                      {t('literatur.apply')}
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* Grid List for Items */}
          {filteredItems.length === 0 ? (
            <div className="py-24 flex flex-col items-center justify-center text-center bg-white dark:bg-[#08120e] border border-dashed border-slate-200 dark:border-white/5 rounded-3xl">
              <FolderOpen className="w-12 h-12 text-slate-300 dark:text-white/10 mb-4 animate-pulse" />
              <h3 className="text-lg font-black text-slate-900 dark:text-white mb-1">{t('literatur.not_found')}</h3>
              <p className="text-slate-500 dark:text-white/40 text-xs max-w-xs leading-relaxed mt-1">{t('literatur.not_found_desc')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredItems.map((item, index) => (
                <motion.a
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: (index % 4) * 0.05 }}
                  key={item.id}
                  href={`/officer/literatur/${item.id}`}
                  className="relative bg-white dark:bg-[#090d14] border border-slate-200 dark:border-white/10 rounded-3xl overflow-hidden cursor-pointer group hover:border-emerald-500/50 transition-all duration-500 transform-gpu hover:-translate-y-1.5 flex flex-col h-full shadow-[0_4px_20px_rgba(0,0,0,0.06)] dark:shadow-none hover:shadow-[0_12px_30px_rgba(16,185,129,0.15)]"
                >
                  {/* Category Cover */}
                  <div className="relative aspect-[16/9] w-full overflow-hidden shrink-0 bg-slate-100 dark:bg-slate-900 border-b border-slate-100 dark:border-white/5">
                    {item.category?.imageUrl ? (
                      <img
                        src={resolveImageUrl(item.category.imageUrl)}
                        alt=""
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-emerald-500/40 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-[#090d14]">
                        <FolderOpen className="w-14 h-14" />
                      </div>
                    )}
                    
                    {/* Subtle gradient vignette */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                    
                    {/* Badges */}
                    <div className="absolute top-3.5 left-3.5 z-10 flex gap-2">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 backdrop-blur-md shadow-sm border bg-white/95 dark:bg-black/70 ${
                        TYPE_COLORS[item.type] || TYPE_COLORS.OTHER
                      }`}>
                        {item.type || "OTHER"}
                      </span>
                    </div>
                  </div>

                  {/* Title & metadata */}
                  <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between z-10 bg-white dark:bg-[#090d14]">
                    <div>
                      <h3 className="font-extrabold text-slate-900 dark:text-white text-base sm:text-lg line-clamp-2 mb-3 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors duration-300 leading-snug tracking-tight break-words">
                        {item.title}
                      </h3>
                      <div className="space-y-2 mb-5">
                        {item.author && (
                          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 font-medium">
                            <User className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <span className="truncate">{item.author}</span>
                          </div>
                        )}
                        {item.year && (
                          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 font-medium">
                            <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <span>{t('literatur.year')} {item.year}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-white/10">
                      <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 tracking-wider uppercase flex items-center gap-1.5 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        {t('literatur.open')}
                      </span>
                      <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200/80 dark:border-white/5 flex items-center justify-center group-hover:bg-emerald-500 group-hover:border-emerald-500 group-hover:text-white text-slate-500 dark:text-slate-400 transition-all duration-300 group-hover:scale-110 shadow-sm">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>
                </motion.a>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
