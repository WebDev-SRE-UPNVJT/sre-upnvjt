"use client";

import React, { useState } from "react";

import { Plus, Edit2, Trash2, Search, Activity as ActivityIcon, MapPin, Calendar, Type, X, CheckCircle2, XCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { hasAccess } from "@/lib/permissions";
import { createActivityAction, updateActivityAction, deleteActivityAction } from "@/app/actions/activityActions";

export default function ActivitiesClient({ initialActivities, currentUser }) {
  const [activities, setActivities] = useState(initialActivities || []);
  const [search, setSearch] = useState("");
  const [notification, setNotification] = useState(null);

  const showNotification = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };
  
  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [currentActivity, setCurrentActivity] = useState(null);
  
  // Form state
  const [isSubmitting, setIsSubmitting] = useState(false);

  // RBAC permissions
  const canCreate = hasAccess(currentUser, 'activities', 'create');
  const canUpdate = hasAccess(currentUser, 'activities', 'update');
  const canDelete = hasAccess(currentUser, 'activities', 'delete');

  const filteredActivities = activities.filter(a => 
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    (a.description || "").toLowerCase().includes(search.toLowerCase()) ||
    a.type.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenModal = (activity = null) => {
    setCurrentActivity(activity);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setCurrentActivity(null);
    setIsModalOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const formData = new FormData(e.target);
    
    try {
      if (currentActivity) {
        const res = await updateActivityAction(currentActivity.id, formData);
        if (res.success) {
          showNotification("Activity updated successfully");
          setActivities(prev => prev.map(a => a.id === currentActivity.id ? res.activity : a));
          handleCloseModal();
        } else {
          showNotification(res.error || "Failed to update activity", "error");
        }
      } else {
        const res = await createActivityAction(formData);
        if (res.success) {
          showNotification("Activity created successfully");
          setActivities(prev => [res.activity, ...prev]);
          handleCloseModal();
        } else {
          showNotification(res.error || "Failed to create activity", "error");
        }
      }
    } catch (error) {
      showNotification("An error occurred", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!currentActivity) return;
    setIsSubmitting(true);
    
    try {
      const res = await deleteActivityAction(currentActivity.id);
      if (res.success) {
        showNotification("Activity deleted successfully");
        setActivities(prev => prev.filter(a => a.id !== currentActivity.id));
        setIsDeleteOpen(false);
        setCurrentActivity(null);
      } else {
        showNotification(res.error || "Failed to delete activity", "error");
      }
    } catch (error) {
      showNotification("An error occurred", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
            <ActivityIcon className="w-6 h-6 text-primary" />
            Activities
          </h1>
          <p className="text-gray-500 dark:text-white/50 max-w-xl">
            Manage organization activities and events.
          </p>
        </div>
        {canCreate && (
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 bg-primary text-[#050e0a] px-6 py-3 rounded-xl font-bold tracking-wide hover:bg-primary-focus hover:scale-105 transition-all shrink-0 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
          >
            <Plus className="w-5 h-5" />
            Add Activity
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white/40 dark:bg-white/[0.02] p-4 rounded-2xl border border-gray-200/50 dark:border-white/10 shadow-sm flex flex-wrap gap-4 backdrop-blur-xl">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-white/30" />
          <input
            type="text"
            placeholder="Search activities..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none"
          />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredActivities.length === 0 ? (
          <div className="col-span-full py-12 text-center text-gray-500 dark:text-white/50">
            No activities found.
          </div>
        ) : (
          filteredActivities.map((activity) => (
            <div key={activity.id} className="bg-white/40 dark:bg-white/[0.02] rounded-3xl border border-gray-200/50 dark:border-white/10 p-6 shadow-lg hover:shadow-xl hover:border-primary/30 dark:hover:border-primary/30 hover:shadow-[0_0_30px_rgba(16,185,129,0.15)] transition-all duration-500 flex flex-col h-full backdrop-blur-xl group overflow-hidden relative">
              {activity.imageUrl && (
                <div className="w-full h-56 -mt-6 -mx-6 mb-6 overflow-hidden relative">
                  <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent dark:from-[#07130e] dark:via-transparent dark:to-transparent z-10 opacity-80 group-hover:opacity-60 transition-opacity duration-500" />
                  <img 
                    src={activity.imageUrl} 
                    alt={activity.name} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                  />
                  <div className="absolute top-4 left-4 z-20">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider bg-white text-primary shadow-lg">
                      <Type className="w-3 h-3" />
                      {activity.type}
                    </span>
                  </div>
                </div>
              )}
              
              <div className="flex justify-between items-start mb-4">
                {!activity.imageUrl && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider bg-primary/10 text-primary">
                    <Type className="w-3 h-3" />
                    {activity.type}
                  </span>
                )}
                
                {(canUpdate || canDelete) && (
                  <div className={`flex items-center gap-1 ${activity.imageUrl ? 'absolute top-4 right-4 z-20 bg-white/20 dark:bg-black/40 backdrop-blur-md rounded-xl p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-lg' : ''}`}>
                    {canUpdate && (
                      <button
                        onClick={() => handleOpenModal(activity)}
                        className={`p-2 rounded-xl transition-colors ${activity.imageUrl ? 'text-white hover:bg-white/20' : 'text-gray-400 dark:text-white/40 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10'}`}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}
                    {canDelete && (
                      <button
                        onClick={() => {
                          setCurrentActivity(activity);
                          setIsDeleteOpen(true);
                        }}
                        className={`p-2 rounded-xl transition-colors ${activity.imageUrl ? 'text-white hover:bg-red-500/80 hover:text-white' : 'text-gray-400 dark:text-white/40 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10'}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>
              
              <h3 className="text-xl font-display font-bold text-gray-900 dark:text-white mb-2 line-clamp-1 group-hover:text-primary transition-colors">{activity.name}</h3>
              <p className="text-sm text-gray-500 dark:text-white/60 mb-6 line-clamp-3 flex-1 leading-relaxed">
                {activity.description || "No description provided."}
              </p>
              
              <div className="space-y-3 pt-5 border-t border-gray-200/50 dark:border-white/10">
                <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-white/70">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <span className="font-medium">{activity.date ? new Date(activity.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "No Date"}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-white/70">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <span className="font-medium truncate">{activity.location || "Location TBD"}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 dark:bg-[#07130e]/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#07130e] rounded-3xl w-full max-w-lg shadow-2xl border border-gray-200 dark:border-white/10 overflow-hidden max-h-[85vh] flex flex-col">
            <div className="px-8 py-5 border-b border-gray-200 dark:border-white/10 flex justify-between items-center bg-gray-50/50 dark:bg-white/[0.02] shrink-0">
              <h2 className="text-xl font-display font-bold text-gray-900 dark:text-white">
                {currentActivity ? "Edit Activity" : "Add Activity"}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors p-2 rounded-full hover:bg-gray-200 dark:hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-5 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-white/70 uppercase tracking-wider mb-2">
                  Name *
                </label>
                <input
                  name="name"
                  type="text"
                  required
                  defaultValue={currentActivity?.name || ""}
                  className="w-full bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-primary transition-colors"
                  placeholder="E.g. Annual General Meeting"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-white/70 uppercase tracking-wider mb-2">
                  Type *
                </label>
                <input
                  name="type"
                  type="text"
                  required
                  defaultValue={currentActivity?.type || ""}
                  className="w-full bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-primary transition-colors"
                  placeholder="E.g. Meeting, Workshop, Event"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-white/70 uppercase tracking-wider mb-2">
                  Date *
                </label>
                <input
                  name="date"
                  type="date"
                  required
                  defaultValue={currentActivity?.date ? new Date(currentActivity.date).toISOString().split('T')[0] : ""}
                  className="w-full bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-white/70 uppercase tracking-wider mb-2">
                  Location
                </label>
                <input
                  name="location"
                  type="text"
                  defaultValue={currentActivity?.location || ""}
                  className="w-full bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-primary transition-colors"
                  placeholder="E.g. Room A12 or Online"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-white/70 uppercase tracking-wider mb-2">
                  Action Button Type
                </label>
                <select
                  name="linkType"
                  defaultValue={currentActivity?.linkType || "detail"}
                  className="w-full bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-primary transition-colors"
                >
                  <option value="detail" className="bg-white dark:bg-slate-900 text-gray-900 dark:text-white">Lihat Detail (View Detail)</option>
                  <option value="register" className="bg-white dark:bg-slate-900 text-gray-900 dark:text-white">Daftar (Register)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-white/70 uppercase tracking-wider mb-2">
                  Action Link URL (Optional)
                </label>
                <input
                  name="link"
                  type="url"
                  defaultValue={currentActivity?.link || ""}
                  className="w-full bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-primary transition-colors"
                  placeholder="E.g. https://bit.ly/register-sre or https://forms.gle/..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-white/70 uppercase tracking-wider mb-2">
                  Image (Optional)
                </label>
                <div className="relative group">
                  <input
                    name="image"
                    type="file"
                    accept="image/*"
                    className="w-full bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-gray-500 dark:text-white/70 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-primary hover:file:text-[#050e0a] file:transition-colors focus:outline-none focus:border-primary transition-colors cursor-pointer"
                  />
                  {currentActivity?.imageUrl && (
                    <p className="text-xs text-primary mt-2 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Current image exists. Uploading a new one will replace it.
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-white/70 uppercase tracking-wider mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  rows="3"
                  defaultValue={currentActivity?.description || ""}
                  className="w-full bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-primary transition-colors resize-none"
                  placeholder="Detailed description of the activity..."
                />
              </div>

              <div className="pt-6 border-t border-gray-200 dark:border-white/10 flex justify-end gap-3 mt-8">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-500 dark:text-white/70 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 bg-primary text-[#050e0a] px-6 py-2.5 rounded-xl font-bold tracking-wide hover:bg-primary-focus transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? "Saving..." : "Save Activity"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 dark:bg-[#07130e]/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#07130e] rounded-3xl w-full max-w-sm shadow-2xl border border-gray-200 dark:border-white/10 p-8 text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-5">
              <Trash2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-display font-bold text-gray-900 dark:text-white mb-2">Delete Activity</h3>
            <p className="text-sm text-gray-500 dark:text-white/60 mb-8">
              Are you sure you want to delete &quot;{currentActivity?.name}&quot;? This action cannot be undone.
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setIsDeleteOpen(false)}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-500 dark:text-white/70 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isSubmitting}
                className="px-6 py-2.5 text-sm font-bold text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors disabled:opacity-50 shadow-[0_0_15px_rgba(239,68,68,0.3)]"
              >
                {isSubmitting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

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
