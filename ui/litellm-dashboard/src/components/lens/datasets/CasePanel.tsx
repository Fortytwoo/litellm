"use client";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";

import { useId, type ReactNode } from "react";
import { SquareArrowOutUpRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

import { useOpenSourceTrace } from "../route";
import { MessageList } from "../traces/detail/content/Messages";
import { Section } from "../traces/detail/content/Section";
import { IdChip } from "../traces/ui/IdChip";
import { caseConversation, caseOutput, shortCaseId, type CaseEdit } from "./caseView";
import type { DatasetCase } from "./types";

export interface CasePanelProps {
  readonly item: DatasetCase;
  readonly datasetName: string;
  readonly editable: boolean;
  readonly onEdit: (edit: CaseEdit) => void;
}

export function CasePanel({ item, datasetName, editable, onEdit }: CasePanelProps) {
  const { t: uiT } = useDashboardLanguage();

  return (
    <Tabs defaultValue="case" className="min-h-0 flex-1 gap-0">
      <header className="flex shrink-0 flex-col gap-1.5 px-4 pt-3 pb-2">
        <div className="flex min-w-0 items-center gap-2">
          <h2 className="min-w-0 truncate text-base font-semibold text-foreground">
            {uiT("ui.b8cc9688078c9103")}
            {shortCaseId(item.id)} <span className="font-normal text-muted-foreground">@ {datasetName}</span>
          </h2>
          <IdChip value={item.id} label={uiT("ui.798cee7fb0e552dc")} />
          <label className="ml-auto flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
            {uiT("ui.ba829a98b7994088")}
            <Switch
              size="sm"
              checked={item.included}
              disabled={!editable}
              onCheckedChange={(included) => onEdit({ included })}
            />
          </label>
        </div>
      </header>
      <div className="shrink-0 border-b px-4">
        <TabsList variant="line" aria-label={uiT("ui.2c4390730ef472a3")} className="h-9 gap-4 px-0">
          <TabsTrigger value="case" className="flex-none px-0 text-sm">
            {uiT("ui.15f86e24ed25aed1")}
          </TabsTrigger>
          <TabsTrigger value="source" className="flex-none px-0 text-sm">
            {uiT("ui.0e570ca6fabe24f9")}
          </TabsTrigger>
        </TabsList>
      </div>
      <TabsContent value="case" className="min-h-0 overflow-auto pt-1">
        <CaseBody item={item} editable={editable} onEdit={onEdit} />
      </TabsContent>
      <TabsContent value="source" className="min-h-0 overflow-auto">
        <SourceBody item={item} />
      </TabsContent>
    </Tabs>
  );
}

function CaseBody({ item, editable, onEdit }: Omit<CasePanelProps, "datasetName">) {
  const { t: uiT } = useDashboardLanguage();

  const expectedId = useId();
  const conversation = caseConversation(item);
  const output = caseOutput(item);
  return (
    <>
      <Section title={uiT("ui.36ecb4f86691")} count={conversation.length}>
        {conversation.length ? <MessageList messages={conversation} /> : <Empty>{uiT("ui.ba12b0dd5a36e8bd")}</Empty>}
      </Section>
      <Section title={uiT("ui.b2439bcb8dee")}>
        {output.length ? <MessageList messages={output} /> : <Empty>{uiT("ui.67d07152755a7c22")}</Empty>}
      </Section>
      <section aria-label={uiT("ui.ca99b7f1b14ee2c0")} className="flex flex-col gap-2 px-4 pt-2 pb-5">
        <label htmlFor={expectedId} className="text-sm font-semibold text-foreground">
          {uiT("ui.ca99b7f1b14ee2c0")}
        </label>
        {editable ? (
          <Textarea
            id={expectedId}
            value={item.expected}
            placeholder={uiT("ui.074521f09ae8cec8")}
            className="min-h-24 bg-background text-sm"
            onChange={(event) => onEdit({ expected: event.target.value })}
          />
        ) : (
          <p id={expectedId} className="text-sm whitespace-pre-wrap text-foreground">
            {item.expected || <span className="text-muted-foreground italic">{uiT("ui.4895f73177ab")}</span>}
          </p>
        )}
      </section>
    </>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return <p className="py-2 text-sm text-muted-foreground italic">{children}</p>;
}

const SOURCE_FIELDS = [
  ["Trace", "trace_id"],
  ["Span", "span_id"],
  ["Finding", "finding_id"],
  ["Investigation", "lens_id"],
] as const;

function SourceBody({ item }: { item: DatasetCase }) {
  const { t: uiT } = useDashboardLanguage();

  const openSourceTrace = useOpenSourceTrace();
  const { source } = item;
  return (
    <div className="flex flex-col gap-4 p-4">
      <dl className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-6 gap-y-2 text-sm">
        {SOURCE_FIELDS.map(([label, key]) => (
          <div key={key} className="contents">
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="flex min-w-0 items-center gap-1">
              {source[key] ? (
                <IdChip
                  value={source[key]}
                  label={uiT("ui.9a9adedbdef80bce", { v0: String(label.toLowerCase()) })}
                  showValue
                />
              ) : (
                <span className="text-muted-foreground italic">{uiT("ui.dc937b598926")}</span>
              )}
            </dd>
          </div>
        ))}
      </dl>
      {source.trace_id && (
        <Button
          size="sm"
          variant="outline"
          className="self-start"
          onClick={() =>
            openSourceTrace({ traceId: source.trace_id, traceRef: source.trace_ref, spanId: source.span_id })
          }
        >
          {uiT("ui.df6a84e8db631dfe")}
          <SquareArrowOutUpRight className="size-3.5" />
        </Button>
      )}
    </div>
  );
}
