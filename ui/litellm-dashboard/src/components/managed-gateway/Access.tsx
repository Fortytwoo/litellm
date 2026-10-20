"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { obj, rows, str, strings, type Row } from "@/lib/http/managedGateway";
import { Field, Grid, Modal, Notice, TextField, useAction, useGateway, useGatewayQuery } from "./Shared";
import { useCopy } from "./locale";

export function Access({ departments = false }: { departments?: boolean }) {
  const t = useCopy();
  const { snapshot, write } = useGateway();
  const directory = useGatewayQuery("directory");
  const policy = useGatewayQuery("policy");
  const [selected, setSelected] = useState<Row | null>(null);
  const [roleEditor, setRoleEditor] = useState(false);
  const [policyDraft, setPolicyDraft] = useState("");
  const action = useAction();
  const document = obj(policy.data?.document);
  const bindings = obj(document[departments ? "groups" : "bindings"]);
  const entries = rows(directory.data?.[departments ? "departments" : "members"]).map((r) => {
    const binding = obj(bindings[str(r[departments ? "id" : "subject"])]);
    return {
      ...r,
      role_labels: strings(binding.roles)
        .map((id) => str(obj(obj(document.roles)[id]).label) || id)
        .join(", "),
      tool_rules: strings(binding.tools).join(", "),
    };
  });
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{t(departments ? "inherited" : "serverChecks")}</p>
      <Notice error={directory.error || policy.error || action.error} />
      <Button
        variant="outline"
        onClick={() => {
          setPolicyDraft(JSON.stringify(document, null, 2));
          setRoleEditor(true);
        }}
      >
        {t("roles")}
      </Button>
      <Grid
        data={entries}
        columns={[
          { key: "label", label: t("name") },
          { key: departments ? "id" : "subject", label: t("subject") },
          { key: "role_labels", label: t("role") },
          { key: "tool_rules", label: t("tools") },
          ...(departments ? [{ key: "member_count", label: t("count") }] : []),
        ]}
        actions={(row) => (
          <Button variant="outline" onClick={() => setSelected(row)}>
            {t("edit")}
          </Button>
        )}
      />
      {selected && policy.data && (
        <Binding
          key={str(selected.id) || str(selected.subject)}
          selected={selected}
          departments={departments}
          policy={policy.data}
          onClose={() => setSelected(null)}
        />
      )}
      <Modal title={t("roles")} open={roleEditor} onClose={() => setRoleEditor(false)}>
        <p className="text-sm text-muted-foreground">{t("serverChecks")}</p>
        <Field label={t("policyJson")}>
          <textarea
            className="min-h-80 rounded-md border p-3 font-mono text-xs"
            value={policyDraft}
            onChange={(e) => setPolicyDraft(e.target.value)}
          />
        </Field>
        <Notice error={action.error} />
        <Button
          disabled={action.pending}
          onClick={() =>
            action.run(async () => {
              const value: unknown = JSON.parse(policyDraft);
              await write("policy", { expected_revision: policy.data?.revision, document: value }, "PUT");
              setRoleEditor(false);
            })
          }
        >
          {t("save")}
        </Button>
      </Modal>
    </div>
  );
}

