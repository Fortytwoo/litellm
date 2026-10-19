"use client";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import { t as translateUi } from "@/i18n";
import { CircleMinus, Info, Plus } from "lucide-react";
import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SimpleTooltip } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { useFieldArray, useFormContext, useWatch } from "react-hook-form";

import {
  MountedFormField,
  useMountedName,
  type MountedFormValues,
} from "@/components/common_components/MountedFormField";
import { requiredRule } from "@/components/common_components/formRules";
import { matchesPattern, selectControl, selectTriggerControl, textControl } from "./mcpFieldRules";
import { listControl } from "./mcpFormStore";

const SCOPE_OPTIONS = [
  {
    value: "global",
    get label() {
      return translateUi("ui.425f233626b3cd02");
    },
  },
  {
    value: "user",
    get label() {
      return translateUi("ui.a6bb6180e1bf41da");
    },
  },
];

const VARIABLE_NAME_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/;

/**
 * Form section for admin-configured MCP environment variables.
 *
 * Each row has: name | value | scope. Variables can be interpolated into
 * Static Headers via ${NAME}. ``scope=global`` (shown as "Instance") values
 * are used as-is. ``scope=user`` (shown as "Per-user") values are filled in
 * by each user via the MCP Gateway dashboard.
 *
 * The parent form reads the ``env_vars`` field from the form values.
 */
const EnvVarsSection: React.FC = () => {
  const { t: uiT } = useDashboardLanguage();

  const { control } = useFormContext<MountedFormValues>();
  const { fields, append, remove } = useFieldArray({ control: listControl(control), name: "env_vars" });
  useMountedName("env_vars");

  return (
    <div className="rounded-lg border border-border bg-muted p-4">
      <div className="flex items-center gap-2 mb-1">
        <strong className="text-sm font-semibold">{uiT("ui.02db55bac5e3f7ce")}</strong>
        <SimpleTooltip
          content={
            <>
              {uiT("ui.95103d9bfb0e5ab7")} <code>{"${VAR_NAME}"}</code>. <br />
              <b>{uiT("ui.425f233626b3cd02")}</b>
              {uiT("ui.0404962da6234300")}
              <br />
              <b>{uiT("ui.a6bb6180e1bf41da")}</b>
              {uiT("ui.25e566fd6e0d9174")}
            </>
          }
        >
          <Info className="size-4 text-info hover:text-info/80 cursor-help" />
        </SimpleTooltip>
      </div>
      <span className="mb-3 block text-xs text-muted-foreground">
        {uiT("ui.3c1b6944418849c8")} <code>{"${VAR_NAME}"}</code>
        {uiT("ui.18ab2178bc27b124")}{" "}
        <code className="bg-card px-1 rounded-sm border border-border">
          {"${DB_PROTOCOL}://${CORP_USERNAME}:${CORP_PASSWORD}@${DB_HOSTNAME}"}
        </code>
      </span>

      <div className="space-y-2">
        {fields.length > 0 && (
          <div className="flex gap-3 px-1 text-xs font-medium text-muted-foreground uppercase tracking-wide">
            <div style={{ flex: 1 }}>{uiT("ui.27c2ee03484204e4")}</div>
            <div style={{ flex: 1 }}>{uiT("ui.5cc784a57d905108")}</div>
            <div style={{ width: 160 }}>{uiT("ui.b073f6c68ef87211")}</div>
            <div style={{ width: 24 }} />
          </div>
        )}
        {fields.map((item, index) => (
          <div key={item.id} className="flex gap-3 items-start">
            <MountedFormField
              name={["env_vars", String(index), "name"]}
              className="mb-0 flex-1"
              rules={{
                validate: {
                  required: requiredRule("Variable name is required"),
                  pattern: matchesPattern(
                    VARIABLE_NAME_PATTERN,
                    "Use letters, digits, underscores; cannot start with a digit.",
                  ),
                },
              }}
            >
              {(control) => (
                <Input
                  {...textControl(control)}
                  placeholder={uiT("ui.d120d9a9aab29f16")}
                  className="rounded-md font-mono"
                />
              )}
            </MountedFormField>
            <div style={{ flex: 1 }}>
              <ScopedValueOrDescription index={index} />
            </div>
            <MountedFormField name={["env_vars", String(index), "scope"]} className="mb-0 w-40" defaultValue="global">
              {(control) => (
                <Select {...selectControl<string>(control)} items={SCOPE_OPTIONS}>
                  <SelectTrigger {...selectTriggerControl(control)} className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SCOPE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </MountedFormField>
            <div style={{ width: 24, height: 32 }} className="flex items-center justify-center">
              <CircleMinus
                onClick={() => remove(index)}
                className="size-4 text-muted-foreground hover:text-destructive cursor-pointer"
              />
            </div>
          </div>
        ))}
        <Button variant="outline" className="w-full border-dashed" onClick={() => append({ scope: "global" })}>
          <Plus />
          {uiT("ui.f95fcf61a86350ab")}
        </Button>
      </div>
    </div>
  );
};

// For instance-scoped vars this column holds the admin value. For per-user
// vars the value comes from each user later, so the column instead captures an
// optional description that the per-user fill-in modal shows as a hint.
const ScopedValueOrDescription: React.FC<{ index: number }> = ({ index }) => {
  const { t: uiT } = useDashboardLanguage();

  const isPerUser = useWatch({ name: `env_vars.${index}.scope` }) === "user";
  if (isPerUser) {
    return (
      <MountedFormField name={["env_vars", String(index), "description"]} className="mb-0">
        {(control) => (
          <InputGroup>
            <InputGroupAddon>
              <SimpleTooltip content={uiT("ui.430d4a5300170c56")}>
                <span className="text-xs text-muted-foreground cursor-help whitespace-nowrap">
                  <Info className="mr-1 inline size-3 align-text-bottom" />
                  {uiT("ui.a7b4cf9f7e429771")}
                </span>
              </SimpleTooltip>
            </InputGroupAddon>
            <InputGroupInput
              {...textControl(control)}
              placeholder={uiT("ui.c50b4e93e4ce51fc")}
              className="text-muted-foreground"
            />
          </InputGroup>
        )}
      </MountedFormField>
    );
  }
  return (
    <MountedFormField name={["env_vars", String(index), "value"]} className="mb-0">
      {(control) => (
        <Input {...textControl(control)} placeholder={uiT("ui.daadd3b4d8978797")} className="rounded-md font-mono" />
      )}
    </MountedFormField>
  );
};

export default EnvVarsSection;
