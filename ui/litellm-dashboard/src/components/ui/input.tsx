"use client";

import * as React from "react";
import { CurrencyFieldContext } from "@/components/shared/form/CurrencyFieldContext";

import { cn } from "@/lib/cva.config";

const numericValue = (value: React.ComponentProps<"input">["value"]) => {
  if (typeof value !== "string" || value.trim() === "") return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : value;
};

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    const currencyField = React.useContext(CurrencyFieldContext);
    const [draft, setDraft] = React.useState<string | null>(null);
    const currencyNumber = currencyField && type === "number";
    const displayValue = currencyField ? draft ?? props.value : props.value;
    const value = currencyNumber ? numericValue(displayValue) : displayValue;
    return (
      <input
        type={type}
        data-slot="input"
        className={cn(
          "h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none selection:bg-primary selection:text-primary-foreground file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30",
          "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
          "aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
          className,
        )}
        ref={ref}
        {...props}
        value={value}
        step={currencyNumber ? "any" : props.step}
        onChange={(event) => {
          if (currencyField) setDraft(event.target.value);
          props.onChange?.(event);
        }}
        onBlur={(event) => {
          setDraft(null);
          props.onBlur?.(event);
        }}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
