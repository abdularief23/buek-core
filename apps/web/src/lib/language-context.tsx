import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import {
  type AppLanguage,
  getAppLanguage,
  setAppLanguage as persistAppLanguage
} from "./user-preferences.js";
import { translate, type TranslationKey } from "./i18n.js";

interface LanguageContextValue {
  language: AppLanguage;
  setLanguage: (language: AppLanguage) => void;
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>(getAppLanguage());

  const setLanguage = useCallback((next: AppLanguage) => {
    persistAppLanguage(next);
    setLanguageState(next);
  }, []);

  const t = useCallback(
    (key: TranslationKey, vars?: Record<string, string | number>) => translate(language, key, vars),
    [language]
  );

  const value = useMemo(() => ({ language, setLanguage, t }), [language, setLanguage, t]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
