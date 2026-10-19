"use client";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";

import { useId } from "react";
import { Plus, X } from "lucide-react";
import { useFieldArray, useFormContext, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { InvestigationInput } from "../investigationSchema";
import type { ScopeOptions } from "../useMatchingActivity";

export function MetadataFilters({ attributes, keys }: Pick<ScopeOptions, "attributes" | "keys">) {
  const { t: uiT } = useDashboardLanguage();

  const id = useId();
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<InvestigationInput>();
  const { fields, append, remove } = useFieldArray({ control, name: "selection.filters", keyName: "fieldId" });
  const filters = useWatch({ control, name: "selection.filters" });
  return (
    <>
      {fields.map((field, index) => (
        <div key={field.fieldId} className="space-y-2">
          <div className="flex gap-2">
            <Input
              {...register(`selection.filters.${index}.key`)}
              aria-label={uiT("ui.fff1c2a7d05cf78e", { v0: String(index + 1) })}
              list={`${id}-keys`}
              placeholder={uiT("ui.6ed06b931f6bcb7e")}
            />
            <Button
              variant="ghost"
              size="icon"
              aria-label={uiT("ui.682e0cfb4d89b075", { v0: String(index + 1) })}
              onClick={() => remove(index)}
            >
              <X className="size-4" />
            </Button>
          </div>
          {errors.selection?.filters?.[index]?.key?.message && (
            <p role="alert" className="text-sm text-destructive">
              {errors.selection.filters[index].key.message}
            </p>
          )}
          <Input
            {...register(`selection.filters.${index}.value`)}
            aria-label={uiT("ui.7ae1bd72bcf1eacd", { v0: String(index + 1) })}
            list={`${id}-values-${index}`}
            placeholder={uiT("ui.f939ae3d30c69e33")}
          />
          {errors.selection?.filters?.[index]?.value?.message && (
            <p role="alert" className="text-sm text-destructive">
              {errors.selection.filters[index].value.message}
            </p>
          )}
          <datalist id={`${id}-values-${index}`}>
            {[...new Set(attributes.filter((a) => a.key === filters[index].key).map((a) => a.value))]
              .sort()
              .map((v) => (
                <option key={v} value={v} />
              ))}
          </datalist>
        </div>
      ))}
      <datalist id={`${id}-keys`}>
        {keys.map((key) => (
          <option key={key} value={key} />
        ))}
      </datalist>
      <Button variant="outline" size="sm" disabled={filters.length >= 8} onClick={() => append({ key: "", value: "" })}>
        <Plus className="size-3" /> {uiT("ui.60a0d83510ea99a1")}
      </Button>
    </>
  );
}