function Binding({
  selected,
  departments,
  policy,
  onClose,
}: {
  selected: Row;
  departments: boolean;
  policy: Row;
  onClose: () => void;
}) {
  const t = useCopy();
  const { write } = useGateway();
  const action = useAction();
  const document = obj(policy.document);
  const id = str(selected[departments ? "id" : "subject"]);
  const previous = obj(obj(document[departments ? "groups" : "bindings"])[id]);
  const [roles, setRoles] = useState(strings(previous.roles));
  const [tools, setTools] = useState(strings(previous.tools).join("\n"));
  const save = (remove = false) =>
    action.run(async () => {
      await write("bulk-bindings", {
        expected_revision: policy.revision,
        kind: departments ? "department" : "member",
        selected: [id],
        binding: remove
          ? null
          : {
              ...previous,
              roles,
              tools: tools
                .split("\n")
                .map((v) => v.trim())
                .filter(Boolean),
            },
      });
      onClose();
    });
  return (
    <Modal title={str(selected.label)} open onClose={onClose}>
      <fieldset className="grid gap-2 rounded-md border p-3">
        <legend>{t("role")}</legend>
        {Object.entries(obj(document.roles)).map(([id, role]) => (
          <label key={id} className="flex items-start gap-2">
            <input
              type="checkbox"
              checked={roles.includes(id)}
              onChange={(e) => setRoles(e.target.checked ? [...roles, id] : roles.filter((r) => r !== id))}
            />
            <span>
              {str(obj(role).label) || id}
              <small className="block text-muted-foreground">{strings(obj(role).permissions).join(", ")}</small>
            </span>
          </label>
        ))}
      </fieldset>
      <Field label={t("toolsAllowed")}>
        <textarea
          className="min-h-28 rounded-md border p-2 font-mono text-xs"
          value={tools}
          onChange={(e) => setTools(e.target.value)}
        />
      </Field>
      <Notice error={action.error} />
      <div className="flex justify-between gap-2">
        <Button variant="destructive" disabled={action.pending} onClick={() => save(true)}>
          {t("deleteBinding")}
        </Button>
        <Button disabled={action.pending} onClick={() => save()}>
          {t("save")}
        </Button>
      </div>
    </Modal>
  );
}

export function Accounts() {
  const t = useCopy();
  const { snapshot, write } = useGateway();
  const own = useGatewayQuery("personal-account");
  const canAdmin = strings(snapshot.permissions).includes("policy.write");
  const catalog = useGatewayQuery("yuntu-account-catalog", undefined, canAdmin);
  const directory = useGatewayQuery("directory", undefined, canAdmin);
  const action = useAction();
  const [importing, setImporting] = useState(false);
  const [assignment, setAssignment] = useState(false);
  const [login, setLogin] = useState<Row | null>(null);
  const [viewer, setViewer] = useState("");
  async function loginAction(kind: "start" | "poll" | "cancel" | "viewer") {
    await action.run(async () => {
      const value = await write("yuntu-login", {
        action: kind,
        ...(kind === "start" ? {} : { login_ref: login?.login_ref }),
      });
      if (kind === "viewer") {
        const url = str(value.login_url);
        if (url.startsWith("https://")) setViewer(url);
      } else {
        setLogin(kind === "cancel" ? null : value);
        setViewer("");
      }
    });
  }
  return (
    <div className="space-y-6">
      <Notice error={own.error || (canAdmin && catalog.error) || action.error} />
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">{t("myAccounts")}</h2>
        <p className="text-sm text-muted-foreground">{t("accountHint")}</p>
        <Button variant="outline" disabled={action.pending} onClick={() => loginAction("start")}>
          {t("accountLogin")}
        </Button>
        {login && (
          <div className="space-y-2 rounded-md border p-3">
            <p>
              {t("startLoginNotice")} {str(login.state)}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => loginAction("viewer")}>
                {t("viewer")}
              </Button>
              <Button variant="outline" onClick={() => loginAction("poll")}>
                {t("loginPoll")}
              </Button>
              <Button variant="outline" onClick={() => loginAction("cancel")}>
                {t("loginCancel")}
              </Button>
              {viewer && (
                <a className="text-primary underline" target="_blank" rel="noopener noreferrer" href={viewer}>
                  {t("viewer")}
                </a>
              )}
            </div>
          </div>
        )}
        <Grid
          data={rows(own.data?.accounts)}
          columns={[
            { key: "label", label: t("name") },
            { key: "source", label: t("description") },
            { key: "is_default", label: t("currentDefault") },
          ]}
          actions={(row) => (
            <Button
              variant="outline"
              disabled={action.pending || row.is_default === true}
              onClick={() => action.run(() => write("yuntu-account-default", { account_ref: row.account_ref }, "PUT"))}
            >
              {t("default")}
            </Button>
          )}
        />
      </div>
      {canAdmin && <AccountBindings catalog={catalog} directory={directory} />}
      {canAdmin && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">{t("managedAccounts")}</h2>
          <div className="flex gap-2">
            <Button onClick={() => setImporting(true)}>{t("import")}</Button>
            <Button variant="outline" onClick={() => setAssignment(true)}>
              {t("assign")}
            </Button>
          </div>
          <Grid
            data={rows(catalog.data?.accounts)}
            columns={[
              { key: "label", label: t("name") },
              { key: "account_ref", label: t("id") },
              { key: "enabled", label: t("enabled") },
              { key: "revision", label: t("version") },
            ]}
            actions={(row) => (
              <Button
                variant="outline"
                disabled={action.pending}
                onClick={() =>
                  action.run(() =>
                    write(
                      "yuntu-account-state",
                      { account_ref: row.account_ref, enabled: row.enabled !== true, revision: row.revision },
                      "PUT",
                    ),
                  )
                }
              >
                {t(row.enabled === true ? "disabled" : "enabled")}
              </Button>
            )}
          />
        </div>
      )}
      {importing && <ImportAccount onClose={() => setImporting(false)} />}
      {assignment && (
        <AssignAccounts
          accounts={rows(catalog.data?.accounts)}
          members={rows(directory.data?.members)}
          onClose={() => setAssignment(false)}
        />
      )}
    </div>
  );
}

