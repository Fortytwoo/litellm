"use client";
import { translateText } from "@/i18n";

import { t as translateUi } from "@/i18n";

import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import React, { useEffect, useState } from "react";
import { Ban, Clock3, Cloud, Database, Info, LoaderCircle, RefreshCw, TriangleAlert } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/cva.config";

import { toast } from "@/lib/toast";
import {
  cancelModelCostMapReload,
  getModelCostMapReloadStatus,
  getModelCostMapSource,
  reloadModelCostMap,
  scheduleModelCostMapReload,
} from "./networking";

interface ReloadStatus {
  scheduled: boolean;
  interval_hours: number | null;
  last_run: string | null;
  next_run: string | null;
}

interface CostMapSourceInfo {
  source: "local" | "remote";
  url: string | null;
  is_env_forced: boolean;
  fallback_reason: string | null;
  loaded_at: string | null;
  source_revision: string | null;
  etag: string | null;
  model_count: number;
}

const SHORT_REVISION_LENGTH = 12;

const shortRevision = (revision: string) => revision.slice(0, SHORT_REVISION_LENGTH);

const EMPTY_RELOAD_STATUS: ReloadStatus = {
  scheduled: false,
  interval_hours: null,
  last_run: null,
  next_run: null,
};

interface PriceDataReloadProps {
  accessToken: string;
  onReloadSuccess?: () => void;
  buttonText?: string;
  showIcon?: boolean;
  size?: "small" | "middle" | "large";
  type?: "primary" | "default" | "dashed" | "link" | "text";
  className?: string;
}

const buttonVariants = {
  primary: "default",
  default: "outline",
  dashed: "outline",
  link: "link",
  text: "ghost",
} as const;

const buttonSizes = {
  small: "sm",
  middle: "default",
  large: "lg",
} as const;

const isValidReloadInterval = (value: number) => {
  if (!Number.isFinite(value)) return false;
  if (!Number.isInteger(value)) return false;
  return value >= 1 && value <= 168;
};

const formatDateTime = (dateTimeString: string | null) => {
  if (!dateTimeString) return "Never";
  const parsed = new Date(dateTimeString);
  return Number.isNaN(parsed.getTime()) ? dateTimeString : parsed.toLocaleString();
};

const CostMapProvenanceRows: React.FC<{ sourceInfo: CostMapSourceInfo }> = ({ sourceInfo }) => {
  const { t: uiT } = useDashboardLanguage();
  return (
    <>
      {sourceInfo.source_revision && (
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="text-muted-foreground">{uiT("ui.9e7e12b2f3efb2cc")}</span>
          <Tooltip>
            <TooltipTrigger render={<code className="font-mono" />}>
              {shortRevision(sourceInfo.source_revision)}
            </TooltipTrigger>
            <TooltipContent>{sourceInfo.source_revision}</TooltipContent>
          </Tooltip>
        </div>
      )}

      {sourceInfo.etag && (
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="text-muted-foreground">{uiT("ui.65c09e9a8a4e8f3b")}</span>
          <Tooltip>
            <TooltipTrigger render={<code className="max-w-60 truncate font-mono" />}>{sourceInfo.etag}</TooltipTrigger>
            <TooltipContent>{sourceInfo.etag}</TooltipContent>
          </Tooltip>
        </div>
      )}

      {sourceInfo.loaded_at && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">{uiT("ui.a144adb2f8ca9220")}</span>
          <span className="font-medium">{formatDateTime(sourceInfo.loaded_at)}</span>
        </div>
      )}

      {sourceInfo.loaded_at && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Info className="size-3.5 shrink-0" />
          <span>{uiT("ui.98c221e497311d95")}</span>
        </div>
      )}
    </>
  );
};

