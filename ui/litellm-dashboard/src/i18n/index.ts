import en from "./locales/en.json";
import zh from "./locales/zh.json";
import templateInflections from "./templateInflections.json";

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
    [value.replace(/\bCNY\b/g, "USD").replace(/\(¥\)/g, "($)"), "ui." + key] as const,
  ]),
);

export function translateText(value: string, locale: Locale = activeLocale): string {
  const key = displayKeys.get(value);
  if (key) return t(key, locale);
  const trimmedKey = displayKeys.get(value.trim());
  if (trimmedKey) {
    return (value.match(/^\s*/)?.[0] ?? "") + t(trimmedKey, locale).trim() + (value.match(/\s*$/)?.[0] ?? "");
  }
  if (value.length > 5000) return value;
  for (const template of displayTemplates) {
    if (template.locale === locale || !value.startsWith(template.prefix)) continue;
    const match = template.pattern.exec(value);
    if (!match) continue;
    const captures = Object.fromEntries(template.names.map((name, index) => [name, match[index + 1]]));
    if (template.names.some((name, index) => captures[name] !== match[index + 1])) continue;
    const suffixes = (templateInflections as Readonly<Record<string, readonly string[]>>)[template.key] ?? [];
    const values = Object.fromEntries(
      Object.entries(captures).map(([name, captured]) => [
        name,
        locale === "zh" && suffixes.includes(name) ? "" : captured,
      ]),
    );
    return t(template.key, locale, values);
  }
  return value;
}

const escapePattern = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const displayTemplates = (["en", "zh"] as const)
  .flatMap((locale) =>
    Object.entries(translations[locale].ui as Readonly<Record<string, string>>).flatMap(([id, message]) => {
      const names = [...message.matchAll(/\{\{(\w+)\}\}/g)].map((match) => match[1]);
      const parts = message.split(/\{\{\w+\}\}/g);
      const suffixes = (templateInflections as Readonly<Record<string, readonly string[]>>)["ui." + id] ?? [];
      const ambiguous = /\}\}\s*\{\{/.test(message) && !suffixes.length;
      if (!names.length || parts.join("").trim().length < 8 || ambiguous) return [];
      const pattern = parts.reduce((result, part, index) => {
        if (!index) return escapePattern(part);
        const capture = suffixes.includes(names[index - 1]) ? "(s?)" : "([\\s\\S]*?)";
        return result + capture + escapePattern(part);
      }, "");
      return [
        {
          key: "ui." + id,
          locale,
          names,
          prefix: parts[0],
          pattern: new RegExp("^" + pattern + "$"),
          weight: parts.join("").length,
        },
      ];
    }),
  )
  .sort((left, right) => right.weight - left.weight);

export function getActiveLocale(): Locale {
  return activeLocale;
}

export function getFormattingLocale(): string {
  return activeLocale === "zh" ? "zh-CN" : "en-US";
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
