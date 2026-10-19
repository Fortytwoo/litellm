"use client";
import { t as translateUi } from "@/i18n";

import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import React, { useState, useEffect, useId } from "react";
import { Save, Plus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UiLoadingSpinner } from "@/components/ui/ui-loading-spinner";
import { DeprecationBanner } from "@/components/DeprecationBanner";
import { toast } from "@/lib/toast";
import {
  getGeneralSettingsCall,
  updateConfigFieldSetting,
  deleteConfigFieldSetting,
  fetchMCPClientIp,
} from "@/components/networking";

interface MCPNetworkSettingsProps {
  accessToken: string | null;
}

/**
 * Given an IP like "203.0.113.45", return "203.0.113.0/24".
 */
function ipToSlash24(ip: string): string {
  const parts = ip.split(".");
  if (parts.length !== 4) return ip + "/32";
  return `${parts[0]}.${parts[1]}.${parts[2]}.0/24`;
}

export interface AllowedClient {
  readonly alias: string;
  readonly value: string;
}

interface AllowedClientRow extends AllowedClient {
  readonly key: string;
}

interface ClientDraft extends AllowedClient {
  readonly key: string | null;
}

const isAllowedClient = (entry: unknown): entry is AllowedClient => {
  if (typeof entry !== "object" || entry === null) return false;
  const { alias, value } = entry as Partial<Record<keyof AllowedClient, unknown>>;
  return typeof alias === "string" && typeof value === "string" && !isIncomplete({ alias, value });
};

type StoredAllowlist =
  | { readonly kind: "absent" }
  | { readonly kind: "clients"; readonly clients: AllowedClient[] }
  | { readonly kind: "malformed" };

const ABSENT: StoredAllowlist = { kind: "absent" };

const parseStoredClients = (fieldValue: unknown): StoredAllowlist => {
  if (fieldValue === null || fieldValue === undefined) return ABSENT;
  if (Array.isArray(fieldValue) && fieldValue.every(isAllowedClient)) {
    return { kind: "clients", clients: fieldValue.map(({ alias, value }) => ({ alias, value })) };
  }
  return { kind: "malformed" };
};

let nextRowKey = 0;
const newRow = (client: AllowedClient): AllowedClientRow => ({ ...client, key: `client-${nextRowKey++}` });

const trimClient = ({ alias, value }: AllowedClient): AllowedClient => ({ alias: alias.trim(), value: value.trim() });

const isIncomplete = ({ alias, value }: AllowedClient) => alias === "" || value === "";

const sameList = (a: string[], b: string[]) => a.length === b.length && a.every((value, i) => value === b[i]);

const sameClients = (a: AllowedClient[], b: AllowedClient[]) =>
  a.length === b.length && a.every((client, i) => client.alias === b[i].alias && client.value === b[i].value);

const unchangedSinceLoad = (value: string[], stored: string[] | null) =>
  stored === null ? value.length === 0 : value.length > 0 && sameList(value, stored);

const clientsUnchangedSinceLoad = (value: AllowedClient[], stored: StoredAllowlist) => {
  switch (stored.kind) {
    case "absent":
      return value.length === 0;
    case "clients":
      return value.length > 0 && sameClients(value, stored.clients);
    case "malformed":
      return false;
  }
};

const headerUnchangedSinceLoad = (value: string, stored: string | null) =>
  stored === null ? value === "" : value !== "" && value === stored;

interface AllowedClientDialogProps {
  readonly draft: ClientDraft | null;
  readonly onChange: (draft: ClientDraft) => void;
  readonly onCommit: () => void;
  readonly onRemove: () => void;
  readonly onClose: () => void;
}

