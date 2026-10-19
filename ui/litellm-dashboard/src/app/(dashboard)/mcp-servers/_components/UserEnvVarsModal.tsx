"use client";
import { t as translateUi } from "@/i18n";

import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import React from "react";
import { CircleAlert, Info } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { MCPServer, MCPUserEnvVarsStatus, MCPUserEnvVarSpec } from "@/components/mcp_tools/types";
import { clearMCPUserEnvVars, getMCPUserEnvVars, storeMCPUserEnvVars } from "@/components/networking";
import { toast } from "@/lib/toast";
import { FieldGroup } from "@/components/ui/field";
import { FormField } from "@/components/shared/form/FormField";
import { Alert, AlertTitle } from "@/components/shared/Alert";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PasswordInput } from "@/components/shared/PasswordInput";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared/table_cells/status_badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { UiLoadingSpinner } from "@/components/ui/ui-loading-spinner";
import { useZodForm } from "@/lib/forms/useZodForm";

interface UserEnvVarsModalProps {
  server: MCPServer | null;
  open: boolean;
  accessToken: string | null;
  onClose: () => void;
  onSaved?: (status: MCPUserEnvVarsStatus) => void;
}

interface UserEnvVarsFormProps {
  required: readonly MCPUserEnvVarSpec[];
  isSaving: boolean;
  onCancel: () => void;
  onClear?: () => void;
  onSubmit: (values: Record<string, string>) => void;
}

const buildSchema = (required: readonly MCPUserEnvVarSpec[]) =>
  z.object(
    Object.fromEntries(
      required.map((spec) => [spec.name, spec.is_set ? z.string() : z.string().min(1, `${spec.name} is required`)]),
    ),
  );

const emptyValues = (required: readonly MCPUserEnvVarSpec[]): Record<string, string> =>
  Object.fromEntries(required.map((spec) => [spec.name, ""]));

const UserEnvVarsForm: React.FC<UserEnvVarsFormProps> = ({ required, isSaving, onCancel, onClear, onSubmit }) => {
  const { t: uiT } = useDashboardLanguage();

  const form = useZodForm(buildSchema(required), { defaultValues: emptyValues(required) });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <FieldGroup>
        {required.map((spec) => (
          <FormField
            key={spec.name}
            control={form.control}
            name={spec.name}
            description={spec.description || undefined}
            label={
              <span className="flex items-center gap-2">
                <span className="font-mono text-sm font-semibold">{spec.name}</span>
                {spec.is_set && <Badge variant="secondary">{uiT("ui.b6f6f3ad07b3c05f")}</Badge>}
              </span>
            }
          >
            {(field) => (
              <PasswordInput
                {...field}
                disabled={isSaving}
                placeholder={
                  spec.is_set
                    ? uiT("ui.06d995247dd421a7")
                    : spec.description || uiT("ui.d1dc00caf2ba5134", { v0: String(spec.name) })
                }
              />
            )}
          </FormField>
        ))}
      </FieldGroup>
      <div className="mt-6 flex items-center justify-end gap-2 border-t border-border pt-2">
        {onClear && (
          <Button type="button" variant="destructive" className="mr-auto" onClick={onClear} disabled={isSaving}>
            {uiT("ui.83b12c2216ef")}
          </Button>
        )}
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving}>
          {uiT("ui.19766ed6ccb2")}
        </Button>
        <Button type="submit" disabled={isSaving}>
          {isSaving && <UiLoadingSpinner className="mr-2 size-4" />}
          {uiT("ui.8e171e87357e897a")}
        </Button>
      </div>
    </form>
  );
};

/**
 * User-facing modal for filling in per-user MCP environment variables.
 *
 * Backed by GET / POST ``/v1/mcp/server/{id}/user-env-vars``. Each field
 * the admin marked as ``scope=user`` shows up with the admin-supplied
 * description as the placeholder.
 */
