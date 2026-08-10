"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FolderOpen, UploadCloud, FileText, ExternalLink, Trash2,
  CheckCircle2, XCircle, Calendar, Tag, Plus, Search, X,
  ChevronDown, File,
} from "lucide-react";
import { EmptyState, SectionHeader } from "../components/ui/CommonUI";

// ─── File type icon + color ─────────────────────────────────────────────────
function getFileStyle(url = "") {
  const lower = url.toLowerCase();
  if (lower.includes("pdf"))   return { color: "text-red-500",    bg: "bg-red-500/10 border-red-500/20",    label: "PDF" };
  if (lower.includes("doc"))   return { color: "text-blue-500",   bg: "bg-blue-500/10 border-blue-500/20",   label: "DOC" };
  if (lower.includes("ppt"))   return { color: "text-orange-500", bg: "bg-orange-500/10 border-orange-500/20", label: "PPT" };
  if (lower.includes("xls"))   return { color: "text-emerald-500",bg: "bg-emerald-500/10 border-emerald-500/20", label: "XLS" };
  if (lower.includes("image") || lower.includes("jpg") || lower.includes("png"))
    return { color: "text-pink-500", bg: "bg-pink-500/10 border-pink-500/20", label: "IMG" };
  return { color: "text-slate-500", bg: "bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10", label: "FILE" };
}

