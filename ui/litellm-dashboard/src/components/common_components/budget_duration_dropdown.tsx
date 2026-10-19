"use client";
import { t as translateUi } from "@/i18n";

import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const NEVER_RESETS_BUDGET_DURATION = "none";

const DURATION_LABELS: Record<string, string> = {
  get [NEVER_RESETS_BUDGET_DURATION]() {
    return translateUi("ui.f95c8af3735c");
  },
  get "1h"() {
    return translateUi("ui.2b2a51df70a1");
  },
  get "24h"() {
    return translateUi("ui.6f31304cdfd0");
  },
  get "7d"() {
    return translateUi("ui.8850eced986e");
  },
  get "30d"() {
    return translateUi("ui.9169e3ca73ee");
  },
};

interface BudgetDurationDropdownProps {
  id?: string;
  value?: string | null;
  onChange?: (value: string | null) => void;
  className?: string;
  style?: React.CSSProperties;
  placeholder?: string;
  showNeverResets?: boolean;
}

const BudgetDurationDropdown: React.FC<BudgetDurationDropdownProps> = ({
  id,
  value,
  onChange,
  className = "",
  style = {},
  placeholder = "n/a",
  showNeverResets = false,
}) => {
  const { t: uiT } = useDashboardLanguage();

  return (
    <Select items={DURATION_LABELS} value={value || null} onValueChange={onChange}>
      <SelectTrigger id={id} className={`w-full ${className}`} style={style}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={null}>{placeholder}</SelectItem>
        {showNeverResets ? (
          <SelectItem value={NEVER_RESETS_BUDGET_DURATION}>{uiT("ui.f95c8af3735c")}</SelectItem>
        ) : null}
        <SelectItem value="1h">{uiT("ui.2b2a51df70a1")}</SelectItem>
        <SelectItem value="24h">{uiT("ui.6f31304cdfd0")}</SelectItem>
        <SelectItem value="7d">{uiT("ui.8850eced986e")}</SelectItem>
        <SelectItem value="30d">{uiT("ui.9169e3ca73ee")}</SelectItem>
      </SelectContent>
    </Select>
  );
};

export const getBudgetDurationLabel = (value: string | null | undefined): string => {
  if (!value) return "Not set";

  const budgetDurationMap: Record<string, string> = {
    "1h": "hourly",
    "24h": "daily",
    "7d": "weekly",
    "30d": "monthly",
  };

  return budgetDurationMap[value] || value;
};

export default BudgetDurationDropdown;
