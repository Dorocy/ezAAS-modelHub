"use client";

import {
  createContext,
  useState,
  useContext,
  ReactNode,
  useCallback,
  useEffect,
} from "react";

const translations = { en: require("@/contexts/en.json"), ko: require("@/contexts/ko.json") };

type Locale = "en" | "ko";

interface LanguageContextType {
  locale: Locale;
  changeLanguage: (locale: Locale) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [locale, setLocale] = useState<Locale>("en");

  useEffect(() => {
    const savedLocale = localStorage.getItem("locale") as Locale;
    if (savedLocale && ["en", "ko"].includes(savedLocale)) {
      setLocale(savedLocale);
    }
  }, []);

  const changeLanguage = (newLocale: Locale) => {
    localStorage.setItem("locale", newLocale);
    setLocale(newLocale);
  };

  const t = useCallback(
    (key: string) => {
      return translations[locale][key] || key;
    },
    [locale]
  );

  return (
    <LanguageContext.Provider value={{ locale, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};