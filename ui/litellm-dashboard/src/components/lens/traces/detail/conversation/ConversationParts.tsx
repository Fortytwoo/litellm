"use client";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";

import { ChevronRight, Wrench } from "lucide-react";
import { useState } from "react";

import CopyButton from "@/components/shared/CopyButton";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cva.config";

import type { TraceMessage } from "../../types";
import { fmtMs } from "../../utils";
import { Markdown } from "../content/Markdown";
import { ToolCallBlock, ToolResultCard } from "../content/Messages";
import { toolSummary } from "../content/payload";
import { ErrorBlock } from "../content/SpanError";
import { ToolArguments, ToolOutput } from "../content/ToolContent";
import type { ConversationGroup, ConversationItem } from "./conversation";

export function ConversationSteps({
  groups,
  onOpenStep,
}: {
  groups: readonly ConversationGroup[];
  onOpenStep: (id: string) => void;
}) {
  const { t: uiT } = useDashboardLanguage();

  return groups.map((group) =>
    group.kind === "item" ? (
      <ConversationStep key={group.item.id} item={group.item} onOpenStep={onOpenStep} />
    ) : (
      <details key={group.id} className="min-w-0 rounded-md border p-3">
        <summary className="cursor-pointer text-sm font-medium">
          {uiT("ui.29704ce947db9803")} {group.name}
        </summary>
        <div className="mt-4 min-w-0 space-y-5 border-l pl-3">
          <ConversationSteps groups={group.children} onOpenStep={onOpenStep} />
        </div>
      </details>
    ),
  );
}

export function ConversationStep({ item, onOpenStep }: { item: ConversationItem; onOpenStep: (id: string) => void }) {
  const { t: uiT } = useDashboardLanguage();

  return (
    <section className="min-w-0 space-y-2" aria-label={uiT("ui.e6f8c78b711a72d1", { v0: String(item.span.name) })}>
      {item.toolResult === undefined && (
        <div className="flex min-w-0 items-center justify-between gap-2 text-xs text-muted-foreground">
          <div className="flex min-w-0 items-center gap-2">
            {item.model && (
              <span className="truncate" title={item.model}>
                {item.model}
              </span>
            )}
            <span className="shrink-0 tabular-nums">{fmtMs(item.time ?? item.span.start_offset_ms)}</span>
          </div>
          <Button
            variant="ghost"
            size="xs"
            aria-label={uiT("ui.f8047fe968f2e54d", { v0: String(item.span.name) })}
            onClick={() => onOpenStep(item.span.span_id)}
            className="shrink-0 text-muted-foreground"
          >
            {uiT("ui.0179d2eda96d226c")}
          </Button>
        </div>
      )}
      {item.showError && <ErrorBlock span={item.span} />}
      {item.messages.map((message, index) => (
        <ConversationMessage key={index} message={message} />
      ))}
      {item.toolResult !== undefined && <ConversationTool item={item} onOpenStep={onOpenStep} />}
    </section>
  );
}

function ConversationTool({ item, onOpenStep }: { item: ConversationItem; onOpenStep: (id: string) => void }) {
  const { t: uiT } = useDashboardLanguage();

  const [open, setOpen] = useState(item.span.status === "error");
  const failed = item.span.status === "error";
  const summary = toolSummary(item.toolCall?.args);
  return (
    <div className={cn("min-w-0 overflow-hidden rounded-md border", failed && "border-destructive/40")}>
      <div className="flex min-w-0 items-start gap-1 pr-2">
        <button
          type="button"
          aria-expanded={open}
          aria-label={uiT("ui.76faa265aacd3e3f", {
            v0: String(open ? uiT("ui.be6eb1fc3b05") : uiT("ui.07548c2c6511")),
            v1: String(item.span.name),
          })}
          onClick={() => setOpen((value) => !value)}
          className="flex min-w-0 flex-1 items-center gap-2 px-3 py-2.5 text-left text-sm hover:bg-muted/40"
        >
          <ChevronRight
            className={cn("size-3.5 shrink-0 text-muted-foreground transition-transform", open && "rotate-90")}
          />
          <Wrench className="size-3.5 shrink-0 text-muted-foreground" />
          <span className="min-w-0 flex-1">
            <span className="block truncate font-medium">{item.span.name}</span>
            {summary && !open && (
              <span className="mt-1 block truncate font-mono text-xs text-muted-foreground" title={summary}>
                {summary}
              </span>
            )}
          </span>
          <span className={cn("ml-auto shrink-0 text-xs", failed ? "text-destructive" : "text-muted-foreground")}>
            {failed ? uiT("ui.031a8f0f659d") : uiT("ui.22a970d2e5b1cc23")}
          </span>
        </button>
        <Button
          variant="ghost"
          size="xs"
          aria-label={uiT("ui.f8047fe968f2e54d", { v0: String(item.span.name) })}
          onClick={() => onOpenStep(item.span.span_id)}
          className="my-2.5 shrink-0 text-muted-foreground"
        >
          {uiT("ui.e0723a86a5b9408a")}
        </Button>
      </div>
      {open && (
        <div className="min-w-0 space-y-3 border-t px-3 py-3">
          {item.toolCall && <ToolArguments args={item.toolCall.args} />}
          {item.span.error && item.span.error !== item.toolResult && (
            <p className="text-sm text-destructive">{item.span.error}</p>
          )}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{uiT("ui.6e7d50e84f47")}</span>
            <CopyButton
              variant="action"
              value={item.toolResult ?? ""}
              label={uiT("ui.31fbd1b7902bb3d6", { v0: String(item.span.name) })}
              iconOnly
            />
          </div>
          {item.toolResult ? (
            <ToolOutput result={item.toolResult} failed={failed} />
          ) : (
            <p className="text-sm text-muted-foreground">{uiT("ui.fb3a99b93749ff23")}</p>
          )}
        </div>
      )}
    </div>
  );
}

export function ConversationMessage({ message }: { message: TraceMessage }) {
  const { t: uiT } = useDashboardLanguage();

  if (message.role === "system" && (message.content.startsWith("Agent ") || message.content === "Context compacted"))
    return <p className="text-xs text-muted-foreground">{message.content}</p>;
  if (message.role === "system")
    return (
      <details className="text-sm text-muted-foreground">
        <summary className="cursor-pointer">{uiT("ui.93a2ab1b5b52c607")}</summary>
        <div className="pt-3">
          <Markdown text={message.content} />
        </div>
      </details>
    );
  if (message.role === "tool") return <ToolResultCard name={message.name || "Tool result"} result={message.content} />;
  return (
    <div className={message.role === "user" ? "flex justify-end" : "space-y-3"}>
      {message.content && (
        <div className={message.role === "user" ? "max-w-[85%] rounded-xl bg-muted px-4 py-3" : "px-1 py-1"}>
          <Markdown text={message.content} />
        </div>
      )}
      {message.tool_calls?.map((call, index) => (
        <details key={index} className="rounded-md border p-3 text-sm">
          <summary className="cursor-pointer">{call.name}</summary>
          <div className="pt-3">
            <ToolCallBlock call={call} />
          </div>
        </details>
      ))}
    </div>
  );
}
