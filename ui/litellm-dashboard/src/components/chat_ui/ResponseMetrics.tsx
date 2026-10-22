"use client";
import { formatMoney } from "@/utils/currency";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import React from "react";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Clock,
  Database,
  DatabaseBackup,
  JapaneseYen,
  Hash,
  History,
  Lightbulb,
  Wrench,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { PROMPT_CACHE_CREATION_TOOLTIP, PROMPT_CACHE_READ_TOOLTIP } from "@/utils/promptCacheUsage";

const RESPONSE_CACHE_TOOLTIP =
  "This response was replayed from LiteLLM's response cache. The request never reached the provider, so it did not read from or write to the provider's own prompt cache.";

export interface TokenUsage {
  completionTokens?: number;
  promptTokens?: number;
  totalTokens?: number;
  reasoningTokens?: number;
  cacheReadTokens?: number;
  cacheCreationTokens?: number;
  cost?: number;
  servedFromResponseCache?: boolean;
}

interface ResponseMetricsProps {
  timeToFirstToken?: number;
  totalLatency?: number;
  usage?: TokenUsage;
  toolName?: string;
}

interface MetricItemProps {
  label: string;
  tooltip: string;
  icon: React.ReactNode;
  value: string;
}

function MetricItem({ label, tooltip, icon, value }: MetricItemProps) {
  return (
    <Tooltip>
      <TooltipTrigger render={<div className="flex items-center gap-1" aria-label={`${label}: ${value}`} />}>
        {icon}
        <span>
          {label}: {value}
        </span>
      </TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  );
}

function ResponseCacheIndicator() {
  const { t: uiT } = useDashboardLanguage();

  return (
    <MetricItem
      label={uiT("ui.f98832fd0834")}
      tooltip={RESPONSE_CACHE_TOOLTIP}
      icon={<History className="size-3" aria-hidden="true" />}
      value="Hit"
    />
  );
}

function PromptCacheChips({ usage }: { usage?: TokenUsage }) {
  const { t: uiT } = useDashboardLanguage();

  if (usage?.servedFromResponseCache) {
    return <ResponseCacheIndicator />;
  }

  const readTokens = usage?.cacheReadTokens ?? 0;
  const creationTokens = usage?.cacheCreationTokens ?? 0;

  return (
    <>
      {readTokens > 0 && (
        <MetricItem
          label={uiT("ui.bc60bc6b4e59a4e3")}
          tooltip={PROMPT_CACHE_READ_TOOLTIP}
          icon={<Database className="size-3" aria-hidden="true" />}
          value={String(readTokens)}
        />
      )}

      {creationTokens > 0 && (
        <MetricItem
          label={uiT("ui.1471a902cb72f017")}
          tooltip={PROMPT_CACHE_CREATION_TOOLTIP}
          icon={<DatabaseBackup className="size-3" aria-hidden="true" />}
          value={String(creationTokens)}
        />
      )}
    </>
  );
}

const ResponseMetrics: React.FC<ResponseMetricsProps> = ({ timeToFirstToken, totalLatency, usage, toolName }) => {
  const { t: uiT } = useDashboardLanguage();

  if (!timeToFirstToken && !totalLatency && !usage) return null;

  return (
    <div className="response-metrics mt-2 flex flex-wrap gap-3 border-t border-border pt-2 text-xs text-muted-foreground">
      {timeToFirstToken !== undefined && (
        <MetricItem
          label="TTFT"
          tooltip={uiT("ui.0cec400f147f0f13")}
          icon={<Clock className="size-3" aria-hidden="true" />}
          value={`${(timeToFirstToken / 1000).toFixed(2)}s`}
        />
      )}

      {totalLatency !== undefined && (
        <MetricItem
          label={uiT("ui.58c0439d739643a6")}
          tooltip={uiT("ui.21848d236dc60c6b")}
          icon={<Clock className="size-3" aria-hidden="true" />}
          value={`${(totalLatency / 1000).toFixed(2)}s`}
        />
      )}

      {usage?.promptTokens !== undefined && (
        <MetricItem
          label={uiT("ui.8bc1d53cc57c24b7")}
          tooltip={uiT("ui.b8fbf83c69d10704")}
          icon={<ArrowDownToLine className="size-3" aria-hidden="true" />}
          value={String(usage.promptTokens)}
        />
      )}

      <PromptCacheChips usage={usage} />

      {usage?.completionTokens !== undefined && (
        <MetricItem
          label={uiT("ui.9a3c5460432ba66a")}
          tooltip={uiT("ui.f5ad1c5b775f969a")}
          icon={<ArrowUpFromLine className="size-3" aria-hidden="true" />}
          value={String(usage.completionTokens)}
        />
      )}

      {usage?.reasoningTokens !== undefined && (
        <MetricItem
          label={uiT("ui.d8211e24e83d1600")}
          tooltip={uiT("ui.157b0f67b44284d4")}
          icon={<Lightbulb className="size-3" aria-hidden="true" />}
          value={String(usage.reasoningTokens)}
        />
      )}

      {usage?.totalTokens !== undefined && (
        <MetricItem
          label={uiT("ui.c9b3c38247f7")}
          tooltip={uiT("ui.e7601ca1178ad955")}
          icon={<Hash className="size-3" aria-hidden="true" />}
          value={String(usage.totalTokens)}
        />
      )}

      {typeof usage?.cost === "number" && Number.isFinite(usage.cost) && (
        <MetricItem
          label={uiT("ui.204a5eb2cd28")}
          tooltip={uiT("ui.204a5eb2cd28")}
          icon={<JapaneseYen className="size-3" aria-hidden="true" />}
          value={formatMoney(usage.cost, 6)}
        />
      )}

      {toolName && (
        <MetricItem
          label={uiT("ui.2e53bdcd0740867b")}
          tooltip={uiT("ui.9b41efae340c46c7")}
          icon={<Wrench className="size-3" aria-hidden="true" />}
          value={toolName}
        />
      )}
    </div>
  );
};

export default ResponseMetrics;
