"use client";
import { t as translateUi } from "@/i18n";

import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import { useCallback, useRef, useState } from "react";
import type { components } from "@/lib/http/schema";
import { toast } from "@/lib/toast";
import {
  chunk,
  MAX_BULK_TEAM_MEMBER_BUDGET_UPDATES,
  pluralize,
  type MemberBudgetResetPending,
  type TeamUpdatePayload,
} from "./memberBudgetReset";

export type MemberBudgetBulkResult = components["schemas"]["TeamMemberBudgetUpdateResult"];

export type MemberBudgetResetState =
  | { phase: "idle" }
  | { phase: "prompting"; pending: MemberBudgetResetPending }
  | { phase: "resetting"; pending: MemberBudgetResetPending; attempted: number }
  | { phase: "resetFailed"; pending: MemberBudgetResetPending; attempted: number };

export interface MemberBudgetResetGateway {
  saveTeam: (updateData: TeamUpdatePayload) => Promise<void>;
  resetMemberBudgets: (teamId: string, userIds: readonly string[]) => Promise<MemberBudgetBulkResult[]>;
  refreshTeamData: () => Promise<void>;
}

type ResetRun =
  | { ok: true; attempted: number; results: readonly MemberBudgetBulkResult[] }
  | { ok: false; attempted: number; error: unknown };

export const useMemberBudgetReset = (gateway: MemberBudgetResetGateway) => {
  useDashboardLanguage();

  const [state, setState] = useState<MemberBudgetResetState>({ phase: "idle" });
  const activeRun = useRef<object | null>(null);
  const isCurrent = (run: object) => activeRun.current === run;

  const runReset = async (pending: MemberBudgetResetPending, attempted: number, run: object) => {
    const { resetMemberBudgets, refreshTeamData } = gateway;

    const runChunks = (
      chunks: readonly (readonly string[])[],
      attemptedSoFar: number,
      results: readonly MemberBudgetBulkResult[],
    ): Promise<ResetRun> => {
      const [ids, ...rest] = chunks;
      if (ids === undefined) return Promise.resolve({ ok: true, attempted: attemptedSoFar, results });
      return resetMemberBudgets(pending.teamId, ids).then(
        (batch) => runChunks(rest, attemptedSoFar + ids.length, [...results, ...batch]),
        (error: unknown) => ({ ok: false as const, attempted: attemptedSoFar, error }),
      );
    };

    const outcome = await runChunks(
      chunk(pending.userIds.slice(attempted), MAX_BULK_TEAM_MEMBER_BUDGET_UPDATES),
      attempted,
      [],
    );

    if (!isCurrent(run)) return;
    if (!outcome.ok) {
      console.error("Error resetting member budgets:", outcome.error);
      const total = pending.userIds.length;
      if (outcome.attempted > 0) {
        toast.error(
          translateUi("ui.c24be087969cf537", undefined, {
            v0: String(outcome.attempted),
            v1: String(total),
            v2: String(pluralize(total, "budget", "budgets")),
          }),
        );
      } else {
        toast.fromError("Team updated, but member budgets could not be reset");
      }
      setState({ phase: "resetFailed", pending, attempted: outcome.attempted });
      await refreshTeamData();
      return;
    }
    const failed = outcome.results.filter((r) => !r.success);
    if (failed.length > 0) {
      toast.error(
        translateUi("ui.46b45e6a1010eaf3", undefined, {
          v0: String(failed.length),
          v1: String(pluralize(failed.length, "budget", "budgets")),
        }),
      );
    } else {
      toast.success(
        translateUi("ui.1d456beb5f3819f4", undefined, {
          v0: String(outcome.attempted),
          v1: String(pluralize(outcome.attempted, "budget", "budgets")),
        }),
      );
    }
    setState({ phase: "idle" });
    await refreshTeamData();
  };

  const prompt = (pending: MemberBudgetResetPending) => setState({ phase: "prompting", pending });

  const reset = async () => {
    if (state.phase !== "prompting") return;
    const { pending } = state;
    const run = {};
    activeRun.current = run;
    setState({ phase: "resetting", pending, attempted: 0 });
    try {
      await gateway.saveTeam(pending.updateData);
    } catch (error) {
      console.error("Error updating team:", error);
      if (isCurrent(run)) setState({ phase: "prompting", pending });
      return;
    }
    await runReset(pending, 0, run);
  };

  const retry = async () => {
    if (state.phase !== "resetFailed") return;
    const { pending, attempted } = state;
    const run = {};
    activeRun.current = run;
    setState({ phase: "resetting", pending, attempted });
    await runReset(pending, attempted, run);
  };

  const keepCustom = async () => {
    if (state.phase !== "prompting") return;
    const { pending } = state;
    const run = {};
    activeRun.current = run;
    setState({ phase: "idle" });
    try {
      await gateway.saveTeam(pending.updateData);
      if (isCurrent(run)) toast.success(translateUi("ui.93d09f3198502ba3"));
    } catch (error) {
      console.error("Error updating team:", error);
    }
    if (isCurrent(run)) await gateway.refreshTeamData();
  };

  const dismiss = useCallback(() => {
    activeRun.current = null;
    setState({ phase: "idle" });
  }, []);

  return { state, prompt, reset, retry, keepCustom, dismiss };
};
