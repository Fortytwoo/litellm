"use client";
import { formatMoney } from "@/utils/currency";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import React from "react";
import { MCPServerCostInfo } from "@/components/mcp_tools/types";

interface MCPServerCostDisplayProps {
  costConfig?: MCPServerCostInfo | null;
}

const MCPServerCostDisplay: React.FC<MCPServerCostDisplayProps> = ({ costConfig }) => {
  const { t: uiT } = useDashboardLanguage();

  const hasDefaultCost =
    costConfig?.default_cost_per_query !== undefined && costConfig?.default_cost_per_query !== null;
  const hasToolCosts =
    costConfig?.tool_name_to_cost_per_query && Object.keys(costConfig.tool_name_to_cost_per_query).length > 0;
  const hasCostConfig = hasDefaultCost || hasToolCosts;

  if (!hasCostConfig) {
    return (
      <div className="mt-6 border-t border-border pt-6">
        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-muted p-4">
            <p className="text-sm text-muted-foreground">{uiT("ui.0fc9826c99b7fe5a")}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 border-t border-border pt-6">
      <div className="space-y-4">
        {hasDefaultCost &&
          costConfig?.default_cost_per_query !== undefined &&
          costConfig?.default_cost_per_query !== null && (
            <div>
              <p className="text-sm font-medium">{uiT("ui.2f7631876f0ffb9e")}</p>
              <div className="font-mono text-sm">{formatMoney(Number(costConfig.default_cost_per_query), 4)}</div>
            </div>
          )}

        {hasToolCosts && costConfig?.tool_name_to_cost_per_query && (
          <div>
            <p className="text-sm font-medium">{uiT("ui.985746803f3841a9")}</p>
            <div className="mt-2 space-y-2">
              {Object.entries(costConfig.tool_name_to_cost_per_query).map(
                ([toolName, cost]) =>
                  cost !== null &&
                  cost !== undefined && (
                    <div key={toolName} className="flex items-center justify-between rounded-lg bg-muted p-3">
                      <p className="text-sm font-medium">{toolName}</p>
                      <p className="font-mono text-sm">
                        {formatMoney(Number(cost), 4)} {uiT("ui.7a64c050c433c0b9")}
                      </p>
                    </div>
                  ),
              )}
            </div>
          </div>
        )}

        <div className="mt-4 rounded-lg border border-border bg-muted p-4">
          <p className="text-sm font-medium">{uiT("ui.cad181bb7724a5ca")}</p>
          <div className="mt-2 space-y-1">
            {hasDefaultCost &&
              costConfig?.default_cost_per_query !== undefined &&
              costConfig?.default_cost_per_query !== null && (
                <p className="text-sm text-muted-foreground">
                  {uiT("ui.699a39484a7e7f2b")}
                  {formatMoney(costConfig.default_cost_per_query, 4)} {uiT("ui.7a64c050c433c0b9")}
                </p>
              )}
            {hasToolCosts && costConfig?.tool_name_to_cost_per_query && (
              <p className="text-sm text-muted-foreground">
                • {Object.keys(costConfig.tool_name_to_cost_per_query).length} {uiT("ui.18293296dd530e50")}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MCPServerCostDisplay;
