"use client";
import { parseAsInteger, parseAsString, parseAsStringLiteral, useQueryStates } from "nuqs";
import { Button } from "@/components/ui/button";
import { auditTime, num, obj, rows, str } from "@/lib/http/managedGateway";
import { Grid, Notice, TextField, useGatewayQuery } from "./Shared";
import { useCopy } from "./locale";
const auditParsers = {
  auditKind: parseAsStringLiteral(["audit", "calls"] as const).withDefault("audit"),
  auditPage: parseAsInteger.withDefault(1),
  actor: parseAsString.withDefault(""),
  target: parseAsString.withDefault(""),
  outcome: parseAsString.withDefault(""),
  sort: parseAsStringLiteral(["created_at", "actor", "target", "outcome", "id"] as const).withDefault("created_at"),
  direction: parseAsStringLiteral(["asc", "desc"] as const).withDefault("desc"),
};
export function Audit() {
  const t = useCopy();
  const [params, setParams] = useQueryStates(auditParsers);
  const query = useGatewayQuery(params.auditKind, {
    page: params.auditPage,
    page_size: 25,
    actor: params.actor || undefined,
    target: params.target || undefined,
    outcome: params.outcome || undefined,
    sort: params.sort,
    direction: params.direction,
  });
  const identities = rows(query.data?.rows).map((row) => ({
    ...row,
    created_at: str(row.display_time) || auditTime(row.created_at),
    name: str(obj(row.identity).name),
    identity_id: str(obj(row.identity).open_id) || str(row.actor),
  }));
  return (
    <div className="space-y-4">
      <Notice error={query.error} />
      <div className="flex flex-wrap gap-2">
        <Button
          variant={params.auditKind === "audit" ? "default" : "outline"}
          onClick={() => setParams({ auditKind: "audit", auditPage: 1 })}
        >
          {t("decision")}
        </Button>
        <Button
          variant={params.auditKind === "calls" ? "default" : "outline"}
          onClick={() => setParams({ auditKind: "calls", auditPage: 1 })}
        >
          {t("calls")}
        </Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <TextField
          label={t("actor")}
          value={params.actor}
          onChange={(v) => setParams({ actor: v || null, auditPage: 1 })}
        />
        <TextField
          label={t("target")}
          value={params.target}
          onChange={(v) => setParams({ target: v || null, auditPage: 1 })}
        />
        <TextField
          label={t("outcome")}
          value={params.outcome}
          onChange={(v) => setParams({ outcome: v || null, auditPage: 1 })}
        />
      </div>
      <div className="flex gap-3">
        <select
          className="rounded-md border p-2"
          aria-label={t("sort")}
          value={params.sort}
          onChange={(e) => setParams({ sort: auditParsers.sort.parse(e.target.value), auditPage: 1 })}
        >
          {(["created_at", "actor", "target", "outcome", "id"] as const).map((key, i) => (
            <option key={key} value={key}>
              {t((["time", "actor", "target", "outcome", "id"] as const)[i])}
            </option>
          ))}
        </select>
        <Button
          variant="outline"
          onClick={() => setParams({ direction: params.direction === "asc" ? "desc" : "asc", auditPage: 1 })}
        >
          {params.direction === "asc" ? "↑" : "↓"}
        </Button>
      </div>
      <Grid
        serverPages
        data={identities}
        columns={[
          { key: "created_at", label: t("time") },
          { key: "name", label: t("actor") },
          { key: "identity_id", label: t("subject") },
          { key: "action", label: t("actions") },
          { key: "target", label: t("target") },
          { key: "outcome", label: t("outcome") },
        ]}
      />
      <div className="flex justify-end gap-3">
        <Button
          variant="outline"
          disabled={params.auditPage <= 1}
          onClick={() => setParams({ auditPage: params.auditPage - 1 })}
        >
          {t("previous")}
        </Button>
        <span className="self-center text-sm">
          {params.auditPage} / {Math.max(1, Math.ceil(num(query.data?.total) / 25))}
        </span>
        <Button
          variant="outline"
          disabled={params.auditPage * 25 >= num(query.data?.total)}
          onClick={() => setParams({ auditPage: params.auditPage + 1 })}
        >
          {t("next")}
        </Button>
      </div>
    </div>
  );
}
