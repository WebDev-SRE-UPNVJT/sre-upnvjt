"use client";

import { createContext, useContext, useState, useEffect, useMemo } from "react";
import id from "./id.json";
import en from "./en.json";

const translations = { id, en };

const defaultT = (key, params = {}) => {
  if (!key || typeof key !== "string") return "";
  const keys = key.split(".");
  let value = en;
  for (const k of keys) {
    if (value === undefined) break;
    value = value[k];
  }
  let res = value !== undefined ? value : key;
  if (typeof res === "string" && params && typeof params === "object") {
    Object.keys(params).forEach((paramKey) => {
      res = res.replace(new RegExp(`\\{${paramKey}\\}`, "g"), params[paramKey]);
    });
  }
  return res;
};

const defaultContextValue = {
  language: "en",
  setLanguage: () => {},
  t: defaultT,
};

const LanguageContext = createContext(defaultContextValue);

export function LanguageProvider({ children, initialLanguage = "en" }) {
  const [language, setLanguage] = useState(initialLanguage);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("app_lang");
      if (stored && (stored === "id" || stored === "en")) {
        setLanguage(stored);
      } else if (initialLanguage) {
        setLanguage(initialLanguage);
      }
    } catch (e) {
      // ignore localStorage errors (e.g. in incognito/SSR)
    }
  }, [initialLanguage]);

  useEffect(() => {
    try {
      localStorage.setItem("app_lang", language);
    } catch (e) {
      // ignore
    }
  }, [language]);

  const t = (key, params = {}) => {
    if (!key || typeof key !== "string") return "";
    const keys = key.split(".");
    let value = translations[language] || translations.en;
    for (const k of keys) {
      if (value === undefined) break;
      value = value[k];
    }
    // Fallback to English if translation is missing in selected language
    if (value === undefined) {
      let fallbackValue = translations.en;
      for (const k of keys) {
        if (fallbackValue === undefined) break;
        fallbackValue = fallbackValue[k];
      }
      value = fallbackValue;
    }

    let res = value !== undefined ? value : key;
    if (typeof res === "string" && params && typeof params === "object") {
      Object.keys(params).forEach((paramKey) => {
        res = res.replace(new RegExp(`\\{${paramKey}\\}`, "g"), params[paramKey]);
      });
    }
    return res;
  };

  const contextValue = useMemo(() => ({ language, setLanguage, t }), [language]);

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  return context || defaultContextValue;
};