function AccountBindings({
  catalog,
  directory,
}: {
  catalog: ReturnType<typeof useGatewayQuery>;
  directory: ReturnType<typeof useGatewayQuery>;
}) {
  const t = useCopy();
  const members = rows(directory.data?.members);
  const bindings = rows(catalog.data?.bindings);
  function bindingStatus(binding: Row): string {
    if (!binding.grant_enabled) return t("bindingRevoked");
    if (!binding.account_enabled) return t("accountDisabled");
    return t("enabled");
  }
  const memberNames = new Map(members.map((member) => [str(member.subject), str(member.label)]));
  const boundSubjects = new Set(bindings.map((binding) => str(binding.subject)));
  const entries = [
    ...bindings.map((binding) => ({
      subject: str(binding.subject),
      member: memberNames.get(str(binding.subject)) || t("unknownMember"),
      account: str(binding.label),
      source: t(binding.source === "self_login" ? "selfLogin" : "adminGrant"),
      status: bindingStatus(binding),
      default: t(binding.is_default ? "defaultAccount" : "notDefault"),
    })),
    ...members
      .filter((member) => !boundSubjects.has(str(member.subject)))
      .map((member) => ({
        subject: str(member.subject),
        member: str(member.label),
        account: t("unbound"),
        source: "",
        status: t("unbound"),
        default: "",
      })),
  ];
  const isLoading = catalog.isPending || directory.isPending;
  const complete = Array.isArray(catalog.data?.bindings) && Array.isArray(directory.data?.members);
  const failed = Boolean(catalog.error || directory.error) || (!isLoading && !complete);
  return (
    <section aria-label={t("accountBindings")} className="space-y-3">
      <h2 className="text-lg font-semibold">{t("accountBindings")}</h2>
      {isLoading && <p>{t("loading")}</p>}
      {!isLoading && failed && (
        <>
          <Notice error={t("bindingReadError")} />
          <Button
            variant="outline"
            onClick={() => {
              void catalog.refetch();
              void directory.refetch();
            }}
          >
            {t("retry")}
          </Button>
        </>
      )}
      {!isLoading && !failed && (
        <Grid
          data={entries}
          columns={[
            { key: "member", label: t("owner") },
            { key: "account", label: t("yuntuAccount") },
            { key: "source", label: t("bindingSource") },
            { key: "status", label: t("status") },
            { key: "default", label: t("currentDefault") },
          ]}
        />
      )}
    </section>
  );
}

