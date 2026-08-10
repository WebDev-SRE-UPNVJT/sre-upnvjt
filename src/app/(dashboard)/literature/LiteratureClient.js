"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Edit2, Trash2, X, Search, CheckCircle2, XCircle,
  AlertTriangle, BookOpen, FolderOpen, ExternalLink, UploadCloud,
  FileText, Grid3X3, List, Eye, EyeOff,
} from "lucide-react";
import {
  createCategory, updateCategory, deleteCategory,
  createLiteratureItem, updateLiteratureItem, deleteLiteratureItem,
} from "@/app/actions/literatureActions";
import { useSession } from "next-auth/react";
import { hasAccess } from "@/lib/permissions";

// ─── Constants ───────────────────────────────────────────────────────────────
const ITEM_TYPES = ["PDF", "SLIDES", "DOC", "VIDEO", "OTHER"];

const TYPE_COLORS = {
  PDF:    "bg-red-500/15 text-red-400 border-red-500/25",
  SLIDES: "bg-orange-500/15 text-orange-400 border-orange-500/25",
  DOC:    "bg-blue-500/15 text-blue-400 border-blue-500/25",
  VIDEO:  "bg-purple-500/15 text-purple-400 border-purple-500/25",
  OTHER:  "bg-gray-500/15 text-gray-400 border-gray-500/25",
};

const EMPTY_CATEGORY = { name: "", imageUrl: "", description: "" };
const EMPTY_ITEM = {
  title: "", author: "", year: "", categoryId: "",
  driveUrl: "", type: "PDF", isPublished: false,
};

// ─── Shared helpers ───────────────────────────────────────────────────────────
const InputField = ({ label, children }) => (
  <div>
    <label className="block text-[11px] font-bold tracking-wider text-gray-500 dark:text-white/50 uppercase mb-2">
      {label}
    </label>
    {children}
  </div>
);

const inputCls =
  "w-full h-12 px-4 bg-white dark:bg-white/5 shadow-sm dark:shadow-none border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/20 focus:outline-none focus:border-primary/50 transition-all";

const textareaCls =
  "w-full p-4 bg-white dark:bg-white/5 shadow-sm dark:shadow-none border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/20 focus:outline-none focus:border-primary/50 transition-all resize-none";

