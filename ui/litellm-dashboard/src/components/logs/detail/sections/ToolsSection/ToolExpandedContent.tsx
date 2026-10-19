"use client";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
/**
 * Expanded content for a tool with view mode toggle
 */

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ParsedTool } from "./types";
import { FormattedToolView } from "./FormattedToolView";
import { JsonToolView } from "./JsonToolView";

type ViewMode = "formatted" | "json";

interface ToolExpandedContentProps {
  tool: ParsedTool;
}

export function ToolExpandedContent({ tool }: ToolExpandedContentProps) {
  const { t: uiT } = useDashboardLanguage();

  const [viewMode, setViewMode] = useState<ViewMode>("formatted");

  return (
    <div>
      {/* View Mode Toggle - Top Right */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        <span className="text-xs text-muted-foreground">{uiT("ui.526e0087cc3f")}</span>
        <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as ViewMode)}>
          <TabsList>
            <TabsTrigger value="formatted">{uiT("ui.2bf44931f908")}</TabsTrigger>
            <TabsTrigger value="json">JSON</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {viewMode === "formatted" ? <FormattedToolView tool={tool} /> : <JsonToolView tool={tool} />}
    </div>
  );
}
