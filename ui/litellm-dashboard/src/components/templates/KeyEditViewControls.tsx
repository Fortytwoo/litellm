"use client";
import { LocalizedText } from "@/contexts/LanguageContext";

import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import { t as translateUi } from "@/i18n";
import React from "react";
import { Button } from "@/components/ui/button";
import { UiLoadingSpinner } from "@/components/ui/ui-loading-spinner";
import { Control, UseFormReturn } from "react-hook-form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { CircleHelp } from "lucide-react";
import { FormField } from "@/components/shared/form/FormField";
import { toast } from "@/lib/toast";
import AgentSelector from "../agent_management/AgentSelector";
import RateLimitTypeFormItem from "../common_components/RateLimitTypeFormItem";
import NumericalInput from "../shared/numerical_input";
import SkillSelector from "../skills/SkillSelector";
import { moveTagsOutOfMetadataJson } from "./keyEditFieldNormalizers";
import { AgentsAndGroups, KeyEditFormValues } from "./keyEditFormValues";

export const labelWithHint = (label: React.ReactNode, hint: string): React.ReactNode => (
  <>
    <LocalizedText>{label}</LocalizedText>
    <Tooltip>
      <TooltipTrigger render={<CircleHelp className="size-3.5 shrink-0 cursor-help text-muted-foreground" />} />
      <TooltipContent className="max-w-xs">
        <LocalizedText>{hint}</LocalizedText>
      </TooltipContent>
    </Tooltip>
  </>
);

const KEY_TYPE_OPTIONS = [
  {
    value: "default",
    get label() {
      return translateUi("ui.1d36da8581e0");
    },
    get hint() {
      return translateUi("ui.2bc65f06c7b55ec0");
    },
  },
  {
    value: "llm_api",
    get label() {
      return translateUi("ui.d2abdaa27ce8");
    },
    get hint() {
      return translateUi("ui.dd6ebc488d6f849b");
    },
  },
  {
    value: "management",
    get label() {
      return translateUi("ui.e51248773b9a");
    },
    get hint() {
      return translateUi("ui.ff3df0ecc8db7171");
    },
  },
];

