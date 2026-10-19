"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Button } from "@/components/ui/button";

export function LocalizedError({ reset }: { reset: () => void }) {
  const { t } = useLanguage();
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
      <h1 className="text-xl font-semibold">{t("ui.ddf785b79c42")}</h1>
      <p>{t("ui.cf5605cdcc73")}</p>
      <div className="flex gap-2">
        <Button onClick={reset}>{t("ui.bdc090ec61e3")}</Button>
        <Button variant="outline" onClick={() => window.history.back()}>{t("ui.76900f1bfd16")}</Button>
      </div>
      <LanguageSwitcher />
    </main>
  );
}
