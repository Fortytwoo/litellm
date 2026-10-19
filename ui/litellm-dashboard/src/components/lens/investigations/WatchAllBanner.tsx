"use client";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";

import { z } from "zod";
import { useLensUpdate } from "../data/mutations";
import type { Lens } from "../model/types";

const watchAllResult = z.object({
  skipped: z.array(z.object({ id: z.string(), name: z.string(), reason: z.string() })),
});

export interface WatchAllBannerProps {
  readonly lenses: readonly Lens[];
}

export function WatchAllBanner({ lenses }: WatchAllBannerProps) {
  const { t: uiT } = useDashboardLanguage();

  const watchAll = useLensUpdate();
  const paused = lenses.filter((lens) => !lens.settings.enabled).length;
  if (paused === 0) return null;
  const result = watchAllResult.safeParse(watchAll.data);
  const skipped = result.success ? result.data.skipped : [];
  if (skipped.length >= paused)
    return (
      <span
        role="status"
        className="text-xs text-muted-foreground"
        title={skipped.map((s) => `${s.name}: ${s.reason}`).join("\n")}
      >
        {paused} {uiT("ui.c8ef4c217519f34d")}{" "}
        {skipped.length === 1
          ? uiT("ui.6bb0e6fac27661b5", { v0: String(skipped[0].name) })
          : uiT("ui.764d088243dc5a3c", { v0: String(skipped.length) })}
      </span>
    );
  return (
    <span role="status" className="text-xs text-muted-foreground">
      {paused} {uiT("ui.c8ef4c217519f34d")}{" "}
      {watchAll.error && <span className="text-destructive">{watchAll.error.message} · </span>}
      <button
        type="button"
        disabled={watchAll.isPending}
        onClick={() => watchAll.mutate((api) => api.watchAll())}
        className="font-medium text-foreground underline-offset-2 hover:underline disabled:opacity-50"
      >
        {uiT("ui.08f6d3f555b7c1f5")}
      </button>
    </span>
  );
}
