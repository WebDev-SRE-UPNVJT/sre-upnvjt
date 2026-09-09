"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, Plus, Edit2, Trash2, X, FileText, Check, AlertCircle, 
  Image as ImageIcon, Loader2, Tag, FolderPlus, Settings2, Sparkles, Filter,
  Languages, Globe, Copy
} from "lucide-react";
import { hasAccess } from "@/lib/permissions";
import { 
  createContent, updateContent, deleteContent,
  createContentCategory, updateContentCategory, deleteContentCategory 
} from "@/app/actions/contentActions";
import TinyMCEEditor from "@/components/editor/TinyMCEEditor";
import { resolveImageUrl } from "@/lib/imageUrl";

const CATEGORY_COLORS = [
  { label: "Emerald", value: "emerald", bg: "bg-emerald-500" },
  { label: "Blue", value: "blue", bg: "bg-blue-500" },
  { label: "Amber", value: "amber", bg: "bg-amber-500" },
  { label: "Purple", value: "purple", bg: "bg-purple-500" },
  { label: "Rose", value: "rose", bg: "bg-rose-500" },
  { label: "Cyan", value: "cyan", bg: "bg-cyan-500" },
];

export function getCategoryBadgeStyle(color) {
  switch (color) {
    case "blue":
      return "bg-blue-600 text-white border-2 border-blue-400 shadow-md shadow-blue-900/30";
    case "amber":
      return "bg-amber-400 text-slate-950 border-2 border-amber-300 shadow-md shadow-amber-900/30 font-black";
    case "purple":
      return "bg-purple-600 text-white border-2 border-purple-400 shadow-md shadow-purple-900/30";
    case "rose":
    case "red":
      return "bg-rose-600 text-white border-2 border-rose-400 shadow-md shadow-rose-900/30";
    case "cyan":
      return "bg-cyan-400 text-slate-950 border-2 border-cyan-200 shadow-md shadow-cyan-900/30 font-black";
    case "emerald":
    default:
      return "bg-emerald-600 text-white border-2 border-emerald-400 shadow-md shadow-emerald-900/30";
  }
}