function ImportAccount({ onClose }: { onClose: () => void }) {
  const t = useCopy();
  const pool = useGatewayQuery("yuntu-pool-accounts");
  const { write } = useGateway();
  const action = useAction();
  const [candidate, setCandidate] = useState<Row | null>(null);
  const [label, setLabel] = useState("");
  return (
    <Modal title={t("candidates")} open onClose={onClose}>
      <Notice error={pool.error || action.error} />
      <Grid
        data={rows(pool.data?.accounts)}
        columns={[
          { key: "label", label: t("name") },
          { key: "status", label: t("status") },
        ]}
        actions={(row) => (
          <Button
            variant={candidate?.candidate_ref === row.candidate_ref ? "default" : "outline"}
            disabled={!!row.account_ref}
            onClick={() => {
              setCandidate(row);
              setLabel(str(row.label));
            }}
          >
            {t(candidate?.candidate_ref === row.candidate_ref ? "selected" : "select")}
          </Button>
        )}
      />
      {candidate && (
        <div className="space-y-3 rounded-md border p-3">
          <p>
            {t("selected")}: {str(candidate.label)}
          </p>
          <TextField label={t("name")} value={label} onChange={setLabel} />
          <Button
            disabled={action.pending || !label.trim()}
            onClick={() =>
              action.run(async () => {
                await write("yuntu-account-import", { candidate_ref: candidate.candidate_ref, label });
                onClose();
              })
            }
          >
            {t("importConfirm")}
          </Button>
        </div>
      )}
    </Modal>
  );
}

function AssignAccounts({ accounts, members, onClose }: { accounts: Row[]; members: Row[]; onClose: () => void }) {
  const t = useCopy();
  const { write } = useGateway();
  const action = useAction();
  const [subject, setSubject] = useState("");
  const [grants, setGrants] = useState<Row[] | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  async function load(value: string) {
    setSubject(value);
    setGrants(null);
    setSelected([]);
    if (value)
      await action.run(async () => {
        const data = await write("yuntu-account-grants", { subject: value });
        setGrants(rows(data.grants));
        setSelected(
          rows(data.grants)
            .filter((g) => g.enabled === true)
            .map((g) => str(g.account_ref)),
        );
      });
  }
  return (
    <Modal title={t("assign")} open onClose={onClose}>
      <Field label={t("owner")}>
        <select
          disabled={action.pending}
          className="rounded-md border p-2"
          value={subject}
          onChange={(e) => load(e.target.value)}
        >
          <option value="">{t("select")}</option>
          {members.map((m) => (
            <option key={str(m.subject)} value={str(m.subject)}>
              {str(m.label)}
            </option>
          ))}
        </select>
      </Field>
      <Notice error={action.error} />
      {grants && (
        <>
          <fieldset className="grid gap-2 rounded-md border p-3">
            {accounts.map((account) => {
              const ref = str(account.account_ref);
              return (
                <label key={ref} className="flex gap-2">
                  <input
                    type="checkbox"
                    checked={selected.includes(ref)}
                    onChange={(e) =>
                      setSelected(e.target.checked ? [...selected, ref] : selected.filter((r) => r !== ref))
                    }
                  />
                  {str(account.label)}
                </label>
              );
            })}
          </fieldset>
          <Button
            disabled={action.pending}
            onClick={() =>
              action.run(async () => {
                const changes = accounts
                  .filter(
                    (a) =>
                      (grants.find((g) => g.account_ref === a.account_ref)?.enabled === true) !==
                      selected.includes(str(a.account_ref)),
                  )
                  .map((a) => ({
                    account_ref: a.account_ref,
                    enabled: selected.includes(str(a.account_ref)),
                    revision: grants.find((g) => g.account_ref === a.account_ref)?.revision ?? 0,
                  }));
                if (changes.length) await write("yuntu-account-grants-batch", { subject, changes });
                onClose();
              })
            }
          >
            {t("save")}
          </Button>
        </>
      )}
    </Modal>
  );
}
