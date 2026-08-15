"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { ShoppingBag, ArrowUpRight, Package, ShoppingCart, ExternalLink, Tag } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";

const InstagramIcon = (props) => (
  <svg className={`fill-current ${props.className || "w-5 h-5"}`} viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
  </svg>
);

export default function MerchPublicClient({ merchandise = [] }) {
  const { t } = useLanguage();
  const formatRupiah = (val) => {
    const num = Number(val) || 0;
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }).format(num);
  };

  // Separate bundles and regular products if name/desc mentions bundle
  const bundles = merchandise.filter(m => 
    (m.name || "").toLowerCase().includes("bundle") || 
    (m.description || "").toLowerCase().includes("bundle")
  );

  const regularProducts = merchandise.filter(m => !bundles.some(b => b.id === m.id));

  return (
    <div className="min-h-screen bg-[#0cc48a] dark:bg-[#07130e] text-white pt-24 select-none font-sans transition-colors duration-300">
      
      {/* Hero Section */}
      <section className="relative bg-[#0cc48a] dark:bg-[#07130e] text-white py-20 px-6 md:px-12 lg:px-20 overflow-hidden border-b border-white/10 dark:border-transparent transition-colors duration-300">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-yellow-300/10 dark:bg-emerald-500/10 blur-[100px]" />
        
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="flex flex-col gap-6"
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-yellow-300/15 border border-yellow-300/30 text-yellow-300 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider w-fit mb-2">
              <ShoppingBag className="w-4 h-4" /> {t("visitor.merchandise.hero_badge")}
            </div>

            <h1 className="text-4xl md:text-6xl font-display font-black leading-tight tracking-tight uppercase">
              {t("visitor.merchandise.title").split(" SRE ")[0]} <br className="hidden md:inline" />
              <span className="text-yellow-300 dark:text-emerald-400">SRE {t("visitor.merchandise.title").split(" SRE ")[1]}</span>
            </h1>
            <p className="text-lg md:text-xl font-light text-white dark:text-gray-300 leading-relaxed max-w-xl">
              {t("visitor.merchandise.subtitle")}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="w-full max-w-[420px] aspect-square mx-auto rounded-3xl border border-white/20 dark:border-white/10 bg-white/10 dark:bg-white/[0.02] backdrop-blur-xl shadow-2xl relative overflow-hidden flex items-center justify-center group"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-yellow-300/10 to-transparent dark:from-emerald-500/10 dark:to-transparent" />
            <svg
              className="w-48 h-48 text-yellow-300/40 group-hover:text-yellow-300/60 dark:text-emerald-400/40 dark:group-hover:text-emerald-400/60 transition-colors duration-500"
              viewBox="0 0 100 100"
              fill="none"
              stroke="currentColor"
            >
              {/* Tapered Tower (Matches Footer Wind Turbine) */}
              <path d="M 46.5 95 L 50 50 L 53.5 95 Z" fill="currentColor" opacity="0.75" />

              {/* Rotating Blade Assembly Perfectly Centered at (50, 50) */}
              <g>
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  from="0 50 50"
                  to="360 50 50"
                  dur="12s"
                  repeatCount="indefinite"
                />
                {/* 3 Rounded Straight-Line Blades */}
                <line x1="50" y1="50" x2="50" y2="12" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" opacity="0.9" />
                <line x1="50" y1="50" x2="50" y2="12" transform="rotate(120 50 50)" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" opacity="0.9" />
                <line x1="50" y1="50" x2="50" y2="12" transform="rotate(240 50 50)" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" opacity="0.9" />

                {/* Center Hub */}
                <circle cx="50" cy="50" r="4.5" fill="currentColor" />
              </g>
            </svg>
            
            <div className="absolute bottom-6 left-6 right-6 text-center">
              <span className="text-xs font-mono tracking-widest text-yellow-300 dark:text-emerald-400 uppercase font-bold">{t("visitor.merchandise.available_now")}</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Special Bundles */}
      {bundles.length > 0 && (
        <section className="py-20 px-6 md:px-12 lg:px-20 bg-[#e8ecc4] dark:bg-[#040e0a] border-b border-white/10 dark:border-transparent transition-colors duration-300">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <span className="text-xs font-black text-[#0cc48a] dark:text-emerald-400 tracking-widest uppercase mb-2 block">{t("visitor.merchandise.exclusive_offers")}</span>
              <h2 className="text-3xl md:text-5xl font-display font-black uppercase text-[#07130e] dark:text-white tracking-tight">
                {t("visitor.merchandise.special_bundles_prefix")}<span className="text-[#0cc48a] dark:text-emerald-400">{t("visitor.merchandise.special_bundles_highlight")}</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {bundles.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="bg-white border border-[#d0d6a8] dark:bg-[#07130e] dark:border-white/10 rounded-3xl overflow-hidden shadow-lg hover:border-[#0cc48a]/40 dark:hover:border-emerald-500/40 transition-all duration-500 group flex flex-col sm:flex-row"
                >
                  <div className="sm:w-1/2 aspect-square relative overflow-hidden bg-[#07130e]/30 dark:bg-emerald-950/30">
                    <img
                      src={item.imageUrl || "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?q=80&w=800&auto=format&fit=crop"}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute top-3 left-3">
                      <span className="px-3 py-1 rounded-xl bg-amber-500/30 text-amber-200 border border-amber-500/40 text-[10px] font-black uppercase tracking-wider backdrop-blur-md">
                        BUNDLE
                      </span>
                    </div>
                  </div>

                  <div className="sm:w-1/2 p-6 flex flex-col justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-[#07130e] dark:text-white mb-2 group-hover:text-[#0cc48a] dark:group-hover:text-emerald-400 transition-colors">
                        {item.name}
                      </h3>
                      <p className="text-[#07130e]/80 dark:text-gray-300 text-xs leading-relaxed mb-4 line-clamp-3">
                        {item.description}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-[#d0d6a8] dark:border-white/10 flex items-center justify-between">
                      <span className="text-xl font-black text-[#0cc48a] dark:text-emerald-400">{formatRupiah(item.price)}</span>
                      {item.linkUrl ? (
                        <a
                          href={item.linkUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-[#0cc48a] hover:bg-[#0ab37d] text-white dark:bg-emerald-500 dark:hover:bg-emerald-400 dark:text-black font-bold text-xs rounded-xl transition-all shadow-lg flex items-center gap-1"
                        >
                          {t("visitor.merchandise.buy_now")} <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      ) : (
                        <span className="text-xs text-[#07130e]/60 dark:text-gray-500 italic">{t("visitor.merchandise.contact_sre")}</span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Products */}
      <section id="catalog" className="scroll-mt-20 py-20 px-6 md:px-12 lg:px-20 border-b border-white/10 dark:border-transparent bg-[#08a270] dark:bg-[#07130e] transition-colors duration-300">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs font-black text-yellow-300 dark:text-emerald-400 tracking-widest uppercase mb-2 block">{t("visitor.merchandise.catalog")}</span>
            <h2 className="text-3xl md:text-5xl font-display font-black uppercase text-white tracking-tight">
              {t("visitor.merchandise.products_prefix")}<span className="text-yellow-300 dark:text-emerald-400">{t("visitor.merchandise.products_highlight")}</span>
            </h2>
          </div>

          {merchandise.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="w-full max-w-3xl mx-auto p-12 md:p-16 rounded-3xl border border-dashed border-white/20 dark:border-white/10 bg-white/10 dark:bg-white/[0.01] backdrop-blur-md flex flex-col items-center justify-center text-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-yellow-300/10 text-yellow-300 dark:bg-emerald-500/10 dark:text-emerald-400 flex items-center justify-center mb-4">
                <Package className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{t("visitor.merchandise.no_merch")}</h3>
              <p className="text-xs text-white/70 dark:text-gray-400 max-w-md">
                {t("visitor.merchandise.no_merch_desc")}
              </p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {(regularProducts.length > 0 ? regularProducts : merchandise).map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="group flex flex-col bg-white/10 border border-white/20 hover:border-yellow-300/40 dark:bg-[#040e0a] dark:border-white/10 dark:hover:border-emerald-500/40 rounded-3xl overflow-hidden shadow-xl hover:-translate-y-1 hover:shadow-2xl hover:shadow-yellow-300/10 dark:hover:shadow-emerald-500/10 transition-all duration-500"
                >
                  <div className="relative aspect-square w-full overflow-hidden bg-[#07130e]/30 dark:bg-emerald-950/30">
                    <img
                      src={item.imageUrl || "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?q=80&w=800&auto=format&fit=crop"}
                      alt={item.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute top-3 right-3">
                      <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider backdrop-blur-md ${
                        item.isAvailable 
                          ? "bg-yellow-300/25 text-yellow-300 border border-yellow-300/45 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30" 
                          : "bg-red-500/30 text-red-200 border border-red-500/40 dark:bg-red-500/20 dark:text-red-400 dark:border-red-500/20"
                      }`}>
                        {item.isAvailable ? t("visitor.merchandise.available") : t("visitor.merchandise.out_of_stock")}
                      </span>
                    </div>
                  </div>

                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-white group-hover:text-yellow-300 dark:group-hover:text-emerald-400 transition-colors mb-2 line-clamp-1">
                        {item.name}
                      </h3>
                      <p className="text-white/80 dark:text-gray-300 text-xs leading-relaxed mb-6 line-clamp-3">
                        {item.description}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-white/15 dark:border-white/10 flex items-center justify-between">
                      <span className="text-lg font-black text-yellow-300 dark:text-emerald-400">{formatRupiah(item.price)}</span>
                      {item.linkUrl ? (
                        <a
                          href={item.linkUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-yellow-300 hover:bg-yellow-200 text-[#07130e] dark:bg-emerald-500 dark:hover:bg-emerald-400 dark:text-black font-bold text-xs rounded-xl transition-all shadow-lg flex items-center gap-1"
                        >
                          {t("visitor.merchandise.buy")} <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      ) : (
                        <span className="text-xs text-white/60 dark:text-gray-500 italic">{t("visitor.merchandise.no_link")}</span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-20 px-6 md:px-12 lg:px-20 bg-[#0cc48a] dark:bg-[#030a07] text-white relative overflow-hidden transition-colors duration-300">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row justify-between items-start lg:items-center gap-12 relative z-10">
          <div className="max-w-xl">
            <span className="text-xs font-black text-yellow-300 dark:text-emerald-400 tracking-widest uppercase mb-2 block">{t("visitor.merchandise.order_inquiries")}</span>
            <h2 className="text-3xl md:text-5xl font-display font-black leading-tight uppercase mb-4 text-white dark:text-white">
              {t("visitor.merchandise.get_official_prefix")} <br />
              <span className="text-yellow-300 dark:text-emerald-400">{t("visitor.merchandise.get_official_highlight")}</span>
            </h2>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
            <a
              href="https://www.instagram.com/sre.upnjatim/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 bg-white/10 hover:bg-white/20 border-2 border-white/35 dark:border-white/20 text-[#07130e] dark:text-white px-8 py-4 rounded-2xl text-sm font-bold uppercase tracking-wider transition-all duration-300 transform hover:scale-105"
            >
              <InstagramIcon className="w-5 h-5 text-[#07130e] dark:text-emerald-400" />
              @sre.upnjatim
            </a>

            <a
              href="https://shopee.co.id"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 bg-yellow-300 text-[#07130e] hover:bg-yellow-200 shadow-lg shadow-yellow-300/20 dark:bg-emerald-500 dark:text-black dark:hover:bg-emerald-400 dark:shadow-emerald-500/20 px-8 py-4 rounded-2xl text-sm font-bold uppercase tracking-wider transition-all duration-300 transform hover:scale-105"
            >
              <ShoppingCart className="w-5 h-5" />
              {t("visitor.merchandise.shopee")}
            </a>
          </div>
        </div>
      </section>

    </div>
  );
}