const AllowedClientDialog: React.FC<AllowedClientDialogProps> = ({ draft, onChange, onCommit, onRemove, onClose }) => {
  const { t: uiT } = useDashboardLanguage();

  const aliasId = useId();
  const valueId = useId();
  if (draft === null) return null;
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{draft.key === null ? uiT("ui.08553377f210d612") : uiT("ui.63314a49c845e0dd")}</DialogTitle>
          <DialogDescription>{uiT("ui.34e0f8e09a6a08d4")}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor={aliasId}>{uiT("ui.b19e02e9502bbe5a")}</Label>
            <Input
              id={aliasId}
              value={draft.alias}
              placeholder={uiT("ui.f503b707eb23e32e")}
              onChange={(e) => onChange({ ...draft, alias: e.target.value })}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor={valueId}>{uiT("ui.8e37953d23daca5f")}</Label>
            <Input
              id={valueId}
              value={draft.value}
              placeholder={uiT("ui.ae7cf838bc717fe8")}
              className="font-mono"
              onChange={(e) => onChange({ ...draft, value: e.target.value })}
            />
          </div>
        </div>
        <DialogFooter>
          {draft.key !== null && (
            <Button type="button" variant="destructive" className="sm:mr-auto" onClick={onRemove}>
              {uiT("ui.198fca67d27093c4")}
            </Button>
          )}
          <Button type="button" variant="outline" onClick={onClose}>
            {uiT("ui.19766ed6ccb2")}
          </Button>
          <Button type="button" disabled={isIncomplete(trimClient(draft))} onClick={onCommit}>
            {draft.key === null ? uiT("ui.9fd728c66c9a") : uiT("ui.11a6767d5674c7e4")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const MCPNetworkSettings: React.FC<MCPNetworkSettingsProps> = ({ accessToken }) => {
  const { t: uiT } = useDashboardLanguage();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [privateRanges, setPrivateRanges] = useState<string[]>([]);
  const [allowedClients, setAllowedClients] = useState<AllowedClientRow[]>([]);
  const [clientIdHeader, setClientIdHeader] = useState("");
  const [storedRanges, setStoredRanges] = useState<string[] | null>(null);
  const [storedClients, setStoredClients] = useState<StoredAllowlist>(ABSENT);
  const [storedClientIdHeader, setStoredClientIdHeader] = useState<string | null>(null);
  const [currentIp, setCurrentIp] = useState<string | null>(null);
  const [rangeDraft, setRangeDraft] = useState("");
  const [clientDraft, setClientDraft] = useState<ClientDraft | null>(null);

  useEffect(() => {
    loadSettings();
    detectCurrentIp();
  }, [accessToken]);

  const loadSettings = async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const settings = await getGeneralSettingsCall(accessToken);
      for (const field of settings) {
        if (field.field_name === "mcp_internal_ip_ranges" && Array.isArray(field.field_value)) {
          setPrivateRanges(field.field_value);
          setStoredRanges(field.field_value);
        }
        if (field.field_name === "mcp_allowed_clients") {
          const stored = parseStoredClients(field.field_value);
          setAllowedClients(stored.kind === "clients" ? stored.clients.map(newRow) : []);
          setStoredClients(stored);
        }
        if (field.field_name === "mcp_client_id_header" && typeof field.field_value === "string") {
          setClientIdHeader(field.field_value);
          setStoredClientIdHeader(field.field_value);
        }
      }
    } catch (error) {
      console.error("Failed to load MCP network settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const detectCurrentIp = async () => {
    if (!accessToken) return;
    const ip = await fetchMCPClientIp(accessToken);
    if (ip) {
      setCurrentIp(ip);
    }
  };

  const persistRanges = async (token: string) => {
    if (unchangedSinceLoad(privateRanges, storedRanges)) return;
    if (privateRanges.length > 0) {
      await updateConfigFieldSetting(token, "mcp_internal_ip_ranges", privateRanges);
      setStoredRanges(privateRanges);
      return;
    }
    await deleteConfigFieldSetting(token, "mcp_internal_ip_ranges");
    setStoredRanges(null);
  };

  const persistAllowedClients = async (token: string) => {
    const clients = allowedClients.map(({ alias, value }) => ({ alias, value }));
    if (clientsUnchangedSinceLoad(clients, storedClients)) return;
    if (clients.length > 0) {
      await updateConfigFieldSetting(token, "mcp_allowed_clients", clients);
      setStoredClients({ kind: "clients", clients });
      return;
    }
    await deleteConfigFieldSetting(token, "mcp_allowed_clients");
    setStoredClients(ABSENT);
  };

  const persistClientIdHeader = async (token: string) => {
    const value = clientIdHeader.trim();
    if (headerUnchangedSinceLoad(value, storedClientIdHeader)) return;
    if (value !== "") {
      await updateConfigFieldSetting(token, "mcp_client_id_header", value);
      setStoredClientIdHeader(value);
      return;
    }
    await deleteConfigFieldSetting(token, "mcp_client_id_header");
    setStoredClientIdHeader(null);
  };

  const handleSave = async () => {
    if (!accessToken) return;
    setSaving(true);
    const [rangeResult] = await Promise.allSettled([persistRanges(accessToken)]);
    const [clientResult] = await Promise.allSettled([persistAllowedClients(accessToken)]);
    const [headerResult] = await Promise.allSettled([persistClientIdHeader(accessToken)]);
    setSaving(false);
    const failures = [rangeResult, clientResult, headerResult].filter(
      (result): result is PromiseRejectedResult => result.status === "rejected",
    );
    if (failures.length === 0) {
      toast.success(translateUi("ui.5cec04ae04ac4e5a"));
      return;
    }
    failures.forEach((failure) => toast.fromError(failure.reason));
  };

  const addSuggestedRange = (range: string) => {
    if (!privateRanges.includes(range)) {
      setPrivateRanges([...privateRanges, range]);
    }
  };

  // Commas separate entries, matching the old tokenised input.
  const splitDraft = (draft: string, existing: string[]) =>
    draft
      .split(",")
      .map((r) => r.trim())
      .filter((r) => r !== "" && !existing.includes(r));

  const commitDraft = () => {
    const added = splitDraft(rangeDraft, privateRanges);
    if (added.length > 0) {
      setPrivateRanges([...privateRanges, ...added]);
    }
    setRangeDraft("");
  };

  const commitClientDraft = () => {
    if (clientDraft === null) return;
    const client = trimClient(clientDraft);
    setAllowedClients(
      clientDraft.key === null
        ? [...allowedClients, newRow(client)]
        : allowedClients.map((row) => (row.key === clientDraft.key ? { ...row, ...client } : row)),
    );
    setClientDraft(null);
  };

  const removeDraftedClient = () => {
    if (clientDraft === null) return;
    setAllowedClients(allowedClients.filter((row) => row.key !== clientDraft.key));
    setClientDraft(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <UiLoadingSpinner className="size-6 text-muted-foreground" />
      </div>
    );
  }

  const suggestedRange = currentIp ? ipToSlash24(currentIp) : null;
  const storedAllowlistIsMalformed = storedClients.kind === "malformed";
  const storedAllowlistIsEmpty = storedClients.kind === "clients" && storedClients.clients.length === 0;

  return (
    <div className="space-y-6 p-4">
      <DeprecationBanner featureName="MCP Network Settings and the internal-network-only flag" />
      <div>
        <p className="text-lg font-semibold">{uiT("ui.49b061be186a10b8")}</p>
        <p className="mt-1 text-sm text-muted-foreground">{uiT("ui.652acba6b79c78a2")}</p>
      </div>

      <Card className="p-6">
        {currentIp && (
          <div className="mb-4 rounded-lg bg-muted p-3">
            <p className="text-sm">
              {uiT("ui.7629aa1f38fd1680")} <span className="font-mono font-medium">{currentIp}</span>
            </p>
            {suggestedRange && !privateRanges.includes(suggestedRange) && (
              <div className="mt-1 flex items-center gap-2">
                <p className="text-sm">{uiT("ui.3cb59055ad7b49c1")} </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="font-mono"
                  onClick={() => addSuggestedRange(suggestedRange)}
                >
                  <Plus />
                  {suggestedRange}
                </Button>
              </div>
            )}
          </div>
        )}

        <div className="mb-2 flex items-center">
          <p className="text-sm font-medium">{uiT("ui.b1252517b703ef76")}</p>
        </div>
        {privateRanges.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {privateRanges.map((range) => (
              <Badge key={range} variant="secondary" className="font-mono">
                {range}
                <button
                  type="button"
                  aria-label={uiT("ui.86790c6d4f116494", { v0: String(range) })}
                  onClick={() => setPrivateRanges(privateRanges.filter((r) => r !== range))}
                  className="ml-1 cursor-pointer"
                >
                  <X className="size-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
        <Input
          value={rangeDraft}
          placeholder={uiT("ui.d63033a39dc95c46")}
          onChange={(e) => setRangeDraft(e.target.value)}
          onBlur={commitDraft}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              commitDraft();
            }
          }}
        />
        <p className="mt-2 text-xs text-muted-foreground">{uiT("ui.64f42ec254092e7b")}</p>
      </Card>

      <div>
        <p className="text-lg font-semibold">{uiT("ui.7a5f53883a46e588")}</p>
        <p className="mt-1 text-sm text-muted-foreground">{uiT("ui.dcb540e3889aa417")}</p>
      </div>

      <Card className="p-6">
        {storedAllowlistIsMalformed && <p className="mb-2 text-sm text-destructive">{uiT("ui.7d561c8c4a7325ae")}</p>}
        {storedAllowlistIsEmpty && <p className="mb-2 text-sm text-destructive">{uiT("ui.a833241f83ad521d")}</p>}
        {allowedClients.length > 0 && (
          <div className="mb-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {allowedClients.map((row) => (
              <button
                key={row.key}
                type="button"
                className="flex min-w-0 flex-col items-start gap-1 rounded-lg border border-border bg-background p-3 text-left hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                onClick={() => setClientDraft(row)}
              >
                <span className="w-full truncate text-sm font-medium">{row.alias}</span>
                <span className="w-full truncate font-mono text-xs text-muted-foreground">{row.value}</span>
              </button>
            ))}
          </div>
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setClientDraft({ key: null, alias: "", value: "" })}
        >
          <Plus />
          {uiT("ui.08553377f210d612")}
        </Button>
        <p className="mt-2 text-xs text-muted-foreground">{uiT("ui.6a88f3961adbb82b")}</p>

        <div className="mt-6 mb-2 flex items-center">
          <p className="text-sm font-medium">{uiT("ui.800408d5dd1c3005")}</p>
        </div>
        <Input
          aria-label={uiT("ui.85b9dd840ba8d265")}
          value={clientIdHeader}
          placeholder={uiT("ui.9c2b31ce67bfe6c3")}
          onChange={(e) => setClientIdHeader(e.target.value)}
        />
        <p className="mt-2 text-xs text-muted-foreground">{uiT("ui.9964ffb62e141bd0")}</p>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          <Save />
          {uiT("ui.1509f561f241")}
        </Button>
      </div>

      <AllowedClientDialog
        draft={clientDraft}
        onChange={setClientDraft}
        onCommit={commitClientDraft}
        onRemove={removeDraftedClient}
        onClose={() => setClientDraft(null)}
      />
    </div>
  );
};

export default MCPNetworkSettings;
