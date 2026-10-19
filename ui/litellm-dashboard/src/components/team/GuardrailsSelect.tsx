"use client";
import { t as translateUi } from "@/i18n";

import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";

import { Globe } from "lucide-react";
import React, { useState } from "react";

import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxItem,
  ComboboxLabel,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from "@/components/ui/combobox";

export interface GuardrailOption {
  name: string;
  disabled: boolean;
}

interface GuardrailGroup {
  label: string;
  icon: boolean;
  items: GuardrailOption[];
}

interface GuardrailsSelectProps {
  id?: string;
  value: string[];
  onValueChange: (value: string[]) => void;
  globalGuardrails: readonly GuardrailOption[];
  otherGuardrails: readonly GuardrailOption[];
  globalGuardrailNames: ReadonlySet<string>;
  placeholder?: string;
  emptyText?: string;
}

const matchesQuery = (option: GuardrailOption, query: string): boolean =>
  option.name.toLowerCase().includes(query.trim().toLowerCase());

export const GuardrailsSelect: React.FC<GuardrailsSelectProps> = ({
  id,
  value,
  onValueChange,
  globalGuardrails,
  otherGuardrails,
  globalGuardrailNames,
  placeholder = translateUi("ui.2a6961064d004427"),
  emptyText = translateUi("ui.8cdd5f5fbb0f2781"),
}) => {
  const { t: uiT } = useDashboardLanguage();

  const anchor = useComboboxAnchor();
  const [query, setQuery] = useState("");

  const known = [...globalGuardrails, ...otherGuardrails];
  const selected = value.map((name) => known.find((option) => option.name === name) ?? { name, disabled: false });
  const grouped = globalGuardrails.length > 0 && otherGuardrails.length > 0;
  const groups: GuardrailGroup[] = grouped
    ? [
        { label: uiT("ui.a258b30f88c30650"), icon: true, items: [...globalGuardrails] },
        { label: uiT("ui.f97e9da0e3b879f0"), icon: false, items: [...otherGuardrails] },
      ]
    : [{ label: "", icon: false, items: known }];

  return (
    <Combobox
      multiple
      items={groups}
      value={selected}
      onValueChange={(next: GuardrailOption[]) => {
        setQuery("");
        onValueChange(next.map((option) => option.name));
      }}
      inputValue={query}
      onInputValueChange={setQuery}
      isItemEqualToValue={(option: GuardrailOption, other: GuardrailOption) => option.name === other.name}
      itemToStringLabel={(option: GuardrailOption) => option.name}
      filter={matchesQuery}
      openOnInputClick
    >
      <ComboboxChips render={<div ref={anchor} />} className="min-h-8 py-1 text-sm">
        <ComboboxValue>
          {(chips: GuardrailOption[]) => (
            <>
              {chips.map((option) => (
                <ComboboxChip key={option.name} aria-label={option.name}>
                  {globalGuardrailNames.has(option.name) && (
                    <Globe className="size-3" aria-label={uiT("ui.cdd8465f91f95cb1")} />
                  )}
                  {option.name}
                </ComboboxChip>
              ))}
              <ComboboxChipsInput id={id} placeholder={placeholder} className="min-w-24" aria-label={placeholder} />
            </>
          )}
        </ComboboxValue>
      </ComboboxChips>
      <ComboboxContent anchor={anchor}>
        <ComboboxEmpty>{emptyText}</ComboboxEmpty>
        <ComboboxList>
          {(group: GuardrailGroup) => (
            <ComboboxGroup key={group.label} items={group.items}>
              {group.label !== "" && (
                <ComboboxLabel>
                  {group.icon ? <Globe className="mr-1 inline size-3" aria-hidden="true" /> : null}
                  {group.label}
                </ComboboxLabel>
              )}
              <ComboboxCollection>
                {(option: GuardrailOption) => (
                  <ComboboxItem
                    key={option.name}
                    value={option}
                    title={option.name}
                    disabled={option.disabled}
                    aria-label={option.name}
                  >
                    {option.name}
                  </ComboboxItem>
                )}
              </ComboboxCollection>
            </ComboboxGroup>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
};

export default GuardrailsSelect;
