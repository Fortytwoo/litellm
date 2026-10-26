"use client";
import { useUserDisplayLookup } from "@/app/(dashboard)/hooks/users/useUsers";
import { userSelectionLabel } from "@/utils/userDisplay";
import { translateText } from "@/i18n";

import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";

import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RefreshCw, Unplug } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UiLoadingSpinner } from "@/components/ui/ui-loading-spinner";
import { fetchMCPGatewaySessions, terminateMCPGatewaySessions } from "@/components/networking";
import type {
  MCPGatewaySessionGroupCount,
  MCPGatewaySessionSelector,
  MCPGatewaySessionsResponse,
  MCPGatewaySessionsTerminateResponse,
} from "@/components/mcp_tools/types";
import { createQueryKeys } from "@/app/(dashboard)/hooks/common/queryKeysFactory";

const mcpGatewaySessionKeys = createQueryKeys("mcpGatewaySessions");
const REFETCH_INTERVAL_MS = 15000;
const UNKNOWN_LABEL = "(unknown)";

export function formatIdleSeconds(idleSeconds: number): string {
  const total = Math.max(0, Math.floor(idleSeconds));
  if (total < 60) return `${total}s`;
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return seconds === 0 ? `${minutes}m` : `${minutes}m ${seconds}s`;
}

function groupLabel(label: string | null): string {
  if (label === null) return UNKNOWN_LABEL;
  return label === "" ? '""' : label;
}

export function describeSelector(
  selector: MCPGatewaySessionSelector,
  userNames: Readonly<Record<string, string>> = {},
): string {
  if (selector.user_id !== undefined)
    return `every live session opened by user ${userSelectionLabel({ user_id: selector.user_id, user_alias: userNames[selector.user_id] })}`;
  return `session ${selector.session_id_prefix}`;
}

export function describeTerminateResult(result: MCPGatewaySessionsTerminateResponse): string {
  const noun = result.terminated_sessions === 1 ? "session" : "sessions";
  return `Disconnected ${result.terminated_sessions} ${noun} on worker pid ${result.worker_pid}.`;
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-card border border-border rounded-lg px-4 py-3">
      <div className="text-2xl font-bold text-foreground">{value}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
    </div>
  );
}

function DisconnectUserButton({
  userId,
  onDisconnectUser,
}: {
  userId: string | null;
  onDisconnectUser: (userId: string) => void;
}) {
  const { t: uiT } = useDashboardLanguage();

  if (userId === null || userId === "") return null;
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => onDisconnectUser(userId)}
      aria-label={uiT("ui.36649defda0e28d3", { v0: String(groupLabel(userId)) })}
    >
      <Unplug className="size-4" />
      {uiT("ui.ea2a631dc487ae3f")}
    </Button>
  );
}

