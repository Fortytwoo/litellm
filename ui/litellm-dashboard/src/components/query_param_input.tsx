"use client";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import React from "react";
import { Minus, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { KeyValuePair } from "./key_value_input";

interface QueryParamInputProps {
  value?: readonly KeyValuePair[];
  onChange?: (value: readonly KeyValuePair[]) => void;
}

const QueryParamInput: React.FC<QueryParamInputProps> = ({ value = [], onChange }) => {
  const { t: uiT } = useDashboardLanguage();

  const handleAdd = () => onChange?.([...value, ["", ""]]);

  const handleRemove = (index: number) => onChange?.(value.filter((_, i) => i !== index));

  const handleChange = (index: number, pair: KeyValuePair) =>
    onChange?.(value.map((existing, i) => (i === index ? pair : existing)));

  return (
    <div className="space-y-2">
      {value.map(([key, val], index) => (
        <div key={index} className="flex items-center gap-2">
          <Input
            placeholder={uiT("ui.2f984ca0f1dc154f")}
            value={key}
            onChange={(e) => handleChange(index, [e.target.value, val])}
          />
          <Input
            placeholder={uiT("ui.78da5353cfe12262")}
            value={val}
            onChange={(e) => handleChange(index, [key, e.target.value])}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => handleRemove(index)}
            aria-label={uiT("ui.010948ebfe99de3d", { v0: String(index + 1) })}
          >
            <Minus />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" onClick={handleAdd}>
        <Plus />
        {uiT("ui.12dd04026e5d3658")}
      </Button>
    </div>
  );
};

export default QueryParamInput;
