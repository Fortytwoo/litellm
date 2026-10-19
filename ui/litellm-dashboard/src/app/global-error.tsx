"use client";

import { LanguageProvider } from "@/contexts/LanguageContext";
import { LocalizedError } from "@/components/LocalizedError";

export default function GlobalError({ reset }: { reset: () => void }) {
  return <html lang="zh-CN"><body><LanguageProvider><LocalizedError reset={reset} /></LanguageProvider></body></html>;
}
