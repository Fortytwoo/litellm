"use client";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import React from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatNumberWithCommas } from "@/utils/dataUtils";
import type { MemberBudgetResetState } from "./useMemberBudgetReset";

interface ResetMemberBudgetsDialogProps {
  state: MemberBudgetResetState;
  onReset: () => void;
  onRetry: () => void;
  onKeep: () => void;
  onDismiss: () => void;
}

export default function ResetMemberBudgetsDialog({
  state,
  onReset,
  onRetry,
  onKeep,
  onDismiss,
}: ResetMemberBudgetsDialogProps) {
  const { t: uiT } = useDashboardLanguage();

  const open = state.phase !== "idle";
  const busy = state.phase === "resetting";
  const failed = state.phase === "resetFailed";
  const memberCount = state.phase === "idle" ? 0 : state.pending.userIds.length;
  const newBudget = state.phase === "idle" ? 0 : state.pending.newBudget;

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && !busy) onDismiss();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{uiT("ui.f1a9aea1e445c7e0")}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          {uiT(memberCount === 1 ? "supplement.resetMemberBudgetOne" : "supplement.resetMemberBudgetMany", {
            count: memberCount,
            budget: formatNumberWithCommas(newBudget, 2),
          })}
        </p>
        <DialogFooter>
          {failed ? (
            <>
              <Button variant="outline" onClick={onDismiss}>
                {uiT("ui.19766ed6ccb2")}
              </Button>
              <Button onClick={onRetry}>{uiT("ui.83f039d962e91351")}</Button>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={onDismiss} disabled={busy}>
                {uiT("ui.19766ed6ccb2")}
              </Button>
              <Button variant="outline" onClick={onKeep} disabled={busy}>
                {uiT(memberCount === 1 ? "supplement.keepMemberBudgetOne" : "supplement.keepMemberBudgetMany")}
              </Button>
              <Button onClick={onReset} disabled={busy}>
                {uiT(memberCount === 1 ? "supplement.resetMemberOne" : "supplement.resetMemberMany", {
                  budget: formatNumberWithCommas(newBudget, 2),
                })}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
