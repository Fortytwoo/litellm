import { useLanguage } from "@/contexts/LanguageContext";
import { t } from "@/i18n";
import en from "@/i18n/locales/en.json";

export type CopyKey = keyof typeof en.managed;

export function gatewayText(key: CopyKey) {
  return t("managed." + key);
}

export function useCopy() {
  const { t } = useLanguage();
  return (key: CopyKey) => t("managed." + key);
}
