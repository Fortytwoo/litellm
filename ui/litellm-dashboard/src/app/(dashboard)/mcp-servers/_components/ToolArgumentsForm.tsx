"use client";
import { translateText } from "@/i18n";

import { t as translateUi } from "@/i18n";

import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import React from "react";
import { useForm, type Control } from "react-hook-form";
import { CircleHelp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { FieldGroup } from "@/components/ui/field";
import { FormField, type FormFieldControlProps } from "@/components/shared/form/FormField";
import { UiLoadingSpinner } from "@/components/ui/ui-loading-spinner";
import type { InputSchemaProperty } from "@/components/mcp_tools/types";
import {
  ToolArgumentField,
  ToolArgumentsFormValues,
  buildToolCallArguments,
  initialArgumentValues,
  resolveSchemaProperty,
  toolArgumentsResolver,
} from "./toolCallArguments";

const argumentLabel = (field: ToolArgumentField): React.ReactNode => (
  <span className="flex items-center">
    {field.key}
    {field.required && <span className="ml-1 text-destructive">*</span>}
    {field.prop.description && (
      <Tooltip>
        <TooltipTrigger render={<CircleHelp className="ml-2 size-3.5 shrink-0 cursor-help text-muted-foreground" />} />
        <TooltipContent>{field.prop.description}</TooltipContent>
      </Tooltip>
    )}
  </span>
);

const BOOLEAN_ITEMS = [
  {
    value: true,
    get label() {
      return translateUi("ui.3cbc87c7681f34db");
    },
  },
  {
    value: false,
    get label() {
      return translateUi("ui.60a33e6cf5151f2d");
    },
  },
];

const booleanTitle = (value: unknown): string | undefined => {
  if (value === true) return "True";
  if (value === false) return "False";
  return undefined;
};

const JsonArgumentControl: React.FC<{
  field: ToolArgumentField;
  prop: InputSchemaProperty;
  control: FormFieldControlProps<ToolArgumentsFormValues, `args.${number}`>;
}> = ({ field, prop, control }) => {
  const { t: uiT } = useDashboardLanguage();

  const isObject = prop.type === "object";
  const fallbackPlaceholder = isObject ? `Enter JSON object for ${field.key}` : `Enter JSON array for ${field.key}`;
  return (
    <div className="space-y-2">
      <Textarea
        {...control}
        rows={isObject ? 6 : 4}
        value={(control.value as string) ?? ""}
        placeholder={prop.description || fallbackPlaceholder}
        spellCheck={false}
        data-testid={`textarea-${field.key}`}
        className="rounded-lg font-mono"
      />
      <p className="text-xs text-muted-foreground">
        {isObject ? uiT("ui.d30a814b01ef597a") : uiT("ui.455a372ce8be03fe")}
      </p>
    </div>
  );
};

const ToolArgumentControl: React.FC<{
  field: ToolArgumentField;
  control: FormFieldControlProps<ToolArgumentsFormValues, `args.${number}`>;
}> = ({ field, control }) => {
  const { t: uiT } = useDashboardLanguage();

  const prop = resolveSchemaProperty(field.prop);

  if (prop.type === "string" && prop.enum) {
    return (
      <select
        {...control}
        value={control.value == null ? -1 : prop.enum.indexOf(String(control.value))}
        onChange={(event) => control.onChange(prop.enum?.[Number(event.target.value)] ?? null)}
        className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-colors focus:border-ring focus:ring-3 focus:ring-ring/50 focus:outline-hidden"
      >
        <option value={-1} disabled={field.required}>
          {uiT("ui.2a78025de6aa")} {field.key}
        </option>
        {prop.enum.map((option, index) => (
          <option key={option} value={index}>
            {option === "" ? uiT("ui.fae5b9633566de0d") : option}
          </option>
        ))}
      </select>
    );
  }

  if (prop.type === "number" || prop.type === "integer") {
    return (
      <Input
        {...control}
        type="number"
        step={prop.type === "integer" ? 1 : "any"}
        value={(control.value as number | string) ?? ""}
        placeholder={prop.description || uiT("ui.43e95aa600c4c9a9", { v0: String(field.key) })}
        className="rounded-lg"
      />
    );
  }

  if (prop.type === "boolean") {
    return (
      <Select
        items={
          field.required
            ? BOOLEAN_ITEMS
            : [{ value: null, label: uiT("ui.58661820dfdc4c9f", { v0: String(field.key) }) }, ...BOOLEAN_ITEMS]
        }
        value={control.value ?? null}
        onValueChange={control.onChange}
      >
        <SelectTrigger
          id={control.id}
          aria-invalid={control["aria-invalid"]}
          title={booleanTitle(control.value)}
          className="w-full"
        >
          <SelectValue placeholder={uiT("ui.58661820dfdc4c9f", { v0: String(field.key) })} />
        </SelectTrigger>
        <SelectContent>
          {!field.required && (
            <SelectItem value={null}>
              {uiT("ui.2a78025de6aa")} {field.key}
            </SelectItem>
          )}
          <SelectItem value={true}>{uiT("ui.3cbc87c7681f34db")}</SelectItem>
          <SelectItem value={false}>{uiT("ui.60a33e6cf5151f2d")}</SelectItem>
        </SelectContent>
      </Select>
    );
  }

  if (prop.type === "object" || prop.type === "array") {
    return <JsonArgumentControl field={field} prop={prop} control={control} />;
  }

  return (
    <Input
      {...control}
      value={(control.value as string) ?? ""}
      placeholder={prop.description || uiT("ui.43e95aa600c4c9a9", { v0: String(field.key) })}
      className="rounded-lg"
    />
  );
};

const ToolArgumentFields: React.FC<{
  fields: readonly ToolArgumentField[];
  control: Control<ToolArgumentsFormValues>;
  singleInputFallback: boolean;
}> = ({ fields, control, singleInputFallback }) => {
  const { t: uiT } = useDashboardLanguage();

  if (singleInputFallback) {
    return (
      <FieldGroup>
        <FormField
          control={control}
          name="args.0"
          label={
            <span>
              {uiT("ui.36ecb4f86691")} <span className="text-destructive">*</span>
            </span>
          }
        >
          {(field) => (
            <Input
              {...field}
              value={(field.value as string) ?? ""}
              placeholder={uiT("ui.5469ad745c4b31c5")}
              className="rounded-lg"
            />
          )}
        </FormField>
      </FieldGroup>
    );
  }

  if (fields.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-muted py-6 text-center">
        <div className="mx-auto max-w-sm">
          <h4 className="mb-1 text-sm font-medium text-foreground">{uiT("ui.0048e1a96c17c7bc")}</h4>
          <p className="text-xs text-muted-foreground">{uiT("ui.38ed28f933229066")}</p>
        </div>
      </div>
    );
  }

  return (
    <FieldGroup>
      {fields.map((field, index) => (
        <FormField
          key={`${field.key}-${index}`}
          control={control}
          name={`args.${index}` as const}
          label={argumentLabel(field)}
        >
          {(itemControl) => <ToolArgumentControl field={field} control={itemControl} />}
        </FormField>
      ))}
    </FieldGroup>
  );
};

