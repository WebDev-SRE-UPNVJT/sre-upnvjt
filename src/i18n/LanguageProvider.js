"use client";

import { createContext, useContext, useState, useEffect } from "react";
import id from "./id.json";
import en from "./en.json";

const translations = { id, en };

const LanguageContext = createContext();

export function LanguageProvider({ children, initialLanguage = "id" }) {
  const [language, setLanguage] = useState(initialLanguage);

  useEffect(() => {
    // Apabila prop language berubah dari server, perbarui state
    // Tetapi prioritaskan localStorage jika ada
    const stored = localStorage.getItem("app_lang");
    if (stored && (stored === "id" || stored === "en")) {
      setLanguage(stored);
    } else {
      setLanguage(initialLanguage);
    }
  }, [initialLanguage]);

  useEffect(() => {
    localStorage.setItem("app_lang", language);
  }, [language]);

  const t = (key) => {
    const keys = key.split(".");
    let value = translations[language];
    for (const k of keys) {
      if (value === undefined) break;
      value = value[k];
    }
    return value !== undefined ? value : key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
