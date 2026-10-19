"use client";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import { t as translateUi } from "@/i18n";

import {
  getCoreRowModel,
  useReactTable,
  type CellContext,
  type ColumnDef,
  type TableOptions,
} from "@tanstack/react-table";
import { createContext, useContext, type ReactNode } from "react";
import { SquareArrowOutUpRight } from "lucide-react";
import { useMediaQuery } from "usehooks-ts";

import { Inspector } from "@/components/shared/Inspector";
import { InspectorTable } from "@/components/shared/InspectorTable";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/cva.config";

import { useOpenSourceTrace } from "../route";
import { FINDING_PANEL_WIDTH_KEY } from "../storage";
import { caseInput, caseReplyText, toolCallCount } from "./caseView";
import type { DatasetCase } from "./types";

const CASE_HEIGHT = 36;
const MOBILE_CASE_HEIGHT = 52;
const MUTED_ITALIC = "text-muted-foreground/80 italic";

interface CaseTableContextValue {
  readonly editable: boolean;
  readonly onToggle: (id: string, included: boolean) => void;
}

const CaseTableContext = createContext<CaseTableContextValue | null>(null);

function useCaseTable(): CaseTableContextValue {
  const value = useContext(CaseTableContext);
  if (value === null) throw new Error("Case cells must be rendered inside CaseTable");
  return value;
}

export const caseLabel = (index: number): string => `Case ${index + 1}`;

type Cell = CellContext<DatasetCase, unknown>;

function IncludeCell({ row }: Cell) {
  const { t: uiT } = useDashboardLanguage();

  const { editable, onToggle } = useCaseTable();
  return (
    <Checkbox
      aria-label={uiT("ui.8890b6d6a699740f", { v0: String(caseLabel(row.index).toLowerCase()) })}
      checked={row.original.included}
      disabled={!editable}
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
      onCheckedChange={(included) => onToggle(row.original.id, included)}
    />
  );
}

function InputText({ item }: { item: DatasetCase }) {
  const { t: uiT } = useDashboardLanguage();

  const input = caseInput(item);
  if (!input) return <span className={MUTED_ITALIC}>{uiT("ui.6e69efde182aea68")}</span>;
  return (
    <>
      <span className="text-muted-foreground">{input.role}: </span>
      <span className="text-foreground">{input.text}</span>
    </>
  );
}

function ReplyText({ item }: { item: DatasetCase }) {
  const { t: uiT } = useDashboardLanguage();

  const reply = caseReplyText(item);
  return reply ? <span>{reply}</span> : <span className={MUTED_ITALIC}>{uiT("ui.0623c0abcd81a5e0")}</span>;
}

function InputCell({ row: { original: item } }: Cell) {
  return (
    <span className="flex min-w-0 flex-col gap-0.5">
      <span className="truncate">
        <InputText item={item} />
      </span>
      <span className="truncate text-muted-foreground md:hidden">
        <ReplyText item={item} />
      </span>
    </span>
  );
}

function ReplyCell({ row: { original: item } }: Cell) {
  return (
    <span className="block truncate text-foreground">
      <ReplyText item={item} />
    </span>
  );
}

function ExpectedCell({ row: { original: item } }: Cell) {
  const { t: uiT } = useDashboardLanguage();

  return item.expected ? (
    <span className="block truncate text-foreground">{item.expected}</span>
  ) : (
    <span className={MUTED_ITALIC}>{uiT("ui.4895f73177ab")}</span>
  );
}

function SourceCell({ row: { original: item } }: Cell) {
  const { t: uiT } = useDashboardLanguage();

  const openSourceTrace = useOpenSourceTrace();
  const { trace_id: traceId, trace_ref: traceRef, span_id: spanId } = item.source;
  if (!traceId) return null;
  return (
    <button
      type="button"
      aria-label={uiT("ui.df6a84e8db631dfe")}
      title={uiT("ui.df6a84e8db631dfe")}
      onClick={(event) => {
        event.stopPropagation();
        openSourceTrace({ traceId, traceRef, spanId });
      }}
      className="inline-flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
    >
      <SquareArrowOutUpRight className="size-3.5" />
    </button>
  );
}