const callButtonLabel = (isLoading: boolean, hasRun: boolean): string => {
  if (isLoading) return "Calling Tool...";
  return hasRun ? "Call Again" : "Call Tool";
};

export const ToolArgumentsForm: React.FC<{
  fields: readonly ToolArgumentField[];
  singleInputFallback: boolean;
  isLoading: boolean;
  hasRun: boolean;
  onRun: (args: Record<string, unknown>) => void;
}> = ({ fields, singleInputFallback, isLoading, hasRun, onRun }) => {
  useDashboardLanguage();

  const form = useForm<ToolArgumentsFormValues>({
    defaultValues: { args: initialArgumentValues(fields) },
    resolver: toolArgumentsResolver(fields),
  });

  const submit = form.handleSubmit((values) => onRun(buildToolCallArguments(fields, values.args)));

  return (
    <TooltipProvider>
      <form onSubmit={submit} className="space-y-3">
        <ToolArgumentFields fields={fields} control={form.control} singleInputFallback={singleInputFallback} />

        <div className="border-t border-border pt-3">
          <Button
            type="button"
            onClick={() => void submit()}
            disabled={isLoading}
            aria-busy={isLoading}
            className="w-full"
          >
            {isLoading && <UiLoadingSpinner className="size-4" />}
            {translateText(callButtonLabel(isLoading, hasRun))}
          </Button>
        </div>
      </form>
    </TooltipProvider>
  );
};