export default function ContentClient({ initialContents, initialCategories, currentUser }) {
  const [contents, setContents] = useState(initialContents || []);
  const [categories, setCategories] = useState(initialCategories || []);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("all");

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);

  const [selectedContent, setSelectedContent] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  
  // Editor language tab: "en" | "id"
  const [editorLanguage, setEditorLanguage] = useState("en");

  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const [categoryError, setCategoryError] = useState("");
  
  // Content Form State (Bilingual)
  const [formData, setFormData] = useState({
    title: "",     // English title (Default)
    titleId: "",   // Indonesian title
    slug: "",
    categoryId: "",
    body: "",      // English body (Default)
    bodyId: "",    // Indonesian body
    imageUrl: "",
    isPublished: false
  });

  // Category Form State
  const [categoryFormData, setCategoryFormData] = useState({
    name: "",
    slug: "",
    description: "",
    color: "emerald"
  });

  const userForPerms = { ...currentUser, roleName: currentUser?.role?.name || currentUser?.roleName };
  const canCreate = hasAccess(userForPerms, "content", "create");
  const canUpdate = hasAccess(userForPerms, "content", "update");
  const canDelete = hasAccess(userForPerms, "content", "delete");

  const filteredContents = useMemo(() => {
    return contents.filter(c => {
      const matchesSearch = 
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.titleId && c.titleId.toLowerCase().includes(searchQuery.toLowerCase())) ||
        c.authorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.categoryName && c.categoryName.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory = 
        selectedCategoryFilter === "all" || 
        c.categoryId?.toString() === selectedCategoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [contents, searchQuery, selectedCategoryFilter]);

  // ----------------------------------------------------------------
  // Content Handlers
  // ----------------------------------------------------------------

  const handleOpenModal = (contentItem = null) => {
    setError("");
    setEditorLanguage("en");
    if (contentItem) {
      setSelectedContent(contentItem);
      setFormData({
        title: contentItem.title || "",
        titleId: contentItem.titleId || "",
        slug: contentItem.slug || "",
        categoryId: contentItem.categoryId?.toString() || "",
        body: contentItem.body || "",
        bodyId: contentItem.bodyId || "",
        imageUrl: contentItem.imageUrl || "",
        isPublished: contentItem.isPublished
      });
    } else {
      setSelectedContent(null);
      setFormData({
        title: "",
        titleId: "",
        slug: "",
        categoryId: categories.length > 0 ? categories[0].id.toString() : "",
        body: "",
        bodyId: "",
        imageUrl: "",
        isPublished: false
      });
    }
    setIsModalOpen(true);
  };

  const generateSlug = (title) => {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  };

  const handleTitleChange = (e) => {
    const title = e.target.value;
    setFormData(prev => ({
      ...prev,
      title,
      slug: !selectedContent ? generateSlug(title) : prev.slug
    }));
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError("");

    try {
      const uploadData = new FormData();
      uploadData.append("file", file);
      uploadData.append("folder", "content");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: uploadData,
      });

      const json = await res.json();
      if (json.success && json.url) {
        setFormData(prev => ({ ...prev, imageUrl: json.url }));
      } else {
        setError(json.error || "Failed to upload image.");
      }
    } catch (err) {
      setError("Failed to upload image.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmitContent = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setError("English Title is required as default.");
      setEditorLanguage("en");
      return;
    }
    if (!formData.body.trim()) {
      setError("English Content Body is required as default.");
      setEditorLanguage("en");
      return;
    }

    setIsLoading(true);
    setError("");

    const dataToSubmit = {
      ...formData,
      categoryId: formData.categoryId ? parseInt(formData.categoryId, 10) : null,
      updatedById: currentUser.id
    };

    let result;
    if (selectedContent) {
      result = await updateContent(selectedContent.id, dataToSubmit);
    } else {
      result = await createContent(dataToSubmit);
    }

    if (result.success) {
      setIsModalOpen(false);
      const matchedCat = categories.find(cat => cat.id.toString() === formData.categoryId);
      const categoryName = matchedCat ? matchedCat.name : null;
      const categoryColor = matchedCat ? matchedCat.color : null;

      if (selectedContent) {
        setContents(prev => prev.map(c => c.id === selectedContent.id ? { 
          ...c, 
          ...dataToSubmit, 
          categoryName, 
          categoryColor 
        } : c));
      } else {
        setContents(prev => [{ 
          ...dataToSubmit, 
          id: result.data.id, 
          categoryName,
          categoryColor,
          authorName: currentUser.name, 
          createdAt: new Date() 
        }, ...prev]);
      }
    } else {
      setError(result.error || "An error occurred while saving content.");
    }
    setIsLoading(false);
  };

  const handleDeleteContent = async () => {
    if (!selectedContent) return;
    setIsLoading(true);
    const result = await deleteContent(selectedContent.id);
    if (result.success) {
      setContents(prev => prev.filter(c => c.id !== selectedContent.id));
      setIsDeleteModalOpen(false);
    } else {
      setError(result.error || "Failed to delete content.");
    }
    setIsLoading(false);
  };

  // ----------------------------------------------------------------
  // Category Handlers
  // ----------------------------------------------------------------

  const handleOpenCategoryModal = (cat = null) => {
    setCategoryError("");
    if (cat) {
      setSelectedCategory(cat);
      setCategoryFormData({
        name: cat.name,
        slug: cat.slug,
        description: cat.description || "",
        color: cat.color || "emerald"
      });
    } else {
      setSelectedCategory(null);
      setCategoryFormData({
        name: "",
        slug: "",
        description: "",
        color: "emerald"
      });
    }
    setIsCategoryModalOpen(true);
  };

  const handleCategoryNameChange = (e) => {
    const name = e.target.value;
    setCategoryFormData(prev => ({
      ...prev,
      name,
      slug: !selectedCategory ? generateSlug(name) : prev.slug
    }));
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!categoryFormData.name.trim()) return;

    setIsLoading(true);
    setCategoryError("");

    try {
      let res;
      if (selectedCategory) {
        res = await updateContentCategory(selectedCategory.id, categoryFormData);
      } else {
        res = await createContentCategory(categoryFormData);
      }

      if (res.success && res.category) {
        if (selectedCategory) {
          setCategories(prev => prev.map(c => c.id === selectedCategory.id ? res.category : c));
          setContents(prev => prev.map(item => item.categoryId === selectedCategory.id ? {
            ...item,
            categoryName: res.category.name,
            categoryColor: res.category.color
          } : item));
        } else {
          setCategories(prev => [...prev, res.category]);
          setFormData(prev => ({ ...prev, categoryId: res.category.id.toString() }));
        }
        setIsCategoryModalOpen(false);
      } else {
        setCategoryError(res.error || "Failed to save category.");
      }
    } catch (err) {
      setCategoryError("An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCategory = async (catId) => {
    if (!confirm("Are you sure you want to delete this category? Articles under this category will remain, but uncategorized.")) {
      return;
    }
    setIsLoading(true);
    const res = await deleteContentCategory(catId);
    if (res.success) {
      setCategories(prev => prev.filter(c => c.id !== catId));
      setContents(prev => prev.map(item => item.categoryId === catId ? { ...item, categoryId: null, categoryName: null, categoryColor: null } : item));
      if (formData.categoryId === catId.toString()) {
        setFormData(prev => ({ ...prev, categoryId: "" }));
      }
      if (selectedCategoryFilter === catId.toString()) {
        setSelectedCategoryFilter("all");
      }
    } else {
      alert(res.error || "Failed to delete category.");
    }
    setIsLoading(false);
  };

  return (
    <div className="p-6 w-full space-y-6">
      {/* Header Stacked Layout */}
      <div className="relative overflow-hidden rounded-4xl bg-linear-to-br from-primary/90 to-emerald-900 p-8 md:p-12 text-white shadow-2xl shadow-primary/20 mb-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-emerald-400/20 rounded-full blur-[60px] translate-y-1/3 -translate-x-1/4 pointer-events-none" />
        
        <div className="w-full relative z-10 flex flex-col justify-between gap-6">
          <div className="space-y-4 md:flex md:justify-between md:items-start">
            <div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tighter leading-none drop-shadow-sm">
                Artikel & Berita
              </h1>
              <p className="text-white/80 max-w-lg text-sm md:text-base font-medium leading-relaxed mt-2">
                Kelola artikel dua bahasa (English & Indonesia) dengan TinyMCE HTML Editor & Kategori Dinamis.
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-2.5">
              <button 
                onClick={() => setIsCategoryManagerOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/15 border border-white/25 hover:bg-white/25 text-xs font-bold uppercase tracking-widest backdrop-blur-md transition-all cursor-pointer shadow-sm hover:scale-[1.02] active:scale-95"
              >
                <Tag className="w-3.5 h-3.5" /> Kelola Kategori ({categories.length})
              </button>
              <div className="inline-flex items-center gap-2 px-3 py-2 rounded-2xl bg-black/20 border border-white/20 text-xs font-bold uppercase tracking-widest backdrop-blur-md">
                <FileText className="w-4 h-4 text-emerald-300" /> Content Manager
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-4 border-t border-white/10">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-white/50" />
              <input 
                type="text"
                placeholder="Search by title (EN/ID), author, or category..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-white/10 border border-white/20 rounded-2xl text-sm text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 backdrop-blur-md transition-all shadow-inner"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2.5 shrink-0">
              <button 
                onClick={() => handleOpenCategoryModal()}
                className="flex items-center justify-center gap-2 bg-white/15 hover:bg-white/25 text-white border border-white/30 px-5 py-3.5 rounded-2xl font-bold text-sm transition-all backdrop-blur-md active:scale-95 cursor-pointer"
              >
                <FolderPlus className="w-4 h-4" />
                <span>+ Kategori Baru</span>
              </button>
              
              {canCreate && (
                <button 
                  onClick={() => handleOpenModal()}
                  className="flex items-center justify-center gap-2 bg-white text-emerald-950 hover:bg-yellow-300 px-6 py-3.5 rounded-2xl font-bold text-sm transition-all shadow-[0_8px_30px_rgb(0,0,0,0.15)] hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 active:scale-95 cursor-pointer"
                >
                  <Plus className="w-5 h-5" />
                  <span>Tambah Artikel</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-1.5 mr-2 shrink-0">
          <Filter className="w-3.5 h-3.5" /> Kategori:
        </span>
        <button
          onClick={() => setSelectedCategoryFilter("all")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            selectedCategoryFilter === "all"
              ? "bg-primary text-white shadow-md shadow-primary/20"
              : "bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-white/70 hover:bg-gray-200 dark:hover:bg-white/10"
          }`}
        >
          Semua ({contents.length})
        </button>
        {categories.map((cat) => {
          const count = contents.filter(c => c.categoryId === cat.id).length;
          const isActive = selectedCategoryFilter === cat.id.toString();
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategoryFilter(cat.id.toString())}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-2 cursor-pointer ${
                isActive
                  ? "bg-primary text-white shadow-md shadow-primary/20"
                  : "bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-white/70 hover:bg-gray-200 dark:hover:bg-white/10"
              }`}
            >
              <span>{cat.name}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${isActive ? 'bg-white/20 text-white' : 'bg-gray-200 dark:bg-white/10'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Content Grid */}
      {filteredContents.length === 0 ? (
        <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-3xl p-12 text-center shadow-xs">
          <FileText className="w-16 h-16 mx-auto text-gray-300 dark:text-white/20 mb-4" />
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Tidak Ada Konten</h3>
          <p className="text-gray-500 dark:text-white/50 mb-6 max-w-md mx-auto">
            {searchQuery || selectedCategoryFilter !== "all" 
              ? "Tidak ada artikel yang cocok dengan filter atau kata kunci pencarian Anda."
              : "Mulai dengan membuat artikel atau berita pertama untuk dipublikasikan."}
          </p>
          {canCreate && (
            <button onClick={() => handleOpenModal()} className="inline-flex items-center gap-2 bg-primary text-white hover:bg-primary/90 px-6 py-2.5 rounded-xl font-bold transition-colors shadow-lg shadow-primary/20 cursor-pointer">
              <Plus className="w-4 h-4" /> Buat Artikel Baru
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredContents.map((item) => (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                key={item.id}
                className="group relative bg-white dark:bg-[#07130e] border border-gray-200 dark:border-white/10 rounded-3xl overflow-hidden hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 flex flex-col"
              >
                {/* Image Header */}
                <div className="h-48 bg-gray-100 dark:bg-black/50 relative overflow-hidden">
                  {item.imageUrl ? (
                    <img src={resolveImageUrl(item.imageUrl)} alt={item.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-emerald-500/10 to-teal-900/20">
                      <ImageIcon className="w-12 h-12 text-gray-300 dark:text-white/20" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent" />
                  
                  {/* Badges */}
                  <div className="absolute top-4 left-4 flex flex-wrap items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-wider uppercase backdrop-blur-md border ${item.isPublished ? 'bg-primary/20 text-emerald-300 border-primary/40' : 'bg-orange-500/20 text-orange-300 border-orange-500/40'}`}>
                      {item.isPublished ? 'Published' : 'Draft'}
                    </span>
                    {item.categoryName && (
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-wider uppercase backdrop-blur-md border ${getCategoryBadgeStyle(item.categoryColor)}`}>
                        {item.categoryName}
                      </span>
                    )}
                  </div>

                  {/* Dual Language Indicator on Card */}
                  <div className="absolute top-4 right-4 flex items-center gap-1 bg-black/50 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/15 text-[10px] font-bold text-white">
                    <span className="text-emerald-400">EN</span>
                    {item.titleId && item.bodyId ? (
                      <>
                        <span className="text-white/40">/</span>
                        <span className="text-yellow-300">ID</span>
                      </>
                    ) : null}
                  </div>
                </div>

                {/* Body */}
                <div className="p-5 flex-1 flex flex-col">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white line-clamp-2 mb-1 group-hover:text-primary transition-colors">
                    {item.title}
                  </h3>
                  {item.titleId && (
                    <p className="text-xs text-primary/80 dark:text-emerald-400/80 font-medium line-clamp-1 mb-2 italic">
                      ID: {item.titleId}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 dark:text-white/60 line-clamp-2 mb-4 flex-1">
                    {item.body ? item.body.replace(/<[^>]*>?/gm, '') : ""}
                  </p>
                  
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100 dark:border-white/10">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary text-[10px] font-bold">
                        {item.authorName.charAt(0)}
                      </div>
                      <span className="text-xs font-medium text-gray-600 dark:text-white/70 truncate max-w-[120px]">{item.authorName}</span>
                    </div>
                    
                    <div className="flex items-center gap-1 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                      {canUpdate && (
                        <button onClick={() => handleOpenModal(item)} className="p-2 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors cursor-pointer" title="Edit Article">
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}
                      {canDelete && (
                        <button onClick={() => { setSelectedContent(item); setIsDeleteModalOpen(true); }} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer" title="Delete Article">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* ================================================================ */}
      {/* Create/Edit Content Modal - BILINGUAL FULLSCREEN WYSIWYG */}
      {/* ================================================================ */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50" />
            <motion.div initial={{ opacity: 0, scale: 0.96, y: 15 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 15 }} className="fixed inset-0 md:inset-4 lg:inset-6 bg-white dark:bg-[#07130e] md:rounded-3xl shadow-2xl z-50 flex flex-col overflow-hidden border border-gray-200 dark:border-white/10">
              
              {/* Modal Header */}
              <div className="px-6 md:px-10 py-5 border-b border-gray-100 dark:border-white/10 flex items-center justify-between bg-gray-50/70 dark:bg-white/[0.03]">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center">
                    {selectedContent ? <Edit2 className="w-5 h-5 text-primary" /> : <Plus className="w-5 h-5 text-primary" />}
                  </div>
                  <div>
                    <h3 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                      {selectedContent ? "Edit Konten Artikel (Bilingual)" : "Buat Konten Baru (Bilingual)"}
                    </h3>
                    <p className="text-xs md:text-sm text-gray-500 dark:text-white/50">
                      Tulis dalam Bahasa Inggris (Default) dan Bahasa Indonesia. Pengunjung dapat memilih bahasa di halaman artikel.
                    </p>
                  </div>
                </div>
                <button onClick={() => !isLoading && setIsModalOpen(false)} className="p-2.5 text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 rounded-2xl transition-all cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 p-6 md:px-10 md:py-6 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-white/10">
                <div className="max-w-5xl mx-auto space-y-6">
                  {error && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-3 text-red-500">
                      <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                      <p className="text-sm font-medium">{error}</p>
                    </div>
                  )}

                  <form id="contentForm" onSubmit={handleSubmitContent} className="space-y-6">
                    {/* General Settings: Category & Slug & Cover Image */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 rounded-2xl bg-gray-50/60 dark:bg-white/[0.02] border border-gray-200 dark:border-white/10">
                      {/* Category Selector */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between ml-1">
                          <label className="text-xs font-bold uppercase tracking-widest text-gray-600 dark:text-white/60">Kategori Artikel</label>
                          <button
                            type="button"
                            onClick={() => handleOpenCategoryModal()}
                            className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" /> Tambah Kategori
                          </button>
                        </div>
                        <div className="relative">
                          <select
                            value={formData.categoryId}
                            onChange={e => setFormData({ ...formData, categoryId: e.target.value })}
                            className="w-full bg-white dark:bg-[#091812] border border-gray-200 dark:border-white/10 rounded-2xl px-5 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-gray-900 dark:text-white transition-all appearance-none cursor-pointer font-medium"
                          >
                            <option value="" className="text-gray-900 dark:text-gray-900">-- Pilih Kategori --</option>
                            {categories.map((cat) => (
                              <option key={cat.id} value={cat.id} className="text-gray-900 dark:text-gray-900">
                                {cat.name} ({cat.color})
                              </option>
                            ))}
                          </select>
                          <Tag className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>
                      </div>

                      {/* Slug / URL */}
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-gray-600 dark:text-white/60 ml-1">Slug / URL Article *</label>
                        <input 
                          required 
                          type="text" 
                          value={formData.slug} 
                          onChange={e => setFormData({...formData, slug: e.target.value})} 
                          className="w-full bg-white dark:bg-[#091812] border border-gray-200 dark:border-white/10 rounded-2xl px-5 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-gray-900 dark:text-white transition-all font-mono" 
                          placeholder="article-slug-url" 
                        />
                      </div>

                      {/* Cover Banner Image (Full width inside section) */}
                      <div className="space-y-2 md:col-span-2 pt-2 border-t border-gray-200/60 dark:border-white/10">
                        <label className="text-xs font-bold uppercase tracking-widest text-gray-600 dark:text-white/60 ml-1 flex items-center justify-between">
                          <span>Cover Banner Image</span>
                          {isUploading && (
                            <span className="text-primary text-xs font-semibold animate-pulse flex items-center gap-1">
                              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading image...
                            </span>
                          )}
                        </label>
                        
                        <div className="space-y-3">
                          {formData.imageUrl ? (
                            <div className="relative rounded-2xl overflow-hidden border border-gray-200 dark:border-white/10 group aspect-video bg-black/20 max-h-48">
                              <img src={resolveImageUrl(formData.imageUrl)} alt="Cover Preview" className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-xs">
                                <label className="px-4 py-2 bg-white text-slate-900 text-xs font-bold rounded-xl cursor-pointer hover:bg-gray-100 transition-colors shadow-lg flex items-center gap-1.5">
                                  <ImageIcon className="w-4 h-4 text-primary" /> Ganti Gambar
                                  <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
                                </label>
                                <button type="button" onClick={() => setFormData({...formData, imageUrl: ""})} className="px-4 py-2 bg-red-500 text-white text-xs font-bold rounded-xl hover:bg-red-600 transition-colors shadow-lg cursor-pointer">
                                  Hapus
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="relative border-2 border-dashed border-gray-200 dark:border-white/10 rounded-2xl p-5 text-center hover:border-primary/50 transition-colors bg-white dark:bg-[#091812]">
                              <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10" onChange={handleFileUpload} disabled={isUploading} />
                              <div className="flex flex-col items-center gap-2">
                                <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                                  {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ImageIcon className="w-5 h-5" />}
                                </div>
                                <div>
                                  <p className="text-xs font-bold text-gray-900 dark:text-white">Klik atau seret gambar untuk upload cover</p>
                                  <p className="text-[10px] text-gray-500 dark:text-white/40">Mendukung PNG, JPG, WEBP, GIF</p>
                                </div>
                              </div>
                            </div>
                          )}

                          <div className="flex items-center gap-2">
                            <input 
                              type="text" 
                              value={formData.imageUrl} 
                              onChange={e => setFormData({...formData, imageUrl: e.target.value})} 
                              className="w-full bg-white dark:bg-[#091812] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50 text-gray-900 dark:text-white transition-all font-mono" 
                              placeholder="Atau tempel URL gambar eksternal (https://...)" 
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bilingual Language Switcher Tabs */}
                    <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2 bg-gray-100 dark:bg-white/5 rounded-2xl border border-gray-200/80 dark:border-white/10">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setEditorLanguage("en")}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                              editorLanguage === "en"
                                ? "bg-white dark:bg-[#091812] text-primary shadow-md"
                                : "text-gray-500 hover:text-gray-900 dark:text-white/60 dark:hover:text-white"
                            }`}
                          >
                            <span className="text-base">🇬🇧</span>
                            <span>English Content (Default)</span>
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditorLanguage("id")}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                              editorLanguage === "id"
                                ? "bg-white dark:bg-[#091812] text-primary shadow-md"
                                : "text-gray-500 hover:text-gray-900 dark:text-white/60 dark:hover:text-white"
                            }`}
                          >
                            <span className="text-base">🇮🇩</span>
                            <span>Bahasa Indonesia</span>
                            {formData.titleId && formData.bodyId && (
                              <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
                            )}
                          </button>
                        </div>

                        <div className="text-[11px] text-gray-500 dark:text-white/50 px-3 flex items-center gap-1.5">
                          <Globe className="w-3.5 h-3.5 text-primary" />
                          <span>Default tampil dalam English, user dapat beralih ke Indonesia</span>
                        </div>
                      </div>

                      {/* English Editor Fields */}
                      {editorLanguage === "en" && (
                        <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
                          <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-gray-700 dark:text-white/70 ml-1 flex items-center justify-between">
                              <span className="flex items-center gap-1.5">🇬🇧 Article Title (English - Primary) *</span>
                              <span className="text-[10px] text-primary font-semibold">Required</span>
                            </label>
                            <input 
                              required 
                              type="text" 
                              value={formData.title} 
                              onChange={handleTitleChange} 
                              className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl px-5 py-3.5 text-base focus:outline-none focus:ring-2 focus:ring-primary/50 text-gray-900 dark:text-white transition-all font-bold shadow-xs" 
                              placeholder="e.g. Advancing Renewable Energy through Solar Innovations" 
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-gray-700 dark:text-white/70 ml-1 flex items-center justify-between">
                              <span className="flex items-center gap-1.5">🇬🇧 Article Body (English - Primary) *</span>
                              <span className="text-[11px] text-primary font-normal">TinyMCE WYSIWYG & HTML</span>
                            </label>
                            <TinyMCEEditor 
                              value={formData.body}
                              onChange={(contentHtml) => setFormData(prev => ({ ...prev, body: contentHtml }))}
                              height={420}
                              placeholder="Write and style your article content in English..."
                            />
                          </div>
                        </motion.div>
                      )}

                      {/* Indonesian Editor Fields */}
                      {editorLanguage === "id" && (
                        <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between ml-1">
                              <label className="text-xs font-bold uppercase tracking-widest text-gray-700 dark:text-white/70 flex items-center gap-1.5">
                                🇮🇩 Judul Artikel (Bahasa Indonesia)
                              </label>
                              {formData.title && (
                                <button
                                  type="button"
                                  onClick={() => setFormData(prev => ({ ...prev, titleId: prev.title }))}
                                  className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                                  title="Salin judul dari bahasa Inggris"
                                >
                                  <Copy className="w-3 h-3" /> Salin dari Judul English
                                </button>
                              )}
                            </div>
                            <input 
                              type="text" 
                              value={formData.titleId} 
                              onChange={e => setFormData(prev => ({ ...prev, titleId: e.target.value }))} 
                              className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl px-5 py-3.5 text-base focus:outline-none focus:ring-2 focus:ring-primary/50 text-gray-900 dark:text-white transition-all font-bold shadow-xs" 
                              placeholder="contoh: Mendorong Energi Terbarukan melalui Inovasi Panel Surya" 
                            />
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center justify-between ml-1">
                              <label className="text-xs font-bold uppercase tracking-widest text-gray-700 dark:text-white/70 flex items-center gap-1.5">
                                🇮🇩 Isi Konten (Bahasa Indonesia)
                              </label>
                              {formData.body && !formData.bodyId && (
                                <button
                                  type="button"
                                  onClick={() => setFormData(prev => ({ ...prev, bodyId: prev.body }))}
                                  className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                                  title="Salin template layout dari konten English"
                                >
                                  <Copy className="w-3 h-3" /> Salin layout dari English
                                </button>
                              )}
                            </div>
                            <TinyMCEEditor 
                              value={formData.bodyId}
                              onChange={(contentHtml) => setFormData(prev => ({ ...prev, bodyId: contentHtml }))}
                              height={420}
                              placeholder="Tulis dan layout artikel Anda dalam Bahasa Indonesia..."
                            />
                          </div>
                        </motion.div>
                      )}
                    </div>

                    {/* Publish Switch */}
                    <div className="flex items-center justify-between p-5 bg-linear-to-r from-gray-50 to-white dark:from-white/5 dark:to-transparent rounded-2xl border border-gray-200 dark:border-white/10 shadow-xs">
                      <div>
                        <div className="text-sm font-bold text-gray-900 dark:text-white">Publikasikan Konten</div>
                        <div className="text-xs text-gray-500 dark:text-white/50 mt-0.5">Artikel ini akan langsung tampil di halaman publik /articles.</div>
                      </div>
                      <div className={`w-14 h-7 rounded-full p-1 cursor-pointer transition-colors ${formData.isPublished ? 'bg-primary' : 'bg-gray-300 dark:bg-white/20'}`} onClick={() => setFormData({...formData, isPublished: !formData.isPublished})}>
                        <motion.div layout className="w-5 h-5 bg-white rounded-full shadow-md" animate={{ x: formData.isPublished ? 28 : 0 }} transition={{ type: "spring", stiffness: 500, damping: 30 }} />
                      </div>
                    </div>
                  </form>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 md:px-10 py-4 border-t border-gray-100 dark:border-white/10 bg-white dark:bg-[#07130e] flex justify-end gap-3 shrink-0 shadow-lg z-10">
                <button type="button" onClick={() => setIsModalOpen(false)} disabled={isLoading} className="px-6 py-3 text-sm font-bold text-gray-600 dark:text-white/70 hover:bg-gray-100 dark:hover:bg-white/10 rounded-2xl transition-colors disabled:opacity-50 cursor-pointer">Batal</button>
                <button type="submit" form="contentForm" disabled={isLoading} className="flex items-center gap-2 px-8 py-3 text-sm font-bold bg-primary hover:bg-primary/90 text-white rounded-2xl transition-all shadow-xl shadow-primary/20 hover:shadow-primary/40 disabled:opacity-50 active:scale-95 cursor-pointer">
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  {selectedContent ? "Simpan Perubahan" : "Buat Artikel"}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ================================================================ */}
      {/* Modal: Add/Edit Dynamic Category */}
      {/* ================================================================ */}
      <AnimatePresence>
        {isCategoryModalOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 backdrop-blur-sm z-60" onClick={() => !isLoading && setIsCategoryModalOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 15 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 15 }} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white dark:bg-[#091812] rounded-3xl shadow-2xl z-60 overflow-hidden border border-gray-200 dark:border-white/10 p-6 md:p-8">
              <div className="flex items-center justify-between pb-4 mb-6 border-b border-gray-100 dark:border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <Tag className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-gray-900 dark:text-white">
                      {selectedCategory ? "Edit Kategori Konten" : "Tambah Kategori Baru"}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-white/50">
                      Contoh: Berita, Insight, Press Release, Opini, dll.
                    </p>
                  </div>
                </div>
                <button onClick={() => setIsCategoryModalOpen(false)} className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-xl cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {categoryError && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{categoryError}</span>
                </div>
              )}

              <form onSubmit={handleSaveCategory} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-white/60">Nama Kategori *</label>
                  <input
                    required
                    type="text"
                    value={categoryFormData.name}
                    onChange={handleCategoryNameChange}
                    className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-gray-900 dark:text-white"
                    placeholder="misal: Berita, Insight, Riset, Edukasi..."
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-white/60">Slug</label>
                  <input
                    type="text"
                    value={categoryFormData.slug}
                    onChange={e => setCategoryFormData({ ...categoryFormData, slug: e.target.value })}
                    className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-primary/50 text-gray-900 dark:text-white"
                    placeholder="slug-kategori"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-white/60">Deskripsi (Opsional)</label>
                  <textarea
                    rows={2}
                    value={categoryFormData.description}
                    onChange={e => setCategoryFormData({ ...categoryFormData, description: e.target.value })}
                    className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50 text-gray-900 dark:text-white"
                    placeholder="Deskripsi singkat seputar kategori ini..."
                  />
                </div>

                {/* Color Swatch Picker */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-white/60">Warna Aksen Badge</label>
                  <div className="flex flex-wrap gap-2.5 pt-1">
                    {CATEGORY_COLORS.map((c) => (
                      <button
                        type="button"
                        key={c.value}
                        onClick={() => setCategoryFormData({ ...categoryFormData, color: c.value })}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          categoryFormData.color === c.value
                            ? "border-primary ring-2 ring-primary/40 bg-primary/10 text-primary"
                            : "border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-white/70 hover:bg-gray-100"
                        }`}
                      >
                        <span className={`w-3 h-3 rounded-full ${c.bg}`} />
                        <span>{c.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsCategoryModalOpen(false)}
                    disabled={isLoading}
                    className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-white rounded-xl text-sm font-bold hover:bg-gray-200 dark:hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors shadow-md shadow-primary/20 cursor-pointer"
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    {selectedCategory ? "Update Kategori" : "Simpan Kategori"}
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ================================================================ */}
      {/* Modal: Category Manager (List & Delete) */}
      {/* ================================================================ */}
      <AnimatePresence>
        {isCategoryManagerOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 backdrop-blur-sm z-55" onClick={() => setIsCategoryManagerOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 15 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 15 }} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-white dark:bg-[#091812] rounded-3xl shadow-2xl z-55 overflow-hidden border border-gray-200 dark:border-white/10 p-6 md:p-8 max-h-[85vh] flex flex-col">
              <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <Settings2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-gray-900 dark:text-white">Kelola Kategori Konten</h3>
                    <p className="text-xs text-gray-500 dark:text-white/50">Daftar semua kategori artikel dan berita</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setIsCategoryManagerOpen(false);
                      handleOpenCategoryModal();
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Kategori Baru
                  </button>
                  <button onClick={() => setIsCategoryManagerOpen(false)} className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-xl cursor-pointer">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto py-4 space-y-3">
                {categories.length === 0 ? (
                  <p className="text-center py-8 text-sm text-gray-400">Belum ada kategori yang dibuat.</p>
                ) : (
                  categories.map((cat) => {
                    const articleCount = contents.filter(c => c.categoryId === cat.id).length;
                    return (
                      <div key={cat.id} className="p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200/70 dark:border-white/10 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase border ${getCategoryBadgeStyle(cat.color)}`}>
                            {cat.name}
                          </span>
                          <div>
                            <p className="text-xs text-gray-500 dark:text-white/50 font-mono">slug: {cat.slug}</p>
                            {cat.description && (
                              <p className="text-xs text-gray-600 dark:text-white/70 line-clamp-1">{cat.description}</p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-xs font-bold text-gray-400 bg-gray-200/60 dark:bg-white/10 px-2 py-1 rounded-lg">
                            {articleCount} artikel
                          </span>
                          <button
                            onClick={() => {
                              setIsCategoryManagerOpen(false);
                              handleOpenCategoryModal(cat);
                            }}
                            className="p-2 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors cursor-pointer"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(cat.id)}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                            title="Hapus"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ================================================================ */}
      {/* Delete Content Confirmation Modal */}
      {/* ================================================================ */}
      <AnimatePresence>
        {isDeleteModalOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 backdrop-blur-sm z-60" onClick={() => !isLoading && setIsDeleteModalOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white dark:bg-[#07130e] rounded-3xl shadow-2xl z-60 overflow-hidden border border-gray-200 dark:border-white/10 p-6 text-center">
              <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Hapus Artikel?</h3>
              <p className="text-sm text-gray-500 dark:text-white/50 mb-6">
                Apakah Anda yakin ingin menghapus artikel <span className="font-bold text-gray-800 dark:text-white">"{selectedContent?.title}"</span>? Tindakan ini tidak dapat dibatalkan.
              </p>
              
              <div className="flex gap-3">
                <button onClick={() => setIsDeleteModalOpen(false)} disabled={isLoading} className="flex-1 px-4 py-3 bg-gray-100 dark:bg-white/5 text-gray-900 dark:text-white rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-white/10 transition-colors disabled:opacity-50 cursor-pointer">Batal</button>
                <button onClick={handleDeleteContent} disabled={isLoading} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold transition-colors disabled:opacity-50 cursor-pointer">
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />} Hapus
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
