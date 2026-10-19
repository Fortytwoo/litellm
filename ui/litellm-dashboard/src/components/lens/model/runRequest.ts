import { t as translateUi } from "@/i18n";
import type { RunWindow } from "./types";

export const RUN_PRESETS = [
  {
    get label() {
      return translateUi("ui.e0bcc55c6d24528f");
    },
    hours: null,
  },
  {
    get label() {
      return translateUi("ui.a8dfe9d80188");
    },
    hours: 1,
  },
  {
    get label() {
      return translateUi("ui.3033b37ea23466d2");
    },
    hours: 24,
  },
  {
    get label() {
      return translateUi("ui.9976054f2ae7088c");
    },
    hours: 168,
  },
  {
    get label() {
      return translateUi("ui.494ca78f7374");
    },
    hours: -1,
  },
] as const;

export type RunPreset = (typeof RUN_PRESETS)[number]["hours"];

export interface RunChoice {
  preset: RunPreset;
  agent: string;
  saved: string;
  start: string;
  end: string;
}

export function runRequest({ preset, agent, saved, start, end }: RunChoice): RunWindow | string {
  const agentPart = agent.trim() && agent.trim() !== saved ? { agent_name: agent.trim() } : {};
  if (preset === null) return agentPart;
  if (preset > 0) return { ...agentPart, lookback_hours: preset };
  const startMs = Date.parse(start);
  const endMs = Date.parse(end);
  if (Number.isNaN(startMs) || Number.isNaN(endMs)) return "Choose a start and end time";
  if (startMs >= endMs) return "Start time must be before end time";
  return { ...agentPart, start: new Date(startMs).toISOString(), end: new Date(endMs).toISOString() };
}