function GroupCountTable({
  title,
  groups,
  labelHeader,
  onDisconnectUser,
  userNames = {},
}: {
  title: string;
  groups: MCPGatewaySessionGroupCount[];
  labelHeader: string;
  onDisconnectUser?: (userId: string) => void;
  userNames?: Readonly<Record<string, string>>;
}) {
  const { t: uiT } = useDashboardLanguage();

  return (
    <section aria-label={title} className="rounded-lg border border-border bg-card">
      <h3 className="border-b border-border px-4 py-2 text-sm font-semibold text-foreground">{title}</h3>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{labelHeader}</TableHead>
            <TableHead className="text-right">{uiT("ui.6fa3cbf451b2a1d5")}</TableHead>
            {onDisconnectUser ? <TableHead className="text-right">{uiT("ui.ff8059dc6752")}</TableHead> : null}
          </TableRow>
        </TableHeader>
        <TableBody>
          {groups.map((group) => (
            <TableRow key={group.label ?? "__unknown__"}>
              <TableCell className="font-mono text-xs">
                <span title={group.label || undefined}>
                  {(group.label && userNames[group.label]) || groupLabel(group.label)}
                </span>
              </TableCell>
              <TableCell className="text-right">{group.count}</TableCell>
              {onDisconnectUser ? (
                <TableCell className="text-right">
                  <DisconnectUserButton userId={group.label} onDisconnectUser={onDisconnectUser} />
                </TableCell>
              ) : null}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </section>
  );
}

function SessionsBody({
  data,
  error,
  isLoading,
  onDisconnect,
  userNames,
}: {
  data: MCPGatewaySessionsResponse | undefined;
  error: Error | null;
  isLoading: boolean;
  onDisconnect: ((selector: MCPGatewaySessionSelector) => void) | null;
  userNames: Readonly<Record<string, string>>;
}) {
  const { t: uiT } = useDashboardLanguage();

  if (isLoading) {
    return (
      <div
        role="status"
        className="flex items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-card p-12"
      >
        <UiLoadingSpinner className="size-6 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">{uiT("ui.26b02665ce4dd84f")}</p>
      </div>
    );
  }
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>{uiT("ui.2d67fcc45db8b698")}</AlertTitle>
        <AlertDescription>{error.message}</AlertDescription>
      </Alert>
    );
  }
  if (!data) return null;
  if (data.total_sessions === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-card p-12 text-center">
        <p className="text-sm text-muted-foreground">
          {uiT("ui.0aea7de503bacf6f")} {data.worker_pid}
          {uiT("ui.88bc501d1a1fa7c0")}
        </p>
      </div>
    );
  }
  return (
    <>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label={uiT("ui.366487a11e4c5380")} value={data.total_sessions} />
        <StatCard label={uiT("ui.3b5681053bbebec7")} value={data.by_client.length} />
        <StatCard label={uiT("ui.6b0cc904d081")} value={data.by_user.length} />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <GroupCountTable title={uiT("ui.947b2997b284ea04")} labelHeader="Client" groups={data.by_client} />
        <GroupCountTable
          title={uiT("ui.84a06f355e5f5319")}
          labelHeader="User"
          groups={data.by_user}
          userNames={userNames}
          onDisconnectUser={onDisconnect ? (userId) => onDisconnect({ user_id: userId }) : undefined}
        />
      </div>
      <section aria-label={uiT("ui.366487a11e4c5380")} className="rounded-lg border border-border bg-card">
        <h3 className="border-b border-border px-4 py-2 text-sm font-semibold text-foreground">
          {uiT("ui.9c6eef438bbed2d2")} {data.worker_pid})
        </h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{uiT("ui.6959b4159575")}</TableHead>
              <TableHead>{uiT("ui.0c77fe09ab336a3e")}</TableHead>
              <TableHead>{uiT("ui.b512d97e7cbf")}</TableHead>
              <TableHead>{uiT("ui.c34b85dff3c3c063")}</TableHead>
              <TableHead>{uiT("ui.5985039f106d")}</TableHead>
              <TableHead>{uiT("ui.eb3f1fe56719b4a1")}</TableHead>
              <TableHead className="text-right">{uiT("ui.ab0171ca0494d441")}</TableHead>
              <TableHead className="text-right">{uiT("ui.b65abbf5920b271c")}</TableHead>
              {onDisconnect ? <TableHead className="text-right">{uiT("ui.ff8059dc6752")}</TableHead> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.sessions.map((session, index) => (
              <TableRow key={`${session.session_id_prefix}-${index}`}>
                <TableCell className="font-mono text-xs">{session.session_id_prefix}</TableCell>
                <TableCell>
                  {session.client_name === null ? (
                    <span className="text-muted-foreground">{translateText(UNKNOWN_LABEL)}</span>
                  ) : (
                    <>
                      <span className="font-mono text-xs">{groupLabel(session.client_name)}</span>
                      {session.client_version ? (
                        <span className="ml-1 text-xs text-muted-foreground">v{session.client_version}</span>
                      ) : null}
                    </>
                  )}
                </TableCell>
                <TableCell>
                  {session.user_id === null ? (
                    <span className="text-muted-foreground">{translateText(UNKNOWN_LABEL)}</span>
                  ) : (
                    <>
                      <span className="font-mono text-xs">{userNames[session.user_id] || session.user_id}</span>
                      {session.user_email ? (
                        <span className="ml-1 text-xs text-muted-foreground">{session.user_email}</span>
                      ) : null}
                    </>
                  )}
                </TableCell>
                <TableCell className="text-xs">{session.key_alias ?? "-"}</TableCell>
                <TableCell className="text-xs">{session.team_alias ?? session.team_id ?? "-"}</TableCell>
                <TableCell className="font-mono text-xs">{session.client_ip || "-"}</TableCell>
                <TableCell className="text-right text-xs">{formatIdleSeconds(session.idle_seconds)}</TableCell>
                <TableCell className="text-right text-xs">{session.in_flight_requests}</TableCell>
                {onDisconnect ? (
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDisconnect({ session_id_prefix: session.session_id_prefix })}
                      aria-label={uiT("ui.45786279269022e7", { v0: String(session.session_id_prefix) })}
                    >
                      <Unplug className="size-4" />
                      {uiT("ui.acfc5be785a9bb3d")}
                    </Button>
                  </TableCell>
                ) : null}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>
    </>
  );
}

interface MCPGatewaySessionsTabProps {
  accessToken: string | null;
  canTerminate: boolean;
}

export function MCPGatewaySessionsTab({ accessToken, canTerminate }: MCPGatewaySessionsTabProps) {
  const { t: uiT } = useDashboardLanguage();

  const queryClient = useQueryClient();
  const [pendingSelector, setPendingSelector] = useState<MCPGatewaySessionSelector | null>(null);
  const queryOptions = {
    queryKey: mcpGatewaySessionKeys.lists(),
    queryFn: () => fetchMCPGatewaySessions(accessToken!),
    enabled: !!accessToken,
    refetchInterval: REFETCH_INTERVAL_MS,
  };
  const { data, error, isLoading, isFetching, refetch } = useQuery<MCPGatewaySessionsResponse, Error>(queryOptions);
  const { data: userNames = {} } = useUserDisplayLookup(
    (data?.by_user ?? []).flatMap((group) => (group.label ? [group.label] : [])),
  );
  const terminate = useMutation<MCPGatewaySessionsTerminateResponse, Error, MCPGatewaySessionSelector>({
    mutationFn: (selector) => terminateMCPGatewaySessions(accessToken!, selector),
    onSettled: () => queryClient.invalidateQueries({ queryKey: mcpGatewaySessionKeys.lists() }),
  });
  const confirmDisconnect = () => {
    if (pendingSelector === null) return;
    terminate.mutate(pendingSelector);
    setPendingSelector(null);
  };

  return (
    <div className="mt-4 space-y-4" data-testid="mcp-gateway-sessions-tab">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-foreground">{uiT("ui.044dcf23bd5ceff2")}</h2>
          <p className="text-sm text-muted-foreground">{uiT("ui.485c4b767b9876b9")}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
          aria-label={uiT("ui.955507a3940bc599")}
        >
          <RefreshCw className={`size-4 ${isFetching ? "animate-spin" : ""}`} />
          {uiT("ui.0e9161011702")}
        </Button>
      </div>

      {terminate.isError ? (
        <Alert variant="destructive">
          <AlertTitle>{uiT("ui.7aac4b2484c7ea31")}</AlertTitle>
          <AlertDescription>{terminate.error.message}</AlertDescription>
        </Alert>
      ) : null}
      {terminate.isSuccess ? (
        <Alert>
          <AlertTitle>{uiT("ui.04dfac3671b494ad")}</AlertTitle>
          <AlertDescription>
            {translateText(describeTerminateResult(terminate.data))} {uiT("ui.c7c5d95214398bfe")}
          </AlertDescription>
        </Alert>
      ) : null}

      <SessionsBody
        data={data}
        error={error}
        isLoading={isLoading}
        onDisconnect={canTerminate ? setPendingSelector : null}
        userNames={userNames}
      />

      <AlertDialog open={pendingSelector !== null} onOpenChange={(open) => !open && setPendingSelector(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{uiT("ui.40b47d07646751a3")}</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingSelector
                ? uiT("ui.26500094baddbe7f", { v0: String(describeSelector(pendingSelector, userNames)) })
                : ""}
              {uiT("ui.e3630eee032a97c3")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="outline" onClick={() => setPendingSelector(null)}>
              {uiT("ui.19766ed6ccb2")}
            </Button>
            <Button variant="destructive" onClick={confirmDisconnect} disabled={terminate.isPending}>
              {uiT("ui.acfc5be785a9bb3d")}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default MCPGatewaySessionsTab;
