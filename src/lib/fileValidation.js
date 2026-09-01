export const FILE_TYPE_CONFIG = {
  pdf: {
    id: 'pdf',
    label: 'PDF (.pdf)',
    desc: 'Dokumen berkas PDF',
    extensions: ['.pdf'],
    mimeTypes: ['application/pdf'],
    accept: '.pdf,application/pdf',
  },
  image: {
    id: 'image',
    label: 'Gambar / Foto',
    desc: 'JPG, PNG, WEBP, GIF',
    extensions: ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'],
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'],
    accept: 'image/*',
  },
  document: {
    id: 'document',
    label: 'Dokumen Office',
    desc: 'Word, Excel, PPT, PDF, CSV',
    extensions: ['.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.pdf', '.txt', '.csv'],
    mimeTypes: [
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/pdf',
      'text/plain',
      'text/csv',
    ],
    accept: '.doc,.docx,.xls,.xlsx,.ppt,.pptx,.pdf,.txt,.csv',
  },
  archive: {
    id: 'archive',
    label: 'Arsip (ZIP / RAR)',
    desc: '.zip, .rar, .7z, .tar, .gz',
    extensions: ['.zip', '.rar', '.7z', '.tar', '.gz'],
    mimeTypes: [
      'application/zip',
      'application/x-zip-compressed',
      'application/x-rar-compressed',
      'application/x-7z-compressed',
      'application/x-tar',
      'application/gzip',
      'application/octet-stream',
    ],
    accept: '.zip,.rar,.7z,.tar,.gz',
  },
  audio_video: {
    id: 'audio_video',
    label: 'Audio / Video',
    desc: 'MP4, MP3, MOV, WAV, MKV',
    extensions: ['.mp3', '.wav', '.ogg', '.mp4', '.mov', '.avi', '.mkv', '.webm'],
    mimeTypes: ['audio/*', 'video/*'],
    accept: 'audio/*,video/*',
  },
};

/**
 * Mendapatkan string accept attribute untuk HTML file input berdasarkan allowedTypes
 */
export function getFileAcceptAttribute(allowedTypes = []) {
  if (!allowedTypes || allowedTypes.length === 0 || allowedTypes.includes('all')) {
    return '*/*';
  }

  const accepts = [];
  allowedTypes.forEach((typeKey) => {
    if (FILE_TYPE_CONFIG[typeKey]?.accept) {
      accepts.push(FILE_TYPE_CONFIG[typeKey].accept);
    }
  });

  return accepts.length > 0 ? accepts.join(',') : '*/*';
}

/**
 * Mendapatkan ringkasan teks jenis file yang diizinkan untuk ditampilkan ke responden
 */
export function getAllowedTypesLabel(allowedTypes = []) {
  if (!allowedTypes || allowedTypes.length === 0 || allowedTypes.includes('all')) {
    return 'Semua Jenis Berkas (Dokumen, PDF, Gambar, ZIP, dll)';
  }

  const labels = allowedTypes
    .map((t) => FILE_TYPE_CONFIG[t]?.label)
    .filter(Boolean);

  return labels.length > 0 ? labels.join(', ') : 'Semua Format';
}

/**
 * Validasi ekstensi dan ukuran file di sisi client & server
 */
export function validateFileRules(file, allowedTypes = [], maxSizeMb = 10) {
  if (!file) return { valid: false, error: 'File tidak ditemukan' };

  // 1. Validasi Ukuran Maksimal
  const maxBytes = (maxSizeMb || 10) * 1024 * 1024;
  if (file.size > maxBytes) {
    const formattedMax = maxSizeMb >= 1000 ? `${(maxSizeMb / 1000).toFixed(1)} GB` : `${maxSizeMb} MB`;
    const actualMb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `Ukuran berkas (${actualMb} MB) melebihi batas maksimal yang diizinkan (${formattedMax}).`,
    };
  }

  // 2. Validasi Jenis / Ekstensi File
  if (allowedTypes && allowedTypes.length > 0 && !allowedTypes.includes('all')) {
    const fileName = (file.name || '').toLowerCase();
    const fileMime = (file.type || '').toLowerCase();

    const allowedExtensions = [];
    const allowedMimes = [];

    allowedTypes.forEach((typeKey) => {
      const cfg = FILE_TYPE_CONFIG[typeKey];
      if (cfg) {
        allowedExtensions.push(...cfg.extensions);
        allowedMimes.push(...cfg.mimeTypes);
      }
    });

    const hasValidExt = allowedExtensions.some((ext) => fileName.endsWith(ext.toLowerCase()));
    const hasValidMime = allowedMimes.some((m) => {
      if (m.endsWith('/*')) {
        const prefix = m.replace('/*', '');
        return fileMime.startsWith(prefix);
      }
      return fileMime === m;
    });

    if (!hasValidExt && !hasValidMime) {
      return {
        valid: false,
        error: `Format berkas "${fileName}" tidak diizinkan. Format yang diperbolehkan: ${getAllowedTypesLabel(allowedTypes)}.`,
      };
    }
  }

  return { valid: true };
}
