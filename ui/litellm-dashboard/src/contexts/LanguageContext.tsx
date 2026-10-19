"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import moment from "moment";
import "moment/locale/zh-cn";
import {
  DEFAULT_LOCALE,
  LOCALE_STORAGE_KEY,
  setActiveLocale,
  getActiveLocale,
  subscribeLocale,
  translateText,
  t as translate,
  type Locale,
  type TranslationValues,
} from "@/i18n";

interface LanguageContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, values?: TranslationValues) => string;
}

const LanguageContext = createContext<LanguageContextValue>({
  locale: "en",
  setLocale: () => undefined,
  t: (key, values) => translate(key, "en", values),
});

export function useLanguage(): LanguageContextValue {
  return useContext(LanguageContext);
}

export function LocalizedText({ id, text }: { id?: string; text?: string | null }) {
  const { locale, t } = useLanguage();
  return id ? t(id) : translateText(text ?? "", locale);
}

export function LanguageProvider({
  children,
  initialLocale = DEFAULT_LOCALE,
}: {
  children: ReactNode;
  initialLocale?: Locale;
}) {
  const subscribe = useCallback(
    (listener: () => void) =>
      subscribeLocale(() => {
        moment.locale(getActiveLocale() === "zh" ? "zh-cn" : "en");
        listener();
      }, initialLocale),
    [initialLocale],
  );
  const getServerSnapshot = useCallback(() => initialLocale, [initialLocale]);
  const locale = useSyncExternalStore(subscribe, getActiveLocale, getServerSnapshot);
  const setLocale = useCallback((next: Locale) => {
    moment.locale(next === "zh" ? "zh-cn" : "en");
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, next);
    } catch {}
    setActiveLocale(next);
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale === "zh" ? "zh-CN" : "en";
  }, [locale]);

  const t = useCallback((key: string, values?: TranslationValues) => translate(key, locale, values), [locale]);
  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}
