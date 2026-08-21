"use client";

import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Link as LinkIcon, Plus, Copy, ExternalLink, Activity, 
  Search, ArrowRight, Loader2, Check, AlertCircle, Clock, X,
  Trash2, Edit3, Sparkles, QrCode, MousePointerClick, TrendingUp,
  Share2, CheckCircle2, User, Globe, Link2, ShieldCheck, ArrowUpRight
} from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/i18n/LanguageProvider";

export default function ShortlinkClient({ initialLinks = [] }) {
  const { t } = useLanguage();
  const [links, setLinks] = useState(initialLinks);
  const [searchQuery, setSearchQuery] = useState("");
  const [notification, setNotification] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Modal Form State (Pop-up Modal)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ slug: "", originalUrl: "", description: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Delete Modal State
  const [deleteId, setDeleteId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // QR Code Modal State
  const [qrModal, setQrModal] = useState({ isOpen: false, link: null });

  // Realtime Slug Check State
  const [isSlugAvailable, setIsSlugAvailable] = useState(null);
  const [isCheckingSlug, setIsCheckingSlug] = useState(false);
  
  // Copy State
  const [copiedId, setCopiedId] = useState(null);

  const showNotification = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // KPI Calculations
  const totalClicks = useMemo(() => {
    return links.reduce((acc, curr) => acc + (curr.clicks || 0), 0);
  }, [links]);

  const topLink = useMemo(() => {
    if (!links.length) return null;
    return [...links].sort((a, b) => (b.clicks || 0) - (a.clicks || 0))[0];
  }, [links]);

  const filteredLinks = useMemo(() => {
    return links.filter(link => {
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      return (
        link.slug.toLowerCase().includes(q) ||
        (link.description && link.description.toLowerCase().includes(q)) ||
        (link.originalUrl && link.originalUrl.toLowerCase().includes(q)) ||
        (link.creatorName && link.creatorName.toLowerCase().includes(q))
      );
    });
  }, [links, searchQuery]);

  const handleCopy = (slug, id) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://www.sreupnjatim.com";
    const url = `${origin}/s/${slug}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    showNotification(t("shortlinks.copied_toast", { slug }) || `Tautan /s/${slug} disalin ke papan klip!`, "success");
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Real-time check for slug availability
  useEffect(() => {
    if (!formData.slug) {
      setIsSlugAvailable(null);
      return;
    }

    if (editingId) {
      const originalLink = links.find(l => l.id === editingId);
      if (originalLink && originalLink.slug === formData.slug) {
        setIsSlugAvailable(true);
        return;
      }
    }

    const checkAvailability = async () => {
      setIsCheckingSlug(true);
      try {
        const res = await fetch(`/api/shortlink/check?slug=${encodeURIComponent(formData.slug)}`);
        const data = await res.json();
        setIsSlugAvailable(data.available);
      } catch (err) {
        setIsSlugAvailable(null);
      } finally {
        setIsCheckingSlug(false);
      }
    };

    const delayDebounceFn = setTimeout(() => {
      checkAvailability();
    }, 450);

    return () => clearTimeout(delayDebounceFn);
  }, [formData.slug, editingId, links]);

  const handleOpenForm = (link = null) => {
    if (link) {
      setEditingId(link.id);
      setFormData({ slug: link.slug, originalUrl: link.originalUrl, description: link.description || "" });
      setIsSlugAvailable(true);
    } else {
      setEditingId(null);
      setFormData({ slug: "", originalUrl: "", description: "" });
      setIsSlugAvailable(null);
    }
    setIsModalOpen(true);
    setError(null);
  };

  const handleCloseForm = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ slug: "", originalUrl: "", description: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Slug validation
    const cleanSlug = formData.slug.trim().toLowerCase();
    if (!cleanSlug.match(/^[a-z0-9-_]+$/)) {
      setError("Slug hanya boleh berisi huruf kecil, angka, strip (-), dan garis bawah (_)");
      setLoading(false);
      return;
    }

    if (isSlugAvailable === false && !editingId) {
      setError(t("shortlinks.slug_taken") || "Slug ini sudah dipakai! Silakan pilih nama slug yang lain.");
      setLoading(false);
      return;
    }

    try {
      const url = editingId ? `/api/shortlink/${editingId}` : "/api/shortlink";
      const method = editingId ? "PUT" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          slug: cleanSlug,
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Gagal menyimpan shortlink");
      }

      if (editingId) {
        setLinks(links.map(l => l.id === editingId ? { ...l, ...data } : l));
        showNotification(t("shortlinks.updated_toast") || "Tautan berhasil diperbarui!", "success");
      } else {
        setLinks([data, ...links]);
        showNotification(t("shortlinks.created_toast") || "Tautan baru berhasil dibuat!", "success");
      }
      
      handleCloseForm();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id) => {
    setDeleteId(id);
  };

  const confirmDelete = async (id) => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/shortlink/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal menghapus shortlink");
      
      setLinks(links.filter(l => l.id !== id));
      setDeleteId(null);
      showNotification(t("shortlinks.deleted_toast") || "Tautan berhasil dihapus permanen.", "success");
    } catch (err) {
      showNotification(err.message || "Gagal menghapus tautan", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  const currentHost = typeof window !== "undefined" ? window.location.host : "sreupnjatim.com";

  return (
    <div className="w-full relative space-y-8 transition-colors duration-500 select-none pb-20">
      
      {/* Toast Notification */}
      {mounted && typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className={`fixed top-6 right-6 z-[99999] px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 text-sm font-semibold border backdrop-blur-xl ${
                notification.type === "success"
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-[#071a12]"
                  : "bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400 bg-white dark:bg-[#1a0707]"
              }`}
            >
              {notification.type === "success" ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
              <span>{notification.message}</span>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Background Ambience */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none mix-blend-multiply dark:mix-blend-screen" />
      <div className="absolute top-40 left-10 w-[350px] h-[350px] bg-teal-500/5 dark:bg-teal-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Modern Header Section */}
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
              <Link2 className="w-5 h-5" />
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-bold text-emerald-500 uppercase tracking-widest">
              {t('shortlinks.badge') || "RE-Direct Link Center"}
            </span>
          </div>

          <h1 className="text-3xl md:text-5xl font-display font-black tracking-tighter text-slate-900 dark:text-white leading-tight">
            {t('shortlinks.link_center') || "Manajemen Tautan Singkat"} <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400">
              SRE UPN Veteran Jawa Timur
            </span>
          </h1>
          <p className="text-slate-500 dark:text-white/60 text-sm md:text-base font-medium mt-3 max-w-xl leading-relaxed">
            {t('shortlinks.desc') || "Buat, kelola, bagikan, dan pantau metrik analitik klik tautan resmi organisasi."}
          </p>
        </div>

        <div className="relative z-10 w-full md:w-auto flex items-center gap-3">
          <button
            onClick={() => handleOpenForm()}
            className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs md:text-sm tracking-wider uppercase shadow-[0_4px_20px_rgba(16,185,129,0.35)] hover:shadow-[0_6px_25px_rgba(16,185,129,0.5)] hover:scale-[1.02] active:scale-95 transition-all shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t('shortlinks.create_new') || "Buat Tautan Baru"}</span>
          </button>
        </div>
      </motion.div>

      {/* KPI Stats Grid - Responsive Mobile & Desktop Layout */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        {/* Card 1: Total Links */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="col-span-1 bg-white/70 dark:bg-[#08120e]/70 backdrop-blur-xl border border-slate-200/80 dark:border-white/5 rounded-2xl md:rounded-3xl p-4 md:p-5 shadow-sm hover:border-emerald-500/30 transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[10px] md:text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/40">
              {t('shortlinks.stat_total_links') || "Total Tautan"}
            </span>
            <div className="w-7 h-7 md:w-8 md:h-8 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <Globe className="w-3.5 h-3.5 md:w-4 md:h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">
              {links.length}
            </span>
            <span className="text-[11px] md:text-xs text-emerald-500 font-bold">Links</span>
          </div>
        </motion.div>

        {/* Card 2: Total Clicks */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="col-span-1 bg-white/70 dark:bg-[#08120e]/70 backdrop-blur-xl border border-slate-200/80 dark:border-white/5 rounded-2xl md:rounded-3xl p-4 md:p-5 shadow-sm hover:border-teal-500/30 transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[10px] md:text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/40">
              {t('shortlinks.stat_total_clicks') || "Total Klik"}
            </span>
            <div className="w-7 h-7 md:w-8 md:h-8 rounded-xl bg-teal-500/10 text-teal-500 border border-teal-500/20 flex items-center justify-center shrink-0">
              <MousePointerClick className="w-3.5 h-3.5 md:w-4 md:h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">
              {totalClicks.toLocaleString()}
            </span>
            <span className="text-[11px] md:text-xs text-teal-500 font-bold">Clicks</span>
          </div>
        </motion.div>

        {/* Card 3: Top Performer (Span 2 cols on mobile, 1 col on desktop) */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="col-span-2 lg:col-span-1 bg-white/70 dark:bg-[#08120e]/70 backdrop-blur-xl border border-slate-200/80 dark:border-white/5 rounded-2xl md:rounded-3xl p-4 md:p-5 shadow-sm hover:border-primary/30 transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[10px] md:text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/40">
              {t('shortlinks.stat_top_performer') || "Tautan Terpopuler"}
            </span>
            <div className="w-7 h-7 md:w-8 md:h-8 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0">
              <TrendingUp className="w-3.5 h-3.5 md:w-4 md:h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between gap-2 min-w-0">
            <span className="text-base md:text-xl font-black font-mono text-slate-900 dark:text-white truncate block">
              {topLink ? `/s/${topLink.slug}` : "-"}
            </span>
            <span className="text-[10px] md:text-xs text-emerald-500 font-bold shrink-0">
              {topLink ? `${topLink.clicks || 0} ${t('shortlinks.clicks_word') || 'klik'}` : (t('shortlinks.no_data') || "Belum ada data")}
            </span>
          </div>
        </motion.div>
      </div>

      {/* Search & Action Bar */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-center bg-white/60 dark:bg-[#08120e]/60 border border-slate-200/80 dark:border-white/5 rounded-2xl p-3 backdrop-blur-xl shadow-sm">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-white/30" />
          <input
            type="text"
            placeholder={t('shortlinks.search_ph') || "Cari tautan, slug, atau tujuan URL..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 dark:bg-[#0a1610] border border-slate-200 dark:border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs md:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-medium"
          />
        </div>
        
        <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-white/60 whitespace-nowrap">
          <span>{t('shortlinks.showing') || "Menampilkan:"}</span>
          <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-black">
            {t('shortlinks.links_count', { count: filteredLinks.length }) || `${filteredLinks.length} Tautan`}
          </span>
        </div>
      </div>

      {/* Links Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredLinks.map((link, index) => (
            <motion.div
              key={link.id}
              layout
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: index * 0.04, duration: 0.3 }}
              className="bg-white dark:bg-[#08120e] border border-slate-200 dark:border-white/5 hover:border-emerald-500/30 rounded-3xl p-6 group relative overflow-hidden shadow-sm hover:shadow-xl dark:hover:shadow-[0_10px_30px_rgba(16,185,129,0.1)] transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                {/* Header: Slug & Copy Action */}
                <div className="flex justify-between items-start gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-mono text-[10px] font-bold">
                        SHORTLINK
                      </span>
                    </div>
                    <h3 className="text-lg md:text-xl font-black font-mono text-slate-900 dark:text-white truncate group-hover:text-emerald-500 transition-colors">
                      /s/{link.slug}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setQrModal({ isOpen: true, link })}
                      className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-emerald-500/10 hover:text-emerald-500 text-slate-500 dark:text-white/60 transition-colors cursor-pointer"
                      title={t('shortlinks.view_qr') || "Lihat QR Code"}
                    >
                      <QrCode className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopy(link.slug, link.id)}
                      className={`p-2 rounded-xl transition-all cursor-pointer ${
                        copiedId === link.id 
                          ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/30' 
                          : 'bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-white/60 hover:text-emerald-500 hover:bg-emerald-500/10'
                      }`}
                      title={t('shortlinks.copy_url') || "Salin Tautan Lengkap"}
                    >
                      {copiedId === link.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Destination URL */}
                <a
                  href={link.originalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-white/50 hover:text-emerald-500 mb-4 max-w-full group/dest transition-colors"
                  title={link.originalUrl}
                >
                  <ExternalLink className="w-3.5 h-3.5 shrink-0 opacity-70 group-hover/dest:opacity-100" />
                  <span className="truncate">{link.originalUrl}</span>
                </a>

                {/* Metrics & Info Card */}
                <div className="grid grid-cols-2 gap-2.5 mb-4">
                  <div className="bg-slate-50 dark:bg-black/30 p-3 rounded-2xl border border-slate-100 dark:border-white/5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/30 block mb-0.5">
                      {t('shortlinks.clicks_count_label') || "Jumlah Klik"}
                    </span>
                    <span className="text-xl font-black text-slate-900 dark:text-white tabular-nums">
                      {(link.clicks || 0).toLocaleString()}
                    </span>
                  </div>

                  <div className="bg-slate-50 dark:bg-black/30 p-3 rounded-2xl border border-slate-100 dark:border-white/5 flex flex-col justify-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/30 block mb-1">
                      {t('shortlinks.created_by') || "Dibuat Oleh"}
                    </span>
                    <div className="flex items-center gap-1.5 min-w-0">
                      <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center text-[9px] font-black shrink-0">
                        {link.creatorName?.charAt(0) || "S"}
                      </div>
                      <span className="text-xs font-bold text-slate-700 dark:text-white/70 truncate">
                        {link.creatorName || "Staff"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Description */}
                {link.description && (
                  <p className="text-xs text-slate-400 dark:text-white/40 line-clamp-1 mb-4">
                    {link.description}
                  </p>
                )}
              </div>

              {/* Card Footer: Date & Actions */}
              <div className="pt-3.5 border-t border-slate-100 dark:border-white/5 flex items-center justify-between gap-2 mt-2">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-white/40 font-medium">
                  <Clock className="w-3 h-3 opacity-70" />
                  <span>
                    {link.createdAt ? new Date(link.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "-"}
                  </span>
                </div>
                
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleOpenForm(link)}
                    className="p-2 text-slate-400 hover:text-emerald-500 hover:bg-emerald-500/10 rounded-xl transition-colors cursor-pointer"
                    title={t('shortlinks.edit_tooltip') || "Edit Tautan"}
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(link.id)}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-colors cursor-pointer"
                    title={t('shortlinks.delete_tooltip') || "Hapus Tautan"}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {filteredLinks.length === 0 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-16 flex flex-col items-center justify-center bg-white/50 dark:bg-white/5 border border-dashed border-slate-300 dark:border-white/10 rounded-3xl text-center"
        >
          <div className="p-4 rounded-2xl bg-emerald-500/10 text-emerald-500 mb-4 border border-emerald-500/20">
            <LinkIcon className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
            {searchQuery 
              ? (t('shortlinks.search_empty_title') || "Tautan Tidak Ditemukan") 
              : (t('shortlinks.empty_title') || "Belum Ada Tautan Singkat")}
          </h3>
          <p className="text-xs md:text-sm font-medium text-slate-500 dark:text-white/50 max-w-sm mb-6">
            {searchQuery 
              ? (t('shortlinks.search_empty_desc') || "Tidak ada tautan yang cocok dengan kata kunci pencarian Anda.") 
              : (t('shortlinks.empty_desc') || "Buat tautan singkat pertama Anda untuk mempermudah penyebaran link resmi SRE.")}
          </p>
          <button
            type="button"
            onClick={() => handleOpenForm()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 text-black font-bold text-xs hover:bg-emerald-400 transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t('shortlinks.create_new') || "Buat Tautan Baru"}</span>
          </button>
        </motion.div>
      )}

      {/* CREATE / EDIT POP-UP MODAL (Rendered to document.body via Portal) */}
      {mounted && typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          {isModalOpen && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
              {/* Screen Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={handleCloseForm}
                className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-md"
              />

              {/* Centered Modal Card */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                transition={{ duration: 0.2 }}
                className="relative z-10 w-full max-w-xl my-auto bg-white dark:bg-[#091712] border border-slate-200 dark:border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl overflow-hidden max-h-[85vh] overflow-y-auto"
              >
                {/* Header */}
                <div className="flex justify-between items-start mb-6 pb-4 border-b border-slate-100 dark:border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white">
                        {editingId ? (t('shortlinks.edit_title') || "Edit Tautan Singkat") : (t('shortlinks.create_title') || "Buat Tautan Singkat Baru")}
                      </h2>
                      <p className="text-xs text-slate-400 dark:text-white/40 mt-0.5">
                        {t('shortlinks.modal_desc') || "Kustomisasi nama slug dan target destinasi URL resmi."}
                      </p>
                    </div>
                  </div>
                  <button 
                    type="button"
                    onClick={handleCloseForm}
                    className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                {error && (
                  <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <p className="text-xs md:text-sm text-red-600 dark:text-red-400 font-semibold">{error}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Original URL */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-white/70">
                      {t('shortlinks.dest_url_label') || "Target URL Asli (Destination URL) *"}
                    </label>
                    <input
                      type="url"
                      required
                      placeholder={t('shortlinks.url_ph') || "https://drive.google.com/... atau https://..."}
                      value={formData.originalUrl}
                      onChange={(e) => setFormData({...formData, originalUrl: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-[#060e0a] border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3 text-xs md:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 transition-all font-medium"
                    />
                  </div>

                  {/* Custom Slug */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-white/70">
                      {t('shortlinks.custom_slug_label') || "Nama Slug Kustom *"}
                    </label>
                    <div className="flex relative rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#060e0a]">
                      <span className="inline-flex items-center px-3.5 bg-slate-100 dark:bg-white/5 border-r border-slate-200 dark:border-white/10 text-slate-500 dark:text-white/40 font-mono text-xs whitespace-nowrap">
                        {currentHost}/s/
                      </span>
                      <input
                        type="text"
                        required
                        placeholder="contoh: panduan-laporan"
                        value={formData.slug}
                        onChange={(e) => setFormData({...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, '')})}
                        className="w-full bg-transparent px-4 py-3 text-xs md:text-sm font-mono text-slate-900 dark:text-white focus:outline-none pr-10"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
                        {isCheckingSlug ? (
                          <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
                        ) : isSlugAvailable === true ? (
                          <Check className="w-4 h-4 text-emerald-500 font-bold" />
                        ) : isSlugAvailable === false ? (
                          <X className="w-4 h-4 text-red-500 font-bold" />
                        ) : null}
                      </div>
                    </div>
                    {isSlugAvailable === false && (
                      <p className="flex items-center gap-1.5 text-[11px] font-bold text-red-500 mt-1">
                        <AlertCircle className="w-3.5 h-3.5" /> {t('shortlinks.slug_taken') || "Slug ini sudah dipakai! Silakan ganti nama slug."}
                      </p>
                    )}
                    {isSlugAvailable === true && (
                      <p className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-500 mt-1">
                        <Check className="w-3.5 h-3.5" /> {t('shortlinks.slug_avail') || "Slug tersedia untuk digunakan."}
                      </p>
                    )}
                  </div>

                  {/* Description */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-white/70">
                      {t('shortlinks.desc_label') || "Keterangan / Catatan Singkat"}
                    </label>
                    <input
                      type="text"
                      placeholder={t('shortlinks.desc_ph') || "Contoh: Dokumen SOP Administrasi Periode 2026"}
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-[#060e0a] border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3 text-xs md:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 transition-all font-medium"
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-white/5">
                    <button
                      type="button"
                      onClick={handleCloseForm}
                      className="px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-slate-600 dark:text-white/60 hover:bg-slate-100 dark:hover:bg-white/5 transition-all cursor-pointer"
                    >
                      {t('shortlinks.cancel') || "Batal"}
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all disabled:opacity-50 cursor-pointer"
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      <span>{editingId ? (t('shortlinks.save_changes') || "Simpan Perubahan") : (t('shortlinks.create_link') || "Buat Tautan")}</span>
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* QR Code Modal (Rendered to document.body via Portal) */}
      {mounted && typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          {qrModal.isOpen && qrModal.link && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setQrModal({ isOpen: false, link: null })}
                className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-md"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="relative z-10 w-full max-w-sm my-auto bg-white dark:bg-[#091510] border border-slate-200 dark:border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl text-center"
              >
                <button
                  type="button"
                  onClick={() => setQrModal({ isOpen: false, link: null })}
                  className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 mx-auto flex items-center justify-center mb-4">
                  <QrCode className="w-6 h-6" />
                </div>

                <h3 className="text-lg font-black text-slate-900 dark:text-white mb-1">
                  {t('shortlinks.qr_modal_title') || "QR Code Tautan"}
                </h3>
                <p className="text-xs text-slate-500 dark:text-white/40 font-mono mb-6">
                  /s/{qrModal.link.slug}
                </p>

                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-inner inline-block mb-6">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(`${typeof window !== "undefined" ? window.location.origin : "https://www.sreupnjatim.com"}/s/${qrModal.link.slug}`)}&color=064e3b&bgcolor=ffffff`}
                    alt={`QR Code ${qrModal.link.slug}`}
                    className="w-48 h-48 mx-auto"
                  />
                </div>

                <div className="flex gap-2 justify-center">
                  <button
                    type="button"
                    onClick={() => handleCopy(qrModal.link.slug, qrModal.link.id)}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-500 text-black font-bold text-xs hover:bg-emerald-400 transition-all flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20 cursor-pointer"
                  >
                    <Copy className="w-4 h-4" />
                    <span>{t('shortlinks.copy_url_btn') || "Salin URL"}</span>
                  </button>
                  <a
                    href={`https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(`${typeof window !== "undefined" ? window.location.origin : "https://www.sreupnjatim.com"}/s/${qrModal.link.slug}`)}&color=064e3b&bgcolor=ffffff`}
                    download={`QR_SRE_${qrModal.link.slug}.png`}
                    target="_blank"
                    rel="noreferrer"
                    className="py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-white font-bold text-xs hover:bg-slate-200 dark:hover:bg-white/20 transition-all"
                  >
                    {t('shortlinks.download_qr_btn') || "Unduh QR"}
                  </a>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Delete Confirmation Modal (Rendered to document.body via Portal) */}
      {mounted && typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          {deleteId && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setDeleteId(null)}
                className="fixed inset-0 bg-slate-900/40 dark:bg-black/70 backdrop-blur-md"
              />
              <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 15 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 15 }}
                className="relative z-10 w-full max-w-sm my-auto bg-white dark:bg-[#0a1610] border border-slate-200 dark:border-white/10 rounded-[32px] p-8 shadow-2xl overflow-hidden text-center"
              >
                <div className="w-16 h-16 rounded-2xl bg-red-500/10 text-red-500 border border-red-500/20 flex items-center justify-center mx-auto mb-5">
                  <Trash2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">{t('shortlinks.delete_modal_title') || "Hapus Tautan?"}</h3>
                <p className="text-slate-500 dark:text-white/60 font-medium mb-6 text-xs leading-relaxed">
                  {t('shortlinks.delete_modal_desc') || "Tindakan ini permanen. Tautan dan seluruh data analitik kliknya akan dihapus dari sistem."}
                </p>
                
                <div className="flex w-full gap-3">
                  <button 
                    onClick={() => setDeleteId(null)}
                    disabled={isDeleting}
                    className="flex-1 py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider text-slate-600 dark:text-white/70 hover:bg-slate-100 dark:hover:bg-white/5 transition-all cursor-pointer"
                  >
                    {t('shortlinks.cancel') || "Batal"}
                  </button>
                  <button 
                    onClick={() => confirmDelete(deleteId)}
                    disabled={isDeleting}
                    className="flex-1 flex justify-center items-center py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/25 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : (t('shortlinks.delete') || "Hapus")}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

    </div>
  );
}
