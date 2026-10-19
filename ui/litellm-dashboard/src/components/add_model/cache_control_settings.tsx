"use client";
import { translateText } from "@/i18n";

import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import { t as translateUi } from "@/i18n";
import { CircleHelp, Minus, Plus } from "lucide-react";
import React from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import NumericalInput from "../shared/numerical_input";

export const CACHE_CONTROL_LABEL = "Cache Control Injection Points";

export const CACHE_CONTROL_TOOLTIP =
  "Tell litellm where to inject cache control checkpoints. You can specify either by role (to apply to all messages of that role) or by specific message index.";

export const CACHE_CONTROL_DESCRIPTION =
  "Providers like Anthropic, Bedrock API require users to specify where to inject cache control checkpoints, litellm can automatically add them for you as a cost saving feature.";

export const CACHE_CONTROL_ROLE_HINT = "LiteLLM will mark all messages of this role as cacheable";

export const CACHE_CONTROL_INDEX_HINT = "(Optional) If set litellm will mark the message at this index as cacheable";

export type CacheControlRole = "user" | "system" | "assistant";

export interface CacheControlInjectionPoint {
  location: "message";
  role?: CacheControlRole;
  index?: string | number;
}

export const NEW_CACHE_CONTROL_POINT: CacheControlInjectionPoint = { location: "message" };

const LOCATION_ITEMS = [
  {
    value: "message",
    get label() {
      return translateUi("ui.2f77668a9dfbf8d5");
    },
  },
] as const;

const ROLE_ITEMS = [
  {
    value: "user",
    get label() {
      return translateUi("ui.b512d97e7cbf");
    },
  },
  {
    value: "system",
    get label() {
      return translateUi("ui.6725e7bbcd28f3a8");
    },
  },
  {
    value: "assistant",
    get label() {
      return translateUi("ui.391e405152779acc");
    },
  },
] as const;

const LabelWithHint: React.FC<{ label: string; hint: string }> = ({ label, hint }) => {
  const { t: uiT } = useDashboardLanguage();
  return (
    <div className="flex items-center">
      <Label>{label}</Label>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger
            render={
              <button
                type="button"
                aria-label={uiT("ui.b9f4a133392f71cb", { v0: String(label) })}
                className="ml-1 inline-flex cursor-help items-center rounded-sm text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            }
          >
            <CircleHelp aria-hidden className="size-4" />
          </TooltipTrigger>
          <TooltipContent className="max-w-xs whitespace-normal">{hint}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

interface CacheControlInjectionPointsProps {
  value?: CacheControlInjectionPoint[];
  onChange?: (points: CacheControlInjectionPoint[]) => void;
}

/**
 * Editor for `cache_control_injection_points`. It holds no form state of its own so that an antd
 * `Form.Item` and a react-hook-form `FormField` can each host it while their pages migrate
 * independently; both hand a child exactly `value` and `onChange`.
 */
const CacheControlInjectionPoints: React.FC<CacheControlInjectionPointsProps> = ({ value, onChange }) => {
  const { t: uiT } = useDashboardLanguage();

  const points = value ?? [];

  const replaceAt = (index: number, point: CacheControlInjectionPoint) =>
    onChange?.(points.map((existing, position) => (position === index ? point : existing)));

  return (
    <div className="ml-6 border-l-2 border-border pl-4">
      <p className="mb-4 block text-sm text-muted-foreground">{translateText(CACHE_CONTROL_DESCRIPTION)}</p>

      {points.map((point, index) => (
        <div key={index} className="mb-4 flex items-end gap-4">
          <div className="w-[180px] space-y-1">
            <Label>{uiT("ui.baaddf70fb5d")}</Label>
            <Select items={LOCATION_ITEMS} value={point.location} disabled>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LOCATION_ITEMS.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-[180px] space-y-1">
            <LabelWithHint label={uiT("ui.14736a2eb9f4")} hint={CACHE_CONTROL_ROLE_HINT} />
            <Select
              items={ROLE_ITEMS}
              value={point.role ?? null}
              onValueChange={(selected) =>
                replaceAt(index, { ...point, role: (selected as CacheControlRole | null) ?? undefined })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={uiT("ui.977844fd4358f110")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>{uiT("ui.dc937b598926")}</SelectItem>
                {ROLE_ITEMS.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-[180px] space-y-1">
            <LabelWithHint label={uiT("ui.39c3be1198a2fddf")} hint={CACHE_CONTROL_INDEX_HINT} />
            <NumericalInput
              type="number"
              placeholder={uiT("ui.59be71333c96")}
              step={1}
              value={point.index ?? ""}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                replaceAt(index, {
                  ...point,
                  index: event.target.value === "" ? undefined : event.target.value,
                })
              }
            />
          </div>

          {points.length > 1 && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={uiT("ui.f89748b336be726a", { v0: String(index + 1) })}
              className="text-destructive"
              onClick={() => onChange?.(points.filter((_, position) => position !== index))}
            >
              <Minus className="size-4" />
            </Button>
          )}
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        className="w-full border-dashed"
        onClick={() => onChange?.([...points, NEW_CACHE_CONTROL_POINT])}
      >
        <Plus className="mr-2 size-4" />
        {uiT("ui.d5385a610c9e8f89")}
      </Button>
    </div>
  );
};

export default CacheControlInjectionPoints;
