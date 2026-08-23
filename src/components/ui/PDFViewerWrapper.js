"use client";
import React, { useState, useEffect, useMemo } from 'react';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

export default function PDFViewerWrapper({ file, onLoadSuccess, numPages, renderPageWrapper }) {
  const [ReactPdf, setReactPdf] = useState(null);

  useEffect(() => {
    // Dynamically import react-pdf ONLY on the client to avoid DOMMatrix SSR errors
    import('react-pdf').then((mod) => {
      mod.pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${mod.pdfjs.version}/build/pdf.worker.min.mjs`;
      setReactPdf(mod);
    }).catch(err => {
      console.error("Failed to load react-pdf", err);
    });
  }, []);

  const pdfOptions = useMemo(() => {
    if (!ReactPdf?.pdfjs?.version) return undefined;
    return {
      cMapUrl: `https://unpkg.com/pdfjs-dist@${ReactPdf.pdfjs.version}/cmaps/`,
      cMapPacked: true,
      standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${ReactPdf.pdfjs.version}/standard_fonts/`,
    };
  }, [ReactPdf?.pdfjs?.version]);

  if (!ReactPdf) {
    return (
      <div className="w-full flex items-center justify-center p-12 text-slate-400 font-bold uppercase tracking-widest text-xs">
        Memuat Engine PDF...
      </div>
    );
  }

  const { Document, Page } = ReactPdf;

  return (
    <Document
      file={file}
      options={pdfOptions}
      onLoadSuccess={onLoadSuccess}
      loading={null}
      className="flex flex-col items-center gap-8"
    >
      {numPages && Array.from(new Array(numPages), (el, index) => {
        return renderPageWrapper(Page, index);
      })}
    </Document>
  );
}
