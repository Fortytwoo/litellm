"use client";
import { getFormattingLocale } from "@/i18n";
import { useLanguage } from "@/contexts/LanguageContext";
import React from "react";
import type { DateRangePickerValue } from "@/components/shared/date_picker_types";

interface ExportSummaryProps {
  dateRange: DateRangePickerValue;
  selectedFilters: string[];
}

const ExportSummary: React.FC<ExportSummaryProps> = ({ dateRange, selectedFilters }) => {
  const { t } = useLanguage();
  return (
    <div className="text-sm text-muted-foreground">
      {dateRange.from?.toLocaleDateString(getFormattingLocale())} -{" "}
      {dateRange.to?.toLocaleDateString(getFormattingLocale())}
      {selectedFilters.length > 0 &&
        " · " +
          t(selectedFilters.length === 1 ? "supplement.exportFilterOne" : "supplement.exportFilterMany", {
            count: selectedFilters.length,
          })}
    </div>
  );
};

export default ExportSummary;
