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
import { ChevronRight, Database, Loader2, TriangleAlert } from "lucide-react";
import { useMediaQuery } from "usehooks-ts";
import { Inspector } from "@/components/shared/Inspector";
import { InspectorTable } from "@/components/shared/InspectorTable";
import { Button } from "@/components/ui/button";
import { formatActivityTimestamp } from "@/utils/activityTimestamp";
import { FINDING_PANEL_WIDTH_KEY } from "../storage";
import { StateMessage } from "@/components/shared/StateMessage";
import { useDatasetRoute } from "../route";
import { useDatasets } from "./api";
import { DatasetDetail } from "./DatasetDetail";
import type { DatasetSummary } from "./types";

export interface DatasetsViewProps {
  readonly readOnly?: boolean;
}

export function DatasetsView({ readOnly = false }: DatasetsViewProps) {
  const { t: uiT } = useDashboardLanguage();

  const { datasetId, openDataset } = useDatasetRoute();
  return (
    <section aria-label={uiT("ui.e9faf7b714ee2400")} className="flex w-full min-w-0 flex-1 flex-col">
      {datasetId ? (
        <DatasetDetail key={datasetId} datasetId={datasetId} readOnly={readOnly} onBack={() => openDataset(null)} />
      ) : (
        <DatasetList onOpen={openDataset} />
      )}
    </section>
  );
}

function DatasetList({ onOpen }: { onOpen: (id: string) => void }) {
  const { t: uiT } = useDashboardLanguage();

  const datasets = useDatasets();
  if (datasets.isPending)
    return (
      <StateMessage
        role="status"
        icon={<Loader2 className="size-5 animate-spin motion-reduce:animate-none" />}
        title={uiT("ui.d7fcee61faac0802")}
        description={uiT("ui.e076573328bc7cfe")}
      />
    );
  if (datasets.isError)
    return (
      <StateMessage
        role="alert"
        tone="destructive"
        icon={<TriangleAlert className="size-5" />}
        title={uiT("ui.58428272564fc231")}
        description={datasets.error.message}
      >
        <Button size="sm" onClick={() => void datasets.refetch()}>
          {uiT("ui.d8b8392e2c542950")}
        </Button>
      </StateMessage>
    );
  if (datasets.data.length === 0)
    return (
      <StateMessage
        role="status"
        icon={<Database className="size-5" />}
        title={uiT("ui.21f1501fad2477d6")}
        description={uiT("ui.19dfe75388a052fb")}
      />
    );
  return <DatasetTable datasets={datasets.data} onOpen={onOpen} />;
}

type Cell = CellContext<DatasetSummary, unknown>;

const DATASET_HEIGHT = 36;

function NameCell({ row: { original: dataset } }: Cell) {
  const { t: uiT } = useDashboardLanguage();

  return (
    <span className="flex min-w-0 flex-col">
      <span className="truncate font-medium text-foreground">{dataset.name}</span>
      <span className="truncate text-xs text-muted-foreground md:hidden">
        {dataset.agent_name || uiT("ui.ee3e7690173b4911")}
      </span>
    </span>
  );
}

function AgentCell({ row: { original: dataset } }: Cell) {
  const { t: uiT } = useDashboardLanguage();

  return (
    <span className="block truncate text-muted-foreground">{dataset.agent_name || uiT("ui.ee3e7690173b4911")}</span>
  );
}

function RevisionCell({ row: { original: dataset } }: Cell) {
  return <span className="tabular-nums text-muted-foreground">{dataset.revision}</span>;
}

function CasesCell({ row: { original: dataset } }: Cell) {
  return (
    <span className="inline-flex min-w-5 justify-center rounded-full bg-muted px-1.5 font-mono text-xs tabular-nums text-foreground">
      {dataset.case_count}
    </span>
  );
}

function UpdatedCell({ row: { original: dataset } }: Cell) {
  return <span className="whitespace-nowrap text-muted-foreground">{formatActivityTimestamp(dataset.updated_at)}</span>;
}

function OpenCell() {
  return <ChevronRight aria-hidden="true" className="mr-2 ml-auto size-3.5 text-muted-foreground/60" />;
}

const COLUMNS: ColumnDef<DatasetSummary>[] = [
  {
    id: "name",
    get header() {
      return translateUi("ui.4411e525721e7dd8");
    },
    cell: NameCell,
  },
  {
    id: "agent",
    size: 160,
    get header() {
      return translateUi("ui.11b39c93777e");
    },
    cell: AgentCell,
  },
  {
    id: "revision",
    size: 80,
    get header() {
      return translateUi("ui.2e516d68f42f3e35");
    },
    cell: RevisionCell,
    meta: { numeric: true },
  },
  {
    id: "cases",
    size: 64,
    get header() {
      return translateUi("ui.2249bd503ec47d72");
    },
    cell: CasesCell,
    meta: { numeric: true },
  },
  {
    id: "updated",
    size: 200,
    get header() {
      return translateUi("ui.3a5ecca188c0");
    },
    cell: UpdatedCell,
  },
  {
    id: "open",
    size: 40,
    get header() {
      return translateUi("ui.ed077f3d8125");
    },
    cell: OpenCell,
    meta: { headerClassName: "sr-only", className: "pl-0" },
  },
];

function DatasetTable({ datasets, onOpen }: { datasets: readonly DatasetSummary[]; onOpen: (id: string) => void }) {
  const { t: uiT } = useDashboardLanguage();

  const desktop = useMediaQuery("(min-width: 768px)");
  const tableOptions: TableOptions<DatasetSummary> = {
    data: [...datasets],
    columns: COLUMNS,
    defaultColumn: { size: undefined },
    state: { columnVisibility: { agent: desktop, updated: desktop } },
    getRowId: (dataset) => dataset.id,
    autoResetAll: false,
    getCoreRowModel: getCoreRowModel(),
  };
  const table = useReactTable(tableOptions);
  const cases = datasets.reduce((total, dataset) => total + dataset.case_count, 0);
  return (
    <Inspector.Root
      items={datasets}
      itemKey={(dataset) => dataset.id}
      selected={null}
      onSelectedChange={(dataset) => dataset && onOpen(dataset.id)}
      noun="dataset"
      storageKey={FINDING_PANEL_WIDTH_KEY}
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-card">
        <InspectorTable.Root table={table}>
          <InspectorTable.Grid aria-label={uiT("ui.e9faf7b714ee2400")} className="text-xs md:min-w-[720px]">
            <InspectorTable.Header />
            <InspectorTable.Body<DatasetSummary> rowHeight={() => (desktop ? DATASET_HEIGHT : 48)}>
              {(row) => (
                <InspectorTable.Row
                  row={row}
                  item={row.original}
                  tabIndex={0}
                  aria-label={row.original.name}
                  className="group h-12 md:h-9"
                />
              )}
            </InspectorTable.Body>
          </InspectorTable.Grid>
        </InspectorTable.Root>
        <footer className="flex h-8 shrink-0 items-center border-t bg-muted/30 px-3 text-xs text-muted-foreground">
          {datasets.length} {datasets.length === 1 ? uiT("ui.b277fd623676a525") : uiT("ui.714284abfa95a144")} · {cases}{" "}
          {cases === 1 ? uiT("ui.bbfcd4160a1e8674") : uiT("ui.352b84777d8dd96a")}
        </footer>
      </div>
    </Inspector.Root>
  );
}
