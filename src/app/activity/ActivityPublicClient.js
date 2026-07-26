"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, MapPin, Sparkles, Filter, Activity as ActivityIcon, ArrowUpRight, Tag } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";

export default function ActivityPublicClient({ activities = [] }) {
  const { language, t } = useLanguage();
  const [selectedType, setSelectedType] = useState("ALL");

  const now = new Date();
  
  // Separate upcoming and past activities
  const upcomingActivities = activities
    .filter(a => new Date(a.date) >= now)
    .sort((a, b) => new Date(a.date) - new Date(b.date)); // Closest upcoming first

  const sortedActivities = [...activities].sort((a, b) => new Date(b.date) - new Date(a.date)); // Most recent first

  let featuredActivity = null;
  let remainingActivities = [];
  let isUpcomingFeatured = false;

  if (upcomingActivities.length > 0) {
    featuredActivity = upcomingActivities[0];
    isUpcomingFeatured = true;
    remainingActivities = sortedActivities.filter(a => a.id !== featuredActivity.id);
  } else if (sortedActivities.length > 0) {
    featuredActivity = sortedActivities[0];
    isUpcomingFeatured = false;
    remainingActivities = sortedActivities.slice(1);
  }

  // Categories extracted dynamically from activities
  const types = ["ALL", ...Array.from(new Set(activities.map(a => a.type.toUpperCase()).filter(Boolean)))];

  // Filter remaining activities by selected type tab
  const filteredRemaining = remainingActivities.filter(a => {
    if (selectedType === "ALL") return true;
    return (a.type || "").toUpperCase() === selectedType;
  });

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    try {
      return new Date(dateStr).toLocaleDateString(language === "id" ? "id-ID" : "en-US", {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="min-h-screen bg-[#0cc48a] dark:bg-[#07130e] text-white pt-20 font-sans transition-colors duration-300">
      {/* ── HERO BANNER SECTION ── */}
      <section className="relative py-20 md:py-28 px-6 md:px-12 flex items-center overflow-hidden border-b border-white/10 bg-[#0cc48a] dark:bg-[#07130e] transition-colors duration-300">
        {/* Background Image of SRE Meeting */}
        <div 
          className="absolute inset-0 bg-cover bg-center scale-110 md:scale-120 pointer-events-none"
          style={{ backgroundImage: 'url("/images/about/sre%20first%20meet.jpg")' }}
        />
        {/* Creative Left-to-Right Fading Gradient Mask to make it distinct from the About page and remove yellow tint */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#032218] via-[#0aa373]/95 to-[#0cc48a]/65 dark:from-[#050c09] dark:via-[#07130e]/95 dark:to-[#07130e]/30 pointer-events-none transition-colors duration-300" />

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl"
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-yellow-300/15 border border-yellow-300/30 text-yellow-300 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider mb-6 backdrop-blur-md">
              <Sparkles className="w-4 h-4 text-yellow-300 dark:text-emerald-400" />
              SRE UPN VETERAN JATIM
            </div>
            
            <h1 className="text-4xl md:text-6xl font-display font-black tracking-tight uppercase leading-tight text-white mb-6">
              {t("visitor.activity.title").split(" & ")[0]} & <span className="text-yellow-300 dark:text-emerald-400">{t("visitor.activity.title").split(" & ")[1]}</span>
            </h1>

            <p className="text-lg md:text-xl text-white dark:text-gray-300 font-light leading-relaxed mb-8 max-w-2xl">
              {t("visitor.activity.subtitle")}
            </p>

            <div className="flex items-center gap-4 text-sm font-semibold text-white/80 dark:text-gray-400">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-300 dark:bg-emerald-400 animate-pulse" />
                {activities.length} {t("visitor.activity.total_act")}
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── FEATURED / LATEST ACTIVITY SECTION (100% DINAMIS) ── */}
      {featuredActivity && (
        <section className="py-16 md:py-24 px-6 md:px-12 relative overflow-hidden bg-[#e8ecc4] dark:bg-white/[0.01] transition-colors duration-300">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="bg-white border border-[#d0d6a8] dark:bg-white/[0.02] dark:border-white/10 rounded-3xl p-6 md:p-10 shadow-lg backdrop-blur-2xl hover:border-[#0cc48a]/40 dark:hover:border-emerald-500/30 transition-all duration-500 group relative overflow-hidden"
            >
              {/* Background Glow */}
              <div className="absolute -top-32 -right-32 w-80 h-80 bg-[#0cc48a]/10 dark:bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-[#0cc48a]/20 dark:group-hover:bg-emerald-500/20 transition-all duration-500" />

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 items-center">
                {/* Left: Featured Image */}
                <div className="lg:col-span-6 relative rounded-2xl overflow-hidden shadow-xl aspect-[16/10] bg-[#07130e]/40 dark:bg-emerald-950/40 border border-[#d0d6a8] dark:border-white/10 group-hover:scale-[1.01] transition-transform duration-500">
                  {featuredActivity.imageUrl ? (
                    <img
                      src={featuredActivity.imageUrl}
                      alt={featuredActivity.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-[#07130e]/60 dark:text-gray-500 p-8 text-center bg-[#07130e]/5 dark:bg-emerald-950/20">
                      <ActivityIcon className="w-16 h-16 text-[#0cc48a]/30 dark:text-emerald-500/30 mb-3" />
                      <span className="text-xs uppercase font-bold tracking-widest text-[#0cc48a]/50 dark:text-emerald-500/50">{t("visitor.activity.no_image")}</span>
                    </div>
                  )}

                  {/* Category Pill Tag Overlay */}
                  <div className="absolute top-4 left-4 z-20">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider bg-black/60 text-yellow-300 dark:text-emerald-400 backdrop-blur-md border border-white/10 shadow-lg">
                      <Tag className="w-3.5 h-3.5" />
                      {featuredActivity.type || "EVENT"}
                    </span>
                  </div>
                </div>

                {/* Right: Detailed Content */}
                <div className="lg:col-span-6 flex flex-col justify-center gap-5">
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-widest shadow-sm ${
                      isUpcomingFeatured 
                        ? "bg-amber-500/10 text-amber-800 border border-amber-500/20 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30" 
                        : "bg-[#0cc48a]/10 text-[#07130e] border border-[#0cc48a]/20 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30"
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${isUpcomingFeatured ? "bg-amber-500 animate-ping" : "bg-[#0cc48a] dark:bg-emerald-400 animate-pulse"}`} />
                      {isUpcomingFeatured ? t("visitor.activity.upcoming") : t("visitor.activity.latest")}
                    </span>
                  </div>

                  <h2 className="text-3xl md:text-4xl font-display font-black text-[#07130e] dark:text-white tracking-tight leading-tight group-hover:text-[#0cc48a] dark:group-hover:text-emerald-400 transition-colors duration-300">
                    {featuredActivity.name}
                  </h2>

                  <p className="text-[#07130e]/80 dark:text-gray-300 text-sm md:text-base leading-relaxed font-normal whitespace-pre-line line-clamp-4">
                    {featuredActivity.description || t("visitor.activity.no_desc")}
                  </p>

                  {/* Metadata Bar */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-[#d0d6a8] dark:border-white/10 mt-2">
                    {featuredActivity.date && (
                      <div className="flex items-center gap-3 text-sm text-[#07130e] dark:text-gray-300">
                        <div className="w-9 h-9 rounded-xl bg-[#0cc48a]/10 border border-[#0cc48a]/20 dark:bg-emerald-500/10 dark:border-emerald-500/20 flex items-center justify-center text-[#0cc48a] dark:text-emerald-400 shrink-0">
                          <Calendar className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold tracking-wider text-[#07130e]/60 dark:text-gray-400 block">{t("visitor.activity.date")}</span>
                          <span className="font-semibold text-[#07130e] dark:text-white">{formatDate(featuredActivity.date)}</span>
                        </div>
                      </div>
                    )}

                    {featuredActivity.location && (
                      <div className="flex items-center gap-3 text-sm text-[#07130e] dark:text-gray-300">
                        <div className="w-9 h-9 rounded-xl bg-[#0cc48a]/10 border border-[#0cc48a]/20 dark:bg-emerald-500/10 dark:border-emerald-500/20 flex items-center justify-center text-[#0cc48a] dark:text-emerald-400 shrink-0">
                          <MapPin className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold tracking-wider text-[#07130e]/60 dark:text-gray-400 block">{t("visitor.activity.location")}</span>
                          <span className="font-semibold text-[#07130e] dark:text-white truncate max-w-[180px] block">{featuredActivity.location}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* ── OTHER ACTIVITIES SECTION ── */}
      <section className="scroll-mt-20 py-16 md:py-24 px-6 md:px-12 relative border-t border-white/15 dark:border-white/10 bg-[#08a270] dark:bg-[#050e0a] transition-colors duration-300">
        <div className="max-w-7xl mx-auto">
          {/* Header & Category Filters */}
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div>
              <span className="text-xs font-black text-yellow-300 dark:text-emerald-400 tracking-widest uppercase mb-2 block">
                {t("visitor.activity.archive_title")}
              </span>
              <h2 className="text-3xl md:text-4xl font-display font-black text-white uppercase tracking-tight">
                {t("visitor.activity.our_events_prefix")}<span className="text-yellow-300 dark:text-emerald-400">{t("visitor.activity.our_events_highlight")}</span>
              </h2>
            </div>

            {/* Filter Tabs */}
            {types.length > 1 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
                {types.map(tabType => (
                  <button
                    key={tabType}
                    onClick={() => setSelectedType(tabType)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 border ${
                      selectedType === tabType
                        ? "bg-yellow-300 text-[#07130e] border-yellow-300 shadow-lg shadow-yellow-300/20 dark:bg-emerald-500 dark:text-black dark:border-emerald-500 dark:shadow-emerald-500/20"
                        : "bg-white/10 hover:bg-white/20 text-white border-white/10 hover:text-yellow-300 dark:bg-white/5 dark:hover:bg-white/10 dark:text-gray-300 dark:hover:text-white dark:border-white/5"
                    }`}
                  >
                    {tabType === "ALL" ? t("visitor.articles.all_topics") : tabType}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Cards Grid */}
          {filteredRemaining.length === 0 ? (
            <div className="text-center py-20 bg-white/10 dark:bg-white/[0.01] border border-dashed border-white/20 dark:border-white/10 rounded-3xl">
              <ActivityIcon className="w-12 h-12 text-yellow-300/60 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-white mb-1">{t("visitor.activity.no_act_found")}</h3>
              <p className="text-xs text-white/70 dark:text-gray-400 max-w-sm mx-auto">
                {activities.length === 0
                  ? t("visitor.activity.no_act_db")
                  : t("visitor.activity.no_act_filter")}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredRemaining.map((act, idx) => (
                <motion.div
                  key={act.id || idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.08 }}
                  className="group flex flex-col bg-white/10 border border-white/20 hover:border-yellow-300/40 dark:bg-white/[0.02] dark:border-white/10 dark:hover:border-emerald-500/40 rounded-3xl overflow-hidden shadow-xl hover:-translate-y-1 hover:shadow-2xl hover:shadow-yellow-300/10 dark:hover:shadow-emerald-500/10 transition-all duration-500 backdrop-blur-xl"
                >
                  {/* Image Top */}
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#07130e]/40 dark:bg-emerald-950/40">
                    {act.imageUrl ? (
                      <img
                        src={act.imageUrl}
                        alt={act.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white/50 bg-[#07130e]/20 dark:bg-emerald-950/20">
                        <ActivityIcon className="w-10 h-10 text-yellow-300/30 dark:text-emerald-500/20" />
                      </div>
                    )}
                    
                    <div className="absolute inset-0 bg-gradient-to-t from-[#07130e] via-transparent to-transparent opacity-60" />

                    <div className="absolute top-3 left-3">
                      <span className="px-3 py-1 rounded-xl bg-black/60 text-yellow-300 dark:text-emerald-400 border border-white/10 text-[10px] font-black uppercase tracking-wider backdrop-blur-md">
                        {act.type || "EVENT"}
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-white group-hover:text-yellow-300 dark:group-hover:text-emerald-400 transition-colors duration-300 mb-3 line-clamp-1">
                        {act.name}
                      </h3>
                      <p className="text-white/90 dark:text-gray-300 text-xs leading-relaxed mb-6 line-clamp-3">
                        {act.description || t("visitor.activity.no_desc")}
                      </p>
                    </div>

                    {/* Metadata */}
                    <div className="pt-4 border-t border-white/15 dark:border-white/10 flex flex-col gap-2">
                      {act.date && (
                        <div className="flex items-center gap-2.5 text-xs text-white/90 dark:text-gray-400 font-semibold">
                          <Calendar className="w-3.5 h-3.5 text-yellow-300 dark:text-emerald-400 shrink-0" />
                          <span>{formatDate(act.date)}</span>
                        </div>
                      )}
                      {act.location && (
                        <div className="flex items-center gap-2.5 text-xs text-white/90 dark:text-gray-400 font-semibold">
                          <MapPin className="w-3.5 h-3.5 text-yellow-300 dark:text-emerald-400 shrink-0" />
                          <span className="truncate">{act.location}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
