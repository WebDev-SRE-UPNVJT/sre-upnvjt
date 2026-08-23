"use client";

import React, { useState } from "react";
import { Plus, Edit2, Trash2, Search, Rocket, X, CheckCircle2, XCircle, Eye, EyeOff, ArrowUp, ArrowDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { resolveImageUrl } from "@/lib/imageUrl";
import {
  createFeaturedProjectAction,
  updateFeaturedProjectAction,
  deleteFeaturedProjectAction,
} from "@/app/actions/featuredProjectActions";

const STATUS_OPTIONS = ["ONGOING", "COMPLETED", "PLANNED"];
const CATEGORY_OPTIONS = ["Infrastructure", "Research", "Social Impact", "Education", "Technology", "Environment"];

const STATUS_COLORS = {
  ONGOING:   "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400",
  COMPLETED: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400",
  PLANNED:   "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400",
};

export default function FeaturedProjectsClient({ initialProjects, currentUser }) {
  const [projects, setProjects] = useState(initialProjects || []);
  const [search, setSearch] = useState("");
  const [notification, setNotification] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [currentProject, setCurrentProject] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);

  const showNotification = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  };

  const filtered = projects.filter(
    (p) =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase()) ||
      p.status.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenModal = (project = null) => {
    setCurrentProject(project);
    setImagePreview(project?.imageUrl || null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setCurrentProject(null);
    setImagePreview(null);
    setIsModalOpen(false);
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.target);
    try {
      if (currentProject) {
        const res = await updateFeaturedProjectAction(currentProject.id, formData);
        if (res.success) {
          showNotification("Project updated successfully");
          setProjects((prev) => prev.map((p) => (p.id === currentProject.id ? res.project : p)));
          handleCloseModal();
        } else {
          showNotification(res.error || "Failed to update", "error");
        }
      } else {
        const res = await createFeaturedProjectAction(formData);
        if (res.success) {
          showNotification("Project created successfully");
          setProjects((prev) => [res.project, ...prev]);
          handleCloseModal();
        } else {
          showNotification(res.error || "Failed to create", "error");
        }
      }
    } catch {
      showNotification("An error occurred", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!currentProject) return;
    setIsSubmitting(true);
    try {
      const res = await deleteFeaturedProjectAction(currentProject.id);
      if (res.success) {
        showNotification("Project deleted");
        setProjects((prev) => prev.filter((p) => p.id !== currentProject.id));
        setIsDeleteOpen(false);
        setCurrentProject(null);
      } else {
        showNotification(res.error || "Failed to delete", "error");
      }
    } catch {
      showNotification("An error occurred", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen">
      {/* Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-5 right-5 z-[100] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl text-sm font-semibold backdrop-blur-xl border ${
              notification.type === "success"
                ? "bg-emerald-50/90 dark:bg-emerald-900/80 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700"
                : "bg-red-50/90 dark:bg-red-900/80 text-red-700 dark:text-red-300 border-red-200 dark:border-red-700"
            }`}
          >
            {notification.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
            {notification.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 rounded-xl bg-primary/10 dark:bg-primary/20">
              <Rocket className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Featured Events</h1>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 ml-11">
            Manage featured events/projects displayed on the public home page ({projects.length} total)
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-semibold px-5 py-2.5 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg active:scale-95 text-sm"
        >
          <Plus className="w-4 h-4" />
          Add Event
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6 max-w-sm">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search events..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
        />
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10 overflow-hidden shadow-sm">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-gray-600">
            <Rocket className="w-10 h-10 mb-3 opacity-40" />
            <p className="text-sm font-medium">No projects found</p>
            <p className="text-xs mt-1">Add your first featured project above</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-white/10 bg-gray-50/80 dark:bg-white/[0.03]">
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Project</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Category</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Status</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Visibility</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Order</th>
                  <th className="text-right px-5 py-3.5 font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                {filtered.map((project) => (
                  <tr key={project.id} className="hover:bg-gray-50/60 dark:hover:bg-white/[0.03] transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        {project.imageUrl ? (
                          <img
                            src={resolveImageUrl(project.imageUrl)}
                            alt={project.title}
                            className="w-10 h-10 rounded-lg object-cover border border-gray-100 dark:border-white/10 flex-shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center flex-shrink-0">
                            <Rocket className="w-5 h-5 text-primary" />
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white leading-tight">{project.title}</p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 line-clamp-1">{project.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-white/10 px-2.5 py-1 rounded-lg">
                        {project.category}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLORS[project.status] || STATUS_COLORS.ONGOING}`}>
                        {project.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {project.isPublished ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                          <Eye className="w-3.5 h-3.5" /> Published
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-400 dark:text-gray-500">
                          <EyeOff className="w-3.5 h-3.5" /> Draft
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-gray-500 dark:text-gray-400 text-xs font-mono">#{project.order}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenModal(project)}
                          className="p-2 rounded-lg hover:bg-primary/10 dark:hover:bg-primary/20 text-gray-400 hover:text-primary transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => { setCurrentProject(project); setIsDeleteOpen(true); }}
                          className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-gray-400 hover:text-red-500 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={(e) => e.target === e.currentTarget && handleCloseModal()}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              className="w-full max-w-2xl bg-white dark:bg-[#0d1f17] rounded-3xl shadow-2xl border border-gray-100 dark:border-white/10 overflow-hidden"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-white/10">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-primary/10 dark:bg-primary/20">
                    <Rocket className="w-4 h-4 text-primary" />
                  </div>
                  <h2 className="font-bold text-gray-900 dark:text-white text-lg">
                    {currentProject ? "Edit Project" : "Add Featured Project"}
                  </h2>
                </div>
                <button onClick={handleCloseModal} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[75vh] space-y-5">
                {/* Title */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Project Title *</label>
                  <input
                    name="title"
                    defaultValue={currentProject?.title || ""}
                    required
                    placeholder="e.g., Solar Microlab UPN"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
                  />
                </div>

                {/* Category + Status */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Category *</label>
                    <select
                      name="category"
                      defaultValue={currentProject?.category || ""}
                      required
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
                    >
                      <option value="">Select category...</option>
                      {CATEGORY_OPTIONS.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Status *</label>
                    <select
                      name="status"
                      defaultValue={currentProject?.status || "ONGOING"}
                      required
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Description *</label>
                  <textarea
                    name="description"
                    defaultValue={currentProject?.description || ""}
                    required
                    rows={3}
                    placeholder="Describe the project's goal, scope, and impact..."
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 transition resize-none"
                  />
                </div>

                {/* Image Upload */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Cover Image</label>
                  {imagePreview && (
                    <div className="mb-3 relative w-full h-40 rounded-xl overflow-hidden border border-gray-200 dark:border-white/10">
                      <img src={resolveImageUrl(imagePreview)} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <input
                    type="file"
                    name="image"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="w-full text-sm text-gray-500 dark:text-gray-400 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary dark:file:bg-primary/20 hover:file:bg-primary/20 transition"
                  />
                </div>

                {/* Order + Published */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Display Order</label>
                    <input
                      type="number"
                      name="order"
                      defaultValue={currentProject?.order ?? 0}
                      min={0}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
                    />
                    <p className="text-xs text-gray-400 mt-1">Lower number = shown first</p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Visibility</label>
                    <select
                      name="isPublished"
                      defaultValue={currentProject?.isPublished ? "true" : "false"}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
                    >
                      <option value="false">Draft (Hidden)</option>
                      <option value="true">Published (Visible)</option>
                    </select>
                  </div>
                </div>

                {/* Submit */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-sm font-semibold transition disabled:opacity-60 disabled:cursor-not-allowed shadow-md"
                  >
                    {isSubmitting ? "Saving..." : currentProject ? "Save Changes" : "Create Project"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirm Modal */}
      <AnimatePresence>
        {isDeleteOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              className="w-full max-w-sm bg-white dark:bg-[#0d1f17] rounded-3xl shadow-2xl border border-gray-100 dark:border-white/10 p-6 text-center"
            >
              <div className="w-14 h-14 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Delete Project?</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                <span className="font-semibold text-gray-700 dark:text-gray-200">{currentProject?.title}</span> will be permanently removed.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => { setIsDeleteOpen(false); setCurrentProject(null); }}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition disabled:opacity-60 shadow-md"
                >
                  {isSubmitting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
