"use client";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import React, { useState } from "react";
import {
  Bot,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  Clock,
  Copy,
  FileText,
  Link,
  LoaderCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export interface A2ATaskMetadata {
  taskId?: string;
  contextId?: string;
  status?: {
    state?: string;
    timestamp?: string;
    message?: string;
  };
  metadata?: Record<string, unknown>;
}

interface A2AMetricsProps {
  a2aMetadata?: A2ATaskMetadata;
  timeToFirstToken?: number;
  totalLatency?: number;
}

const getStatusIcon = (state?: string) => {
  switch (state) {
    case "completed":
      return <CheckCircle className="size-3 text-success" />;
    case "working":
    case "submitted":
      return <LoaderCircle className="size-3 animate-spin text-info" />;
    case "failed":
    case "canceled":
      return <CircleAlert className="size-3 text-destructive" />;
    default:
      return <Clock className="size-3 text-muted-foreground" />;
  }
};

const getStatusColor = (state?: string) => {
  switch (state) {
    case "completed":
      return "bg-success/15 text-success";
    case "working":
    case "submitted":
      return "bg-info/15 text-info";
    case "failed":
    case "canceled":
      return "bg-destructive/15 text-destructive";
    default:
      return "bg-muted text-foreground";
  }
};

const formatTimestamp = (timestamp?: string) => {
  if (!timestamp) return null;
  try {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return timestamp;
  }
};

const truncateId = (id?: string, length = 8) => {
  if (!id) return null;
  return id.length > length ? `${id.substring(0, length)}…` : id;
};

const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text);
};

