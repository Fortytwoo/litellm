"use client";

import { createContext, useContext, useRef, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, Maximize2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { gateway, obj, str, type Json, type Row } from "@/lib/http/managedGateway";
import { ApiError, type HttpMethod, type QueryParams } from "@/lib/http/client";
import { useCopy } from "./locale";

interface Session {
  me: Row;
  snapshot: Row;
  write: (operation: string, body: unknown, method?: HttpMethod) => Promise<Row>;
}
export const GatewaySession = createContext<Session | null>(null);
export function useGateway() {
  const value = useContext(GatewaySession);
  if (!value) throw new Error("GatewaySession required");
  return value;
}
export function useGatewayQuery(operation: string, query?: QueryParams, enabled = true) {
  return useQuery({
    queryKey: ["gateway", operation, query],
    queryFn: ({ signal }) => gateway(operation, { query, signal }),
    enabled,
    retry: false,
    staleTime: 15000,
  });
}
export function useWriter(csrf: string) {
  const cache = useQueryClient();
  return async (operation: string, body: unknown, method: HttpMethod = "POST") => {
    const result = await gateway(operation, { method, body, csrf });
    await cache.invalidateQueries({ queryKey: ["gateway"] });
    return result;
  };
}
export function useAction() {
  const t = useCopy();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const run = async (fn: () => Promise<unknown>) => {
    if (pending) return;
    setPending(true);
    setError("");
    try {
      await fn();
    } catch (e) {
      setError(e instanceof ApiError && e.status === 409 ? t("conflict") : t("error"));
    } finally {
      setPending(false);
    }
  };
  return { pending, error, run };
}
export function Notice({ error }: { error: unknown }) {
  const t = useCopy();
  return error ? (
    <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
      {typeof error === "string" ? error : t("error")}
    </p>
  ) : null;
}
export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="grid gap-1.5 text-sm">
      <span className="font-medium">{label}</span>
      {children}
    </label>
  );
}
export function TextField({
  label,
  value,
  onChange,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (s: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <Field label={label}>
      <Input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete="off"
      />
    </Field>
  );
}
export function Enabled({ checked, onChange }: { checked: boolean; onChange: (b: boolean) => void }) {
  const t = useCopy();
  return (
    <label className="flex items-center gap-2 text-sm">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {t("enabled")}
    </label>
  );
}
export function Modal({
  title,
  open,
  onClose,
  children,
}: {
  title: string;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}
export function JsonView({ value }: { value: Json | undefined }) {
  return (
    <pre className="max-h-96 overflow-auto whitespace-pre-wrap break-all rounded-md bg-muted p-4 text-xs">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}
export interface Column {
  key: string;
  label: string;
  render?: (row: Row) => ReactNode;
}
export function Grid({
  columns,
  data,
  actions,
  serverPages = false,
}: {
  columns: Column[];
  data: Row[];
  actions?: (row: Row) => ReactNode;
  serverPages?: boolean;
}) {
  const t = useCopy();
  function cell(row: Row, column: Column) {
    if (column.render) return column.render(row);
    const value = row[column.key];
    if (typeof value === "boolean") return t(value ? "enabled" : "disabled");
    return str(value);
  }
  const ref = useRef<HTMLDivElement>(null);
  const [filter, setFilter] = useState("");
  const [page, setPage] = useState(0);
  const [sort, setSort] = useState({ key: "", descending: false });
  const direction = sort.descending ? "descending" : "ascending";
  const filtered = data.filter(
    (row) => !filter || JSON.stringify(row).toLocaleLowerCase().includes(filter.toLocaleLowerCase()),
  );
  const sorted = sort.key
    ? [...filtered].sort(
        (a, b) =>
          String(a[sort.key] ?? "").localeCompare(String(b[sort.key] ?? ""), undefined, { numeric: true }) *
          (sort.descending ? -1 : 1),
      )
    : filtered;
  const current = Math.min(page, Math.max(0, Math.ceil(sorted.length / 20) - 1));
  const shown = serverPages ? sorted : sorted.slice(current * 20, (current + 1) * 20);
  async function copy() {
    try {
      await navigator.clipboard.writeText(
        [
          columns.map((c) => c.label).join("\t"),
          ...sorted.map((r) => columns.map((c) => String(r[c.key] ?? "").replaceAll(/[\t\r\n]/g, " ")).join("\t")),
        ].join("\n"),
      );
      toast.success(t("copied"));
    } catch {
      toast.error(t("error"));
    }
  }
  async function fullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await ref.current?.requestFullscreen();
    } catch {
      toast.error(t("error"));
    }
  }
  return (
    <div
      ref={ref}
      className="group/table relative space-y-3 rounded-lg border bg-background p-4 fullscreen:overflow-auto"
    >
      <div className="flex items-center gap-3 pr-24">
        <Input
          aria-label={t("filter")}
          placeholder={t("filter")}
          value={filter}
          onChange={(e) => {
            setFilter(e.target.value);
            setPage(0);
          }}
        />
        <span className="shrink-0 text-xs text-muted-foreground">
          {t("total")} {filtered.length}
        </span>
      </div>
      <div className="absolute top-4 right-4 flex gap-1 opacity-0 transition-opacity hover:opacity-100 focus-within:opacity-100 [@media(hover:none)]:opacity-100">
        <Button variant="ghost" size="icon" aria-label={t("copy")} title={t("copy")} onClick={copy}>
          <Copy size={16} />
        </Button>
        <Button variant="ghost" size="icon" aria-label={t("fullscreen")} title={t("fullscreen")} onClick={fullscreen}>
          <Maximize2 size={16} />
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((c) => (
              <TableHead key={c.key} aria-sort={sort.key === c.key ? direction : "none"}>
                <button
                  className="text-left"
                  onClick={() => setSort({ key: c.key, descending: sort.key === c.key && !sort.descending })}
                >
                  {c.label}
                </button>
              </TableHead>
            ))}
            {actions && <TableHead>{t("actions")}</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {shown.map((row, i) => (
            <TableRow key={str(row.id) || str(row.subject) || str(row.account_ref) || str(row.name) || i}>
              {columns.map((c) => (
                <TableCell key={c.key} className="max-w-lg whitespace-normal break-words">
                  {cell(row, c)}
                </TableCell>
              ))}
              {actions && (
                <TableCell>
                  <div className="flex flex-wrap gap-2">{actions(row)}</div>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {!shown.length && <p className="p-4 text-sm text-muted-foreground">{t("empty")}</p>}
      {!serverPages && (
        <div className="flex items-center justify-end gap-3 text-xs">
          <Button variant="outline" disabled={current === 0} onClick={() => setPage(current - 1)}>
            {t("previous")}
          </Button>
          {current + 1} / {Math.max(1, Math.ceil(sorted.length / 20))}
          <Button variant="outline" disabled={(current + 1) * 20 >= sorted.length} onClick={() => setPage(current + 1)}>
            {t("next")}
          </Button>
        </div>
      )}
    </div>
  );
}

/** Recurses only over schema declarations; missing output schemas stay explicit. */
export function Schema({ value, depth = 0 }: { value: Json | undefined; depth?: number }) {
  const t = useCopy();
  const schema = obj(value);
  if (!Object.keys(schema).length) return <p className="text-sm text-muted-foreground">{t("noSchema")}</p>;
  if (depth > 12) return <JsonView value={schema} />;
  return (
    <div className="space-y-2 border-l pl-3 text-sm">
      <p className="font-mono text-xs">
        {str(schema.type) || str(schema.$ref)} {schema.enum && JSON.stringify(schema.enum)}
      </p>
      {schema.description && <p className="text-muted-foreground">{str(schema.description)}</p>}
      {Object.entries(obj(schema.properties)).map(([name, field]) => (
        <details key={name} open={depth < 1}>
          <summary className="cursor-pointer py-1 font-medium">
            {name}{" "}
            <span className="text-xs text-muted-foreground">
              {Array.isArray(schema.required) && schema.required.includes(name) ? t("required") : t("optional")}
            </span>
          </summary>
          <Schema value={field} depth={depth + 1} />
        </details>
      ))}
      {schema.items && <Schema value={schema.items} depth={depth + 1} />}
      {["anyOf", "oneOf", "allOf"].map((key) =>
        Array.isArray(schema[key]) ? (
          <div key={key}>
            <span className="font-mono">{key}</span>
            {schema[key].map((child, i) => (
              <Schema key={i} value={child} depth={depth + 1} />
            ))}
          </div>
        ) : null,
      )}
      {Object.entries(schema).filter(
        ([key]) =>
          !["type", "description", "properties", "required", "items", "anyOf", "oneOf", "allOf", "enum"].includes(key),
      ).length > 0 && (
        <JsonView
          value={Object.fromEntries(
            Object.entries(schema).filter(([key]) => !["properties", "items", "anyOf", "oneOf", "allOf"].includes(key)),
          )}
        />
      )}
    </div>
  );
}
