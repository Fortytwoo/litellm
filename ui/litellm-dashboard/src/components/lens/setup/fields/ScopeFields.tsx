"use client";
import { translateText } from "@/i18n";

import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";

import { useState } from "react";
import { Controller, useFormContext, useWatch } from "react-hook-form";
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty,
} from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import type { InvestigationInput } from "../investigationSchema";
import type { ScopeOptions } from "../useMatchingActivity";

import { MetadataFilters } from "./MetadataFilters";

const selectClass = "h-9 w-full rounded-md border border-input bg-background px-3 text-sm";

export function ScopeFields({ names, agentsLoading, agentsError, retryAgents, attributes, keys }: ScopeOptions) {
  const { t: uiT } = useDashboardLanguage();

  const { control, register, setValue } = useFormContext<InvestigationInput>();
  const selection = useWatch({ control, name: "selection" });
  const filters = selection.filters ?? [];
  const hasOptionalScope = !!selection.team_id || !!selection.service;
  const showAdvancedByDefault = !!selection.filters.length || hasOptionalScope || selection.source !== "traces";
  const [advanced, setAdvanced] = useState(showAdvancedByDefault);
  const nameFieldName = selection.source === "requests" ? "selection.service" : "selection.agent_name";
  const selectedName = selection.source === "requests" ? selection.service : selection.agent_name;
  const nameLabel = selection.source === "requests" ? "Model group (optional)" : "Agent (optional)";
  return (
    <>
      <label className="grid gap-2 text-sm font-medium">
        {translateText(nameLabel)}
        <Controller
          control={control}
          name={nameFieldName}
          render={({ field }) => (
            <Combobox
              items={names}
              value={field.value || null}
              inputValue={field.value ?? ""}
              onInputValueChange={field.onChange}
              onValueChange={(name) => field.onChange(name ?? "")}
            >
              <ComboboxInput
                aria-label={nameLabel}
                placeholder={selection.source === "requests" ? uiT("ui.7103bde4de78291b") : uiT("ui.ba1f7a6fae5c215c")}
                showClear={!!selectedName}
                className="w-full h-9"
              />
              <ComboboxContent>
                <ComboboxEmpty>{agentsLoading ? uiT("ui.ae0c1414f42139ce") : uiT("ui.430adbc60a757d5a")}</ComboboxEmpty>
                <ComboboxList>
                  {(name: string) => (
                    <ComboboxItem key={name} value={name}>
                      {name}
                    </ComboboxItem>
                  )}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
          )}
        />
      </label>
      {selection.source !== "requests" && agentsError && (
        <p role="alert" className="text-sm text-destructive">
          {uiT("ui.7b7efce48734877a")}{" "}
          <button type="button" className="underline" onClick={retryAgents}>
            {uiT("ui.942087cc2d41e013")}
          </button>
        </p>
      )}
      <details open={advanced} onToggle={(event) => setAdvanced(event.currentTarget.open)} className="group">
        <summary className="cursor-pointer text-sm font-medium">
          {uiT("ui.db332598745d584e")}
          {filters.length ? ` (${filters.length})` : ""}
        </summary>
        <div className="mt-4 space-y-4">
          {selection.source !== "requests" && (
            <label className="grid gap-2 text-sm">
              {uiT("ui.84f0efc13ab2d6fd")}
              <Input {...register("selection.service")} placeholder={uiT("ui.3b90503da5c77729")} />
            </label>
          )}
          <label className="grid gap-2 text-sm">
            {uiT("ui.233924393e2f6bc6")}
            <select
              {...register("selection.source", {
                onChange: () => {
                  setValue("selection.service", "");
                  setValue("selection.agent_name", "");
                  setValue("selection.filters", []);
                },
              })}
              className={selectClass}
            >
              <option value="traces">{uiT("ui.34b303f1b6b90e9b")}</option>
              <option value="requests">{uiT("ui.241b3307b2900007")}</option>
              <option value="both">{uiT("ui.b642fb27f5eca31f")}</option>
            </select>
          </label>
          <p className="text-xs leading-5 text-muted-foreground">{uiT("ui.9b2b2a180ab029f6")}</p>
          <MetadataFilters attributes={attributes} keys={keys} />
          <label className="grid gap-2 text-sm">
            {uiT("ui.605fa930c5ca9af0")}
            <Input {...register("selection.team_id")} placeholder={uiT("ui.e8c0a21be6e276ba")} />
          </label>
        </div>
      </details>
    </>
  );
}
