"use client";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import { Info } from "lucide-react";
import React from "react";
import { SimpleTooltip } from "@/components/ui/tooltip";

import { Switch } from "@/components/ui/switch";
import { MountedFormField } from "@/components/common_components/MountedFormField";
import { isClientForwardedTokenMode } from "@/components/mcp_tools/types";
import { switchControl } from "./mcpFieldRules";

/**
 * DCR-bridge toggle for the client-forwarded token modes (true_passthrough /
 * oauth_delegate); self-gates to those two auth types and renders nothing
 * otherwise. When on, OAuth-only clients like Claude Desktop can register and
 * sign in through the gateway; when off, the gateway relays the upstream
 * server's own OAuth metadata instead. `initialChecked` seeds the field's
 * default value (not the Switch's DOM defaultChecked): the create form defaults
 * it on, the edit form seeds it from the stored value.
 */
export default function DcrBridgeToggle({
  authType,
  initialChecked,
}: {
  authType?: string | null;
  initialChecked?: boolean;
}) {
  const { t: uiT } = useDashboardLanguage();

  if (!isClientForwardedTokenMode(authType)) return null;
  return (
    <MountedFormField
      label={
        <span className="text-sm font-medium text-foreground flex items-center">
          {uiT("ui.3ac796a03ab46c4e")}
          <SimpleTooltip content={uiT("ui.f451c8e07e59e3e8")}>
            <Info className="ml-2 size-4 text-info hover:text-info/80 cursor-help" />
          </SimpleTooltip>
        </span>
      }
      name="dcr_bridge"
      defaultValue={initialChecked}
    >
      {(control) => <Switch {...switchControl(control)} />}
    </MountedFormField>
  );
}
