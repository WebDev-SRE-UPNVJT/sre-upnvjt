'use client';

import { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  Edit2,
  ClipboardCheck,
  Globe,
  Copy,
  Check,
  ExternalLink,
  FileSpreadsheet,
  Users,
  Sparkles,
  Folder,
} from 'lucide-react';
import Link from 'next/link';

export default function FormsList() {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);
  const [creatingSheetId, setCreatingSheetId] = useState(null);

  useEffect(() => {
    fetchForms();
  }, []);

  const fetchForms = async () => {
    try {
      const res = await fetch('/api/forms', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setForms(data);
      }
    } catch (error) {
      console.error('Failed to load forms', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePublish = async (formId, currentStatus) => {
    const nextStatus = !currentStatus;
    // Optimistic update
    setForms((prev) =>
      prev.map((f) => (f.id === formId ? { ...f, isPublished: nextStatus } : f))
    );

    try {
      const res = await fetch(`/api/forms/${formId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: nextStatus }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || 'Gagal mengubah status formulir');
        fetchForms();
      }
    } catch (err) {
      console.error('Error toggling publish status:', err);
      fetchForms();
    }
  };

  const deleteForm = async (id) => {
    if (!confirm('Apakah Anda yakin ingin menghapus formulir ini? Semua respon yang tersimpan juga akan terhapus.')) return;
    try {
      const res = await fetch(`/api/forms/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchForms();
      } else {
        alert('Gagal menghapus formulir');
      }
    } catch (error) {
      console.error('Error deleting form', error);
    }
  };

  const handleCopyLink = (id) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const url = `${origin}/f/${id}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleConnectSheet = async (formId) => {
    setCreatingSheetId(formId);
    try {
      const res = await fetch(`/api/forms/${formId}/create-sheet`, {
        method: 'POST',
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok && (data.spreadsheetUrl || data.spreadsheetId)) {
        setForms((prev) =>
          prev.map((f) =>
            f.id === formId
              ? {
                  ...f,
                  spreadsheetId: data.spreadsheetId,
                  spreadsheetUrl:
                    data.spreadsheetUrl ||
                    `https://docs.google.com/spreadsheets/d/${data.spreadsheetId}/edit`,
                }
              : f
          )
        );
        alert('Google Spreadsheet berhasil dibuat dan terhubung secara realtime!');
        fetchForms();
      } else {
        alert(data.error || 'Gagal menghubungkan Google Spreadsheet.');
      }
    } catch (err) {
      console.error('Error connecting spreadsheet:', err);
      alert('Terjadi kesalahan jaringan.');
    } finally {
      setCreatingSheetId(null);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-6 w-full relative pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-black tracking-tighter mb-2 flex items-center gap-3 text-gray-900 dark:text-white">
            <ClipboardCheck className="w-8 h-8 text-primary" />
            Form Builder & Publikasi
          </h1>
          <p className="text-gray-500 dark:text-white/50 text-sm max-w-xl">
            Buat form kustom seperti Google Form, bagikan link publik, dan pantau respon secara real-time di Google Spreadsheet.
          </p>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <Link 
            href="/forms/create"
            className="flex items-center justify-center gap-2 bg-primary text-[#050e0a] px-6 py-3 rounded-xl font-bold tracking-wide hover:bg-emerald-400 hover:scale-105 transition-all shrink-0 shadow-[0_0_20px_rgba(16,185,129,0.25)] w-full md:w-auto text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Form Baru</span>
          </Link>
        </div>
      </div>

      {/* Forms Table Container */}
      <div className="bg-white/80 dark:bg-[#08120e]/80 backdrop-blur-2xl rounded-3xl border border-gray-200 dark:border-white/10 overflow-hidden shadow-sm">
        {forms.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-20 h-20 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
              <ClipboardCheck size={32} className="text-gray-400 dark:text-white/30" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Belum ada form yang dibuat</h3>
            <p className="text-gray-500 dark:text-white/60 mb-6 text-sm">
              Mulai buat form pertama Anda untuk survei, pendaftaran, atau kuesioner.
            </p>
            <Link 
              href="/forms/create"
              className="inline-flex items-center gap-2 bg-primary text-[#050e0a] hover:bg-emerald-400 px-6 py-3 rounded-xl font-bold transition-all text-sm shadow-md"
            >
              <Plus className="w-4 h-4" />
              Buat Form Pertama
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-white/50 text-xs uppercase tracking-wider border-b border-gray-200 dark:border-white/10">
                  <th className="p-5 font-bold">Judul Form</th>
                  <th className="p-5 font-bold text-center">Status (Klik untuk Ubah)</th>
                  <th className="p-5 font-bold text-center">Soal</th>
                  <th className="p-5 font-bold text-center">Respon</th>
                  <th className="p-5 font-bold">Google Spreadsheet</th>
                  <th className="p-5 font-bold text-center">Link Publik</th>
                  <th className="p-5 font-bold text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {forms.map((form) => {
                  const validQuestionsCount = form.questions?.filter(
                    (q) => q && q.type !== 'page_break' && q.type !== 'hidden_user'
                  ).length || 0;

                  return (
                    <tr
                      key={form.id}
                      className="border-b border-gray-100 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors group"
                    >
                      {/* Title & Description */}
                      <td className="p-5">
                        <div className="font-bold text-gray-900 dark:text-white text-base">
                          {form.title}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-white/50 mt-1 line-clamp-1 max-w-xs">
                          {form.description || 'Tidak ada deskripsi'}
                        </div>
                      </td>

                      {/* Interactive Status Toggle */}
                      <td className="p-5 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleTogglePublish(form.id, form.isPublished)}
                          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shadow-sm cursor-pointer hover:scale-105 ${
                            form.isPublished
                              ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 hover:bg-emerald-100'
                              : 'bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-white/40 border border-gray-200 dark:border-white/10 hover:bg-gray-200'
                          }`}
                          title="Klik untuk mengubah status Publik / Draf"
                        >
                          {form.isPublished ? (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              Publik (Aktif)
                            </>
                          ) : (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                              Draf (Tutup)
                            </>
                          )}
                        </button>
                      </td>

                      {/* Questions Count */}
                      <td className="p-5 text-center">
                        <span className="inline-flex items-center justify-center bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-white/80 font-bold px-2.5 py-1 rounded-lg text-xs border border-gray-200 dark:border-white/10">
                          {validQuestionsCount} Soal
                        </span>
                      </td>

                      {/* Respon Count */}
                      <td className="p-5 text-center">
                        <span className="inline-flex items-center gap-1 text-primary font-bold text-sm bg-primary/10 border border-primary/20 px-3 py-1 rounded-full">
                          <Users className="w-3.5 h-3.5" />
                          {form.submissionCount || 0}
                        </span>
                      </td>

                      {/* Google Spreadsheet & Drive Folder Links */}
                      <td className="p-5 whitespace-nowrap">
                        <div className="flex flex-col gap-1.5 items-start">
                          {form.spreadsheetUrl || form.spreadsheetId ? (
                            <a
                              href={
                                form.spreadsheetUrl ||
                                `https://docs.google.com/spreadsheets/d/${form.spreadsheetId}/edit`
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/20 px-3 py-1.5 rounded-xl transition-all shadow-sm"
                              title="Buka Google Spreadsheet"
                            >
                              <FileSpreadsheet className="w-3.5 h-3.5" />
                              <span>Spreadsheet</span>
                              <ExternalLink className="w-3 h-3 opacity-70" />
                            </a>
                          ) : (
                            <button
                              type="button"
                              disabled={creatingSheetId === form.id}
                              onClick={() => handleConnectSheet(form.id)}
                              className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-600 dark:text-white/70 bg-gray-100 dark:bg-white/5 hover:bg-emerald-500 hover:text-[#050e0a] dark:hover:bg-primary dark:hover:text-[#050e0a] border border-gray-200 dark:border-white/10 px-3 py-1.5 rounded-xl transition-all"
                              title="Hubungkan ke Google Spreadsheet"
                            >
                              <FileSpreadsheet className="w-3.5 h-3.5" />
                              <span>
                                {creatingSheetId === form.id
                                  ? 'Menghubungkan...'
                                  : 'Hubungkan Sheets'}
                              </span>
                            </button>
                          )}

                          {(form.driveFolderUrl || form.driveFolderId) && (
                            <a
                              href={
                                form.driveFolderUrl ||
                                `https://drive.google.com/drive/folders/${form.driveFolderId}`
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50/50 dark:bg-emerald-500/5 hover:bg-emerald-100/80 dark:hover:bg-emerald-500/15 border border-emerald-200/60 dark:border-emerald-500/20 px-3 py-1 rounded-xl transition-all"
                              title="Buka Folder Berkas Google Drive"
                            >
                              <Folder className="w-3.5 h-3.5" />
                              <span>Folder Berkas</span>
                              <ExternalLink className="w-3 h-3 opacity-70" />
                            </a>
                          )}
                        </div>
                      </td>

                      {/* Public Form Link */}
                      <td className="p-5 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleCopyLink(form.uuid || form.id)}
                            className="p-2 text-gray-500 dark:text-white/60 hover:text-primary hover:bg-primary/10 rounded-xl transition-all"
                            title="Salin Link Formulir (UUID)"
                          >
                            {copiedId === (form.uuid || form.id) ? (
                              <span className="text-xs font-bold text-emerald-500 flex items-center gap-1">
                                <Check className="w-3.5 h-3.5" /> Tersalin
                              </span>
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                          <a
                            href={`/f/${form.uuid || form.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-gray-500 dark:text-white/60 hover:text-primary hover:bg-primary/10 rounded-xl transition-all"
                            title="Buka Formulir Publik"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </div>
                      </td>

                      {/* Action buttons */}
                      <td className="p-5 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <Link
                            href={`/forms/edit/${form.id}`}
                            className="p-2 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all"
                            title="Edit Formulir"
                          >
                            <Edit2 size={18} />
                          </Link>
                          <button 
                            onClick={() => deleteForm(form.id)}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all"
                            title="Hapus Formulir"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