const PriceDataReload: React.FC<PriceDataReloadProps> = ({
  accessToken,
  onReloadSuccess,
  buttonText = translateUi("ui.4a6aa0de5cc20a47"),
  showIcon = true,
  size = "middle",
  type = "primary",
  className = "",
}) => {
  const { t: uiT } = useDashboardLanguage();

  const [isLoading, setIsLoading] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [hours, setHours] = useState<number | "">(6);
  const [reloadStatus, setReloadStatus] = useState<ReloadStatus | null>(null);
  const [sourceInfo, setSourceInfo] = useState<CostMapSourceInfo | null>(null);

  const fetchReloadStatus = async () => {
    if (!accessToken) return;

    try {
      const status = await getModelCostMapReloadStatus(accessToken);
      setReloadStatus(status);
    } catch (error) {
      console.error("Failed to fetch reload status:", error);
      setReloadStatus(EMPTY_RELOAD_STATUS);
    }
  };

  const fetchSourceInfo = async () => {
    if (!accessToken) return;

    try {
      setSourceInfo(await getModelCostMapSource(accessToken));
    } catch (error) {
      console.error("Failed to fetch cost map source info:", error);
    }
  };

  useEffect(() => {
    const initialRefresh = window.setTimeout(() => {
      fetchReloadStatus();
      fetchSourceInfo();
    }, 0);

    const interval = setInterval(() => {
      fetchReloadStatus();
      fetchSourceInfo();
    }, 30000);

    return () => {
      clearTimeout(initialRefresh);
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refresh functions intentionally follow the current access token
  }, [accessToken]);

  const handleHardRefresh = async () => {
    if (!accessToken) {
      toast.fromError("No access token available");
      return;
    }

    setIsLoading(true);
    try {
      const response = await reloadModelCostMap(accessToken);

      if (response.status === "success") {
        toast.success(translateUi("ui.544f4d03df7773e9", undefined, { v0: String(response.models_count || 0) }));
        onReloadSuccess?.();
        await fetchReloadStatus();
        await fetchSourceInfo();
      } else {
        toast.fromError("Failed to reload price data");
      }
    } catch (error) {
      console.error("Error reloading price data:", error);
      toast.fromError("Failed to reload price data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleScheduleReload = async () => {
    if (!accessToken) {
      toast.fromError("No access token available");
      return;
    }

    const intervalHours = Number(hours);
    if (!isValidReloadInterval(intervalHours)) {
      toast.fromError("Hours must be a whole number between 1 and 168");
      return;
    }

    setIsScheduling(true);
    try {
      const response = await scheduleModelCostMapReload(accessToken, intervalHours);

      if (response.status === "success") {
        toast.success(translateUi("ui.5e75598690abba9f", undefined, { v0: String(intervalHours) }));
        setShowScheduleModal(false);
        await fetchReloadStatus();
      } else {
        toast.fromError("Failed to schedule periodic reload");
      }
    } catch (error) {
      console.error("Error scheduling reload:", error);
      toast.fromError("Failed to schedule periodic reload. Please try again.");
    } finally {
      setIsScheduling(false);
    }
  };

  const handleCancelReload = async () => {
    if (!accessToken) {
      toast.fromError("No access token available");
      return;
    }

    setIsCancelling(true);
    try {
      const response = await cancelModelCostMapReload(accessToken);

      if (response.status === "success") {
        toast.success(translateUi("ui.d31b7e648ad7f412"));
        await fetchReloadStatus();
      } else {
        toast.fromError("Failed to cancel periodic reload");
      }
    } catch (error) {
      console.error("Error cancelling reload:", error);
      toast.fromError("Failed to cancel periodic reload. Please try again.");
    } finally {
      setIsCancelling(false);
    }
  };

  const getStatusText = () => {
    if (!reloadStatus?.scheduled) return "Not scheduled";
    if (!reloadStatus.last_run) return "Ready";
    return "Active";
  };

  return (
    <TooltipProvider>
      <div className={className}>
        <div className="mb-4 flex flex-wrap gap-3">
          <AlertDialog>
            <AlertDialogTrigger
              render={
                <Button
                  type="button"
                  variant={buttonVariants[type]}
                  size={buttonSizes[size]}
                  className={cn(type === "dashed" && "border-dashed")}
                  disabled={isLoading}
                />
              }
            >
              {isLoading ? (
                <LoaderCircle className="animate-spin" data-icon="inline-start" />
              ) : (
                showIcon && <RefreshCw data-icon="inline-start" />
              )}
              {buttonText}
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{uiT("ui.3b147fedc450cc27")}</AlertDialogTitle>
                <AlertDialogDescription>{uiT("ui.764692e8952fc57e")}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{uiT("ui.1ea442a134b2a184")}</AlertDialogCancel>
                <AlertDialogAction onClick={handleHardRefresh}>{uiT("ui.85a39ab345d672ff")}</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {!reloadStatus?.scheduled ? (
            <Button type="button" variant="outline" size={buttonSizes[size]} onClick={() => setShowScheduleModal(true)}>
              <Clock3 data-icon="inline-start" />
              {uiT("ui.090dd9c9f213694a")}
            </Button>
          ) : (
            <Button
              type="button"
              variant="destructive"
              size={buttonSizes[size]}
              disabled={isCancelling}
              onClick={handleCancelReload}
            >
              {isCancelling ? (
                <LoaderCircle className="animate-spin" data-icon="inline-start" />
              ) : (
                <Ban data-icon="inline-start" />
              )}
              {uiT("ui.735b72eeba6760d7")}
            </Button>
          )}
        </div>

        {sourceInfo && (
          <Card size="sm" className="mb-3 bg-muted/30">
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2">
                {sourceInfo.source === "remote" ? <Cloud className="size-4" /> : <Database className="size-4" />}
                <span className="text-sm font-medium">{uiT("ui.401f8bae371e680d")}</span>
                <Badge variant="secondary" className="ml-auto uppercase">
                  {sourceInfo.source === "remote" ? uiT("ui.ffa98e02f7ce33fc") : uiT("ui.8c31e6e7223097e2")}
                </Badge>
              </div>

              <Separator />

              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{uiT("ui.a1419018a86c052c")}</span>
                <span className="font-medium">{sourceInfo.model_count.toLocaleString()}</span>
              </div>

              {sourceInfo.url && (
                <div className="flex items-start justify-between gap-2 text-xs">
                  <span className="shrink-0 text-muted-foreground">
                    {sourceInfo.source === "remote" ? uiT("ui.0ba5b48a8d1c83ea") : uiT("ui.490b7deef2efc8e4")}
                  </span>
                  <Tooltip>
                    <TooltipTrigger render={<span className="max-w-60 truncate text-primary" />}>
                      {sourceInfo.url}
                    </TooltipTrigger>
                    <TooltipContent>{sourceInfo.url}</TooltipContent>
                  </Tooltip>
                </div>
              )}

              <CostMapProvenanceRows sourceInfo={sourceInfo} />

              {sourceInfo.is_env_forced && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Info className="size-3.5 shrink-0" />
                  <span>
                    {uiT("ui.15425460e189a10b")} <code>LITELLM_LOCAL_MODEL_COST_MAP=True</code>
                  </span>
                </div>
              )}

              {sourceInfo.fallback_reason && (
                <div className="flex items-start gap-1.5 rounded-md border border-destructive/30 bg-destructive/10 px-2 py-1.5 text-xs">
                  <TriangleAlert className="mt-0.5 size-3.5 shrink-0 text-destructive" />
                  <span>
                    {uiT("ui.b6dd3f6897e1ee66")} {sourceInfo.fallback_reason}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {reloadStatus && (
          <Card size="sm" className="bg-muted/30">
            <CardContent className="space-y-2">
              {reloadStatus.scheduled ? (
                <Badge variant="secondary">
                  <Clock3 />
                  {uiT("ui.c9e6f7a92c6c777a")} {reloadStatus.interval_hours} {uiT("ui.404314b1f4bd")}
                </Badge>
              ) : (
                <p className="text-sm text-muted-foreground">{uiT("ui.8133dc3528de8a41")}</p>
              )}

              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{uiT("ui.f636f90bbb7941ad")}</span>
                <span>{formatDateTime(reloadStatus.last_run)}</span>
              </div>

              {reloadStatus.scheduled && (
                <>
                  {reloadStatus.next_run && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{uiT("ui.3b1a9b54ca297a4c")}</span>
                      <span>{formatDateTime(reloadStatus.next_run)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{uiT("ui.755c8b2a9fb11446")}</span>
                    <Badge variant="outline">{translateText(getStatusText())}</Badge>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        <Dialog open={showScheduleModal} onOpenChange={setShowScheduleModal}>
          <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{uiT("ui.090dd9c9f213694a")}</DialogTitle>
              <DialogDescription>{uiT("ui.5eb8a9516ee0c3ed")}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm">{uiT("ui.bd9d0c889611bf52")}</p>
              <InputGroup>
                <InputGroupInput
                  type="number"
                  aria-label={uiT("ui.d5048c498072027a")}
                  min={1}
                  max={168}
                  value={hours}
                  onChange={(event) => setHours(event.target.value === "" ? "" : Number(event.target.value))}
                />
                <InputGroupAddon align="inline-end">{uiT("ui.404314b1f4bd")}</InputGroupAddon>
              </InputGroup>
              <p className="text-sm text-muted-foreground">
                {uiT("ui.5a362fbf670bc3eb")} {hours} {uiT("ui.8018e31dd0e2e2ac")}
              </p>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowScheduleModal(false)}>
                {uiT("ui.19766ed6ccb2")}
              </Button>
              <Button type="button" disabled={isScheduling} onClick={handleScheduleReload}>
                {isScheduling && <LoaderCircle className="animate-spin" data-icon="inline-start" />}
                {uiT("ui.f4830a1dae298044")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
};

export default PriceDataReload;
