"use client";
import { t as translateUi } from "@/i18n";

import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import { Badge } from "@/components/ui/badge";
import { hasRouterSettings } from "./routerSettingsPayload";

interface RouterSettingsSummaryProps {
  routerSettings: Record<string, unknown> | null | undefined;
  emptyText?: string;
}

const fallbackEntries = (fallbacks: unknown): Array<[string, string[]]> => {
  if (!Array.isArray(fallbacks)) return [];
  return fallbacks.flatMap((entry) =>
    entry && typeof entry === "object" ? (Object.entries(entry) as Array<[string, string[]]>) : [],
  );
};

export default function RouterSettingsSummary({
  routerSettings,
  emptyText = translateUi("ui.fad461b519f2dd4a"),
}: RouterSettingsSummaryProps) {
  const { t: uiT } = useDashboardLanguage();

  if (!hasRouterSettings(routerSettings)) {
    return <div className="text-muted-foreground">{emptyText}</div>;
  }

  const settings = routerSettings as Record<string, unknown>;
  const fallbacks = fallbackEntries(settings.fallbacks);

  return (
    <div className="space-y-1 text-sm">
      {settings.routing_strategy != null && (
        <div>
          {uiT("ui.943252b9344fa761")} <Badge variant="secondary">{String(settings.routing_strategy)}</Badge>
        </div>
      )}
      {settings.num_retries != null && (
        <div>
          {uiT("ui.0ed6cb3a52ea1e41")} {String(settings.num_retries)}
        </div>
      )}
      {settings.allowed_fails != null && (
        <div>
          {uiT("ui.560782494adb8adc")} {String(settings.allowed_fails)}
        </div>
      )}
      {settings.cooldown_time != null && (
        <div>
          {uiT("ui.a674cb50eb95a0f8")} {String(settings.cooldown_time)}s
        </div>
      )}
      {settings.timeout != null && (
        <div>
          {uiT("ui.3cfe9e963c47bcd0")} {String(settings.timeout)}s
        </div>
      )}
      {settings.retry_after != null && (
        <div>
          {uiT("ui.68b1ad84d88cd52a")} {String(settings.retry_after)}s
        </div>
      )}
      {Boolean(settings.enable_tag_filtering) && <div>{uiT("ui.4095709cd9af481d")}</div>}
      {fallbacks.length > 0 && (
        <div>
          <div>{uiT("ui.38b38a807b151ae8")}</div>
          <div className="mt-1 space-y-1">
            {fallbacks.map(([model, targets]) => (
              <div key={model} className="text-xs text-muted-foreground">
                <span className="font-medium">{model}</span>
                <span className="mx-1 text-muted-foreground">{uiT("ui.71b37b9a8a57b848")}</span>
                {Array.isArray(targets) ? targets.join(", ") : String(targets)}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
