"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, Edit2, Trash2, X, Search, CheckCircle2, 
  XCircle, AlertTriangle, ShoppingBag, ExternalLink, UploadCloud
} from "lucide-react";
import { createMerchandise, updateMerchandise, deleteMerchandise } from "@/app/actions/merchandiseActions";
import { useSession } from "next-auth/react";
import { hasAccess } from "@/lib/permissions";
import { resolveImageUrl } from "@/lib/imageUrl";

const EMPTY_MERCH = {
  name: "",
  price: "",
  description: "",
  imageUrl: "",
  linkUrl: "",
  isAvailable: true,
};

export default function MerchClient({ initialMerchandise }) {
  const { data: session } = useSession();
  const [merchandise, setMerchandise] = useState(initialMerchandise || []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentMerch, setCurrentMerch] = useState(EMPTY_MERCH);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  const isEditing = Boolean(currentMerch.id);

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showNotification("error", "Please upload an image file");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "merchandise");

    try {
      setIsLoading(true);
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      
      if (res.ok && data.url) {
        setCurrentMerch(prev => ({ ...prev, imageUrl: data.url }));
        showNotification("success", "Image uploaded successfully!");
      } else {
        showNotification("error", data.error || "Failed to upload image");
      }
    } catch (error) {
      showNotification("error", "An error occurred during upload");
    } finally {
      setIsLoading(false);
    }
  };

  const canCreate = hasAccess(session?.user, 'merchandise', 'create');
  const canUpdate = hasAccess(session?.user, 'merchandise', 'update');
  const canDelete = hasAccess(session?.user, 'merchandise', 'delete');

  const handleOpenModal = (merch) => {
    if (merch) {
      setCurrentMerch({ ...merch });
    } else {
      setCurrentMerch({ ...EMPTY_MERCH });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setCurrentMerch({ ...EMPTY_MERCH }), 300);
  };

  const handleOpenDeleteModal = (merch) => {
    setCurrentMerch({ ...merch });
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setTimeout(() => setCurrentMerch({ ...EMPTY_MERCH }), 300);
  };

  const handleSaveMerch = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const price = parseFloat(String(currentMerch.price) || "0");
    const dataToSave = { ...currentMerch, price };

    if (isEditing) {
      const res = await updateMerchandise(currentMerch.id, dataToSave);
      if (res.success) {
        setMerchandise(merchandise.map(m => m.id === currentMerch.id ? res.merchandise : m));
        showNotification("success", "Merchandise updated successfully!");
        handleCloseModal();
      } else {
        showNotification("error", res.error);
      }
    } else {
      const res = await createMerchandise(dataToSave);
      if (res.success) {
        setMerchandise([res.merchandise, ...merchandise]);
        showNotification("success", "Merchandise created successfully!");
        handleCloseModal();
      } else {
        showNotification("error", res.error);
      }
    }
    setIsLoading(false);
  };

  const handleDeleteMerch = async () => {
    if (!currentMerch.id) return;
    setIsLoading(true);
    const res = await deleteMerchandise(currentMerch.id);
    if (res.success) {
      setMerchandise(merchandise.filter(m => m.id !== currentMerch.id));
      showNotification("success", "Merchandise deleted successfully!");
      handleCloseDeleteModal();
    } else {
      showNotification("error", res.error);
    }
    setIsLoading(false);
  };

  const filteredMerchandise = merchandise.filter(m =>
    (m.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (m.description || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full relative">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-black tracking-tighter mb-2 flex items-center gap-3 text-gray-900 dark:text-white">
            <ShoppingBag className="w-8 h-8 text-primary" />
            Toko SRE (Merchandise)
          </h1>
          <p className="text-gray-500 dark:text-white/50 max-w-xl">
            Kelola produk dan merchandise SRE UPNVJT yang akan ditampilkan ke publik.
          </p>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-white/30" />
            <input 
              type="text"
              placeholder="Cari nama produk..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-white/5 shadow-sm dark:shadow-none border border-gray-200 dark:border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>
          {canCreate && (
            <button 
              onClick={() => handleOpenModal()}
              className="flex items-center gap-2 bg-primary text-[#050e0a] px-6 py-3 rounded-xl font-bold tracking-wide hover:bg-primary-focus hover:scale-105 transition-all shrink-0 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">Tambah Produk</span>
            </button>
          )}
        </div>
      </div>

        {/* Merch Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <AnimatePresence>
            {filteredMerchandise.length > 0 ? (
              filteredMerchandise.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white/40 dark:bg-white/[0.02] border border-gray-200/50 dark:border-white/10 shadow-lg dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)] rounded-3xl overflow-hidden backdrop-blur-xl relative group hover:-translate-y-1 hover:shadow-[0_15px_40px_rgba(16,185,129,0.1)] transition-all duration-300 flex flex-col h-full"
                >
                  <div className="relative aspect-square w-full overflow-hidden bg-gray-100 dark:bg-black/50 border-b border-gray-200 dark:border-white/5">
                    {item.imageUrl ? (
                      <img
                        src={resolveImageUrl(item.imageUrl)}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 ">
                        <ShoppingBag className="w-10 h-10 mb-2" />
                        <span className="text-[12px]">No Image</span>
                      </div>
                    )}
                    <div className="absolute top-3 right-3 flex gap-2">
                      <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider backdrop-blur-md border ${
                        item.isAvailable
                          ? "bg-green-500/20 text-green-300 border-green-500/30"
                          : "bg-red-500/20 text-red-300 border-red-500/30"
                      }`}>
                        {item.isAvailable ? "In Stock" : "Sold Out"}
                      </span>
                    </div>
                  </div>

                  <div className="p-5 flex-1 flex flex-col">
                    <h3 className="text-[16px] font-bold text-gray-900 dark:text-white mb-1 leading-tight group-hover:text-primary transition-colors">{item.name}</h3>
                    <div className="text-[14px] font-bold text-primary dark:text-[#e8ecc4] mb-3">
                      Rp {parseFloat(item.price || 0).toLocaleString("id-ID")}
                    </div>
                    <p className="text-[12px] text-gray-500 dark:text-white/50 line-clamp-2 mb-4 flex-1">
                      {item.description}
                    </p>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-white/10 mt-auto">
                      {item.linkUrl ? (
                        <a href={item.linkUrl} target="_blank" rel="noreferrer" className="text-[11px] text-primary hover:underline flex items-center gap-1">
                          Buy Link <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-[11px] text-gray-500 dark:text-white/30">No Link</span>
                      )}
                      
                      <div className="flex gap-2">
                        {canUpdate && (
                          <button
                            onClick={() => handleOpenModal(item)}
                            className="w-8 h-8 rounded-lg bg-white dark:bg-white/5 shadow-sm dark:shadow-none hover:bg-gray-50 dark:hover:bg-white/10 text-gray-500 dark:text-white/70 hover:text-gray-900 dark:text-white flex items-center justify-center transition-all border border-transparent hover:border-gray-200 dark:border-white/10"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => {
                              setCurrentMerch(item);
                              setIsDeleteModalOpen(true);
                            }}
                            className="w-8 h-8 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 flex items-center justify-center transition-all border border-transparent hover:border-red-500/20"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="col-span-full py-20 flex flex-col items-center justify-center text-center bg-white/40 dark:bg-white/[0.02] border border-gray-200/50 dark:border-white/5 rounded-3xl backdrop-blur-md shadow-sm border-dashed">
                <ShoppingBag className="w-12 h-12 text-gray-500  mb-4" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Belum ada produk</h3>
                <p className="text-gray-500 dark:text-white/40 text-sm">Tambahkan merchandise baru untuk ditampilkan di landing page.</p>
              </div>
            )}
          </AnimatePresence>
        </div>

      {/* Merch Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseModal}
              className="absolute inset-0 bg-white dark:bg-[#050e0a]/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white dark:bg-[#0a1612] border border-gray-200 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-gray-200 dark:border-white/10 flex items-center justify-between shrink-0 bg-gray-50/50 dark:bg-white/[0.02]">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  {isEditing ? "Edit Produk" : "Produk Baru"}
                </h2>
                <button onClick={handleCloseModal} className="text-gray-500 dark:text-white/50 hover:text-gray-900 dark:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1">
                <form id="merchForm" onSubmit={handleSaveMerch} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="md:col-span-1">
                      <label className="block text-[11px] font-bold tracking-wider text-gray-500 dark:text-white/50 uppercase mb-2">Nama Produk</label>
                      <input
                        type="text"
                        required
                        value={currentMerch.name}
                        onChange={(e) => setCurrentMerch(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full h-12 px-4 bg-white dark:bg-white/5 shadow-sm dark:shadow-none border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white placeholder:text-gray-500  focus:outline-none focus:border-primary/50 transition-all"
                        placeholder="e.g. SRE Signature T-Shirt"
                      />
                    </div>

                    <div className="md:col-span-1">
                      <label className="block text-[11px] font-bold tracking-wider text-gray-500 dark:text-white/50 uppercase mb-2">Harga (Rp)</label>
                      <input
                        type="number"
                        required
                        min="0"
                        value={currentMerch.price}
                        onChange={(e) => setCurrentMerch(prev => ({ ...prev, price: e.target.value }))}
                        className="w-full h-12 px-4 bg-white dark:bg-white/5 shadow-sm dark:shadow-none border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white placeholder:text-gray-500  focus:outline-none focus:border-primary/50 transition-all"
                        placeholder="e.g. 149000"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-[11px] font-bold tracking-wider text-gray-500 dark:text-white/50 uppercase mb-2">Deskripsi</label>
                      <textarea
                        required
                        value={currentMerch.description}
                        onChange={(e) => setCurrentMerch(prev => ({ ...prev, description: e.target.value }))}
                        className="w-full p-4 bg-white dark:bg-white/5 shadow-sm dark:shadow-none border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white placeholder:text-gray-500  focus:outline-none focus:border-primary/50 transition-all resize-none h-24"
                        placeholder="Detail bahan, ukuran, dll..."
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-[11px] font-bold tracking-wider text-gray-500 dark:text-white/50 uppercase mb-2">Foto Produk (URL or Upload)</label>
                      <div className="flex gap-4">
                        {currentMerch.imageUrl && (
                          <div className="w-16 h-16 rounded-xl overflow-hidden border border-gray-200 dark:border-white/10 shrink-0">
                            <img src={resolveImageUrl(currentMerch.imageUrl)} alt="Preview" className="w-full h-full object-cover" />
                          </div>
                        )}
                        <input
                          type="text"
                          value={currentMerch.imageUrl}
                          onChange={(e) => setCurrentMerch(prev => ({ ...prev, imageUrl: e.target.value }))}
                          className="flex-1 h-12 px-4 bg-white dark:bg-white/5 shadow-sm dark:shadow-none border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white placeholder:text-gray-500  focus:outline-none focus:border-primary/50 transition-all"
                          placeholder="https://images.unsplash.com/..."
                        />
                        <label className={`relative overflow-hidden w-12 h-12 bg-white dark:bg-white/5 shadow-sm dark:shadow-none border border-gray-200 dark:border-white/10 rounded-xl flex items-center justify-center hover:bg-gray-50 dark:hover:bg-white/10 transition-colors cursor-pointer shrink-0 ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}>
                          <input 
                            type="file" 
                            accept="image/*"
                            onChange={handleFileUpload}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                          />
                          <UploadCloud className="w-5 h-5 text-gray-500 dark:text-white/50" />
                        </label>
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-[11px] font-bold tracking-wider text-gray-500 dark:text-white/50 uppercase mb-2">Tautan Pembelian (Opsional)</label>
                      <input
                        type="url"
                        value={currentMerch.linkUrl}
                        onChange={(e) => setCurrentMerch(prev => ({ ...prev, linkUrl: e.target.value }))}
                        className="w-full h-12 px-4 bg-white dark:bg-white/5 shadow-sm dark:shadow-none border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white placeholder:text-gray-500  focus:outline-none focus:border-primary/50 transition-all"
                        placeholder="Link Shopee / Tokopedia / WhatsApp"
                      />
                    </div>

                    <div className="md:col-span-2 flex items-center justify-between p-4 bg-white dark:bg-white/5 shadow-sm dark:shadow-none border border-gray-200 dark:border-white/10 rounded-xl">
                      <div>
                        <div className="text-gray-900 dark:text-white font-medium text-[14px]">Stok Tersedia</div>
                        <div className="text-gray-500 dark:text-white/40 text-[12px]">Aktifkan jika barang sedang in-stock</div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={currentMerch.isAvailable}
                          onChange={(e) => setCurrentMerch(prev => ({ ...prev, isAvailable: e.target.checked }))}
                        />
                        <div className="w-11 h-6 bg-white dark:bg-white/10 shadow-sm dark:shadow-none peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                    </div>
                  </div>
                </form>
              </div>

              <div className="p-6 border-t border-gray-200 dark:border-white/10 flex justify-end gap-3 shrink-0 bg-gray-50/50 dark:bg-white/[0.02]">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-6 py-2.5 rounded-xl font-semibold text-gray-500 dark:text-white/70 hover:text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-white/10 transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  form="merchForm"
                  disabled={isLoading}
                  className="px-6 py-2.5 rounded-xl font-bold bg-primary text-[#050e0a] hover:bg-[#a8d3ba] transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-[#050e0a]/30 border-t-[#050e0a] rounded-full animate-spin" />
                  ) : (
                    "Simpan Produk"
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Modal */}
      <AnimatePresence>
        {isDeleteModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseDeleteModal}
              className="absolute inset-0 bg-white dark:bg-[#050e0a]/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white dark:bg-[#0a1612] border border-gray-200 dark:border-white/10 rounded-3xl shadow-2xl p-6 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4 border border-red-500/20">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Hapus Produk</h2>
              <p className="text-gray-500 dark:text-white/50 mb-8">
                Apakah Anda yakin ingin menghapus <strong className="text-gray-900 dark:text-white">{currentMerch.name}</strong>? Tindakan ini tidak dapat dibatalkan.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleCloseDeleteModal}
                  className="flex-1 px-4 py-3 rounded-xl font-semibold text-gray-500 dark:text-white/70 hover:text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10 transition-all"
                >
                  Batal
                </button>
                <button
                  onClick={handleDeleteMerch}
                  disabled={isLoading}
                  className="flex-1 px-4 py-3 rounded-xl font-bold bg-red-500 text-gray-900 dark:text-white hover:bg-red-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-gray-200 dark:border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    "Hapus Produk"
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
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
            {notification.type === "success" ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              <XCircle className="w-5 h-5" />
            )}
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
