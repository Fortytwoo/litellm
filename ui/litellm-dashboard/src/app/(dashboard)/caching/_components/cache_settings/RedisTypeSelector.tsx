"use client";
import { t as translateUi } from "@/i18n";

import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface RedisTypeSelectorProps {
  redisType: string;
  redisTypeDescriptions: Readonly<Record<string, string>>;
  onTypeChange: (type: string) => void;
}

const REDIS_TYPE_LABELS: Readonly<Record<string, string>> = {
  get node() {
    return translateUi("ui.b5ff77a9cb7441eb");
  },
  get cluster() {
    return translateUi("ui.c137a7f43e23f7ff");
  },
  get sentinel() {
    return translateUi("ui.8ea9bd0d9810e449");
  },
  get semantic() {
    return translateUi("ui.9c11c99c771fe69a");
  },
};

const RedisTypeSelector: React.FC<RedisTypeSelectorProps> = ({ redisType, redisTypeDescriptions, onTypeChange }) => {
  const { t: uiT } = useDashboardLanguage();

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{uiT("ui.87ece5407db73469")}</label>
      <Select value={redisType} onValueChange={(value) => value !== null && onTypeChange(value)}>
        <SelectTrigger className="w-full">
          <SelectValue>{REDIS_TYPE_LABELS[redisType] ?? redisType}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {Object.entries(REDIS_TYPE_LABELS).map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">{redisTypeDescriptions[redisType] || uiT("ui.8303bd8e56767d35")}</p>
    </div>
  );
};

export default RedisTypeSelector;
