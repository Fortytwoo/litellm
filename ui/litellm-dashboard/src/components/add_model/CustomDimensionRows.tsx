"use client";

import { t as translateUi } from "@/i18n";

import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import type { CustomDimensionRow } from "./custom_dimensions";

const SCORING_MODES = [
  {
    value: "binary",
    get label() {
      return translateUi("ui.ee1c8277caf5fb9b");
    },
  },
  {
    value: "match_count",
    get label() {
      return translateUi("ui.5b2c5230eae26071");
    },
  },
] as const;

interface Props {
  rows: CustomDimensionRow[];
  disabled: boolean;
  onChange: (rows: CustomDimensionRow[]) => void;
  onWeight: (id: string, weight: number) => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
}

export default function CustomDimensionRows({ rows, disabled, onChange, onWeight, onAdd, onRemove }: Props) {
  const { t: uiT } = useDashboardLanguage();

  const [draft, setDraft] = useState<{ id: string; raw: string } | null>(null);
  const update = (id: string, patch: Partial<CustomDimensionRow>) =>
    onChange(rows.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  const editWeight = (id: string, raw: string) => {
    setDraft({ id, raw });
    if (raw.trim() && Number.isFinite(Number(raw))) onWeight(id, Number(raw));
  };
  return (
    <div className="space-y-4">
      {rows.map((row, index) => (
        <fieldset key={row.id} className="min-w-0 space-y-3 rounded-md border p-3">
          <legend className="float-left text-sm font-semibold">
            {uiT("ui.7875ebc9ff4a1b76")} {index + 1}
          </legend>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive/80"
              aria-label={uiT("ui.5aaeef80d367509f", { v0: String(index + 1) })}
              disabled={disabled}
              onClick={() => onRemove(row.id)}
            >
              <Trash2 />
              {uiT("ui.c3812fc4acb8")}
            </Button>
          </div>
          <div className="space-y-1">
            <Label htmlFor={`${row.id}-name`}>{uiT("ui.dcd1d5223f73")}</Label>
            <Input
              id={`${row.id}-name`}
              value={row.name}
              maxLength={64}
              onChange={(event) => update(row.id, { name: event.target.value })}
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Label htmlFor={`${row.id}-weight`}>{uiT("ui.81d27ef6d503")}</Label>
            <Slider
              min={0}
              max={1}
              step={0.01}
              disabled={disabled}
              value={[row.weight]}
              className="min-w-24 flex-1"
              aria-label={uiT("ui.8e03c9777de12cb3", {
                v0: String(row.name || translateUi("ui.400fd5c23c914343", undefined, { v0: String(index + 1) })),
              })}
              onValueChange={(value) => onWeight(row.id, Array.isArray(value) ? value[0] : value)}
            />
            <Input
              id={`${row.id}-weight`}
              className="w-24"
              inputMode="decimal"
              disabled={disabled}
              value={draft?.id === row.id ? draft.raw : Number(row.weight.toPrecision(6)).toString()}
              onBlur={() => setDraft(null)}
              onChange={(event) => editWeight(row.id, event.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {(["keywords", "patterns"] as const).map((field) => (
              <div key={field} className="min-w-0 space-y-1">
                <Label htmlFor={`${row.id}-${field}`}>
                  {field === "keywords" ? uiT("ui.8bfdb93cafaa9147") : uiT("ui.36e205848147c947")}{" "}
                  {uiT("ui.71b442586d53faea")}
                </Label>
                <Textarea
                  id={`${row.id}-${field}`}
                  rows={2}
                  value={row[field]?.join("\n") ?? ""}
                  onChange={(event) =>
                    update(row.id, { [field]: event.target.value ? event.target.value.split("\n") : [] })
                  }
                />
              </div>
            ))}
          </div>
          <div className="space-y-1">
            <Label htmlFor={`${row.id}-scoring`}>{uiT("ui.9ea9bd2122aab52a")}</Label>
            <Select
              items={SCORING_MODES}
              value={row.scoring_mode ?? "binary"}
              onValueChange={(mode) => {
                if (mode === "binary" || mode === "match_count") update(row.id, { scoring_mode: mode });
              }}
            >
              <SelectTrigger id={`${row.id}-scoring`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SCORING_MODES.map((mode) => (
                  <SelectItem key={mode.value} value={mode.value}>
                    {mode.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">{uiT("ui.ec60f1b1eff1938b")}</p>
          </div>
        </fieldset>
      ))}
      <Button type="button" variant="outline" size="sm" disabled={disabled || rows.length >= 16} onClick={onAdd}>
        {uiT("ui.9ebed1fa5178cba4")}
      </Button>
      <p className="text-xs text-muted-foreground">{uiT("ui.90f4294f1bcd5262")}</p>
    </div>
  );
}
