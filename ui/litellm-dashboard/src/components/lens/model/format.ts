import { usdToCny } from "@/utils/currency";
import { t as translateUi } from "@/i18n";
import { formatActivityTimestamp as runTime } from "@/utils/activityTimestamp";
import { translateText } from "@/i18n";
import type { Settings } from "./types";

export { runTime };

export function scopeLabel(settings: Partial<Pick<Settings, "service" | "agent_name" | "filters">>): string {
  return (
    [settings.agent_name, settings.service, ...(settings.filters ?? []).map((f) => `${f.key}: ${f.value}`)]
      .filter(Boolean)
      .join(" · ") || translateText("All activity")
  );
}

export function durationText(seconds: number): string {
  if (!Number.isFinite(seconds)) return "0s";
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
}

export function durationLabel(value: number, base: "minutes" | "hours" = "minutes"): string {
  const minutes = base === "hours" ? value * 60 : value;
  if (minutes >= 1440) {
    const days = Number((minutes / 1440).toFixed(2));
    return `${days} ${translateText(days === 1 ? "day" : "days")}`;
  }
  if (minutes % 60 === 0) return `${minutes / 60} ${translateText(minutes === 60 ? "hour" : "hours")}`;
  return `${minutes} ${translateText(minutes === 1 ? "minute" : "minutes")}`;
}

export function agoLabel(thenMs: number, nowMs: number): string {
  const seconds = Math.max(0, Math.floor((nowMs - thenMs) / 1000));
  if (seconds < 5) return translateText("just now");
  if (seconds < 60) return translateUi("supplement.secondsAgo", undefined, { count: seconds });
  if (seconds < 3600) return translateUi("supplement.minutesAgo", undefined, { count: Math.floor(seconds / 60) });
  if (seconds < 86400) return translateUi("supplement.hoursAgo", undefined, { count: Math.floor(seconds / 3600) });
  return translateUi("supplement.daysAgo", undefined, { count: Math.floor(seconds / 86400) });
}

export const money = (n: number) =>
  `¥${usdToCny(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 3 })}`;
export const when = (value?: string | null) => (value ? runTime(value) : translateText("Not yet"));

export const sourceLabels = {
  get both() {
    return translateUi("ui.82bd8b6ae49265db");
  },
  get requests() {
    return translateUi("ui.241b3307b2900007");
  },
  get traces() {
    return translateUi("ui.34b303f1b6b90e9b");
  },
};