// ─── Main Component ───────────────────────────────────────────────────────────
export default function LiteratureClient({ initialCategories, initialItems, currentUser }) {
  const { data: session } = useSession();
  const user = session?.user ?? currentUser;

  const [activeTab, setActiveTab] = useState("items");
  const [categories, setCategories] = useState(initialCategories || []);
  const [items, setItems] = useState(initialItems || []);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  // Category modal
  const [catModal, setCatModal] = useState(false);
  const [catForm, setCatForm] = useState(EMPTY_CATEGORY);
  const [catDelModal, setCatDelModal] = useState(false);
  const [targetCat, setTargetCat] = useState(null);

  // Item modal
  const [itemModal, setItemModal] = useState(false);
  const [itemForm, setItemForm] = useState(EMPTY_ITEM);
  const [itemDelModal, setItemDelModal] = useState(false);
  const [targetItem, setTargetItem] = useState(null);

  // ── Permissions ────────────────────────────────────────────────────────────
  const canCreate = hasAccess(user, "literature", "create");
  const canUpdate = hasAccess(user, "literature", "update");
  const canDelete = hasAccess(user, "literature", "delete");

  // ── Notification ──────────────────────────────────────────────────────────
  const notify = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3500);
  };

  // ── File upload (shared for category images) ──────────────────────────────
  const handleFileUpload = async (e, setter) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { notify("error", "Harap pilih file gambar"); return; }

    const fd = new FormData();
    fd.append("file", file);
    fd.append("folder", "literature");
    setIsLoading(true);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok && data.url) {
        setter(prev => ({ ...prev, imageUrl: data.url }));
        notify("success", "Gambar berhasil diunggah!");
      } else {
        notify("error", data.error || "Gagal mengunggah gambar");
      }
    } catch {
      notify("error", "Terjadi kesalahan saat upload");
    } finally {
      setIsLoading(false);
    }
  };

  // ══════════════════════════════════════════════════════════════════════════
  //  CATEGORY HANDLERS
  // ══════════════════════════════════════════════════════════════════════════
  const openCatModal = (cat = null) => {
    setCatForm(cat ? { ...cat } : { ...EMPTY_CATEGORY });
    setTargetCat(cat);
    setCatModal(true);
  };
  const closeCatModal = () => {
    setCatModal(false);
    setTimeout(() => { setCatForm(EMPTY_CATEGORY); setTargetCat(null); }, 300);
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const isEditing = Boolean(targetCat?.id);
    const res = isEditing
      ? await updateCategory(targetCat.id, catForm)
      : await createCategory(catForm);

    if (res.success) {
      if (isEditing) {
        setCategories(prev => prev.map(c => c.id === targetCat.id ? res.category : c));
      } else {
        setCategories(prev => [res.category, ...prev]);
      }
      notify("success", isEditing ? "Kategori diperbarui!" : "Kategori ditambahkan!");
      closeCatModal();
    } else {
      notify("error", res.error || "Gagal menyimpan kategori");
    }
    setIsLoading(false);
  };

  const handleDeleteCategory = async () => {
    if (!targetCat?.id) return;
    setIsLoading(true);
    const res = await deleteCategory(targetCat.id);
    if (res.success) {
      setCategories(prev => prev.filter(c => c.id !== targetCat.id));
      notify("success", "Kategori dihapus");
      setCatDelModal(false);
    } else {
      notify("error", res.error || "Gagal menghapus kategori");
    }
    setIsLoading(false);
  };

  // ══════════════════════════════════════════════════════════════════════════
  //  ITEM HANDLERS
  // ══════════════════════════════════════════════════════════════════════════
  const openItemModal = (item = null) => {
    setItemForm(item
      ? { ...item, categoryId: item.categoryId?.toString() || item.category?.id?.toString() || "" }
      : { ...EMPTY_ITEM }
    );
    setTargetItem(item);
    setItemModal(true);
  };
  const closeItemModal = () => {
    setItemModal(false);
    setTimeout(() => { setItemForm(EMPTY_ITEM); setTargetItem(null); }, 300);
  };

  const handleSaveItem = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const isEditing = Boolean(targetItem?.id);
    const res = isEditing
      ? await updateLiteratureItem(targetItem.id, itemForm)
      : await createLiteratureItem(itemForm, user?.id);

    if (res.success) {
      if (isEditing) {
        setItems(prev => prev.map(i => i.id === targetItem.id ? res.item : i));
      } else {
        setItems(prev => [res.item, ...prev]);
      }
      notify("success", isEditing ? "Item diperbarui!" : "Item ditambahkan!");
      closeItemModal();
    } else {
      notify("error", res.error || "Gagal menyimpan item");
    }
    setIsLoading(false);
  };

  const handleDeleteItem = async () => {
    if (!targetItem?.id) return;
    setIsLoading(true);
    const res = await deleteLiteratureItem(targetItem.id);
    if (res.success) {
      setItems(prev => prev.filter(i => i.id !== targetItem.id));
      notify("success", "Item dihapus");
      setItemDelModal(false);
    } else {
      notify("error", res.error || "Gagal menghapus item");
    }
    setIsLoading(false);
  };

  // ── Filtered items ────────────────────────────────────────────────────────
  const filteredItems = items.filter(item => {
    const q = searchQuery.toLowerCase();
    const matchSearch = !q ||
      (item.title || "").toLowerCase().includes(q) ||
      (item.author || "").toLowerCase().includes(q);
    const matchCat = filterCategory === "all" || item.categoryId?.toString() === filterCategory ||
      item.category?.id?.toString() === filterCategory;
    const matchType = filterType === "all" || item.type === filterType;
    return matchSearch && matchCat && matchType;
  });

  const filteredCats = categories.filter(c =>
    (c.name || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ── Currently selected category preview (in item modal) ────────────────
  const selectedCatPreview = categories.find(c => c.id?.toString() === itemForm.categoryId);

  // ═══════════════════════════════════════════════════════════════════════════
  //  RENDER
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className="w-full relative">

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-black tracking-tighter mb-2 flex items-center gap-3 text-gray-900 dark:text-white">
            <BookOpen className="w-8 h-8 text-primary" />
            Literature Bank
          </h1>
          <p className="text-gray-500 dark:text-white/50 max-w-xl">
            Kelola kategori dan item referensi / literatur SRE UPNVJT.
          </p>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          {/* Search */}
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-white/30" />
            <input
              type="text"
              placeholder={activeTab === "items" ? "Cari judul / penulis..." : "Cari kategori..."}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-white/5 shadow-sm dark:shadow-none border border-gray-200 dark:border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>
          {/* Add button */}
          {canCreate && (
            <button
              onClick={() => activeTab === "items" ? openItemModal() : openCatModal()}
              className="flex items-center gap-2 bg-primary text-[#050e0a] px-6 py-3 rounded-xl font-bold tracking-wide hover:bg-primary-focus hover:scale-105 transition-all shrink-0 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">
                {activeTab === "items" ? "Tambah Item" : "Tambah Kategori"}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 mb-8 bg-gray-100 dark:bg-white/[0.03] p-1 rounded-2xl w-fit border border-gray-200 dark:border-white/10">
        {[
          { key: "items", label: "Item Literatur", icon: FileText },
          { key: "categories", label: "Kategori", icon: Grid3X3 },
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setSearchQuery(""); }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === tab.key
                  ? "bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm dark:shadow-[0_2px_10px_rgba(0,0,0,0.3)]"
                  : "text-gray-500 dark:text-white/40 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          TAB: ITEM LITERATUR
         ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "items" && (
        <div>
          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-6">
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
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              className="h-10 px-3.5 bg-white dark:bg-[#0d1c16] border border-gray-200 dark:border-white/15 rounded-xl text-xs font-bold text-gray-900 dark:text-white focus:outline-none focus:border-primary/50 transition-all cursor-pointer shadow-sm"
            >
              <option value="all" className="bg-white dark:bg-[#0a1612] text-gray-900 dark:text-white">Semua Tipe</option>
              {ITEM_TYPES.map(t => <option key={t} value={t} className="bg-white dark:bg-[#0a1612] text-gray-900 dark:text-white">{t}</option>)}
            </select>
            <span className="flex items-center text-sm text-gray-500 dark:text-primary ml-auto">
              {filteredItems.length}
            </span>
          </div>

          {/* Table */}
          <div className="bg-white/40 dark:bg-white/[0.02] border border-gray-200/50 dark:border-white/10 rounded-3xl overflow-hidden backdrop-blur-xl shadow-lg dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)]">
            <div className="overflow-x-auto w-full scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-white/10 scrollbar-track-transparent">
              <table className="w-full min-w-[800px] text-left">
                <thead className="border-b border-gray-200/50 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02]">
                  <tr>
                    {["Judul", "Penulis", "Tahun", "Tipe", "Kategori", "Status", "Aksi"].map(h => (
                      <th key={h} className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-white/40 whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                  <AnimatePresence>
                    {filteredItems.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-20 text-center">
                          <div className="flex flex-col items-center gap-3 text-gray-500 dark:text-white/30">
                            <BookOpen className="w-10 h-10" />
                            <p className="font-medium">Belum ada item literatur</p>
                            <p className="text-sm">Tambahkan referensi pertama untuk ditampilkan di sini.</p>
                          </div>
                        </td>
                      </tr>
                    ) : filteredItems.map(item => (
                      <motion.tr
                        key={item.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="hover:bg-white/60 dark:hover:bg-white/[0.03] transition-colors group"
                      >
                        <td className="px-6 py-4 max-w-[240px]">
                          <div className="font-semibold text-gray-900 dark:text-white text-sm truncate">{item.title}</div>
                          <a
                            href={item.driveUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[11px] text-primary hover:underline flex items-center gap-1 mt-0.5"
                          >
                            Buka Link <ExternalLink className="w-3 h-3" />
                          </a>
                        </td>
                        <td className="px-6 py-4 text-gray-500 dark:text-white/60 text-sm whitespace-nowrap">
                          {item.author || <span className="opacity-30">—</span>}
                        </td>
                        <td className="px-6 py-4 text-gray-500 dark:text-white/60 text-sm whitespace-nowrap">
                          {item.year || <span className="opacity-30">—</span>}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {item.type ? (
                            <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${TYPE_COLORS[item.type] || TYPE_COLORS.OTHER}`}>
                              {item.type}
                            </span>
                          ) : <span className="text-gray-400 dark:text-white/20 text-xs">—</span>}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {item.category?.imageUrl && (
                              <img src={item.category.imageUrl} alt="" className="w-5 h-5 rounded object-cover" />
                            )}
                            <span className="text-sm text-gray-600 dark:text-white/70 truncate max-w-[120px]">
                              {item.category?.name || "—"}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                            item.isPublished
                              ? "bg-green-500/15 text-green-400 border-green-500/25"
                              : "bg-gray-500/10 text-gray-400 border-gray-500/20"
                          }`}>
                            {item.isPublished ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                            {item.isPublished ? "Published" : "Draft"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex gap-2">
                            {canUpdate && (
                              <button
                                onClick={() => openItemModal(item)}
                                className="w-8 h-8 rounded-lg bg-white dark:bg-white/5 shadow-sm dark:shadow-none hover:bg-gray-50 dark:hover:bg-white/10 text-gray-500 dark:text-white/70 hover:text-gray-900 dark:text-white flex items-center justify-center transition-all border border-transparent hover:border-gray-200 dark:border-white/10"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                            )}
                            {canDelete && (
                              <button
                                onClick={() => { setTargetItem(item); setItemDelModal(true); }}
                                className="w-8 h-8 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 flex items-center justify-center transition-all border border-transparent hover:border-red-500/20"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB: KATEGORI
         ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "categories" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <AnimatePresence>
            {filteredCats.length === 0 ? (
              <div className="col-span-full py-20 flex flex-col items-center justify-center text-center bg-white/40 dark:bg-white/[0.02] border border-dashed border-gray-200/50 dark:border-white/10 rounded-3xl">
                <FolderOpen className="w-12 h-12 text-gray-400 dark:text-white/20 mb-4" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Belum ada kategori</h3>
                <p className="text-gray-500 dark:text-white/40 text-sm">Buat kategori untuk mengelompokkan literatur.</p>
              </div>
            ) : filteredCats.map(cat => (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white/40 dark:bg-white/[0.02] border border-gray-200/50 dark:border-white/10 shadow-lg dark:shadow-[0_8px_30px_rgba(0,0,0,0.3)] rounded-3xl overflow-hidden backdrop-blur-xl group hover:-translate-y-1 hover:shadow-[0_15px_40px_rgba(16,185,129,0.08)] transition-all duration-300 flex flex-col"
              >
                {/* Cover */}
                <div className="relative aspect-video w-full overflow-hidden bg-gradient-to-br from-primary/10 to-primary/5 border-b border-gray-200 dark:border-white/5">
                  {cat.imageUrl ? (
                    <img
                      src={cat.imageUrl}
                      alt={cat.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-primary/40">
                      <FolderOpen className="w-10 h-10 mb-2" />
                      <span className="text-[11px] font-medium">No Image</span>
                    </div>
                  )}
                  {/* item count badge */}
                  <div className="absolute top-3 right-3">
                    <span className="px-2 py-1 rounded-md text-[10px] font-bold bg-black/40 text-white backdrop-blur-md border border-white/10">
                      {items.filter(i => i.categoryId === cat.id || i.category?.id === cat.id).length} item
                    </span>
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col">
                  <h3 className="text-[15px] font-bold text-gray-900 dark:text-white mb-1 group-hover:text-primary transition-colors">
                    {cat.name}
                  </h3>
                  {cat.description && (
                    <p className="text-[12px] text-gray-500 dark:text-white/40 line-clamp-2 mb-4 flex-1">
                      {cat.description}
                    </p>
                  )}
                  <div className="flex gap-2 mt-auto pt-4 border-t border-gray-200 dark:border-white/5">
                    {canUpdate && (
                      <button
                        onClick={() => openCatModal(cat)}
                        className="flex-1 h-9 rounded-xl bg-white dark:bg-white/5 shadow-sm dark:shadow-none hover:bg-gray-50 dark:hover:bg-white/10 text-gray-600 dark:text-white/70 hover:text-gray-900 dark:text-white flex items-center justify-center gap-2 transition-all border border-gray-200 dark:border-white/10 text-sm font-medium"
                      >
                        <Edit2 className="w-3.5 h-3.5" /> Edit
                      </button>
                    )}
                    {canDelete && (
                      <button
                        onClick={() => { setTargetCat(cat); setCatDelModal(true); }}
                        className="h-9 w-9 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 flex items-center justify-center transition-all border border-transparent hover:border-red-500/20"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL: SAVE CATEGORY
         ══════════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {catModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={closeCatModal}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white dark:bg-[#0a1612] border border-gray-200 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-gray-200 dark:border-white/10 flex items-center justify-between shrink-0 bg-gray-50/50 dark:bg-white/[0.02]">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <FolderOpen className="w-5 h-5 text-primary" />
                  {targetCat ? "Edit Kategori" : "Kategori Baru"}
                </h2>
                <button onClick={closeCatModal} className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1">
                <form id="catForm" onSubmit={handleSaveCategory} className="space-y-5">
                  <InputField label="Nama Kategori *">
                    <input
                      type="text"
                      required
                      value={catForm.name}
                      onChange={e => setCatForm(p => ({ ...p, name: e.target.value }))}
                      className={inputCls}
                      placeholder="e.g. Teknik Sipil, Fisika Dasar..."
                    />
                  </InputField>

                  <InputField label="Deskripsi">
                    <textarea
                      rows={3}
                      value={catForm.description}
                      onChange={e => setCatForm(p => ({ ...p, description: e.target.value }))}
                      className={`${textareaCls} h-24`}
                      placeholder="Deskripsi singkat kategori ini..."
                    />
                  </InputField>

                  <InputField label="Gambar Kategori (URL atau Upload)">
                    <div className="flex gap-3 items-start">
                      {catForm.imageUrl && (
                        <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-black/30">
                          <img src={catForm.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="flex-1 flex flex-col gap-2">
                        <input
                          type="text"
                          value={catForm.imageUrl}
                          onChange={e => setCatForm(p => ({ ...p, imageUrl: e.target.value }))}
                          className={inputCls}
                          placeholder="https://..."
                        />
                        <label className={`relative overflow-hidden flex items-center gap-2 h-10 px-4 bg-white dark:bg-white/5 shadow-sm dark:shadow-none border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-500 dark:text-white/50 hover:bg-gray-50 dark:hover:bg-white/10 transition-colors cursor-pointer ${isLoading ? "opacity-50 pointer-events-none" : ""}`}>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={e => handleFileUpload(e, setCatForm)}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                          />
                          <UploadCloud className="w-4 h-4" />
                          Upload gambar
                        </label>
                      </div>
                    </div>
                  </InputField>
                </form>
              </div>

              <div className="p-6 border-t border-gray-200 dark:border-white/10 flex justify-end gap-3 shrink-0 bg-gray-50/50 dark:bg-white/[0.02]">
                <button onClick={closeCatModal} className="px-6 py-2.5 rounded-xl font-semibold text-gray-500 dark:text-white/70 hover:text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-all">
                  Batal
                </button>
                <button
                  type="submit"
                  form="catForm"
                  disabled={isLoading}
                  className="px-6 py-2.5 rounded-xl font-bold bg-primary text-[#050e0a] hover:bg-[#a8d3ba] transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {isLoading ? <div className="w-5 h-5 border-2 border-[#050e0a]/30 border-t-[#050e0a] rounded-full animate-spin" /> : "Simpan"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL: SAVE ITEM
         ══════════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {itemModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={closeItemModal}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white dark:bg-[#0a1612] border border-gray-200 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-gray-200 dark:border-white/10 flex items-center justify-between shrink-0 bg-gray-50/50 dark:bg-white/[0.02]">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  {targetItem ? "Edit Item" : "Item Baru"}
                </h2>
                <button onClick={closeItemModal} className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1">
                <form id="itemForm" onSubmit={handleSaveItem} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="md:col-span-2">
                      <InputField label="Judul *">
                        <input
                          type="text"
                          required
                          value={itemForm.title}
                          onChange={e => setItemForm(p => ({ ...p, title: e.target.value }))}
                          className={inputCls}
                          placeholder="e.g. Mekanika Fluida Edisi 7"
                        />
                      </InputField>
                    </div>

                    <InputField label="Penulis / Author">
                      <input
                        type="text"
                        value={itemForm.author}
                        onChange={e => setItemForm(p => ({ ...p, author: e.target.value }))}
                        className={inputCls}
                        placeholder="e.g. Frank White"
                      />
                    </InputField>

                    <InputField label="Tahun">
                      <input
                        type="number"
                        min={1900}
                        max={new Date().getFullYear() + 1}
                        value={itemForm.year}
                        onChange={e => setItemForm(p => ({ ...p, year: e.target.value }))}
                        className={inputCls}
                        placeholder="e.g. 2022"
                      />
                    </InputField>

                    {/* Category select + preview */}
                    <div className="md:col-span-2">
                      <InputField label="Pilih Kategori *">
                        <div className="flex gap-3 items-center">
                          <select
                            required
                            value={itemForm.categoryId}
                            onChange={e => setItemForm(p => ({ ...p, categoryId: e.target.value }))}
                            className={`${inputCls} flex-1 text-gray-900 dark:text-white font-semibold cursor-pointer`}
                          >
                            <option value="" className="bg-white dark:bg-[#0a1612] text-gray-900 dark:text-white">— Pilih Kategori —</option>
                            {categories.map(c => (
                              <option key={c.id} value={c.id.toString()} className="bg-white dark:bg-[#0a1612] text-gray-900 dark:text-white">{c.name}</option>
                            ))}
                          </select>
                          {selectedCatPreview?.imageUrl && (
                            <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-black/30">
                              <img src={selectedCatPreview.imageUrl} alt="" className="w-full h-full object-cover" />
                            </div>
                          )}
                        </div>
                      </InputField>
                    </div>

                    <div className="md:col-span-2">
                      <InputField label="Link Google Drive *">
                        <input
                          type="url"
                          required
                          value={itemForm.driveUrl}
                          onChange={e => setItemForm(p => ({ ...p, driveUrl: e.target.value }))}
                          className={inputCls}
                          placeholder="https://drive.google.com/file/d/..."
                        />
                      </InputField>
                    </div>

                    <InputField label="Tipe">
                      <select
                        value={itemForm.type}
                        onChange={e => setItemForm(p => ({ ...p, type: e.target.value }))}
                        className={`${inputCls} text-gray-900 dark:text-white font-semibold cursor-pointer`}
                      >
                        {ITEM_TYPES.map(t => <option key={t} value={t} className="bg-white dark:bg-[#0a1612] text-gray-900 dark:text-white">{t}</option>)}
                      </select>
                    </InputField>

                    {/* Published toggle */}
                    <div className="flex items-center justify-between p-4 bg-white dark:bg-white/5 shadow-sm dark:shadow-none border border-gray-200 dark:border-white/10 rounded-xl">
                      <div>
                        <div className="text-gray-900 dark:text-white font-medium text-[14px]">Status Publikasi</div>
                        <div className="text-gray-500 dark:text-white/40 text-[12px]">
                          {itemForm.isPublished ? "Ditampilkan ke anggota" : "Tersimpan sebagai draft"}
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={itemForm.isPublished}
                          onChange={e => setItemForm(p => ({ ...p, isPublished: e.target.checked }))}
                        />
                        <div className="w-11 h-6 bg-gray-200 dark:bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
                      </label>
                    </div>
                  </div>
                </form>
              </div>

              <div className="p-6 border-t border-gray-200 dark:border-white/10 flex justify-end gap-3 shrink-0 bg-gray-50/50 dark:bg-white/[0.02]">
                <button onClick={closeItemModal} className="px-6 py-2.5 rounded-xl font-semibold text-gray-500 dark:text-white/70 hover:text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-all">
                  Batal
                </button>
                <button
                  type="submit"
                  form="itemForm"
                  disabled={isLoading}
                  className="px-6 py-2.5 rounded-xl font-bold bg-primary text-[#050e0a] hover:bg-[#a8d3ba] transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {isLoading ? <div className="w-5 h-5 border-2 border-[#050e0a]/30 border-t-[#050e0a] rounded-full animate-spin" /> : "Simpan Item"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL: DELETE CATEGORY
         ══════════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {catDelModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setCatDelModal(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white dark:bg-[#0a1612] border border-gray-200 dark:border-white/10 rounded-3xl shadow-2xl p-8 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4 border border-red-500/20">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Hapus Kategori</h2>
              <p className="text-gray-500 dark:text-white/50 mb-8 text-sm leading-relaxed">
                Apakah Anda yakin ingin menghapus kategori{" "}
                <strong className="text-gray-900 dark:text-white">{targetCat?.name}</strong>?{" "}
                Item di dalam kategori ini mungkin terpengaruh.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setCatDelModal(false)} className="flex-1 px-4 py-3 rounded-xl font-semibold text-gray-500 dark:text-white/70 hover:text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10 transition-all">
                  Batal
                </button>
                <button
                  onClick={handleDeleteCategory}
                  disabled={isLoading}
                  className="flex-1 px-4 py-3 rounded-xl font-bold bg-red-500 text-white hover:bg-red-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Hapus"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL: DELETE ITEM
         ══════════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {itemDelModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setItemDelModal(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white dark:bg-[#0a1612] border border-gray-200 dark:border-white/10 rounded-3xl shadow-2xl p-8 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4 border border-red-500/20">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Hapus Item</h2>
              <p className="text-gray-500 dark:text-white/50 mb-8 text-sm leading-relaxed">
                Apakah Anda yakin ingin menghapus{" "}
                <strong className="text-gray-900 dark:text-white">{targetItem?.title}</strong>?{" "}
                Tindakan ini tidak dapat dibatalkan.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setItemDelModal(false)} className="flex-1 px-4 py-3 rounded-xl font-semibold text-gray-500 dark:text-white/70 hover:text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10 transition-all">
                  Batal
                </button>
                <button
                  onClick={handleDeleteItem}
                  disabled={isLoading}
                  className="flex-1 px-4 py-3 rounded-xl font-bold bg-red-500 text-white hover:bg-red-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Hapus"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Toast Notification ── */}
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
            {notification.type === "success"
              ? <CheckCircle2 className="w-5 h-5" />
              : <XCircle className="w-5 h-5" />
            }
            <span className="font-medium">{notification.message}</span>
            <button onClick={() => setNotification(null)} className="ml-2 opacity-50 hover:opacity-100 transition-opacity">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
