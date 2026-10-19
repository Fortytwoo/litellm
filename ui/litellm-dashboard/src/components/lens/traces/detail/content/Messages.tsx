"use client";
import { t as translateUi } from "@/i18n";

import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";

import { Bot, Settings2, User, Wrench } from "lucide-react";

import CopyButton from "@/components/shared/CopyButton";
import { cn } from "@/lib/cva.config";

import type { TraceMessage, TraceToolCall } from "../../types";
import { Block, BlockBadge, type BadgeTone } from "./Block";
import { Markdown } from "./Markdown";
import { ToolArguments, ToolOutput } from "./ToolContent";

const ROLE_LABEL: Record<string, string> = {
  get user() {
    return translateUi("ui.b512d97e7cbf");
  },
  get system() {
    return translateUi("ui.6725e7bbcd28f3a8");
  },
  get assistant() {
    return translateUi("ui.391e405152779acc");
  },
  get tool() {
    return translateUi("ui.2e53bdcd0740867b");
  },
};
const ROLE_TONE: Record<string, BadgeTone> = { user: "user", assistant: "assistant", tool: "tool", system: "neutral" };
const ROLE_ICON: Record<string, React.ReactNode> = {
  user: <User />,
  assistant: <Bot />,
  tool: <Wrench />,
  system: <Settings2 />,
};

const argsText = (args: unknown): string => (typeof args === "string" ? args : JSON.stringify(args));

export function ToolCallBlock({ call }: { call: TraceToolCall }) {
  const { t: uiT } = useDashboardLanguage();

  return (
    <div className="rounded-md border border-border bg-background">
      <div className="flex items-center gap-2 border-b border-border/70 px-2.5 py-1.5">
        <BlockBadge tone="tool">
          <Wrench />
        </BlockBadge>
        <span className="min-w-0 truncate font-mono text-xs font-medium text-foreground">{call.name}</span>
        <CopyButton
          variant="action"
          value={`${call.name}(${argsText(call.args)})`}
          label={uiT("ui.af1a5d5755c18108", { v0: String(call.name) })}
          iconOnly
          className="ml-auto size-6 text-muted-foreground"
        />
      </div>
      <div className="px-2.5 py-2">
        {call.args === undefined ? (
          <p className="py-2 text-xs text-muted-foreground">{uiT("ui.9f629d690cfc43c4")}</p>
        ) : (
          <ToolArguments args={call.args} />
        )}
      </div>
    </div>
  );
}

export function MessageCard({ message }: { message: TraceMessage }) {
  const label = ROLE_LABEL[message.role] ?? message.role;
  if (message.role === "tool") return <ToolResultCard name={message.name || label} result={message.content} />;
  const calls = message.tool_calls ?? [];
  const copyValue = message.content || calls.map((c) => `${c.name}(${argsText(c.args)})`).join("\n");
  const hasBody = Boolean(message.content) || calls.length > 0;
  return (
    <Block
      icon={<BlockBadge tone={ROLE_TONE[message.role] ?? "neutral"}>{ROLE_ICON[message.role] ?? <User />}</BlockBadge>}
      label={label}
      name={label}
      copyValue={copyValue}
      tone={message.role === "system" ? "muted" : "default"}
      defaultOpen={message.role !== "system"}
    >
      {hasBody && (
        <div className="flex flex-col gap-3">
          {message.content && <Markdown text={message.content} />}
          {calls.map((call, i) => (
            <ToolCallBlock key={`${call.name}-${i}`} call={call} />
          ))}
        </div>
      )}
    </Block>
  );
}

export function MessageList({ messages }: { messages: readonly TraceMessage[] }) {
  return (
    <div className="flex flex-col gap-2">
      {messages.map((message, i) => (
        <MessageCard key={`${message.role}-${i}`} message={message} />
      ))}
    </div>
  );
}

export function ToolResultCard({ name, result, failed = false }: { name: string; result: string; failed?: boolean }) {
  const { t: uiT } = useDashboardLanguage();

  return (
    <article
      className={cn(
        "min-w-0 overflow-hidden rounded-lg border bg-card",
        failed ? "border-destructive/40" : "border-border",
      )}
    >
      <div className="flex min-h-9 items-center gap-2 border-b border-border/70 px-3 py-1.5">
        <BlockBadge tone={failed ? "failed" : "tool"}>
          <Wrench />
        </BlockBadge>
        <span className="min-w-0 flex-1 truncate font-mono text-xs font-medium">{name}</span>
        <CopyButton
          variant="action"
          value={result}
          label={uiT("ui.31fbd1b7902bb3d6", { v0: String(name) })}
          iconOnly
          className="size-6 shrink-0 text-muted-foreground"
        />
      </div>
      <div className="px-3 py-2.5">
        <ToolOutput result={result} failed={failed} />
      </div>
    </article>
  );
}
