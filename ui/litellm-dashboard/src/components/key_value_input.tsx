"use client";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import React from "react";
import { Minus, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type KeyValuePair = readonly [string, string];

interface KeyValueInputProps {
  value?: readonly KeyValuePair[];
  onChange?: (value: readonly KeyValuePair[]) => void;
}

const KeyValueInput: React.FC<KeyValueInputProps> = ({ value = [], onChange }) => {
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
            placeholder={uiT("ui.6e58dfc8e692ed92")}
            value={key}
            onChange={(e) => handleChange(index, [e.target.value, val])}
          />
          <Input
            placeholder={uiT("ui.f00c7870ced32cd0")}
            value={val}
            onChange={(e) => handleChange(index, [key, e.target.value])}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => handleRemove(index)}
            aria-label={uiT("ui.8573cc188bf7dcf6", { v0: String(index + 1) })}
          >
            <Minus />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" onClick={handleAdd}>
        <Plus />
        {uiT("ui.6e8d71f69219ef2b")}
      </Button>
    </div>
  );
};

export default KeyValueInput;
