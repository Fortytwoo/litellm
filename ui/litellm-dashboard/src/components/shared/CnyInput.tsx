"use client";

import { useState, type ChangeEvent, type ComponentProps } from "react";
import { Input } from "@/components/ui/input";
import { cnyToUsd, usdToCny } from "@/utils/currency";

interface CnyInputProps extends Omit<ComponentProps<typeof Input>, "value" | "onChange"> {
  readonly usdValue: number | string | null | undefined;
  readonly onUsdChange: (value: number | null) => void;
}

export function CnyInput({ usdValue, onUsdChange, onBlur, ...props }: CnyInputProps) {
  const [draft, setDraft] = useState<string | null>(null);
  const display = usdValue == null || usdValue === "" ? "" : String(usdToCny(Number(usdValue)));
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const typed = event.target.value;
    setDraft(typed);
    const amount = Number(typed);
    onUsdChange(typed.trim() === "" || !Number.isFinite(amount) ? null : cnyToUsd(amount));
  };
  return (
    <Input
      {...props}
      value={draft ?? display}
      onChange={handleChange}
      onBlur={(event) => {
        setDraft(null);
        onBlur?.(event);
      }}
    />
  );
}