const UserEnvVarsModal: React.FC<UserEnvVarsModalProps> = ({ server, open, accessToken, onClose, onSaved }) => {
  const { t: uiT } = useDashboardLanguage();

  const queryClient = useQueryClient();
  const [confirmingClear, setConfirmingClear] = React.useState(false);
  const close = () => {
    setConfirmingClear(false);
    onClose();
  };
  const queryKey = ["mcpUserEnvVars", server?.server_id];
  const {
    data: status,
    isLoading,
    isError,
  } = useQuery<MCPUserEnvVarsStatus>({
    queryKey,
    queryFn: () => getMCPUserEnvVars(accessToken!, server!.server_id),
    enabled: open && !!server && !!accessToken,
  });

  const saveMutation = useMutation({
    mutationFn: (values: Record<string, string>) => storeMCPUserEnvVars(accessToken!, server!.server_id, values),
    onSuccess: (saved) => {
      queryClient.setQueryData(queryKey, saved);
      toast.success(translateUi("ui.9ba4bd029f5bbbc2"));
      onSaved?.(saved);
      close();
    },
    onError: (err) => {
      toast.fromError(`Failed to save env vars: ${err instanceof Error ? err.message : String(err)}`);
    },
  });

  const clearMutation = useMutation({
    mutationFn: () => clearMCPUserEnvVars(accessToken!, server!.server_id),
    onSuccess: (cleared) => {
      queryClient.setQueryData(queryKey, cleared);
      toast.success(translateUi("ui.deb7992381384720"));
      onSaved?.(cleared);
      close();
    },
    onError: (err) => {
      toast.fromError(`Failed to clear env vars: ${err instanceof Error ? err.message : String(err)}`);
    },
  });

  const handleSave = (values: Record<string, string>) => {
    if (!server || !accessToken) return;
    const trimmed: Record<string, string> = {};
    for (const [k, v] of Object.entries(values)) {
      trimmed[k] = (v ?? "").trim();
    }
    saveMutation.mutate(trimmed);
  };

  const displayName = server?.server_name || server?.alias || server?.server_id || "MCP Server";
  const required = status?.required ?? [];
  const isSaving = saveMutation.isPending || clearMutation.isPending;
  const canClear = !!server && !!accessToken && required.some((spec) => spec.is_set);
  const confirmClear = () => {
    setConfirmingClear(false);
    clearMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={(opened) => !opened && close()}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-[520px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <DialogTitle className="text-base font-semibold">{uiT("ui.d3a36cc9f5b5fffb")}</DialogTitle>
            <StatusBadge tone="info" label={uiT("ui.a6bb6180e1bf41da")} />
          </div>
          <span className="text-xs text-muted-foreground">{displayName}</span>
        </DialogHeader>

        <div className="mt-2 space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <UiLoadingSpinner className="size-5" />
            </div>
          ) : isError ? (
            <Alert variant="error">
              <CircleAlert />
              <AlertTitle>{uiT("ui.2a8f5ce15cfa533f")}</AlertTitle>
            </Alert>
          ) : required.length === 0 ? (
            <Alert variant="info">
              <Info />
              <AlertTitle>{uiT("ui.4e4940bd73bb7f73")}</AlertTitle>
            </Alert>
          ) : (
            <>
              <span className="block text-sm text-muted-foreground">{uiT("ui.037bd4cfb8a37d99")}</span>
              <UserEnvVarsForm
                required={required}
                isSaving={isSaving}
                onCancel={close}
                onClear={canClear ? () => setConfirmingClear(true) : undefined}
                onSubmit={handleSave}
              />
            </>
          )}
        </div>
        <AlertDialog open={confirmingClear} onOpenChange={(opened) => !opened && setConfirmingClear(false)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{uiT("ui.80d8e1a542178f66")}</AlertDialogTitle>
              <AlertDialogDescription>
                {uiT("ui.eb1d58374afc8594")} {displayName}
                {uiT("ui.bfab4bcf2eef3dce")}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <Button variant="outline" onClick={() => setConfirmingClear(false)}>
                {uiT("ui.19766ed6ccb2")}
              </Button>
              <Button variant="destructive" onClick={confirmClear}>
                {uiT("ui.7e2eda5197b0dcc2")}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
};

export default UserEnvVarsModal;
