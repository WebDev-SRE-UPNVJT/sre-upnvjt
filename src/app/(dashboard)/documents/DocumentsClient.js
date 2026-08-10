"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FileText, Plus, Search, FolderOpen, Edit2, Trash2, X, Download, 
  ExternalLink, CheckCircle2, AlertTriangle, Filter, FolderPlus, UploadCloud,
  File, Eye, EyeOff
} from "lucide-react";
import { 
  createDocumentCategory, updateDocumentCategory, deleteDocumentCategory,
  createDocumentItem, updateDocumentItem, deleteDocumentItem 
} from "@/app/actions/documentActions";
import { useSession } from "next-auth/react";
import { hasAccess } from "@/lib/permissions";

const EMPTY_CAT = { name: "", description: "" };
const EMPTY_DOC = { categoryId: "", title: "", description: "", fileUrl: "" };

export default function DocumentsClient({ initialCategories, initialDocuments, currentUser }) {
  const { data: session } = useSession();
  const user = session?.user ?? currentUser;

  const [categories, setCategories] = useState(initialCategories || []);
  const [documents, setDocuments] = useState(initialDocuments || []);

  const [activeTab, setActiveTab] = useState("items"); // "items" | "categories"
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  // Category Modal
  const [catModal, setCatModal] = useState(false);
  const [catForm, setCatForm] = useState(EMPTY_CAT);
  const [targetCat, setTargetCat] = useState(null);
  const [catDelModal, setCatDelModal] = useState(false);

  // Document Modal
  const [docModal, setDocModal] = useState(false);
  const [docForm, setDocForm] = useState(EMPTY_DOC);
  const [targetDoc, setTargetDoc] = useState(null);
  const [docDelModal, setDocDelModal] = useState(false);

  const canCreate = hasAccess(user, "documents", "create");
  const canUpdate = hasAccess(user, "documents", "update");
  const canDelete = hasAccess(user, "documents", "delete");

  const notify = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3500);
  };

  // Upload handler
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fd = new FormData();
    fd.append("file", file);
    fd.append("folder", "internal-documents");

    setIsLoading(true);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok && data.url) {
        setDocForm(p => ({ ...p, fileUrl: data.url }));
        notify("success", "File berhasil diunggah!");
      } else {
        notify("error", data.error || "Gagal mengunggah file");
      }
    } catch {
      notify("error", "Terjadi kesalahan saat mengunggah file");
    } finally {
      setIsLoading(false);
    }
  };

  // Category handlers
  const openCatModal = (cat = null) => {
    setTargetCat(cat);
    setCatForm(cat ? { name: cat.name, description: cat.description || "" } : EMPTY_CAT);
    setCatModal(true);
  };

  const closeCatModal = () => {
    setCatModal(false);
    setTimeout(() => { setCatForm(EMPTY_CAT); setTargetCat(null); }, 300);
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const fd = new FormData();
    fd.append("name", catForm.name);
    fd.append("description", catForm.description);

    const isEditing = Boolean(targetCat?.id);
    const res = isEditing
      ? await updateDocumentCategory(targetCat.id, fd)
      : await createDocumentCategory(fd);

    if (res.success) {
      if (isEditing) {
        setCategories(prev => prev.map(c => c.id === targetCat.id ? res.category : c));
      } else {
        setCategories(prev => [res.category, ...prev]);
      }
      notify("success", isEditing ? "Kategori diperbarui!" : "Kategori dibuat!");
      closeCatModal();
    } else {
      notify("error", res.error || "Gagal menyimpan kategori");
    }
    setIsLoading(false);
  };

  const handleDeleteCategory = async () => {
    if (!targetCat?.id) return;
    setIsLoading(true);
    const res = await deleteDocumentCategory(targetCat.id);
    if (res.success) {
      setCategories(prev => prev.filter(c => c.id !== targetCat.id));
      setDocuments(prev => prev.filter(d => d.categoryId !== targetCat.id));
      notify("success", "Kategori dan dokumen di dalamnya telah dihapus");
      setCatDelModal(false);
    } else {
      notify("error", res.error || "Gagal menghapus kategori");
    }
    setIsLoading(false);
  };

  // Document handlers
  const openDocModal = (doc = null) => {
    setTargetDoc(doc);
    setDocForm(doc ? {
      categoryId: doc.categoryId?.toString() || "",
      title: doc.title,
      description: doc.description || "",
      fileUrl: doc.fileUrl,
    } : EMPTY_DOC);
    setDocModal(true);
  };

  const closeDocModal = () => {
    setDocModal(false);
    setTimeout(() => { setDocForm(EMPTY_DOC); setTargetDoc(null); }, 300);
  };

  const handleSaveDocument = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const isEditing = Boolean(targetDoc?.id);

    const res = isEditing
      ? await updateDocumentItem(targetDoc.id, docForm)
      : await createDocumentItem(docForm, user?.id);

    if (res.success) {
      if (isEditing) {
        setDocuments(prev => prev.map(d => d.id === targetDoc.id ? res.item : d));
      } else {
        setDocuments(prev => [res.item, ...prev]);
      }
      notify("success", isEditing ? "Dokumen diperbarui!" : "Dokumen ditambahkan!");
      closeDocModal();
    } else {
      notify("error", res.error || "Gagal menyimpan dokumen");
    }
    setIsLoading(false);
  };

  const handleDeleteDocument = async () => {
    if (!targetDoc?.id) return;
    setIsLoading(true);
    const res = await deleteDocumentItem(targetDoc.id);
    if (res.success) {
      setDocuments(prev => prev.filter(d => d.id !== targetDoc.id));
      notify("success", "Dokumen dihapus");
      setDocDelModal(false);
    } else {
      notify("error", res.error || "Gagal menghapus dokumen");
    }
    setIsLoading(false);
  };

  // Filtered documents
  const filteredDocs = documents.filter(doc => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q || doc.title.toLowerCase().includes(q) || doc.description?.toLowerCase().includes(q);
    const matchesCategory = filterCategory === "all" || doc.categoryId?.toString() === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const filteredCategories = categories.filter(c => 
    !searchQuery || c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full relative space-y-6">

      {/* Notification Toast */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl backdrop-blur-xl border ${
              notification.type === "success" 
                ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400 font-bold" 
                : "bg-red-500/15 border-red-500/30 text-red-400 font-bold"
            }`}
          >
            {notification.type === "success" ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <X className="w-5 h-5 shrink-0" />}
            <p className="text-xs md:text-sm">{notification.message}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-2">
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-black tracking-tighter mb-2 flex items-center gap-3 text-gray-900 dark:text-white">
            <FileText className="w-8 h-8 text-primary" />
            Dokumen Internal
          </h1>
          <p className="text-gray-500 dark:text-white/50 max-w-xl text-sm">
            Kelola kategori dan berkas dokumen internal SRE UPNVJT.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {canCreate && (
            <>
              <button
                onClick={() => openCatModal()}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-white/5 shadow-sm border border-gray-200 dark:border-white/10 text-gray-700 dark:text-white hover:border-primary/50 transition-all text-xs font-bold"
              >
                <FolderPlus className="w-4 h-4 text-primary" />
                Tambah Kategori
              </button>
              <button
                onClick={() => openDocModal()}
                className="flex items-center gap-2 bg-primary text-[#050e0a] px-5 py-2.5 rounded-xl font-bold text-xs hover:bg-primary-focus transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)]"
              >
                <Plus className="w-4 h-4" />
                Tambah Dokumen
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tabs & Search Filter */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white/40 dark:bg-white/[0.02] border border-gray-200/50 dark:border-white/10 p-4 rounded-2xl backdrop-blur-xl">
        <div className="flex items-center gap-2 bg-gray-100 dark:bg-white/5 p-1 rounded-xl w-full md:w-auto">
          <button
            onClick={() => setActiveTab("items")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "items"
                ? "bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-500 dark:text-white/40 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Dokumen ({documents.length})
          </button>
          <button
            onClick={() => setActiveTab("categories")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "categories"
                ? "bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-500 dark:text-white/40 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            <FolderOpen className="w-3.5 h-3.5" />
            Kategori ({categories.length})
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {activeTab === "items" && (
            <select
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
              className="h-10 px-3.5 bg-white dark:bg-[#0d1c16] border border-gray-200 dark:border-white/15 rounded-xl text-xs font-bold text-gray-900 dark:text-white focus:outline-none focus:border-primary/50 transition-all cursor-pointer shadow-sm"
            >
              <option value="all" className="bg-white dark:bg-[#0a1612] text-gray-900 dark:text-white">Semua Kategori</option>
              {categories.map(c => (
                <option key={c.id} value={c.id.toString()} className="bg-white dark:bg-[#0a1612] text-gray-900 dark:text-white">{c.name}</option>
              ))}
            </select>
          )}

          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Cari..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-9 pr-4 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-xs text-gray-900 dark:text-white focus:outline-none focus:border-primary/50 transition-all"
            />
          </div>
        </div>
      </div>

      {/* ── TAB: DOKUMEN ITEMS ── */}
      {activeTab === "items" && (
        <div className="bg-white/40 dark:bg-white/[0.02] border border-gray-200/50 dark:border-white/10 rounded-3xl overflow-hidden backdrop-blur-xl shadow-lg">
          <div className="overflow-x-auto w-full">
            <table className="w-full min-w-[700px] text-left">
              <thead className="border-b border-gray-200/50 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02]">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-white/40">Dokumen</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-white/40">Kategori</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-white/40">Pengunggah</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-white/40">Tanggal</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-white/40 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200/50 dark:divide-white/5 text-sm">
                {filteredDocs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-16 text-center text-gray-400 dark:text-white/30">
                      Belum ada dokumen internal terdaftar.
                    </td>
                  </tr>
                ) : (
                  filteredDocs.map(doc => (
                    <tr key={doc.id} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                            <File className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-bold text-gray-900 dark:text-white text-xs md:text-sm">{doc.title}</div>
                            {doc.description && (
                              <div className="text-xs text-gray-500 dark:text-white/40 line-clamp-1">{doc.description}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-white/70 border border-gray-200 dark:border-white/5">
                          {doc.category?.name || "Uncategorized"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-600 dark:text-white/70 font-medium">
                        {doc.uploadedBy?.name || "System"}
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500 dark:text-white/40">
                        {doc.createdAt ? new Date(doc.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "-"}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <a
                            href={doc.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-lg bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-600 dark:text-white/70 transition-colors"
                            title="Buka / Download Dokumen"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>
                          {canUpdate && (
                            <button
                              onClick={() => openDocModal(doc)}
                              className="p-2 rounded-lg bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-600 dark:text-white/70 transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => { setTargetDoc(doc); setDocDelModal(true); }}
                              className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB: CATEGORIES ── */}
      {activeTab === "categories" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCategories.length === 0 ? (
            <div className="col-span-full py-16 text-center text-gray-400 dark:text-white/30 bg-white/40 dark:bg-white/[0.02] border border-gray-200/50 dark:border-white/10 rounded-3xl">
              Belum ada kategori dokumen.
            </div>
          ) : (
            filteredCategories.map(cat => (
              <div
                key={cat.id}
                className="bg-white/40 dark:bg-white/[0.02] border border-gray-200/50 dark:border-white/10 rounded-3xl p-6 backdrop-blur-xl flex flex-col justify-between space-y-4 hover:border-primary/30 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                      <FolderOpen className="w-5 h-5" />
                    </div>
                    <div className="flex items-center gap-1">
                      {canUpdate && (
                        <button
                          onClick={() => openCatModal(cat)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500 dark:text-white/60"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {canDelete && (
                        <button
                          onClick={() => { setTargetCat(cat); setCatDelModal(true); }}
                          className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">{cat.name}</h3>
                  <p className="text-xs text-gray-500 dark:text-white/40 line-clamp-2">{cat.description || "Tidak ada deskripsi."}</p>
                </div>

                <div className="pt-3 border-t border-gray-200/50 dark:border-white/5 flex items-center justify-between text-xs text-gray-500 dark:text-white/40 font-medium">
                  <span>Total dokumen</span>
                  <span className="font-bold text-primary">
                    {documents.filter(d => d.categoryId === cat.id).length} File
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── MODAL: DOCUMENT FORM ── */}
      <AnimatePresence>
        {docModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeDocModal} className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-lg bg-white dark:bg-[#0a1612] border border-gray-200 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="p-6 border-b border-gray-200 dark:border-white/10 flex items-center justify-between bg-gray-50/50 dark:bg-white/[0.02]">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  {targetDoc ? "Edit Dokumen" : "Tambah Dokumen Baru"}
                </h2>
                <button onClick={closeDocModal} className="text-gray-400 hover:text-gray-900 dark:hover:text-white"><X className="w-5 h-5" /></button>
              </div>

              <div className="p-6 overflow-y-auto flex-1 space-y-4">
                <form id="docForm" onSubmit={handleSaveDocument} className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold tracking-wider text-gray-500 dark:text-white/50 uppercase mb-2">Judul Dokumen *</label>
                    <input
                      type="text"
                      required
                      value={docForm.title}
                      onChange={e => setDocForm(p => ({ ...p, title: e.target.value }))}
                      className="w-full h-12 px-4 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm font-semibold text-gray-900 dark:text-white focus:outline-none focus:border-primary/50"
                      placeholder="e.g. SOP Pelaksanaan Workshop Energi 2026"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold tracking-wider text-gray-500 dark:text-white/50 uppercase mb-2">Kategori *</label>
                    <select
                      required
                      value={docForm.categoryId}
                      onChange={e => setDocForm(p => ({ ...p, categoryId: e.target.value }))}
                      className="w-full h-12 px-4 bg-white dark:bg-[#07130e] border border-gray-200 dark:border-white/10 rounded-xl text-sm font-semibold text-gray-900 dark:text-white focus:outline-none focus:border-primary/50 cursor-pointer"
                    >
                      <option value="" className="bg-white dark:bg-[#0a1612] text-gray-900 dark:text-white">— Pilih Kategori —</option>
                      {categories.map(c => (
                        <option key={c.id} value={c.id.toString()} className="bg-white dark:bg-[#0a1612] text-gray-900 dark:text-white">{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold tracking-wider text-gray-500 dark:text-white/50 uppercase mb-2">Deskripsi (Opsional)</label>
                    <textarea
                      rows={3}
                      value={docForm.description}
                      onChange={e => setDocForm(p => ({ ...p, description: e.target.value }))}
                      className="w-full p-4 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none resize-none h-20"
                      placeholder="Penjelasan singkat isi berkas..."
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold tracking-wider text-gray-500 dark:text-white/50 uppercase mb-2">File Dokumen (PDF, Doc, R2 / Local) *</label>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          required
                          value={docForm.fileUrl}
                          onChange={e => setDocForm(p => ({ ...p, fileUrl: e.target.value }))}
                          className="flex-1 h-12 px-4 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-xs text-gray-900 dark:text-white focus:outline-none"
                          placeholder="https://... atau upload file di samping"
                        />
                        <label className={`h-12 px-4 bg-primary/10 border border-primary/20 hover:bg-primary/20 text-primary rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors shrink-0 ${isLoading ? "opacity-50 pointer-events-none" : ""}`}>
                          <UploadCloud className="w-4 h-4" />
                          <span>Upload</span>
                          <input type="file" onChange={handleFileUpload} className="hidden" />
                        </label>
                      </div>
                    </div>
                  </div>
                </form>
              </div>

              <div className="p-6 border-t border-gray-200 dark:border-white/10 flex justify-end gap-3 bg-gray-50/50 dark:bg-white/[0.02]">
                <button type="button" onClick={closeDocModal} className="px-5 py-2 rounded-xl text-xs font-semibold text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10">Batal</button>
                <button type="submit" form="docForm" disabled={isLoading} className="px-5 py-2 rounded-xl text-xs font-bold bg-primary text-[#050e0a] hover:bg-primary-focus flex items-center gap-2">
                  {isLoading ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : "Simpan"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── MODAL: CATEGORY FORM ── */}
      <AnimatePresence>
        {catModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeCatModal} className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-md bg-white dark:bg-[#0a1612] border border-gray-200 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden">
              <div className="p-6 border-b border-gray-200 dark:border-white/10 flex items-center justify-between bg-gray-50/50 dark:bg-white/[0.02]">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <FolderPlus className="w-5 h-5 text-primary" />
                  {targetCat ? "Edit Kategori Dokumen" : "Tambah Kategori Dokumen"}
                </h2>
                <button onClick={closeCatModal} className="text-gray-400 hover:text-gray-900 dark:hover:text-white"><X className="w-5 h-5" /></button>
              </div>

              <form onSubmit={handleSaveCategory} className="p-6 space-y-4">
                <div>
                  <label className="block text-[11px] font-bold tracking-wider text-gray-500 dark:text-white/50 uppercase mb-2">Nama Kategori *</label>
                  <input
                    type="text"
                    required
                    value={catForm.name}
                    onChange={e => setCatForm(p => ({ ...p, name: e.target.value }))}
                    className="w-full h-12 px-4 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm font-semibold text-gray-900 dark:text-white focus:outline-none focus:border-primary/50"
                    placeholder="e.g. Surat Keputusan (SK)"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold tracking-wider text-gray-500 dark:text-white/50 uppercase mb-2">Deskripsi</label>
                  <textarea
                    rows={3}
                    value={catForm.description}
                    onChange={e => setCatForm(p => ({ ...p, description: e.target.value }))}
                    className="w-full p-4 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none resize-none h-20"
                    placeholder="Penjelasan kategori..."
                  />
                </div>

                <div className="pt-3 flex justify-end gap-3">
                  <button type="button" onClick={closeCatModal} className="px-5 py-2 rounded-xl text-xs font-semibold text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10">Batal</button>
                  <button type="submit" disabled={isLoading} className="px-5 py-2 rounded-xl text-xs font-bold bg-primary text-[#050e0a] hover:bg-primary-focus flex items-center gap-2">
                    {isLoading ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : "Simpan"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── MODAL DELETE CONFIRM ── */}
      <AnimatePresence>
        {(docDelModal || catDelModal) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setDocDelModal(false); setCatDelModal(false); }} className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-sm bg-white dark:bg-[#0a1612] border border-gray-200 dark:border-white/10 rounded-3xl p-6 text-center">
              <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4 border border-red-500/25">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                Hapus {catDelModal ? "Kategori" : "Dokumen"}?
              </h3>
              <p className="text-xs text-gray-500 dark:text-white/40 mb-6">
                {catDelModal 
                  ? "Semua dokumen dalam kategori ini juga akan dihapus permanen!" 
                  : "Dokumen ini akan dihapus permanen dari sistem."}
              </p>
              <div className="flex gap-3">
                <button onClick={() => { setDocDelModal(false); setCatDelModal(false); }} className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-xs font-semibold text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5">Batal</button>
                <button onClick={catDelModal ? handleDeleteCategory : handleDeleteDocument} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-xs font-bold hover:bg-red-600">Hapus</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
