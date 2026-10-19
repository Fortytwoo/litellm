"use client";
import { t as translateUi } from "@/i18n";

import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import { CircleAlert } from "lucide-react";
import React, { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/shared/Alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { UiLoadingSpinner } from "@/components/ui/ui-loading-spinner";
import { toast } from "@/lib/toast";
import { AgentKillSwitchResult, triggerAgentKillSwitchCall } from "@/components/networking";
import { KillSwitchConfig } from "./kill_switch_config";

interface AgentKillSwitchDangerZoneProps {
  agentId: string;
  agentName: string;
  killSwitch: KillSwitchConfig | null | undefined;
  accessToken: string | null;
  isAdmin: boolean;
}

const AgentKillSwitchDangerZone: React.FC<AgentKillSwitchDangerZoneProps> = ({
  agentId,
  agentName,
  killSwitch,
  accessToken,
  isAdmin,
}) => {
  const { t: uiT } = useDashboardLanguage();

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmationInput, setConfirmationInput] = useState("");
  const [isFiring, setIsFiring] = useState(false);
  const [lastResult, setLastResult] = useState<AgentKillSwitchResult | null>(null);

  if (!isAdmin) return null;

  const openConfirm = () => {
    setConfirmationInput("");
    setIsConfirmOpen(true);
  };

  const fire = async () => {
    if (!accessToken) return;
    setIsFiring(true);
    setLastResult(null);
    try {
      const result = await triggerAgentKillSwitchCall(accessToken, agentId);
      setLastResult(result);
      setIsConfirmOpen(false);
      toast.success(translateUi("ui.fa1274e376c6250f", undefined, { v0: String(result.status_code) }));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : translateUi("ui.51cc1684174a5d23"));
    } finally {
      setIsFiring(false);
    }
  };

  return (
    <section aria-labelledby="agent-danger-zone-heading" className="mt-6">
      <h3 id="agent-danger-zone-heading" className="text-lg font-medium text-destructive">
        {uiT("ui.3c1c01b405853556")}
      </h3>
      <div className="mt-4 rounded-lg border border-destructive/40 bg-destructive/5 p-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 space-y-1 text-sm">
            <p className="font-medium text-foreground">{uiT("ui.e7bf576c9bf8dc33")}</p>
            {killSwitch ? (
              <>
                <p className="text-muted-foreground">{uiT("ui.cfe47a11d3456eb8")}</p>
                <p className="font-mono break-all text-foreground">
                  {killSwitch.method ?? "POST"} {killSwitch.url}
                </p>
              </>
            ) : (
              <p className="text-muted-foreground">{uiT("ui.bab6f3ff11e3d0d2")}</p>
            )}
          </div>
          {killSwitch && (
            <Button type="button" variant="destructive" onClick={openConfirm} disabled={isFiring} aria-busy={isFiring}>
              {isFiring && <UiLoadingSpinner className="size-4" />}
              {uiT("ui.76241085248f9162")}
            </Button>
          )}
        </div>
        {lastResult && (
          <p className="mt-3 text-sm text-muted-foreground" role="status">
            {uiT("ui.d56c25f7f7c5315a")} {lastResult.status_code}
            {lastResult.response_body ? ` ${lastResult.response_body}` : ""}
          </p>
        )}
      </div>

      <Dialog open={isConfirmOpen} onOpenChange={(open) => !open && !isFiring && setIsConfirmOpen(false)}>
        <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {uiT("ui.99737d944b84aa01")} {agentName}?
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Alert variant="error">
              <CircleAlert />
              <AlertTitle>{uiT("ui.b39be9a0fd536dd1")}</AlertTitle>
              <AlertDescription>
                {uiT("ui.c3c42a0bea4df63d")} {killSwitch?.method ?? "POST"} {killSwitch?.url}{" "}
                {uiT("ui.64008e43c4f01aad")}
              </AlertDescription>
            </Alert>
            <div>
              <p className="mb-2 text-base font-medium text-foreground">
                {uiT("ui.baaddf70fb5d")} <span className="font-semibold text-destructive">{agentName}</span>{" "}
                {uiT("ui.1b2a5036345d3021")}
              </p>
              <InputGroup className="rounded-md">
                <InputGroupAddon>
                  <CircleAlert className="size-3.5 text-destructive" />
                </InputGroupAddon>
                <InputGroupInput
                  aria-label={uiT("ui.400a98617a34db54")}
                  value={confirmationInput}
                  onChange={(e) => setConfirmationInput(e.target.value)}
                  placeholder={agentName}
                  autoFocus
                />
              </InputGroup>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfirmOpen(false)} disabled={isFiring}>
              {uiT("ui.19766ed6ccb2")}
            </Button>
            <Button
              variant="destructive"
              onClick={fire}
              disabled={confirmationInput !== agentName || isFiring}
              aria-busy={isFiring}
            >
              {isFiring && <UiLoadingSpinner className="size-4" />}
              {isFiring ? uiT("ui.0ad0790108d27577") : uiT("ui.76241085248f9162")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default AgentKillSwitchDangerZone;
