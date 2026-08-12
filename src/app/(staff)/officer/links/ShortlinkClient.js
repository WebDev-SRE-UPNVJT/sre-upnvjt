"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Link as LinkIcon, Plus, Copy, ExternalLink, Activity, 
  Search, ArrowRight, Loader2, Check, AlertCircle, Clock, X,
  Trash2, Edit3
} from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/i18n/LanguageProvider";

export default function ShortlinkClient({ initialLinks = [] }) {
  const { t } = useLanguage();
  const [links, setLinks] = useState(initialLinks);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ slug: "", originalUrl: "", description: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Delete State
  const [deleteId, setDeleteId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Realtime Slug Check State
  const [isSlugAvailable, setIsSlugAvailable] = useState(null); // null = unknown/typing, true = available, false = taken
  const [isCheckingSlug, setIsCheckingSlug] = useState(false);
  
  // Copy State
  const [copiedId, setCopiedId] = useState(null);

  const filteredLinks = links.filter(link => 
    link.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (link.description && link.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleCopy = (slug, id) => {
    const url = `${window.location.origin}/s/${slug}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Real-time check for slug availability
  useEffect(() => {
    if (!formData.slug) {
      setIsSlugAvailable(null);
      return;
    }

    // If editing and slug hasn't changed from original, consider it available
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
        const res = await fetch(`/api/shortlink/check?slug=${formData.slug}`);
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
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [formData.slug]);

  const handleOpenForm = (link = null) => {
    if (link) {
      setEditingId(link.id);
      setFormData({ slug: link.slug, originalUrl: link.originalUrl, description: link.description || "" });
      setIsSlugAvailable(true); // Assuming keeping the same slug is fine
    } else {
      setEditingId(null);
      setFormData({ slug: "", originalUrl: "", description: "" });
      setIsSlugAvailable(null);
    }
    setIsFormOpen(true);
    setError(null);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setFormData({ slug: "", originalUrl: "", description: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Basic validation
    if (!formData.slug.match(/^[a-zA-Z0-9-]+$/)) {
      setError("Slug hanya boleh berisi huruf, angka, dan strip (-)");
      setLoading(false);
      return;
    }

    if (isSlugAvailable === false && !editingId) {
      setError("Slug ini sudah dipakai! Silakan pilih yang lain.");
      setLoading(false);
      return;
    }

    try {
      const url = editingId ? `/api/shortlink/${editingId}` : "/api/shortlink";
      const method = editingId ? "PUT" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Gagal menyimpan shortlink");
      }

      if (editingId) {
        // Update list
        setLinks(links.map(l => l.id === editingId ? { ...l, ...data } : l));
      } else {
        // Add to list
        setLinks([data, ...links]);
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
    } catch (err) {
      alert(err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="w-full relative space-y-8 transition-colors duration-500 select-none pb-20">
      
      {/* Custom Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteId && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 dark:bg-black/60 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white dark:bg-[#0a1610] border border-slate-200 dark:border-white/10 rounded-[32px] p-8 max-w-sm w-full shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-full bg-red-50 dark:bg-red-500/10 text-red-500 flex items-center justify-center mb-6 shadow-inner border border-red-100 dark:border-red-500/20">
                  <Trash2 className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Hapus Tautan?</h3>
                <p className="text-slate-500 dark:text-white/60 font-medium mb-8 text-sm leading-relaxed">
                  Tindakan ini permanen. Tautan dan seluruh data analitik kliknya akan terhapus.
                </p>
                
                <div className="flex w-full gap-3">
                  <button 
                    onClick={() => setDeleteId(null)}
                    disabled={isDeleting}
                    className="flex-1 py-3.5 px-4 rounded-2xl font-bold text-slate-600 dark:text-white/70 hover:bg-slate-100 dark:hover:bg-white/5 transition-all"
                  >
                    Batal
                  </button>
                  <button 
                    onClick={() => confirmDelete(deleteId)}
                    disabled={isDeleting}
                    className="flex-1 flex justify-center items-center py-3.5 px-4 rounded-2xl font-bold bg-red-500 hover:bg-red-600 text-white shadow-[0_4px_0_rgb(185,28,28)] hover:shadow-[0_2px_0_rgb(185,28,28)] hover:translate-y-[2px] active:shadow-none active:translate-y-[4px] transition-all disabled:opacity-50"
                  >
                    {isDeleting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Hapus!"}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Background Ambience */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none mix-blend-multiply dark:mix-blend-screen" />
        
      {/* Gamified Header Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 bg-white/60 dark:bg-[#08120e]/60 backdrop-blur-md border border-slate-200 dark:border-white/5 rounded-3xl p-6 md:p-8 shadow-xl dark:shadow-2xl relative overflow-hidden"
      >
        <div className="absolute -left-16 -bottom-16 w-48 h-48 rounded-full bg-emerald-500/20 dark:bg-emerald-500/10 blur-[50px] pointer-events-none" />
        
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-bold text-emerald-500 uppercase tracking-widest mb-4">
              RE-Direct
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-black tracking-tighter text-slate-900 dark:text-white leading-tight">
            {t('shortlinks.link_center')}
          </h1>
          <p className="text-slate-500 dark:text-white/60 text-sm md:text-base font-medium mt-4 max-w-lg leading-relaxed">
            {t('shortlinks.desc')}
          </p>
        </div>

        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => handleOpenForm()}
          className="w-full md:w-auto flex items-center justify-center gap-2 p-4 px-6 rounded-2xl bg-emerald-500 text-white font-bold shadow-[0_6px_0_0_#047857] hover:shadow-[0_2px_0_0_#047857] hover:translate-y-[4px] transition-all active:shadow-none active:translate-y-[6px]"
        >
          <Plus className="w-5 h-5" />
          {t('shortlinks.create_new')}
        </motion.button>
      </motion.div>

        {/* Create Form (Expandable) */}
        <AnimatePresence>
          {isFormOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: 'auto', marginBottom: 32 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              className="overflow-hidden"
            >
              <form onSubmit={handleSubmit} className="bg-white/80 dark:bg-[#08120e]/80 backdrop-blur-md border border-slate-200 dark:border-white/5 rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-emerald-500/5 rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                <div className="relative z-10">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                      {editingId ? "Edit Tautan SRE" : t('shortlinks.create_new')}
                    </h2>
                    <button 
                      type="button"
                      onClick={handleCloseForm}
                      className="p-2 bg-slate-100 dark:bg-white/5 hover:bg-red-50 dark:hover:bg-red-500/10 text-slate-400 hover:text-red-500 rounded-full transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                
                {error && (
                  <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <p className="text-sm text-red-600 dark:text-red-400 font-medium">{error}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {/* Original URL */}
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-white/80">{t('shortlinks.url_asli')} *</label>
                    <input
                      type="url"
                      required
                      placeholder={t('shortlinks.url_ph')}
                      value={formData.originalUrl}
                      onChange={(e) => setFormData({...formData, originalUrl: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-black/50 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                    />
                  </div>

                  {/* Slug */}
                  <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-white/80">{t('shortlinks.slug')} *</label>
                  <div className="flex relative rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/50">
                    <span className="inline-flex items-center px-4 bg-slate-100 dark:bg-white/5 border-r border-slate-200 dark:border-white/10 text-slate-500 dark:text-white/40 font-mono text-sm whitespace-nowrap">
                      {typeof window !== "undefined" ? `${window.location.host}/s/` : "sreupnjatim.com/s/"}
                    </span>
                    <input
                      type="text"
                      required
                      placeholder={t('shortlinks.slug_ph')}
                      value={formData.slug}
                      onChange={(e) => setFormData({...formData, slug: e.target.value})}
                      className="w-full bg-transparent px-4 py-3 text-slate-900 dark:text-white focus:outline-none pr-10"
                    />
                    {/* Availability Indicator */}
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
                        {isCheckingSlug ? (
                          <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
                        ) : isSlugAvailable === true ? (
                          <Check className="w-5 h-5 text-emerald-500" />
                        ) : isSlugAvailable === false ? (
                          <X className="w-5 h-5 text-red-500" />
                        ) : null}
                    </div>
                  </div>
                  {isSlugAvailable === false && (
                        <p className="flex items-center gap-1.5 text-xs font-bold text-rose-500 mt-2">
                          <AlertCircle className="w-4 h-4" /> {t('shortlinks.slug_taken')}
                        </p>
                      )}
                      {isSlugAvailable === true && (
                        <p className="flex items-center gap-1.5 text-xs font-bold text-emerald-500 mt-2">
                          <Check className="w-4 h-4" /> {t('shortlinks.slug_avail')}
                        </p>
                      )}
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-white/80">{t('shortlinks.desc_label')}</label>
                    <input
                      type="text"
                      placeholder={t('shortlinks.desc_ph')}
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-black/50 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleCloseForm}
                    className="px-6 py-3 rounded-2xl font-bold text-slate-600 dark:text-white/60 hover:bg-slate-100 dark:hover:bg-white/5 transition-all"
                  >
                    Batal
                  </button>
                  <motion.button
                    type="submit"
                    disabled={loading}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white px-8 py-3 rounded-2xl font-bold transition-all shadow-[0_5px_0_rgb(4,120,87)] hover:shadow-[0_2px_0_rgb(4,120,87)] hover:translate-y-1 active:shadow-none active:translate-y-[5px] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-6 h-6" />}
                    Simpan Tautan
                  </motion.button>
                </div>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mb-8">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-white/30" />
            <input
              type="text"
              placeholder={t('shortlinks.search_ph')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-[#0a1610] border border-slate-200 dark:border-white/10 rounded-2xl pl-12 pr-4 py-4 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all shadow-sm font-medium"
            />
          </div>
          
          <div className="px-6 py-4 bg-emerald-50 dark:bg-[#0a1610] rounded-2xl border border-emerald-100 dark:border-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold whitespace-nowrap shadow-sm">
            {t('shortlinks.total')} {filteredLinks.length} {t('shortlinks.links')}
          </div>
        </div>

        {/* Links Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredLinks.map((link, index) => (
              <motion.div
                key={link.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.05 }}
                className="group perspective"
              >
                <div className="h-full bg-white/80 dark:bg-[#08120e]/80 backdrop-blur-md border border-slate-200 dark:border-white/5 rounded-3xl p-6 relative overflow-hidden transition-all duration-500 transform-gpu hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(16,185,129,0.3)] hover:border-emerald-500/30">
                {/* Background Glow */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-colors duration-500" />
                
                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1 min-w-0 pr-4">
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white truncate">
                        /s/{link.slug}
                      </h3>
                    </div>
                    <button
                      onClick={() => handleCopy(link.slug, link.id)}
                      className={`p-2 rounded-xl border transition-all ${
                        copiedId === link.id 
                          ? 'bg-emerald-500 border-emerald-500 text-white' 
                          : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-400 dark:text-white/40 hover:text-emerald-500 hover:border-emerald-500/50'
                      }`}
                    >
                      {copiedId === link.id ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                    </button>
                  </div>

                  <p className="text-sm font-medium text-slate-500 dark:text-white/50 mb-6 truncate" title={link.originalUrl}>
                      {link.originalUrl}
                    </p>
                    
                    {/* Stats & Info Section */}
                    <div className="grid grid-cols-2 gap-3 mb-5">
                      <div className="bg-slate-50 dark:bg-black/20 p-3 rounded-xl border border-slate-100 dark:border-white/5 group-hover:border-emerald-500/20 transition-colors">
                        <p className="text-[10px] font-bold tracking-wider text-slate-400 dark:text-white/30 uppercase">{t('shortlinks.clicks')}</p>
                        <p className="text-2xl font-black text-slate-900 dark:text-white">{(link.clicks || 0).toLocaleString()}</p>
                      </div>
                      <div className="bg-slate-50 dark:bg-black/20 p-3 rounded-xl border border-slate-100 dark:border-white/5 group-hover:border-emerald-500/20 transition-colors flex flex-col justify-center">
                        <p className="text-[10px] font-bold tracking-wider text-slate-400 dark:text-white/30 uppercase mb-1">{t('shortlinks.creator')}</p>
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center text-[10px] font-bold">
                            {link.creatorName?.charAt(0) || "U"}
                          </div>
                          <span className="text-xs font-bold text-slate-700 dark:text-white/70 truncate">{link.creatorName || "User"}</span>
                        </div>
                      </div>
                    </div>

                    {/* Desc & Date */}
                    <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-white/5">
                      <p className="text-xs text-slate-400 dark:text-white/40 truncate max-w-[60%] font-medium">
                        {link.description || t('shortlinks.no_desc')}
                      </p>
                      
                      {/* Actions: Edit & Delete */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleOpenForm(link)}
                          className="p-2 text-slate-400 hover:text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-colors"
                          title="Edit Shortlink"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(link.id)}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Delete Shortlink"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {filteredLinks.length === 0 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="col-span-full p-16 flex flex-col items-center justify-center bg-white/50 dark:bg-white/5 border border-dashed border-slate-300 dark:border-white/10 rounded-3xl"
            >
              <div className="p-4 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 mb-4 border border-emerald-100 dark:border-emerald-500/20">
                <LinkIcon className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">{t('shortlinks.empty_title')}</h3>
              <p className="text-sm font-medium text-slate-500 dark:text-white/50 text-center max-w-sm mb-6">
                {searchQuery 
                  ? t('shortlinks.empty_desc1') 
                  : t('shortlinks.empty_desc2')}
              </p>
            </motion.div>
          )}
        </div>
      </div>
  );
}
