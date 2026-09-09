"use client";

import React, { useRef, useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import { useTheme } from "next-themes";

// Dynamic import of TinyMCE Editor to avoid SSR hydration issues in Next.js
const Editor = dynamic(
  () => import("@tinymce/tinymce-react").then((mod) => mod.Editor),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-80 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 flex flex-col items-center justify-center gap-3 text-gray-400">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="text-xs font-semibold">Loading Rich HTML Editor...</span>
      </div>
    ),
  }
);

export default function TinyMCEEditor({
  value,
  onChange,
  placeholder = "Write and format your article content here...",
  height = 480,
}) {
  const editorRef = useRef(null);
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDarkMode = mounted && (resolvedTheme === "dark" || (typeof document !== "undefined" && document.documentElement.classList.contains("dark")));

  // Image upload handler directly into Cloudflare R2 via /api/upload
  const handleImageUpload = (blobInfo, progress) => {
    return new Promise(async (resolve, reject) => {
      try {
        const formData = new FormData();
        formData.append("file", blobInfo.blob(), blobInfo.filename());
        formData.append("folder", "content/editor");

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          throw new Error(`Upload failed with status: ${res.status}`);
        }

        const data = await res.json();
        if (data.success && data.url) {
          resolve(data.url);
        } else {
          reject(data.error || "Failed to upload image.");
        }
      } catch (err) {
        reject(err.message || "Failed to upload image.");
      }
    });
  };

  return (
    <div className="tinymce-wrapper w-full rounded-2xl overflow-hidden border border-gray-200 dark:border-white/10 shadow-xs bg-white dark:bg-[#07140f] transition-all">
      <Editor
        tinymceScriptSrc="https://cdnjs.cloudflare.com/ajax/libs/tinymce/6.8.3/tinymce.min.js"
        onInit={(evt, editor) => (editorRef.current = editor)}
        value={value || ""}
        onEditorChange={(newContent) => {
          if (onChange) {
            onChange(newContent);
          }
        }}
        init={{
          height: height,
          menubar: "file edit view insert format tools table help",
          plugins: [
            "advlist", "autolink", "lists", "link", "image", "charmap", "preview",
            "anchor", "searchreplace", "visualblocks", "code", "fullscreen",
            "insertdatetime", "media", "table", "help", "wordcount"
          ],
          toolbar:
            "undo redo | blocks fontfamily fontsize | " +
            "bold italic underline strikethrough | forecolor backcolor | " +
            "alignleft aligncenter alignright alignjustify | " +
            "bullist numlist outdent indent | link image media table hr blockquote | " +
            "code fullscreen | removeformat help",
          content_style: `
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; 
              font-size: 16px; 
              line-height: 1.85;
              color: ${isDarkMode ? "#f3f4f6" : "#1f2937"};
              background-color: ${isDarkMode ? "#07140f" : "#ffffff"};
              padding: 16px 24px;
            }
            p, div { margin-top: 0; margin-bottom: 1.5em; line-height: 1.85; }
            img { max-width: 100%; height: auto; border-radius: 12px; }
            table { border-collapse: collapse; width: 100%; margin: 20px 0; }
            th, td { border: 1px solid ${isDarkMode ? "#273831" : "#e5e7eb"}; padding: 10px 14px; }
            th { background-color: ${isDarkMode ? "#0e241c" : "#f9fafb"}; }
            blockquote { border-left: 4px solid #10b981; margin: 20px 0; padding-left: 16px; font-style: italic; opacity: 0.9; }
            a { color: #10b981; text-decoration: underline; }
            h1, h2, h3, h4, h5, h6 { font-weight: 800; line-height: 1.35; margin-top: 1.8em; margin-bottom: 0.6em; }
            ul, ol { margin: 1.2em 0; padding-left: 1.8em; }
            li { margin: 0.4em 0; line-height: 1.8; }
          `,
          skin: isDarkMode ? "oxide-dark" : "oxide",
          content_css: isDarkMode ? "dark" : "default",
          placeholder: placeholder,
          branding: false,
          promotion: false,
          elementpath: true,
          resize: true,
          images_upload_handler: handleImageUpload,
          automatic_uploads: true,
          file_picker_types: "image",
          link_assume_external_targets: true,
          paste_data_images: true,
          browser_spellcheck: true,
        }}
      />
    </div>
  );
}
