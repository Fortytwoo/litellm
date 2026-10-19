"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { obj, rows, str, strings, type Row } from "@/lib/http/managedGateway";
import { Field, Grid, JsonView, Modal, Notice, Schema, useAction, useGateway, useGatewayQuery } from "./Shared";
import { useCopy } from "./locale";

export function Tools({ services = false }: { services?: boolean }) {
  const t = useCopy();
  const { snapshot, write } = useGateway();
  const action = useAction();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Row[] | null>(null);
  const [selected, setSelected] = useState<Row | null>(null);
  const serviceHealth = (state: Row) => (state.ok === true ? t("allowed") : t("unavailable"));
  const health = useGatewayQuery("health", undefined, services);
  async function search(e: React.FormEvent) {
    e.preventDefault();
    await action.run(async () => {
      const result = await write("tool-search", { query, limit: 20 });
      setResults(rows(result.tools ?? result.results));
    });
  }
  const tools =
    results ??
    rows(snapshot.tools).filter(
      (row) =>
        !query || (str(row.name) + " " + str(row.description)).toLocaleLowerCase().includes(query.toLocaleLowerCase()),
    );
  return (
    <div className="space-y-4">
      <Notice error={action.error || health.error} />
      {services && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{health.isFetching ? t("probing") : t("serverChecks")}</p>
            <Button variant="outline" disabled={health.isFetching} onClick={() => health.refetch()}>
              {t("probe")}
            </Button>
          </div>
          <Grid
            data={rows(snapshot.services).map((service) => {
              const state = rows(health.data?.rows).find((r) => r.name === service.name);
              return {
                ...service,
                health: state ? serviceHealth(state) : t("unknown"),
              };
            })}
            columns={[
              { key: "name", label: t("name") },
              { key: "transport", label: t("protocol") },
              { key: "tool_count", label: t("toolCount") },
              { key: "callable_count", label: t("callable") },
              { key: "read_count", label: t("readOnly") },
              { key: "health", label: t("status") },
            ]}
            actions={(row) => (
              <Button
                variant="outline"
                onClick={() => {
                  setQuery(str(row.name));
                  setResults(rows(snapshot.tools).filter((tool) => tool.service === row.name));
                }}
              >
                {t("tools")}
              </Button>
            )}
          />
        </>
      )}
      {snapshot.tools_available === false && <Notice error={t("unavailable")} />}
      <form className="flex gap-2" onSubmit={search}>
        <Input
          aria-label={t("search")}
          placeholder={t("search")}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setResults(null);
          }}
        />
        <Button type="submit" disabled={!query.trim() || action.pending}>{t("semantic")}</Button>
      </form>
      <Grid
        data={tools}
        columns={[
          { key: "name", label: t("name") },
          { key: "service", label: t("service") },
          { key: "description", label: t("description") },
          { key: "input_count", label: t("input") },
          { key: "test_mode", label: t("test") },
          { key: "callable", label: t("callable") },
        ]}
        actions={(row) => (
          <>
            <Button variant="outline" onClick={() => setSelected(row)}>
              {t("detail")}
            </Button>
            <Button
              variant="outline"
              disabled={!strings(snapshot.permissions).includes("tools.execute")}
              onClick={() => setSelected(row)}
            >
              {t("test")}
            </Button>
          </>
        )}
      />
      {selected && <ToolDetail key={str(selected.name)} name={str(selected.name)} onClose={() => setSelected(null)} />}
    </div>
  );
}

function ToolDetail({ name, onClose }: { name: string; onClose: () => void }) {
  const t = useCopy();
  const { snapshot, write } = useGateway();
  const detail = useGatewayQuery("tool-detail", { name });
  const action = useAction();
  const [args, setArgs] = useState("{}");
  const [result, setResult] = useState<Row | null>(null);
  const [confirmation, setConfirmation] = useState("");
  const [tab, setTab] = useState<"input" | "output" | "test">("input");
  const tool = obj(detail.data?.tool);
  const mode = str(detail.data?.test_mode);
  function changeArguments(value: string) {
    setArgs(value);
    setConfirmation("");
    setResult(null);
  }
  async function invoke(confirm = false) {
    await action.run(async () => {
      const parsed: unknown = JSON.parse(args);
      if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") throw new Error("invalid arguments");
      const value = await write("tool-test", {
        name,
        arguments: parsed,
        mode: mode === "export" && !confirm ? "preview" : "execute",
        ...(confirm ? { confirmation_ref: confirmation } : {}),
      });
      setResult(value);
      setConfirmation(str(value.confirmation_ref));
    });
  }
  return (
    <Modal title={name} open onClose={onClose}>
      <Notice error={detail.error || action.error} />
      <p className="text-sm text-muted-foreground">{str(tool.description)}</p>
      <div className="flex gap-2" role="tablist">
        {(["input", "output", "test"] as const).map((key) => (
          <Button
            key={key}
            role="tab"
            aria-selected={tab === key}
            variant={tab === key ? "default" : "outline"}
            onClick={() => setTab(key)}
          >
            {t(key)}
          </Button>
        ))}
      </div>
      {detail.isPending && <p>{t("loading")}</p>}
      {!detail.isPending &&
        (tab === "test" ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">{t(mode === "validate" ? "validateOnly" : "toolHint")}</p>
            <Field label={t("arguments")}>
              <textarea
                className="min-h-40 rounded-md border bg-background p-3 font-mono text-xs"
                value={args}
                onChange={(e) => changeArguments(e.target.value)}
              />
            </Field>
            <Button
              disabled={action.pending || !strings(snapshot.permissions).includes("tools.execute")}
              onClick={() => invoke()}
            >
              {t(mode === "export" ? "preview" : "execute")}
            </Button>
            {confirmation && (
              <div className="space-y-2 rounded-md border p-3">
                <p>{t("confirmUse")}</p>
                <Button disabled={action.pending} onClick={() => invoke(true)}>
                  {t("confirm")}
                </Button>
              </div>
            )}
            {result && <JsonView value={result} />}
          </div>
        ) : (
          <Schema value={tool[tab === "input" ? "inputSchema" : "outputSchema"]} />
        ))}
    </Modal>
  );
}
