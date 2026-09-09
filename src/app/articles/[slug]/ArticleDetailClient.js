"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence, useScroll, useSpring } from "framer-motion";
import { 
  ChevronLeft, Calendar, Tag, Image as ImageIcon, Globe, Check, 
  Clock, Share2, Copy, ArrowRight, ArrowUp, Bookmark, Sparkles,
  Send, BookOpen, Layers
} from "lucide-react";
import { useTheme } from "next-themes";
import { resolveImageUrl } from "@/lib/imageUrl";
import { getCategoryBadgeStyle } from "@/app/(dashboard)/content/ContentClient";

const TwitterIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const LinkedinIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.45c-.93 0-1.68.75-1.68 1.68s.75 1.68 1.68 1.68 1.68-.75 1.68-1.68-.75-1.68-1.68-1.68Z"/>
  </svg>
);

export default function ArticleDetailClient({ articleData, relatedArticles = [] }) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  // 1. Language state: "en" (default) or "id"
  const [currentLang, setCurrentLang] = useState("en");
  const [copied, setCopied] = useState(false);
  const [fontSizeMultiplier, setFontSizeMultiplier] = useState(1); // 0.92 (small), 1 (normal), 1.12 (large)
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted ? resolvedTheme === "dark" : true;

  // 2. Reading progress bar
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  // Track scroll position for Back to Top button
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 400) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // 3. Active Title & Body based on language selection
  const displayTitle = currentLang === "id" && articleData.titleId ? articleData.titleId : articleData.title;
  const displayBody = currentLang === "id" && articleData.bodyId ? articleData.bodyId : articleData.body;
  const isFallbackToEnglish = currentLang === "id" && !articleData.bodyId;

  // 4. Calculate estimated reading time & word count
  const { readTimeMin, wordCount } = useMemo(() => {
    const plainText = (displayBody || "").replace(/<[^>]*>?/gm, " ");
    const words = plainText.trim().split(/\s+/).filter(Boolean).length;
    const minutes = Math.max(1, Math.ceil(words / 200));
    return { readTimeMin: minutes, wordCount: words };
  }, [displayBody]);

  // 5. Share Handlers
  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const shareToTwitter = () => {
    if (typeof window !== "undefined") {
      const text = encodeURIComponent(`Baca artikel: "${displayTitle}" di SRE UPN Veteran Jawa Timur`);
      window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(window.location.href)}`, "_blank");
    }
  };

  const shareToLinkedin = () => {
    if (typeof window !== "undefined") {
      window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`, "_blank");
    }
  };

  const shareToWhatsApp = () => {
    if (typeof window !== "undefined") {
      const text = encodeURIComponent(`*${displayTitle}*\n\nBaca selengkapnya di SRE UPNVJT:\n${window.location.href}`);
      window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
    }
  };

  return (
    <div className="min-h-screen bg-[#0bb37e] dark:bg-[#07130e] text-white font-sans selection:bg-yellow-300 selection:text-slate-950 relative transition-colors duration-500">
      
      {/* ── Scroll Progress Bar ────────────────────────────────────────── */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-yellow-300 via-primary to-emerald-400 z-60 origin-left shadow-lg shadow-primary/30"
        style={{ scaleX }}
      />

      {/* ── Ambient Radial Glows Background ────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-primary/20 dark:bg-primary/12 rounded-full blur-[160px]" />
        <div className="absolute top-[600px] -right-40 w-[600px] h-[600px] bg-emerald-400/20 dark:bg-emerald-600/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-20 -left-40 w-[600px] h-[600px] bg-yellow-400/15 dark:bg-yellow-400/8 rounded-full blur-[160px]" />
      </div>

      <main className="relative z-10 pt-20 sm:pt-32 pb-16 sm:pb-24 px-4 sm:px-8 max-w-4xl lg:max-w-5xl xl:max-w-5xl mx-auto">
        
        {/* ── Sleek Top Navigation Bar (Back + Compact Language Switcher) ── */}
        <div className="flex items-center justify-between gap-3 mb-6 sm:mb-8">
          <Link 
            href="/articles" 
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-white/90 hover:text-yellow-300 transition-colors py-1.5 px-2.5 -ml-2.5 rounded-lg hover:bg-white/10"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Semua Artikel</span>
          </Link>

          {/* Compact Bilingual Switcher */}
          <div className="inline-flex items-center bg-black/20 dark:bg-black/50 border border-white/20 p-1 rounded-xl backdrop-blur-md">
            <button
              onClick={() => setCurrentLang("en")}
              className={`px-2.5 sm:px-3 py-1 rounded-lg text-[11px] font-bold tracking-wide transition-all cursor-pointer ${
                currentLang === "en"
                  ? "bg-yellow-300 text-slate-950 font-black shadow-sm"
                  : "text-white/70 hover:text-white"
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setCurrentLang("id")}
              className={`px-2.5 sm:px-3 py-1 rounded-lg text-[11px] font-bold tracking-wide transition-all cursor-pointer ${
                currentLang === "id"
                  ? "bg-yellow-300 text-slate-950 font-black shadow-sm"
                  : "text-white/70 hover:text-white"
              }`}
            >
              ID
            </button>
          </div>
        </div>

        {/* Fallback Notice if ID not translated */}
        {isFallbackToEnglish && (
          <motion.div 
            initial={{ opacity: 0, y: -8 }} 
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-3 sm:p-4 rounded-2xl bg-black/20 border border-yellow-300/40 text-yellow-200 text-xs font-medium flex items-center gap-2.5 backdrop-blur-md"
          >
            <Globe className="w-4 h-4 shrink-0 text-yellow-300" />
            <span>Versi Bahasa Indonesia belum tersedia. Konten ditampilkan dalam Bahasa Inggris.</span>
          </motion.div>
        )}

        {/* ── Article Header ────────────────────────────────────────────── */}
        <header className="mb-6 sm:mb-8">
          
          {/* Category & Meta info in single clean row */}
          <div className="flex flex-wrap items-center gap-2.5 text-xs font-semibold mb-4 text-white/80">
            {articleData.category?.name && (
              <span className={`px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider shadow-xs ${getCategoryBadgeStyle(articleData.category.color)}`}>
                {articleData.category.name}
              </span>
            )}
            <span>•</span>
            <span>{new Date(articleData.createdAt).toLocaleDateString(currentLang === "id" ? 'id-ID' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            <span>•</span>
            <span className="text-yellow-300 dark:text-emerald-300 font-bold">{readTimeMin} min read</span>
          </div>
          
          {/* Article Title */}
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-[40px] font-black tracking-tight mb-5 leading-tight sm:leading-snug font-display text-white">
            {displayTitle}
          </h1>

          {/* Author & Share Bar in Clean Horizontal Row */}
          <div className="flex items-center justify-between gap-4 py-3 border-y border-white/15 dark:border-white/10 my-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-yellow-300 to-emerald-500 dark:from-primary dark:to-emerald-600 flex items-center justify-center text-slate-950 font-black text-xs sm:text-sm shrink-0 shadow-sm">
                {articleData.author?.name ? articleData.author.name.charAt(0).toUpperCase() : "S"}
              </div>
              <div className="min-w-0 truncate">
                <div className="text-xs sm:text-sm font-bold text-white truncate">
                  {articleData.author?.name || "Editorial Team"}
                </div>
                <div className="text-[11px] text-white/70 truncate">SRE UPN Veteran Jawa Timur</div>
              </div>
            </div>

            {/* Clean Share Buttons */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button 
                onClick={handleCopyLink} 
                className={`p-2 rounded-xl transition-all cursor-pointer ${copied ? 'bg-yellow-300 text-slate-950' : 'hover:bg-white/15 text-white/80 hover:text-white'}`}
                title="Salin tautan"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
              <button 
                onClick={shareToTwitter} 
                className="p-2 rounded-xl hover:bg-white/15 text-white/80 hover:text-white transition-all cursor-pointer"
                title="Share ke X"
              >
                <TwitterIcon className="w-4 h-4" />
              </button>
              <button 
                onClick={shareToLinkedin} 
                className="p-2 rounded-xl hover:bg-white/15 text-white/80 hover:text-white transition-all cursor-pointer"
                title="Share ke LinkedIn"
              >
                <LinkedinIcon className="w-4 h-4" />
              </button>
              <button 
                onClick={shareToWhatsApp} 
                className="p-2 rounded-xl hover:bg-white/15 text-white/80 hover:text-white transition-all cursor-pointer"
                title="Share ke WhatsApp"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* ── Cover Image (Clean Cinematic) ──────────────────────────────── */}
        {articleData.imageUrl ? (
          <div className="relative w-full aspect-video md:aspect-[16/9] max-h-[540px] rounded-2xl sm:rounded-3xl overflow-hidden mb-8 shadow-xl bg-black/30">
            <img 
              src={resolveImageUrl(articleData.imageUrl)} 
              alt={displayTitle} 
              className="w-full h-full object-cover object-center"
            />
          </div>
        ) : null}

        {/* ── Clean Reading Canvas (Free from cramped boxes) ─────────────── */}
        <div className="bg-[#099c6d]/40 dark:bg-[#07150f]/80 border border-white/15 dark:border-white/10 rounded-2xl sm:rounded-3xl p-5 sm:p-10 md:p-12 shadow-xl backdrop-blur-md mb-12">
          
          {/* Subtle Font Scale Bar */}
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-white/15 text-xs text-white/70">
            <div className="flex items-center gap-1.5 font-medium">
              <BookOpen className="w-3.5 h-3.5 text-yellow-300" />
              <span>{wordCount} kata</span>
            </div>
            
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-white/50 mr-1">Teks:</span>
              <button 
                onClick={() => setFontSizeMultiplier(0.88)} 
                className={`px-2 py-0.5 rounded-md font-bold text-xs transition-colors cursor-pointer ${fontSizeMultiplier === 0.88 ? 'bg-yellow-300 text-slate-950 font-black' : 'bg-black/20 hover:bg-black/40 text-white'}`}
              >
                A-
              </button>
              <button 
                onClick={() => setFontSizeMultiplier(1)} 
                className={`px-2 py-0.5 rounded-md font-bold text-xs transition-colors cursor-pointer ${fontSizeMultiplier === 1 ? 'bg-yellow-300 text-slate-950 font-black' : 'bg-black/20 hover:bg-black/40 text-white'}`}
              >
                A
              </button>
              <button 
                onClick={() => setFontSizeMultiplier(1.18)} 
                className={`px-2 py-0.5 rounded-md font-bold text-xs transition-colors cursor-pointer ${fontSizeMultiplier === 1.18 ? 'bg-yellow-300 text-slate-950 font-black' : 'bg-black/20 hover:bg-black/40 text-white'}`}
              >
                A+
              </button>
              <button 
                onClick={() => setFontSizeMultiplier(1.35)} 
                className={`px-2 py-0.5 rounded-md font-bold text-xs transition-colors cursor-pointer ${fontSizeMultiplier === 1.35 ? 'bg-yellow-300 text-slate-950 font-black' : 'bg-black/20 hover:bg-black/40 text-white'}`}
              >
                A++
              </button>
            </div>
          </div>

          {/* Render Rich HTML Article Content */}
          <article 
            key={`${currentLang}-${isDark ? 'dark' : 'light'}`}
            style={{ fontSize: `${fontSizeMultiplier * 100}%` }}
            className="article-html-content transition-all duration-300"
            dangerouslySetInnerHTML={{ __html: displayBody }}
          />

          {/* End divider */}
          <div className="flex items-center justify-center gap-3 my-10 pt-6 border-t border-white/15">
            <span className="w-10 h-0.5 bg-gradient-to-r from-transparent to-yellow-300" />
            <Sparkles className="w-4 h-4 text-yellow-300" />
            <span className="w-10 h-0.5 bg-gradient-to-l from-transparent to-yellow-300" />
          </div>

          {/* Bottom Share Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left pt-2">
            <div>
              <h4 className="text-sm sm:text-base font-bold text-white">Bagikan wawasan ini</h4>
              <p className="text-[11px] text-white/70">Akselerasi transisi energi bersih dengan menyebarkan artikel ini.</p>
            </div>
            
            <button
              onClick={handleCopyLink}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-yellow-300 hover:bg-yellow-400 text-slate-950 font-black text-xs transition-all shadow-md cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? "Tautan Tersalin!" : "Salin Tautan Artikel"}</span>
            </button>
          </div>
        </div>

        {/* ── Related Articles Section ──────────────────────────────────── */}
        {relatedArticles.length > 0 && (
          <section className="space-y-4 sm:space-y-6">
            <div className="flex items-center justify-between border-b-2 border-white/20 dark:border-white/10 pb-3 sm:pb-4">
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight font-display">Artikel Lainnya</h3>
                <p className="text-[11px] sm:text-xs text-white/70 dark:text-white/50">Jelajahi wawasan energi terbarukan lainnya</p>
              </div>
              <Link href="/articles" className="text-xs font-black text-yellow-300 hover:underline flex items-center gap-1">
                <span>Lihat Semua</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
              {relatedArticles.map((item) => (
                <Link key={item.id} href={`/articles/${item.slug}`} className="group block">
                  <div className="bg-[#099c6d] dark:bg-[#091b13] border-2 border-white/20 dark:border-white/10 rounded-2xl overflow-hidden hover:border-yellow-300 hover:shadow-xl transition-all duration-300 h-full flex flex-col hover:-translate-y-1">
                    <div className="h-40 bg-black/40 relative overflow-hidden">
                      {item.imageUrl ? (
                        <img 
                          src={resolveImageUrl(item.imageUrl)} 
                          alt={item.title} 
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-primary/10">
                          <ImageIcon className="w-8 h-8 text-yellow-300 dark:text-primary/40" />
                        </div>
                      )}
                      {item.category?.name && (
                        <div className="absolute top-2.5 left-2.5">
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase border shadow-md ${getCategoryBadgeStyle(item.category.color)}`}>
                            {item.category.name}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <h4 className="text-sm font-bold text-white line-clamp-2 mb-2 group-hover:text-yellow-300 transition-colors">
                        {item.title}
                      </h4>
                      <p className="text-[11px] text-white/80 dark:text-white/60 line-clamp-2 mb-3">
                        {item.body ? item.body.replace(/<[^>]*>?/gm, '') : ""}
                      </p>
                      <div className="flex items-center justify-between text-[10px] text-white/60 dark:text-white/40 pt-2 border-t border-white/15 dark:border-white/10 mt-auto">
                        <span>{new Date(item.createdAt).toLocaleDateString('id-ID', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        <span className="text-yellow-300 dark:text-primary font-black flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                          Baca <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

      </main>

      {/* ── Floating Back to Top Button ───────────────────────────────── */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            onClick={scrollToTop}
            className="fixed bottom-5 right-5 sm:bottom-8 sm:right-8 z-50 p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-yellow-300 hover:bg-yellow-400 text-slate-950 shadow-2xl shadow-yellow-300/30 border-2 border-white/30 transition-all cursor-pointer hover:scale-110 active:scale-95"
            title="Kembali ke atas"
          >
            <ArrowUp className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
          </motion.button>
        )}
      </AnimatePresence>

    </div>
  );
}