export const KeyTypeSelect = ({
  id,
  value,
  onChange,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
}) => {
  const { t: uiT } = useDashboardLanguage();
  return (
    <Select
      items={Object.fromEntries(KEY_TYPE_OPTIONS.map((option) => [option.value, option.label]))}
      value={value}
      onValueChange={(next: string | null) => next != null && onChange(next)}
    >
      <SelectTrigger id={id} className="w-full">
        <SelectValue placeholder={uiT("ui.4d9158f200f3")} />
      </SelectTrigger>
      <SelectContent>
        {KEY_TYPE_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            <div className="py-1">
              <div className="font-medium">{option.label}</div>
              <div className="mt-0.5 text-[11px] text-muted-foreground">{option.hint}</div>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

const SKILLS_HINT =
  "Enabled skills are visible to every key. Grant disabled (private) Claude Code plugins to this key here.";

const TPD_HINT =
  "Daily token budget for batch submissions (/v1/batches). When set, batch input files are charged against this 24h window instead of the key's TPM/RPM limits. Online requests keep using TPM/RPM.";

export const KeyRateLimitFields = ({ control }: { control: Control<KeyEditFormValues> }) => {
  const { t: uiT } = useDashboardLanguage();
  return (
    <>
      <FormField control={control} name="tpm_limit" label={uiT("ui.703406a2fc47")}>
        {({ ref: _ref, ...field }) => <NumericalInput {...field} value={field.value ?? ""} min={0} />}
      </FormField>

      <FormField control={control} name="tpm_limit_type">
        {({ value, onChange, id }) => (
          <RateLimitTypeFormItem
            id={id}
            type="tpm"
            name="tpm_limit_type"
            showDetailedDescriptions={false}
            value={value as string | null}
            onChange={onChange}
          />
        )}
      </FormField>

      <FormField control={control} name="rpm_limit" label={uiT("ui.e543e799b809")}>
        {({ ref: _ref, ...field }) => <NumericalInput {...field} value={field.value ?? ""} min={0} />}
      </FormField>

      <FormField control={control} name="rpm_limit_type">
        {({ value, onChange, id }) => (
          <RateLimitTypeFormItem
            id={id}
            type="rpm"
            name="rpm_limit_type"
            showDetailedDescriptions={false}
            value={value as string | null}
            onChange={onChange}
          />
        )}
      </FormField>

      <FormField control={control} name="tpd_limit" label={labelWithHint("TPD Limit (batch)", TPD_HINT)}>
        {({ ref: _ref, ...field }) => <NumericalInput {...field} value={field.value ?? ""} min={0} />}
      </FormField>
    </>
  );
};

export const KeyAgentAndSkillFields = ({
  control,
  accessToken,
}: {
  control: Control<KeyEditFormValues>;
  accessToken: string;
}) => {
  const { t: uiT } = useDashboardLanguage();
  return (
    <>
      <FormField control={control} name="agents_and_groups" label={uiT("ui.c51b5b533820")}>
        {({ value, onChange }) => (
          <AgentSelector
            onChange={onChange}
            value={value as AgentsAndGroups | undefined}
            accessToken={accessToken}
            placeholder={uiT("ui.3c8350c1d0ba")}
          />
        )}
      </FormField>

      <FormField control={control} name="skills" label={labelWithHint("Skills", SKILLS_HINT)}>
        {({ value, onChange }) => (
          <SkillSelector onChange={onChange} value={value as string[] | undefined} accessToken={accessToken} />
        )}
      </FormField>
    </>
  );
};

type KeyEditForm = Pick<
  UseFormReturn<KeyEditFormValues, unknown, KeyEditFormValues>,
  "control" | "getValues" | "setValue"
>;

export const moveMetadataTagsToTagsField = (form: KeyEditForm): void => {
  const moved = moveTagsOutOfMetadataJson(form.getValues("metadata"), form.getValues("tags"));
  if (moved === null) return;
  form.setValue("metadata", moved.metadata, { shouldDirty: true });
  form.setValue("tags", moved.tags, { shouldDirty: true });
  if (moved.movedTags.length > 0) {
    toast.info(translateUi("ui.64fd054fe61db8b3", undefined, { v0: String(moved.movedTags.join(", ")) }));
  }
};

export const KeyMetadataField = ({ form }: { form: KeyEditForm }) => {
  const { t: uiT } = useDashboardLanguage();
  return (
    <FormField
      control={form.control}
      name="metadata"
      label={uiT("ui.9eddf573cb50")}
      description={uiT("ui.5afeacecb2b0")}
    >
      {(field) => (
        <Textarea
          {...field}
          value={(field.value as string | undefined) ?? ""}
          rows={10}
          onBlur={() => {
            field.onBlur();
            moveMetadataTagsToTagsField(form);
          }}
        />
      )}
    </FormField>
  );
};

export const KeyBudgetNumberField = ({
  control,
  name,
  label,
  placeholder,
}: {
  control: Control<KeyEditFormValues>;
  name: "max_budget" | "soft_budget";
  label: string;
  placeholder: string;
}) => (
  <FormField control={control} name={name} label={label}>
    {({ ref: _ref, ...field }) => (
      <NumericalInput
        {...field}
        value={field.value ?? ""}
        step={0.01}
        style={{ width: "100%" }}
        placeholder={placeholder}
      />
    )}
  </FormField>
);

export function KeyEditActions({ onCancel, isKeySaving }: { onCancel: () => void; isKeySaving: boolean }) {
  const { t: uiT } = useDashboardLanguage();
  return (
    <div className="sticky z-chrome bg-background p-4 border-t border-border -bottom-6 -inset-x-6">
      <div className="flex justify-end items-center gap-2">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isKeySaving}>
          {uiT("ui.19766ed6ccb2")}
        </Button>
        <Button type="submit" disabled={isKeySaving} aria-busy={isKeySaving}>
          {isKeySaving && <UiLoadingSpinner className="size-4" />}
          {uiT("ui.35322b5bb5a2")}
        </Button>
      </div>
    </div>
  );
}
