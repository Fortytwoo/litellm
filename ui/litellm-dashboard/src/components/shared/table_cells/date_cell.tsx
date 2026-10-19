"use client";

import { CellTooltip } from "./cell_tooltip";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Locale } from "@/i18n";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;

export type DatePrecision = "datetime" | "date";

interface DateCellProps {
  value: string | null | undefined;
  precision?: DatePrecision;
  fallback?: string;
}

const pad = (n: number): string => String(n).padStart(2, "0");

export const formatCellDate = (date: Date, precision: DatePrecision, locale: Locale = "en"): string => {
  if (locale === "zh") {
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      ...(precision === "datetime"
        ? ({ hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" } as const)
        : {}),
    };
    return new Intl.DateTimeFormat("zh-CN", options).format(date);
  }
  return precision === "date"
    ? `${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`
    : `${MONTHS[date.getMonth()]} ${date.getDate()}, ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

export const formatFullTimestamp = (date: Date, locale: Locale = "en"): string => {
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const day =
    locale === "zh"
      ? formatCellDate(date, "date", locale)
      : `${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  const time = `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  return `${day}, ${time} (${timeZone})`;
};

export function DateCell({ value, precision = "datetime", fallback = "-" }: DateCellProps) {
  const { locale } = useLanguage();
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) {
    return <span className="text-muted-foreground">{fallback}</span>;
  }

  return (
    <CellTooltip
      content={formatFullTimestamp(date, locale)}
      trigger={<span className="whitespace-nowrap">{formatCellDate(date, precision, locale)}</span>}
    />
  );
}