const A2AMetrics: React.FC<A2AMetricsProps> = ({ a2aMetadata, timeToFirstToken, totalLatency }) => {
  const { t: uiT } = useDashboardLanguage();

  const [showDetails, setShowDetails] = useState(false);

  if (!a2aMetadata && !timeToFirstToken && !totalLatency) return null;

  const { taskId, contextId, status, metadata } = a2aMetadata || {};
  const formattedTime = formatTimestamp(status?.timestamp);

  return (
    <div className="a2a-metrics mt-3 pt-2 border-t border-border text-xs">
      {/* A2A Metadata Header */}
      <div className="flex items-center mb-2 text-muted-foreground">
        <Bot className="mr-1.5 size-4 text-info" />
        <span className="font-medium text-foreground">{uiT("ui.2650b4429642d67b")}</span>
      </div>

      {/* Main metrics row */}
      <div className="flex flex-wrap items-center gap-2 text-muted-foreground ml-4">
        {/* Status badge */}
        {status?.state && (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(status.state)}`}
          >
            {getStatusIcon(status.state)}
            <span className="ml-1 capitalize">{status.state}</span>
          </span>
        )}

        {/* Timestamp */}
        {formattedTime && (
          <Tooltip>
            <TooltipTrigger render={<span className="flex items-center" />}>
              <Clock className="mr-1 size-3" />
              {formattedTime}
            </TooltipTrigger>
            <TooltipContent>{status?.timestamp}</TooltipContent>
          </Tooltip>
        )}

        {/* Latency */}
        {totalLatency !== undefined && (
          <Tooltip>
            <TooltipTrigger render={<span className="flex items-center text-info" />}>
              <Clock className="mr-1 size-3" />
              {(totalLatency / 1000).toFixed(2)}s
            </TooltipTrigger>
            <TooltipContent>{uiT("ui.21848d236dc60c6b")}</TooltipContent>
          </Tooltip>
        )}

        {/* Time to first token */}
        {timeToFirstToken !== undefined && (
          <Tooltip>
            <TooltipTrigger render={<span className="flex items-center text-success" />}>
              {uiT("ui.c8f76bdcebdf2a1a")} {(timeToFirstToken / 1000).toFixed(2)}s
            </TooltipTrigger>
            <TooltipContent>{uiT("ui.0cec400f147f0f13")}</TooltipContent>
          </Tooltip>
        )}
      </div>

      {/* IDs row */}
      <div className="flex flex-wrap items-center gap-3 text-muted-foreground ml-4 mt-1.5">
        {/* Task ID */}
        {taskId && (
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  className="h-auto p-0 font-normal text-muted-foreground hover:bg-transparent hover:text-foreground"
                  onClick={() => copyToClipboard(taskId)}
                  aria-label={uiT("ui.1f2307b246e7f0b5", { v0: String(taskId) })}
                />
              }
            >
              <FileText className="size-3" />
              {uiT("ui.ab7ffccd2b3c445b")} {truncateId(taskId)}
              <Copy className="size-3 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent>
              {uiT("ui.4db4e1a1f217ee19")} {taskId}
            </TooltipContent>
          </Tooltip>
        )}

        {/* Context/Session ID */}
        {contextId && (
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  className="h-auto p-0 font-normal text-muted-foreground hover:bg-transparent hover:text-foreground"
                  onClick={() => copyToClipboard(contextId)}
                  aria-label={uiT("ui.78b4e304e444984e", { v0: String(contextId) })}
                />
              }
            >
              <Link className="size-3" />
              {uiT("ui.35706b2709641cb1")} {truncateId(contextId)}
              <Copy className="size-3 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent>
              {uiT("ui.4db4e1a1f217ee19")} {contextId}
            </TooltipContent>
          </Tooltip>
        )}

        {/* Details toggle */}
        {(metadata || status?.message) && (
          <Collapsible open={showDetails} onOpenChange={setShowDetails}>
            <CollapsibleTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  className="h-auto p-0 text-xs text-info hover:bg-transparent hover:text-info/80"
                />
              }
            >
              {showDetails ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
              {uiT("ui.45989de49fb7")}
            </CollapsibleTrigger>
          </Collapsible>
        )}
      </div>

      {/* Expandable details panel */}
      <Collapsible open={showDetails} onOpenChange={setShowDetails}>
        <CollapsibleContent>
          <div className="mt-2 ml-4 p-3 bg-muted rounded-md text-muted-foreground border border-border">
            {/* Status message */}
            {status?.message && (
              <div className="mb-2">
                <span className="font-medium text-foreground">{uiT("ui.e287b84bfe63b2b3")}</span>
                <span className="ml-2">{status.message}</span>
              </div>
            )}

            {/* Full IDs */}
            {taskId && (
              <div className="mb-1.5 flex items-center">
                <span className="font-medium text-foreground w-24">{uiT("ui.a1b5efe2f6eb4fbf")}</span>
                <code className="ml-2 px-2 py-1 bg-card border border-border rounded-sm text-xs font-mono">
                  {taskId}
                </code>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  className="ml-2 text-muted-foreground hover:text-info"
                  onClick={() => copyToClipboard(taskId)}
                  aria-label={uiT("ui.1f2307b246e7f0b5", { v0: String(taskId) })}
                >
                  <Copy className="size-3" />
                </Button>
              </div>
            )}

            {contextId && (
              <div className="mb-1.5 flex items-center">
                <span className="font-medium text-foreground w-24">{uiT("ui.e26a7c0b57984f06")}</span>
                <code className="ml-2 px-2 py-1 bg-card border border-border rounded-sm text-xs font-mono">
                  {contextId}
                </code>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  className="ml-2 text-muted-foreground hover:text-info"
                  onClick={() => copyToClipboard(contextId)}
                  aria-label={uiT("ui.78b4e304e444984e", { v0: String(contextId) })}
                >
                  <Copy className="size-3" />
                </Button>
              </div>
            )}

            {/* Metadata fields */}
            {metadata && Object.keys(metadata).length > 0 && (
              <div className="mt-3">
                <span className="font-medium text-foreground">{uiT("ui.5349eb3ff446da07")}</span>
                <pre className="mt-1.5 p-2 bg-card border border-border rounded-sm text-xs font-mono overflow-x-auto whitespace-pre-wrap">
                  {JSON.stringify(metadata, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default A2AMetrics;
