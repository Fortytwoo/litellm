"use client";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

import { lensQueries } from "../../data/queries";
import { useLensApi } from "../../data/LensServices";
import type { Lens, RunWindow } from "../../model/types";
import { RUN_PRESETS, runRequest, type RunChoice, type RunPreset } from "../../model/runRequest";

const localInput = (date: Date) =>
  new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);

export function RunNowDialog({
  lens,
  busy,
  onClose,
  onRun,
}: {
  lens: Lens;
  busy: boolean;
  onClose: () => void;
  onRun: (request: RunWindow) => Promise<void>;
}) {
  const { t: uiT } = useDashboardLanguage();

  const api = useLensApi();
  const agentsQuery = useQuery(lensQueries.agents(api, "traces"));
  const agents = Array.isArray(agentsQuery.data) ? agentsQuery.data : [];
  const now = new Date();
  const [preset, setPreset] = useState<RunPreset>(null);
  const [agent, setAgent] = useState(lens.settings.agent_name ?? "");
  const [start, setStart] = useState(localInput(new Date(now.getTime() - 3_600_000)));
  const [end, setEnd] = useState(localInput(now));
  const [error, setError] = useState("");
  const submit = async () => {
    const choice: RunChoice = { preset, agent, saved: lens.settings.agent_name ?? "", start, end };
    const request = runRequest(choice);
    if (typeof request === "string") {
      setError(request);
      return;
    }
    setError("");
    await onRun(request);
  };
  return (
    <Dialog open onOpenChange={(open) => !open && !busy && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{uiT("ui.0991397702fabb40")}</DialogTitle>
          <DialogDescription>{uiT("ui.78f524e4374f0fe5")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <label className="grid gap-1.5 text-sm font-medium">
            {uiT("ui.11b39c93777e")}
            <Combobox
              items={agents}
              value={agent || null}
              inputValue={agent}
              onInputValueChange={setAgent}
              onValueChange={(name) => setAgent(name ?? "")}
            >
              <ComboboxInput
                aria-label={uiT("ui.11b39c93777e")}
                placeholder={uiT("ui.54c32d3e2cfa1cc8")}
                showClear={!!agent}
                className="h-9 w-full"
              />
              <ComboboxContent>
                <ComboboxEmpty>{uiT("ui.430adbc60a757d5a")}</ComboboxEmpty>
                <ComboboxList>
                  {(name: string) => (
                    <ComboboxItem key={name} value={name}>
                      {name}
                    </ComboboxItem>
                  )}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
          </label>
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">{uiT("ui.ebcce392ac843f33")}</legend>
            <div className="flex flex-wrap gap-1.5">
              {RUN_PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  aria-pressed={preset === p.hours}
                  onClick={() => setPreset(p.hours)}
                  className="rounded-md bg-muted/60 px-2.5 py-1 text-xs text-muted-foreground hover:bg-muted aria-pressed:bg-background aria-pressed:text-foreground aria-pressed:ring-[1.5px] aria-pressed:ring-foreground aria-pressed:ring-inset"
                >
                  {p.label}
                </button>
              ))}
            </div>
            {preset === -1 && (
              <div className="grid grid-cols-2 gap-2">
                <label className="grid gap-1 text-xs text-muted-foreground">
                  {uiT("ui.218197693424e015")}
                  <Input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} />
                </label>
                <label className="grid gap-1 text-xs text-muted-foreground">
                  {uiT("ui.f4b06ef6d3c81436")}
                  <Input type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} />
                </label>
              </div>
            )}
          </fieldset>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" disabled={busy} onClick={onClose}>
            {uiT("ui.19766ed6ccb2")}
          </Button>
          <Button disabled={busy} onClick={() => void submit()}>
            {uiT("ui.0991397702fabb40")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