// ─── Document card ───────────────────────────────────────────────────────────
function DocCard({ doc, index }) {
  const style = getFileStyle(doc.title + doc.fileUrl);
  const date  = new Date(doc.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="group bg-white dark:bg-[#08120e] border border-slate-200 dark:border-white/5 hover:border-primary/30 rounded-2xl p-4 transition-all duration-300 hover:shadow-[0_0_25px_rgba(16,185,129,0.08)] flex gap-4 items-start"
    >
      {/* File type badge */}
      <div className={`w-11 h-11 rounded-xl border flex items-center justify-center flex-shrink-0 ${style.bg}`}>
        <span className={`text-[10px] font-black ${style.color}`}>{style.label}</span>
      </div>

      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-black text-slate-900 dark:text-white truncate group-hover:text-primary transition-colors">
          {doc.title}
        </h4>
        {doc.description && (
          <p className="text-[11px] text-slate-400 dark:text-white/40 mt-0.5 line-clamp-1">{doc.description}</p>
        )}
        <div className="flex flex-wrap items-center gap-2 mt-2">
          {doc.category && (
            <span className="flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary uppercase tracking-wider">
              <Tag className="w-2.5 h-2.5" />{doc.category.name}
            </span>
          )}
          <span className="flex items-center gap-1 text-[9px] text-slate-400 dark:text-white/30 font-medium">
            <Calendar className="w-2.5 h-2.5" />{date}
          </span>
        </div>
      </div>

      <a
        href={doc.fileUrl}
        target="_blank"
        rel="noreferrer"
        className="p-2 rounded-xl hover:bg-primary/10 text-slate-300 dark:text-white/20 hover:text-primary transition-colors flex-shrink-0"
        title="Buka file"
      >
        <ExternalLink className="w-4 h-4" />
      </a>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════
export default function DokumenClient({ categories, initialDocuments }) {
  const fileRef  = useRef(null);
  const [docs, setDocs]         = useState(initialDocuments ?? []);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch]     = useState("");
  const [catFilter, setCat]     = useState("ALL");

  // Form state
  const [file, setFile]         = useState(null);
  const [title, setTitle]       = useState("");
  const [desc, setDesc]         = useState("");
  const [catId, setCatId]       = useState(categories[0]?.id ?? "");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [success, setSuccess]   = useState("");
  const [isDragging, setDragging] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !title.trim() || !catId) {
      setError("File, judul, dan kategori wajib diisi.");
      return;
    }
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("title", title.trim());
      fd.append("description", desc.trim());
      fd.append("categoryId", catId.toString());

      const res  = await fetch("/api/dokumen", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal mengupload dokumen");

      setDocs((prev) => [data.document, ...prev]);
      setSuccess("Dokumen berhasil diupload ke Google Drive!");
      setFile(null); setTitle(""); setDesc("");
      setTimeout(() => { setSuccess(""); setShowForm(false); }, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Filter
  const visible = docs.filter((d) => {
    if (catFilter !== "ALL" && d.categoryId?.toString() !== catFilter) return false;
    if (search && !d.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="w-full space-y-8">

      {/* ── Header ─────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
        <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/25 text-[10px] font-black text-purple-600 dark:text-purple-400 tracking-widest uppercase mb-3">
          <FolderOpen className="w-3 h-3" /> Dokumentasi
        </span>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h1 className="text-4xl md:text-5xl font-display font-black tracking-tighter text-slate-900 dark:text-white leading-none">
              Upload Dokumentasi
            </h1>
            <p className="text-slate-500 dark:text-white/45 text-sm mt-2.5 font-medium">
              Upload dan kelola dokumentasi kegiatan kamu ke Google Drive.
            </p>
          </div>
          <button
            onClick={() => { setShowForm(true); setError(""); setSuccess(""); }}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-primary to-emerald-400 text-[#050e0a] font-black text-sm tracking-widest uppercase shadow-[0_0_20px_rgba(16,185,129,0.25)] hover:shadow-[0_0_30px_rgba(16,185,129,0.45)] hover:scale-[1.02] transition-all"
          >
            <Plus className="w-4 h-4" /> Upload Baru
          </button>
        </div>
      </motion.div>

      {/* ── Stats ──────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="flex flex-wrap gap-3">
        {[
          { label: "Total Dokumen", val: docs.length, color: "text-slate-900 dark:text-white" },
          ...categories.slice(0, 4).map((c) => ({
            label: c.name,
            val: docs.filter((d) => d.categoryId === c.id).length,
            color: "text-primary",
          })),
        ].map((s) => (
          <div key={s.label} className="flex flex-col items-center px-5 py-3 bg-white dark:bg-[#08120e] border border-slate-200 dark:border-white/5 rounded-2xl shadow-sm">
            <span className={`text-xl font-black ${s.color}`}>{s.val}</span>
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/30 mt-0.5 whitespace-nowrap">{s.label}</span>
          </div>
        ))}
      </motion.div>

      {/* ── Filter + Search ───────────────────────────────────── */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
        className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/8 rounded-2xl overflow-x-auto flex-wrap">
          <button
            onClick={() => setCat("ALL")}
            className={`px-3.5 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all ${catFilter === "ALL" ? "bg-white dark:bg-[#0d1f17] text-primary border border-primary/20 shadow-sm" : "text-slate-500 dark:text-white/40"}`}
          >
            Semua ({docs.length})
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setCat(c.id.toString())}
              className={`px-3.5 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all ${catFilter === c.id.toString() ? "bg-white dark:bg-[#0d1f17] text-primary border border-primary/20 shadow-sm" : "text-slate-500 dark:text-white/40"}`}
            >
              {c.name} ({docs.filter((d) => d.categoryId === c.id).length})
            </button>
          ))}
        </div>
        <div className="relative max-w-xs">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-white/30" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari dokumen..."
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#08120e] border border-slate-200 dark:border-white/8 rounded-2xl text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/25 focus:outline-none focus:border-primary/50 transition-all"
          />
        </div>
      </motion.div>

      {/* ── Doc Grid ──────────────────────────────────────────── */}
      {visible.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {visible.map((doc, i) => <DocCard key={doc.id} doc={doc} index={i} />)}
        </div>
      ) : (
        <EmptyState
          icon={FolderOpen}
          title="Belum ada dokumen"
          description={search || catFilter !== "ALL" ? "Tidak ditemukan dokumen dengan filter ini." : "Upload dokumen pertamamu sekarang!"}
          className="py-20 bg-white dark:bg-[#08120e] border border-slate-200 dark:border-white/5 rounded-3xl"
        />
      )}

      {/* ── Upload Modal ───────────────────────────────────────── */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={(e) => e.target === e.currentTarget && !loading && setShowForm(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="w-full max-w-lg bg-white dark:bg-[#07130e] border border-slate-200 dark:border-white/10 rounded-3xl shadow-[0_40px_80px_rgba(0,0,0,0.4)] overflow-hidden"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 pb-4 border-b border-slate-100 dark:border-white/5">
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">Upload Dokumen Baru</h3>
                  <p className="text-xs text-slate-400 dark:text-white/40 mt-0.5">File akan diupload ke Google Drive SRE</p>
                </div>
                {!loading && (
                  <button onClick={() => setShowForm(false)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {/* Title */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-white/40">Judul Dokumen *</label>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Contoh: Notulensi Rapat 17 Juli 2025"
                    required
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-2xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:border-primary/50 transition-all"
                  />
                </div>

                {/* Category */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-white/40">Kategori *</label>
                  {categories.length > 0 ? (
                    <div className="relative">
                      <select
                        value={catId}
                        onChange={(e) => setCatId(e.target.value)}
                        className="w-full appearance-none px-4 py-3 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-2xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:border-primary/50 transition-all pr-10"
                      >
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                  ) : (
                    <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2">
                      Belum ada kategori. Minta admin untuk membuat kategori dokumen terlebih dahulu.
                    </p>
                  )}
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-white/40">Deskripsi (opsional)</label>
                  <input
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    placeholder="Keterangan singkat tentang dokumen ini..."
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-2xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:border-primary/50 transition-all"
                  />
                </div>

                {/* File drop zone */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-white/40">File *</label>
                  <div
                    onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={(e) => { e.preventDefault(); setDragging(false); setFile(e.dataTransfer.files[0] ?? null); }}
                    onClick={() => fileRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-300
                      ${isDragging ? "border-primary bg-primary/5" :
                        file ? "border-emerald-500/50 bg-emerald-500/5" :
                               "border-slate-300 dark:border-white/15 hover:border-primary/50 hover:bg-primary/5"}`}
                  >
                    <input ref={fileRef} type="file" className="hidden" onChange={(e) => setFile(e.target.files[0] ?? null)} />
                    {file ? (
                      <div className="flex items-center gap-3 justify-center">
                        <File className="w-5 h-5 text-primary flex-shrink-0" />
                        <div className="text-left min-w-0">
                          <p className="text-sm font-black text-slate-900 dark:text-white truncate">{file.name}</p>
                          <p className="text-[10px] text-slate-400 dark:text-white/30">{(file.size / 1024).toFixed(1)} KB</p>
                        </div>
                        <button type="button" onClick={(e) => { e.stopPropagation(); setFile(null); }} className="ml-auto text-slate-400 hover:text-red-500 transition-colors flex-shrink-0">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <UploadCloud className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-white/20" />
                        <p className="text-sm font-black text-slate-600 dark:text-white/60">Drag & drop atau klik untuk pilih</p>
                        <p className="text-[10px] text-slate-400 dark:text-white/30 mt-1">PDF, DOC, PPT, XLS, JPG, PNG</p>
                      </>
                    )}
                  </div>
                </div>

                {/* Messages */}
                <AnimatePresence>
                  {error && (
                    <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="flex items-center gap-2 p-3.5 bg-red-500/8 border border-red-500/20 rounded-xl">
                      <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                      <p className="text-xs font-bold text-red-600 dark:text-red-400">{error}</p>
                    </motion.div>
                  )}
                  {success && (
                    <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="flex items-center gap-2 p-3.5 bg-emerald-500/8 border border-emerald-500/20 rounded-xl">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{success}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading || categories.length === 0}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-primary to-emerald-400 text-[#050e0a] font-black text-sm tracking-widest uppercase transition-all hover:scale-[1.01] shadow-[0_0_25px_rgba(16,185,129,0.25)] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2.5"
                >
                  {loading ? (
                    <><div className="w-4 h-4 rounded-full border-2 border-[#050e0a]/30 border-t-[#050e0a] animate-spin" />Mengupload ke Google Drive...</>
                  ) : (
                    <><UploadCloud className="w-4 h-4" />Upload Dokumen</>
                  )}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
