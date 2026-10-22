"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { rows, str, strings, type Row } from "@/lib/http/managedGateway";
import { Enabled, Field, Grid, Modal, Notice, TextField, useAction, useGateway, useGatewayQuery } from "./Shared";
import { useCopy } from "./locale";
import { formatMoney } from "@/utils/currency";
import { CnyInput } from "@/components/shared/CnyInput";

const money = (value: unknown): string => formatMoney(typeof value === "number" ? value : null);

export function Models({ kind }: { kind: "apis" | "models" | "users" }) {
  const t = useCopy();
  const { snapshot, write } = useGateway();
  const query = useGatewayQuery("model-config");
  const directory = useGatewayQuery("model-members", undefined, kind === "users");
  const [editing, setEditing] = useState<Row | null>(null);
  const [creating, setCreating] = useState(false);
  const [rotating, setRotating] = useState<Row | null>(null);
  const action = useAction();
  const canWrite = strings(snapshot.permissions).includes("models.write");
  async function rotate(row: Row) {
    await action.run(async () => {
      await write("model-key-rotate", { subject: row.subject, revision: query.data?.revision });
      setRotating(null);
    });
  }
  const columnSets = {
    apis: [
      { key: "label", label: t("name") },
      { key: "id", label: t("id") },
      { key: "provider", label: t("provider") },
      { key: "base_url", label: t("base") },
      { key: "enabled", label: t("enabled") },
    ],
    models: [
      { key: "label", label: t("name") },
      { key: "id", label: t("id") },
      { key: "api_id", label: t("api") },
      { key: "upstream_model", label: t("upstream") },
      { key: "context_window", label: t("context") },
      { key: "max_output_tokens", label: t("maxOutput") },
      { key: "enabled", label: t("enabled") },
    ],
    users: [
      { key: "label", label: t("owner") },
      { key: "subject", label: t("subject") },
      { key: "models", label: t("models"), render: (r: Row) => strings(r.models).join(", ") },
      { key: "max_budget", label: t("budget"), render: (row: Row) => money(row.max_budget) },
      { key: "spend", label: t("spend"), render: (row: Row) => money(row.spend) },
      { key: "enabled", label: t("enabled") },
    ],
  };
  const columns = columnSets[kind];
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{t(kind === "users" ? "explicitGrant" : "noKeys")}</p>
      <Notice error={query.error || action.error} />
      {canWrite && (
        <Button
          onClick={() => {
            setEditing({ enabled: true });
            setCreating(true);
          }}
        >
          {t("add")}
        </Button>
      )}
      {query.isPending ? (
        <p>{t("loading")}</p>
      ) : (
        <Grid
          data={rows(query.data?.[kind])}
          columns={columns}
          actions={
            canWrite
              ? (row) => (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEditing(row);
                        setCreating(false);
                      }}
                    >
                      {t("edit")}
                    </Button>
                    {kind === "users" && (
                      <Button variant="outline" disabled={action.pending} onClick={() => setRotating(row)}>
                        {t("rotate")}
                      </Button>
                    )}
                  </>
                )
              : undefined
          }
        />
      )}
      {editing && query.data && (
        <ModelForm
          key={`${kind}-${str(editing.id) || str(editing.subject)}-${creating}`}
          kind={kind}
          initial={editing}
          creating={creating}
          config={query.data}
          members={rows(directory.data?.members)}
          onClose={() => setEditing(null)}
        />
      )}
      {rotating && (
        <Modal title={t("rotate")} open onClose={() => setRotating(null)}>
          <p>{t("rotationConfirm")}</p>
          <Notice error={action.error} />
          <div className="flex justify-end gap-2">
            <Button variant="outline" disabled={action.pending} onClick={() => setRotating(null)}>{t("cancel")}</Button>
            <Button disabled={action.pending} onClick={() => rotate(rotating)}>{t("rotate")}</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function ModelForm({
  kind,
  initial,
  config,
  members,
  creating,
  onClose,
}: {
  kind: "apis" | "models" | "users";
  initial: Row;
  config: Row;
  members: Row[];
  creating: boolean;
  onClose: () => void;
}) {
  const t = useCopy();
  const { write } = useGateway();
  const action = useAction();
  const [data, setData] = useState<Row>({ provider: "openai", ...initial });
  const [identifier, setIdentifier] = useState(str(initial.id) || str(initial.subject));
  const [key, setKey] = useState("");
  const change = (name: string, value: string | boolean | number | string[]) =>
    setData((prev) => ({ ...prev, [name]: value }));
  const field = (name: string, label: string, numeric = false) => (
    <TextField
      key={name}
      label={label}
      required
      value={str(data[name])}
      type={numeric ? "number" : "text"}
      onChange={(v) => change(name, numeric ? Number(v) : v)}
    />
  );
  async function save(e: React.FormEvent) {
    e.preventDefault();
    await action.run(async () => {
      function payloadForKind(): Row {
        const common = { label: data.label ?? "", enabled: data.enabled === true };
        if (kind === "apis")
          return {
            ...common,
            base_url: data.base_url ?? "",
            provider: data.provider ?? "openai",
            protocol: data.protocol ?? "openai",
            ...(key ? { api_key: key } : {}),
          };
        if (kind === "models")
          return {
            ...common,
            api_id: data.api_id ?? "",
            upstream_model: data.upstream_model ?? "",
            context_window: data.context_window ?? 0,
            max_output_tokens: data.max_output_tokens ?? 0,
            protocol: data.protocol ?? "openai",
          };
        return {
          ...common,
          models: strings(data.models),
          ...Object.fromEntries(
            ["max_budget", "rpm_limit", "tpm_limit"].map((k) => [
              k,
              data[k] === "" || data[k] === undefined ? null : data[k],
            ]),
          ),
        };
      }
      const payload = payloadForKind();
      await write("model-config", { kind, id: identifier, data: payload, revision: config.revision }, "PUT");
      onClose();
    });
  }
  return (
    <Modal title={t(kind === "users" ? "grants" : kind)} open onClose={onClose}>
      <form onSubmit={save} className="grid gap-4">
        {kind === "users" ? (
          <Field label={t("owner")}>
            <select
              aria-label={t("owner")}
              className="rounded-md border bg-background p-2"
              disabled={!creating}
              required
              value={identifier}
              onChange={(e) => {
                setIdentifier(e.target.value);
                change("label", str(members.find((m) => m.subject === e.target.value)?.label));
              }}
            >
              <option value="">{t("select")}</option>
              {members.map((m) => (
                <option key={str(m.subject)} value={str(m.subject)}>
                  {str(m.label)}
                </option>
              ))}
              {!creating && !members.some((m) => m.subject === identifier) && (
                <option value={identifier}>{str(initial.label)}</option>
              )}
            </select>
          </Field>
        ) : (
          <Field label={t("id")}>
            <input
              className="rounded-md border p-2"
              required
              disabled={!creating}
              pattern="[a-z][a-z0-9_-]{0,63}"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
            />
          </Field>
        )}
        {field("label", t("name"))}
        {kind === "apis" && (
          <>
            {field("base_url", t("base"))}
            {field("provider", t("provider"))}
            <TextField label={t("key")} type="password" value={key} required={creating} onChange={setKey} />
          </>
        )}
        {kind === "models" && (
          <>
            <Field label={t("api")}>
              <select
                required
                className="rounded-md border p-2"
                value={str(data.api_id)}
                onChange={(e) => change("api_id", e.target.value)}
              >
                <option value="">{t("select")}</option>
                {rows(config.apis).map((api) => (
                  <option key={str(api.id)} value={str(api.id)}>
                    {str(api.label)}
                  </option>
                ))}
              </select>
            </Field>
            {field("upstream_model", t("upstream"))}
            {field("context_window", t("context"), true)}
            {field("max_output_tokens", t("maxOutput"), true)}
          </>
        )}
        {kind !== "users" && (
          <Field label={t("protocol")}>
            <select
              className="rounded-md border p-2"
              value={str(data.protocol) || "openai"}
              onChange={(e) => change("protocol", e.target.value)}
            >
              <option value="openai">OpenAI</option>
              <option value="messages">Anthropic Messages</option>
            </select>
          </Field>
        )}
        {kind === "users" && (
          <>
            <p className="text-sm text-muted-foreground">{t("explicitGrant")}</p>
            <fieldset className="grid max-h-60 gap-2 overflow-auto rounded-md border p-3">
              <legend>{t("models")}</legend>
              {rows(config.models).map((m) => (
                <label key={str(m.id)} className="flex gap-2">
                  <input
                    type="checkbox"
                    checked={strings(data.models).includes(str(m.id))}
                    onChange={(e) =>
                      change(
                        "models",
                        e.target.checked
                          ? [...strings(data.models), str(m.id)]
                          : strings(data.models).filter((id) => id !== m.id),
                      )
                    }
                  />
                  {str(m.label)}
                </label>
              ))}
            </fieldset>
            <Field label={`${t("budget")} (¥)`}>
              <CnyInput
                usdValue={typeof data.max_budget === "number" ? data.max_budget : null}
                onUsdChange={(value) => change("max_budget", value ?? "")}
              />
            </Field>
            {["rpm_limit", "tpm_limit"].map((name, i) => (
              <TextField
                key={name}
                label={t((["rpm", "tpm"] as const)[i])}
                type="number"
                value={str(data[name])}
                onChange={(v) => change(name, v === "" ? "" : Number(v))}
              />
            ))}
          </>
        )}
        <Enabled checked={data.enabled === true} onChange={(v) => change("enabled", v)} />
        <Notice error={action.error} />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            {t("cancel")}
          </Button>
          <Button type="submit" disabled={action.pending}>
            {t("save")}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function Workspace({ usage = false }: { usage?: boolean }) {
  const t = useCopy();
  const self = useGatewayQuery("model-self");
  const accounts = useGatewayQuery("personal-account", undefined, !usage);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const logs = useGatewayQuery("model-usage", { start: start || undefined, end: end || undefined }, usage);
  return (
    <div className="space-y-5">
      <Notice error={self.error || (usage ? logs.error : accounts.error)} />
      <p className="text-sm text-muted-foreground">{t("noKeys")}</p>
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          [t("modelList"), rows(self.data?.models).length],
          [t("spend"), money(self.data?.spend)],
          [t("budget"), money(self.data?.max_budget)],
        ].map(([label, value]) => (
          <div key={str(label)} className="rounded-lg border bg-card p-5">
            <p className="text-sm text-muted-foreground">{str(label)}</p>
            <p className="mt-3 text-2xl font-semibold">{str(value)}</p>
          </div>
        ))}
      </div>
      {usage ? (
        <>
          <div className="flex gap-4">
            <TextField label={t("dateStart")} type="date" value={start} onChange={setStart} />
            <TextField label={t("dateEnd")} type="date" value={end} onChange={setEnd} />
          </div>
          <Grid
            data={rows(logs.data?.records)}
            columns={[
              { key: "startTime", label: t("time") },
              { key: "model", label: t("models") },
              { key: "spend", label: t("spend"), render: (row: Row) => money(row.spend) },
              { key: "total_tokens", label: t("tokens") },
              { key: "status", label: t("status") },
            ]}
          />
        </>
      ) : (
        <Grid
          data={rows(self.data?.models)}
          columns={[
            { key: "label", label: t("name") },
            { key: "id", label: t("id") },
            { key: "contextWindow", label: t("context") },
            { key: "maxOutputTokens", label: t("maxOutput") },
          ]}
        />
      )}
    </div>
  );
}
