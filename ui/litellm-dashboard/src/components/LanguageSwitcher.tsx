"use client";

import { Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useLanguage();
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setLocale(locale === "en" ? "zh" : "en")}
      title={t("language.label")}
    >
      <Languages className="size-4" />
      {t("language.switch_to")}
    </Button>
  );
}
