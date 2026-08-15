"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Plus, Edit2, Trash2, X, Search, CheckCircle2,
  XCircle, AlertTriangle, Handshake, ImageIcon, UploadCloud
} from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";

function resolveLogoUrl(url) {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("/")) {
    return url;
  }
  const baseUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || "https://cdn.webly.biz.id/";
  return `${baseUrl.replace(/\/+$/, "")}/${url.replace(/^\/+/, "")}`;
}

const EMPTY_PARTNER = {
  name: "",
  logoUrl: "",
  websiteUrl: "",
  tier: null,
  isActive: true,
};

export default function PartnerClient({ initialPartners }) {
  const { data: session } = useSession();
  const { t } = useLanguage();
  const router = useRouter();
  const [partners, setPartners] = useState(initialPartners || []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentPartner, setCurrentPartner] = useState(EMPTY_PARTNER);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [notification, setNotification] = useState(null);

  if (session?.user?.roleName !== "SUPER_ADMIN") {
    return (
      <div className="w-full flex items-center justify-center py-32">
        <div className="text-gray-500 dark:text-white/50">{t("roles.access_denied")}</div>
      </div>
    );
  }

  const isEditing = Boolean(currentPartner.id);

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleOpenModal = (partner) => {
    if (partner) {
      setCurrentPartner({ ...partner });
    } else {
      setCurrentPartner({ ...EMPTY_PARTNER });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setCurrentPartner({ ...EMPTY_PARTNER }), 300);
  };

  const handleOpenDeleteModal = (partner) => {
    setCurrentPartner({ ...partner });
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setTimeout(() => setCurrentPartner({ ...EMPTY_PARTNER }), 300);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showNotification("error", "Please upload an image file");
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "partners");

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      
      if (res.ok && data.url) {
        setCurrentPartner(prev => ({ ...prev, logoUrl: data.url }));
        showNotification("success", "Image uploaded successfully!");
      } else {
        showNotification("error", data.error || "Failed to upload image");
      }
    } catch (error) {
      showNotification("error", "An error occurred during upload");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSavePartner = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const url = isEditing ? `/api/partners/${currentPartner.id}` : "/api/partners";
      const method = isEditing ? "PUT" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(currentPartner)
      });
      
      const data = await res.json();
      
      if (res.ok) {
        if (isEditing) {
          setPartners(partners.map(p => p.id === currentPartner.id ? data.partner : p));
          showNotification("success", "Partner updated successfully!");
        } else {
          setPartners([...partners, data.partner]);
          showNotification("success", "Partner created successfully!");
        }
        handleCloseModal();
      } else {
        showNotification("error", data.error || "Failed to save partner");
      }
    } catch (err) {
      showNotification("error", "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePartner = async () => {
    if (!currentPartner.id) return;
    setIsLoading(true);
    
    try {
      const res = await fetch(`/api/partners/${currentPartner.id}`, {
        method: "DELETE"
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setPartners(partners.filter(p => p.id !== currentPartner.id));
        showNotification("success", "Partner deleted successfully!");
        handleCloseDeleteModal();
      } else {
        showNotification("error", data.error || "Failed to delete partner");
      }
    } catch (err) {
      showNotification("error", "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredPartners = partners.filter(p =>
    (p.name || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full relative">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-black tracking-tighter mb-2 flex items-center gap-3 text-gray-900 dark:text-white">
            <Handshake className="w-8 h-8 text-primary" />
            {t("partners.title")}
          </h1>
          <p className="text-gray-500 dark:text-white/50 max-w-xl">
            {t("partners.subtitle")}
          </p>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-white/30" />
            <input 
              type="text"
              placeholder={t("partners.search")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-white/5 shadow-sm dark:shadow-none border border-gray-200 dark:border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>
          <button 
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 bg-primary text-[#050e0a] px-6 py-3 rounded-xl font-bold tracking-wide hover:bg-primary-focus hover:scale-105 transition-all shrink-0 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">{t("partners.add")}</span>
          </button>
        </div>
      </div>

        {/* Partner Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          <AnimatePresence>
            {filteredPartners.length > 0 ? (
              filteredPartners.map((partner) => (
                <motion.div
                  key={partner.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white/40 dark:bg-white/[0.02] border border-gray-200/50 dark:border-white/10 shadow-lg dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)] rounded-3xl overflow-hidden backdrop-blur-xl relative group hover:-translate-y-1 hover:shadow-[0_15px_40px_rgba(16,185,129,0.1)] transition-all duration-300 flex flex-col h-full"
                >
                  <div className="relative aspect-video w-full overflow-hidden bg-white dark:bg-white/5 shadow-sm dark:shadow-none flex items-center justify-center p-4 border-b border-gray-200 dark:border-white/5">
                    {partner.logoUrl ? (
                      <img
                        src={resolveLogoUrl(partner.logoUrl)}
                        alt={partner.name}
                        className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 dark:text-white/20">
                        <ImageIcon className="w-10 h-10 mb-2" />
                        <span className="text-[12px]">{t("partners.no_image")}</span>
                      </div>
                    )}
                  </div>

                  <div className="p-5 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-[16px] font-bold text-gray-900 dark:text-white leading-tight group-hover:text-primary transition-colors">{partner.name}</h3>
                      <span className={`px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider backdrop-blur-md border ${
                        partner.tier === "LARGE" ? "bg-purple-500/20 text-purple-300 border-purple-500/30" : 
                        partner.tier === "MEDIUM" ? "bg-blue-500/20 text-blue-300 border-blue-500/30" :
                        partner.tier ? "bg-white dark:bg-white/10 shadow-sm dark:shadow-none text-gray-500 dark:text-white/60 border-gray-200 dark:border-white/20" : "hidden"
                      }`}>
                        {partner.tier}
                      </span>
                    </div>

                    <div className="flex gap-2 mt-auto">
                      <button
                        onClick={() => handleOpenModal(partner)}
                        className="flex-1 h-9 rounded-lg bg-white dark:bg-white/5 shadow-sm dark:shadow-none hover:bg-gray-50 dark:hover:bg-white/10 text-gray-500 dark:text-white/70 hover:text-gray-900 dark:text-white flex items-center justify-center transition-all border border-transparent hover:border-gray-200 dark:border-white/10"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleOpenDeleteModal(partner)}
                        className="flex-1 h-9 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 flex items-center justify-center transition-all border border-transparent hover:border-red-500/20"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="col-span-full py-20 flex flex-col items-center justify-center text-center bg-white/40 dark:bg-white/[0.02] border border-gray-200/50 dark:border-white/5 rounded-3xl backdrop-blur-md shadow-sm border-dashed">
                <Handshake className="w-12 h-12 text-gray-500 dark:text-white/20 mb-4" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{t("partners.no_partners")}</h3>
                <p className="text-gray-500 dark:text-white/40 text-sm">{t("partners.no_partners_desc")}</p>
              </div>
            )}
          </AnimatePresence>
        </div>

      {/* Partner Modal */}
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
              className="relative w-full max-w-md bg-white dark:bg-[#0a1612] border border-gray-200 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-gray-200 dark:border-white/10 flex items-center justify-between shrink-0 bg-gray-50/50 dark:bg-white/[0.02]">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  {isEditing ? t("partners.edit") : t("partners.new")}
                </h2>
                <button onClick={handleCloseModal} className="text-gray-500 dark:text-white/50 hover:text-gray-900 dark:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1">
                <form id="partnerForm" onSubmit={handleSavePartner} className="space-y-5">
                  <div>
                    <label className="block text-[11px] font-bold tracking-wider text-gray-500 dark:text-white/50 uppercase mb-2">{t("partners.name")}</label>
                    <input
                      type="text"
                      required
                      value={currentPartner.name}
                      onChange={(e) => setCurrentPartner(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full h-12 px-4 bg-white dark:bg-white/5 shadow-sm dark:shadow-none border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white placeholder:text-gray-500 dark:text-white/20 focus:outline-none focus:border-primary/50 transition-all"
                      placeholder={t("partners.name_ph")}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold tracking-wider text-gray-500 dark:text-white/50 uppercase mb-2">{t("partners.logo")}</label>
                    <div className="flex gap-2 mb-3">
                      <input
                        type="text"
                        required
                        value={currentPartner.logoUrl}
                        onChange={(e) => setCurrentPartner(prev => ({ ...prev, logoUrl: e.target.value }))}
                        className="flex-1 h-12 px-4 bg-white dark:bg-white/5 shadow-sm dark:shadow-none border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white placeholder:text-gray-500 dark:text-white/20 focus:outline-none focus:border-primary/50 transition-all"
                        placeholder="https://..."
                      />
                      <label className={`h-12 px-4 flex items-center justify-center gap-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 shadow-sm dark:shadow-none cursor-pointer hover:bg-gray-50 dark:hover:bg-white/10 transition-all ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                        {isUploading ? (
                          <div className="w-5 h-5 border-2 border-gray-200 dark:border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <UploadCloud className="w-5 h-5 text-gray-500 dark:text-white/70" />
                        )}
                        <span className="text-[14px] font-semibold text-gray-500 dark:text-white/70 hidden sm:block">{t("partners.upload")}</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={handleFileUpload}
                        />
                      </label>
                    </div>
                    {currentPartner.logoUrl && (
                      <div className="w-full h-32 rounded-lg overflow-hidden shrink-0 border border-gray-200 dark:border-white/10 bg-white dark:bg-white/10 shadow-sm dark:shadow-none flex items-center justify-center p-4">
                        <img src={resolveLogoUrl(currentPartner.logoUrl)} alt="Preview" className="max-w-full max-h-full object-contain" />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold tracking-wider text-gray-500 dark:text-white/50 uppercase mb-2">{t("partners.size")}</label>
                    <select
                      value={currentPartner.tier || ""}
                      onChange={(e) => setCurrentPartner(prev => ({ ...prev, tier: e.target.value || null }))}
                      className="w-full h-12 px-4 bg-white dark:bg-white/5 shadow-sm dark:shadow-none border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:border-primary/50 transition-all appearance-none"
                    >
                      <option value="" className="bg-white dark:bg-[#0a1612] text-gray-900 dark:text-white">— No Tier —</option>
                      <option value="LARGE" className="bg-white dark:bg-[#0a1612] text-gray-900 dark:text-white">{t("partners.large")}</option>
                      <option value="MEDIUM" className="bg-white dark:bg-[#0a1612] text-gray-900 dark:text-white">{t("partners.medium")}</option>
                      <option value="SMALL" className="bg-white dark:bg-[#0a1612] text-gray-900 dark:text-white">{t("partners.small")}</option>
                    </select>
                  </div>

                  <div className="pt-2 flex items-center justify-between p-4 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10">
                    <div>
                      <div className="text-sm font-bold text-gray-900 dark:text-white">Status Aktif</div>
                      <div className="text-xs text-gray-500 dark:text-white/50">Tampilkan mitra ini di halaman publik</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCurrentPartner(prev => ({ ...prev, isActive: !prev.isActive }))}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        currentPartner.isActive !== false ? 'bg-primary' : 'bg-gray-300 dark:bg-white/20'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          currentPartner.isActive !== false ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </form>
              </div>

              <div className="p-6 border-t border-gray-200 dark:border-white/10 flex justify-end gap-3 shrink-0 bg-gray-50/50 dark:bg-white/[0.02]">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-6 py-2.5 rounded-xl font-semibold text-gray-500 dark:text-white/70 hover:text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-white/10 transition-all"
                >
                  {t("partners.cancel")}
                </button>
                <button
                  type="submit"
                  form="partnerForm"
                  disabled={isLoading}
                  className="px-6 py-2.5 rounded-xl font-bold bg-primary text-[#050e0a] hover:bg-[#a8d3ba] transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-[#050e0a]/30 border-t-[#050e0a] rounded-full animate-spin" />
                  ) : (
                    t("partners.save")
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
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t("partners.delete_title")}</h2>
              <p className="text-gray-500 dark:text-white/50 mb-8">
                {t("partners.delete_desc1")}<strong className="text-gray-900 dark:text-white">{currentPartner.name}</strong>{t("partners.delete_desc2")}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleCloseDeleteModal}
                  className="flex-1 px-4 py-3 rounded-xl font-semibold text-gray-500 dark:text-white/70 hover:text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10 transition-all"
                >
                  {t("partners.cancel")}
                </button>
                <button
                  onClick={handleDeletePartner}
                  disabled={isLoading}
                  className="flex-1 px-4 py-3 rounded-xl font-bold bg-red-500 text-gray-900 dark:text-white hover:bg-red-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-gray-200 dark:border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    t("partners.delete_btn")
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
