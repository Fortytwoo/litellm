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
import dayjs from "dayjs";
import "dayjs/locale/zh-cn";
import { z } from "zod";
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

function setFormattingLocale(locale: Locale): void {
  moment.locale(locale === "zh" ? "zh-cn" : "en");
  dayjs.locale(locale === "zh" ? "zh-cn" : "en");
  z.config(locale === "zh" ? z.locales.zhCN() : z.locales.en());
}

const LanguageContext = createContext<LanguageContextValue>({
  locale: "en",
  setLocale: () => undefined,
  t: (key, values) => translate(key, "en", values),
});

export function useLanguage(): LanguageContextValue {
  return useContext(LanguageContext);
}

export function LocalizedText({ id, text, children }: { id?: string; text?: string | null; children?: ReactNode }) {
  const { locale, t } = useLanguage();
  if (id) return t(id);
  const value = text ?? children ?? "";
  return typeof value === "string" ? translateText(value, locale) : value;
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
        setFormattingLocale(getActiveLocale());
        listener();
      }, initialLocale),
    [initialLocale],
  );
  const getServerSnapshot = useCallback(() => initialLocale, [initialLocale]);
  const locale = useSyncExternalStore(subscribe, getActiveLocale, getServerSnapshot);
  const setLocale = useCallback((next: Locale) => {
    setFormattingLocale(next);
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
