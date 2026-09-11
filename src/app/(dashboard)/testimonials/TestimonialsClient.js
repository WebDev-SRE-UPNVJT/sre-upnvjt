"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Edit2, Trash2, X, Search, CheckCircle2, XCircle,
  AlertTriangle, Star, UploadCloud, Check, Eye, EyeOff,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { resolveImageUrl } from "@/lib/imageUrl";
import { compressImageToWebP } from "@/lib/imageCompressor";
import { hasAccess } from "@/lib/permissions";

const EMPTY_TESTIMONIAL = {
  authorName: "", authorPosition: "", authorPhotoUrl: "",
  content: "", isPublished: false,
};

export default function TestimonialsClient({ initialTestimonials, currentUser }) {
  const { data: session } = useSession();
  const user = session?.user ?? currentUser;

  const [testimonials, setTestimonials] = useState(initialTestimonials || []);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  // Modal State
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(EMPTY_TESTIMONIAL);
  const [targetTestimonial, setTargetTestimonial] = useState(null);
  const [delModal, setDelModal] = useState(false);

  const canCreate = hasAccess(user, "content", "create");
  const canUpdate = hasAccess(user, "content", "update");
  const canDelete = hasAccess(user, "content", "delete");

  const notify = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { notify("error", "Harap pilih file gambar"); return; }

    setIsLoading(true);
    try {
      const processedFile = await compressImageToWebP(file, { quality: 0.82, maxWidth: 1200 });
      const fd = new FormData();
      fd.append("file", processedFile);
      fd.append("folder", "testimonials");
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok && data.url) {
        setForm(p => ({ ...p, authorPhotoUrl: data.url }));
        notify("success", "Foto berhasil diunggah!");
      } else {
        notify("error", data.error || "Gagal mengunggah foto");
      }
    } catch {
      notify("error", "Terjadi kesalahan saat upload");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (test = null) => {
    setForm(test ? {
      authorName: test.authorName,
      authorPosition: test.authorPosition,
      authorPhotoUrl: test.authorPhotoUrl || "",
      content: test.content,
      isPublished: test.isPublished,
    } : { ...EMPTY_TESTIMONIAL });
    setTargetTestimonial(test);
    setModal(true);
  };

  const handleCloseModal = () => {
    setModal(false);
    setTimeout(() => { setForm(EMPTY_TESTIMONIAL); setTargetTestimonial(null); }, 300);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const isEditing = Boolean(targetTestimonial?.id);

    const url = isEditing ? `/api/testimonials/${targetTestimonial.id}` : "/api/testimonials";
    const method = isEditing ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (res.ok) {
        if (isEditing) {
          setTestimonials(testimonials.map(t => t.id === targetTestimonial.id ? data.testimonial : t));
        } else {
          setTestimonials([data.testimonial, ...testimonials]);
        }
        notify("success", isEditing ? "Testimoni diperbarui!" : "Testimoni baru ditambahkan!");
        handleCloseModal();
      } else {
        notify("error", data.error || "Gagal menyimpan testimoni");
      }
    } catch {
      notify("error", "Terjadi kesalahan koneksi");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!targetTestimonial?.id) return;
    setIsLoading(true);

    try {
      const res = await fetch(`/api/testimonials/${targetTestimonial.id}`, { method: "DELETE" });
      if (res.ok) {
        setTestimonials(testimonials.filter(t => t.id !== targetTestimonial.id));
        notify("success", "Testimoni berhasil dihapus!");
        setDelModal(false);
      } else {
        const data = await res.json();
        notify("error", data.error || "Gagal menghapus testimoni");
      }
    } catch {
      notify("error", "Terjadi kesalahan koneksi");
    } finally {
      setIsLoading(false);
    }
  };

  const filtered = testimonials.filter(t =>
    (t.authorName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.authorPosition || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.content || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full relative">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-black tracking-tighter mb-2 flex items-center gap-3 text-gray-900 dark:text-white">
            <Star className="w-8 h-8 text-primary" />
            Testimonials Admin
          </h1>
          <p className="text-gray-500 dark:text-white/50 max-w-xl">
            Kelola review, kepuasan, dan testimoni anggota SRE untuk ditampilkan di halaman beranda depan.
          </p>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-white/30" />
            <input
              type="text"
              placeholder="Cari testimoni..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none"
            />
          </div>
          {canCreate && (
            <button
              onClick={() => handleOpenModal()}
              className="flex items-center gap-2 bg-primary text-[#050e0a] px-6 py-3 rounded-xl font-bold tracking-wide hover:bg-primary-focus hover:scale-105 transition-all shrink-0 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
            >
              <Plus className="w-5 h-5" />
              <span>Tambah Testimoni</span>
            </button>
          )}
        </div>
      </div>

      {/* Table grid */}
      <div className="bg-white/40 dark:bg-white/[0.02] border border-gray-200/50 dark:border-white/10 rounded-3xl overflow-hidden backdrop-blur-xl shadow-lg">
        <div className="overflow-x-auto w-full">
          <table className="w-full min-w-[800px] text-left">
            <thead className="border-b border-gray-200/50 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02]">
              <tr>
                {["Penulis", "Jabatan / Posisi", "Isi Testimoni", "Status", "Aksi"].map(h => (
                  <th key={h} className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-white/40">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              <AnimatePresence>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-20 text-center">
                      <div className="flex flex-col items-center gap-3 text-gray-500 dark:text-white/30">
                        <Star className="w-10 h-10" />
                        <p className="font-medium">Belum ada testimoni</p>
                      </div>
                    </td>
                  </tr>
                ) : filtered.map(test => (
                  <tr key={test.id} className="hover:bg-white/60 dark:hover:bg-white/[0.03] transition-all">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {test.authorPhotoUrl ? (
                          <img src={test.authorPhotoUrl} alt="" className="w-8 h-8 rounded-full object-cover border border-gray-200 dark:border-white/10" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                            {test.authorName?.charAt(0)}
                          </div>
                        )}
                        <span className="font-bold text-gray-900 dark:text-white text-sm">{test.authorName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-white/70">
                      {test.authorPosition}
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500 dark:text-white/50 max-w-[340px] truncate">
                      {test.content}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold border ${
                        test.isPublished
                          ? "bg-green-500/10 text-green-400 border-green-500/20"
                          : "bg-gray-500/10 text-gray-400 border-gray-500/20"
                      }`}>
                        {test.isPublished ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        {test.isPublished ? "Published" : "Draft"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {canUpdate && (
                          <button
                            onClick={() => handleOpenModal(test)}
                            className="w-8 h-8 rounded-lg bg-white dark:bg-white/5 border border-transparent hover:border-gray-200 dark:border-white/10 text-gray-500 dark:text-white/70 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-white/10 transition-all"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => { setTargetTestimonial(test); setDelModal(true); }}
                            className="w-8 h-8 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-transparent hover:border-red-500/20 text-red-400 flex items-center justify-center transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>

      {/* Save Modal */}
      <AnimatePresence>
        {modal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={handleCloseModal} className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white dark:bg-[#0a1612] border border-gray-200 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-gray-200 dark:border-white/10 flex items-center justify-between bg-gray-50/50 dark:bg-white/[0.02]">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Star className="w-5 h-5 text-primary" />
                  {targetTestimonial ? "Edit Testimoni" : "Testimoni Baru"}
                </h2>
                <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-900 dark:hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1 space-y-5">
                <form id="testimonialForm" onSubmit={handleSave} className="space-y-5">
                  <InputField label="Nama Lengkap Penulis *">
                    <input type="text" required value={form.authorName}
                      onChange={e => setForm(p => ({ ...p, authorName: e.target.value }))}
                      className={inputCls} placeholder="e.g. John Doe" />
                  </InputField>

                  <InputField label="Jabatan / Posisi Penulis *">
                    <input type="text" required value={form.authorPosition}
                      onChange={e => setForm(p => ({ ...p, authorPosition: e.target.value }))}
                      className={inputCls} placeholder="e.g. Staff of Renewable Energy Division" />
                  </InputField>

                  <InputField label="Isi Testimoni *">
                    <textarea required rows={4} value={form.content}
                      onChange={e => setForm(p => ({ ...p, content: e.target.value }))}
                      className={`${textareaCls} h-28`} placeholder="Tuliskan ulasan atau pengalaman selama di SRE..." />
                  </InputField>

                  <InputField label="Foto Penulis (URL atau Upload)">
                    <div className="flex gap-3 items-start">
                      {form.authorPhotoUrl && (
                        <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-black/30">
                          <img src={form.authorPhotoUrl} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="flex-1 flex flex-col gap-2">
                        <input type="text" value={form.authorPhotoUrl}
                          onChange={e => setForm(p => ({ ...p, authorPhotoUrl: e.target.value }))}
                          className={inputCls} placeholder="https://..." />
                        <label className={`relative overflow-hidden flex items-center gap-2 h-10 px-4 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-500 dark:text-white/50 hover:bg-gray-50 dark:hover:bg-white/10 transition-colors cursor-pointer ${isLoading ? "opacity-50 pointer-events-none" : ""}`}>
                          <input type="file" accept="image/*" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                          <UploadCloud className="w-4 h-4 text-primary" /> Upload foto
                        </label>
                      </div>
                    </div>
                  </InputField>

                  {/* Published toggle */}
                  <div className="flex items-center justify-between p-4 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl">
                    <div>
                      <div className="text-gray-900 dark:text-white font-medium text-[14px]">Tampilkan di Beranda</div>
                      <div className="text-gray-500 dark:text-white/40 text-[12px]">Dapat langsung dibaca oleh pengunjung umum</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={form.isPublished}
                        onChange={e => setForm(p => ({ ...p, isPublished: e.target.checked }))} />
                      <div className="w-11 h-6 bg-gray-200 dark:bg-white/10 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
                    </label>
                  </div>
                </form>
              </div>

              <div className="p-6 border-t border-gray-200 dark:border-white/10 flex justify-end gap-3 bg-gray-50/50 dark:bg-white/[0.02]">
                <button type="button" onClick={handleCloseModal} className="px-5 py-2 rounded-xl text-sm font-semibold text-gray-500 dark:text-white/70 hover:bg-gray-100 dark:hover:bg-white/10">Batal</button>
                <button type="submit" form="testimonialForm" disabled={isLoading}
                  className="px-5 py-2 rounded-xl text-sm font-bold bg-primary text-[#050e0a] hover:bg-primary-focus flex items-center gap-2">
                  {isLoading ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : "Simpan"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {delModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setDelModal(false)} className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-sm bg-white dark:bg-[#0a1612] border border-gray-200 dark:border-white/10 rounded-3xl p-6 text-center">
              <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4 border border-red-500/25">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Hapus Testimoni?</h3>
              <p className="text-xs text-gray-500 dark:text-white/40 mb-6">Ulasan terpilih akan dihapus secara permanen dari beranda.</p>
              <div className="flex gap-3">
                <button onClick={() => setDelModal(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-xs font-semibold text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5">Batal</button>
                <button onClick={handleDelete} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-xs font-bold hover:bg-red-600">Hapus</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Global Toast */}
      <Toast notification={notification} onClose={() => setNotification(null)} />
    </div>
  );
}

// Extracted toast component
function Toast({ notification, onClose }) {
  return (
    <AnimatePresence>
      {notification && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          className={`fixed bottom-6 right-6 z-[70] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border backdrop-blur-md ${
            notification.type === "success"
              ? "bg-green-500/10 border-green-500/20 text-green-400"
              : "bg-red-500/10 border-red-500/20 text-red-400"
          }`}
        >
          {notification.type === "success" ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
          <span className="font-medium text-xs">{notification.message}</span>
          <button onClick={onClose} className="ml-2 opacity-50 hover:opacity-100 transition-opacity">
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const inputCls =
  "w-full h-12 px-4 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/20 focus:outline-none focus:border-primary/50 transition-all";

const textareaCls =
  "w-full p-4 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/20 focus:outline-none focus:border-primary/50 transition-all resize-none";

const InputField = ({ label, children }) => (
  <div>
    <label className="block text-[11px] font-bold tracking-wider text-gray-500 dark:text-white/50 uppercase mb-2">
      {label}
    </label>
    {children}
  </div>
);