function ToolCallsCell({ row: { original: item } }: Cell) {
  const { t: uiT } = useDashboardLanguage();

  const count = toolCallCount(item);
  if (count === 0) return null;
  return (
    <span
      title={uiT("ui.92078b1b270a6f0b", {
        v0: String(count),
        v1: String(count === 1 ? uiT("ui.7edb360f06acaef2") : uiT("ui.f46f5990ebfadcab")),
      })}
      className="inline-flex min-w-5 justify-center rounded-full bg-muted px-1.5 font-mono text-xs tabular-nums text-foreground"
    >
      {count}
    </span>
  );
}

const COLUMNS: ColumnDef<DatasetCase>[] = [
  {
    id: "include",
    size: 40,
    get header() {
      return translateUi("ui.7285576bdacf86fe");
    },
    cell: IncludeCell,
    meta: { headerClassName: "sr-only", className: "pr-0" },
  },
  {
    id: "input",
    get header() {
      return translateUi("ui.36ecb4f86691");
    },
    cell: InputCell,
  },
  {
    id: "reply",
    get header() {
      return translateUi("ui.c253f451bdd56431");
    },
    cell: ReplyCell,
  },
  {
    id: "expected",
    size: 220,
    get header() {
      return translateUi("ui.ca99b7f1b14ee2c0");
    },
    cell: ExpectedCell,
  },
  {
    id: "source",
    size: 72,
    get header() {
      return translateUi("ui.0e570ca6fabe24f9");
    },
    cell: SourceCell,
  },
  {
    id: "tools",
    size: 104,
    get header() {
      return translateUi("ui.da5122dc0f97b158");
    },
    cell: ToolCallsCell,
    meta: { numeric: true },
  },
];

export interface CaseTableProps {
  readonly cases: readonly DatasetCase[];
  readonly editable: boolean;
  readonly selectedId: string | null;
  readonly onSelect: (id: string | null) => void;
  readonly onToggle: (id: string, included: boolean) => void;
  readonly children: (item: DatasetCase) => ReactNode;
}

export function CaseTable({ cases, editable, selectedId, onSelect, onToggle, children }: CaseTableProps) {
  const { t: uiT } = useDashboardLanguage();

  const desktop = useMediaQuery("(min-width: 768px)");
  const tableOptions: TableOptions<DatasetCase> = {
    data: [...cases],
    columns: COLUMNS,
    defaultColumn: { size: undefined },
    state: { columnVisibility: { reply: desktop, expected: desktop, source: desktop } },
    getRowId: (item) => item.id,
    autoResetAll: false,
    getCoreRowModel: getCoreRowModel(),
  };
  const table = useReactTable(tableOptions);
  const selected = cases.find((item) => item.id === selectedId) ?? null;
  const included = cases.filter((item) => item.included).length;
  return (
    <Inspector.Root
      items={cases}
      itemKey={(item) => item.id}
      selected={selected}
      onSelectedChange={(item) => onSelect(item?.id ?? null)}
      noun="case"
      storageKey={FINDING_PANEL_WIDTH_KEY}
    >
      <CaseTableContext.Provider value={{ editable, onToggle }}>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-card">
          <InspectorTable.Root table={table}>
            <InspectorTable.Grid aria-label={uiT("ui.2249bd503ec47d72")} className="text-xs md:min-w-[860px]">
              <InspectorTable.Header />
              <InspectorTable.Body<DatasetCase> rowHeight={() => (desktop ? CASE_HEIGHT : MOBILE_CASE_HEIGHT)}>
                {(row) => (
                  <InspectorTable.Row
                    row={row}
                    item={row.original}
                    tabIndex={0}
                    aria-label={caseLabel(row.index)}
                    className={cn("group h-13 md:h-9", !row.original.included && "[&>td:not(:first-child)]:opacity-50")}
                  />
                )}
              </InspectorTable.Body>
            </InspectorTable.Grid>
          </InspectorTable.Root>
          <footer className="flex h-8 shrink-0 items-center border-t bg-muted/30 px-3 text-xs text-muted-foreground">
            {cases.length} {cases.length === 1 ? uiT("ui.bbfcd4160a1e8674") : uiT("ui.352b84777d8dd96a")} · {included}{" "}
            {uiT("ui.7f0f70e643bcb02d")}
          </footer>
        </div>
      </CaseTableContext.Provider>
      <Inspector.Panel<DatasetCase> label={uiT("ui.01fd608d5cbafca7")} testId="case-panel">
        {children}
      </Inspector.Panel>
    </Inspector.Root>
  );
}
