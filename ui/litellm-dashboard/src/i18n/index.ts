import en from "./locales/en.json";
import zh from "./locales/zh.json";

export type Locale = "en" | "zh";
export type TranslationMap = { readonly [key: string]: string | TranslationMap };
export type TranslationValues = Readonly<Record<string, string | number>>;

export const LOCALE_STORAGE_KEY = "litellm_locale";
export const DEFAULT_LOCALE: Locale = "zh";
export const SUPPORTED_LOCALES: readonly { value: Locale; label: string }[] = [
  { value: "en", label: "English" },
  { value: "zh", label: "中文" },
];
export const translations: Readonly<Record<Locale, TranslationMap>> = { en, zh };

let activeLocale: Locale = DEFAULT_LOCALE;
const listeners = new Set<() => void>();
const displayKeys = new Map(
  [...Object.entries(en.ui), ...Object.entries(zh.ui)].flatMap(([key, value]) => [
    [value, "ui." + key] as const,
    [value.trim(), "ui." + key] as const,
  ]),
);

export function translateText(value: string, locale: Locale = activeLocale): string {
  const key = displayKeys.get(value);
  return key ? t(key, locale) : value;
}

export function getActiveLocale(): Locale {
  return activeLocale;
}

export function setActiveLocale(locale: Locale): void {
  activeLocale = locale;
  listeners.forEach((listener) => listener());
}

export function subscribeLocale(listener: () => void, initialLocale: Locale): () => void {
  listeners.add(listener);
  try {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
    setActiveLocale(stored === "en" || stored === "zh" ? stored : initialLocale);
  } catch {
    setActiveLocale(initialLocale);
  }
  return () => {
    listeners.delete(listener);
  };
}

function resolve(map: TranslationMap, key: string): string | undefined {
  const value = key
    .split(".")
    .reduce<
      string | TranslationMap | undefined
    >((entry, part) => (typeof entry === "object" ? entry[part] : undefined), map);
  return typeof value === "string" ? value : undefined;
}

export function t(key: string, locale: Locale = activeLocale, values: TranslationValues = {}): string {
  const message = resolve(translations[locale], key) ?? resolve(translations.en, key) ?? key;
  return message.replace(/\{\{(\w+)\}\}/g, (placeholder, name: string) => String(values[name] ?? placeholder));
}
