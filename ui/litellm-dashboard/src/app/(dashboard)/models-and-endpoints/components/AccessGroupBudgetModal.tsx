"use client";
import { LocalizedText } from "@/contexts/LanguageContext";

import { t as translateUi } from "@/i18n";

import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";

import { CircleHelp } from "lucide-react";
import React from "react";
import { z } from "zod";
import BudgetDurationDropdown from "@/components/common_components/budget_duration_dropdown";
import { FieldGroup } from "@/components/ui/field";
import { FormField } from "@/components/shared/form/FormField";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import NumericalInput from "@/components/shared/numerical_input";
import { Button } from "@/components/ui/button";
import { useZodForm } from "@/lib/forms/useZodForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ModelAccessGroup } from "@/app/(dashboard)/hooks/modelAccessGroups/useModelAccessGroups";
import { SetModelAccessGroupBudgetParams } from "@/app/(dashboard)/hooks/modelAccessGroups/useSetModelAccessGroupBudget";
import { accessGroupBudgetFormValues, buildAccessGroupBudgetBody, hasAnyBudgetValue } from "./accessGroupBudgetPayload";

const labelWithHint = (label: React.ReactNode, hint: string): React.ReactNode => (
  <>
    <LocalizedText>{label}</LocalizedText>
    <Tooltip>
      <TooltipTrigger render={<CircleHelp className="size-3.5 shrink-0 cursor-help text-muted-foreground" />} />
      <TooltipContent>
        <LocalizedText>{hint}</LocalizedText>
      </TooltipContent>
    </Tooltip>
  </>
);

const budgetSchema = z
  .object({
    max_budget: z.string().optional(),
    soft_budget: z.string().optional(),
    budget_duration: z.string().optional(),
  })
  .refine(hasAnyBudgetValue, {
    get message() {
      return translateUi("ui.36d86ec4d3e2d88a");
    },
    path: ["max_budget"],
  });

interface AccessGroupBudgetModalProps {
  accessGroup: ModelAccessGroup | null;
  isSaving: boolean;
  onCancel: () => void;
  onSubmit: (params: SetModelAccessGroupBudgetParams) => void;
}

const AccessGroupBudgetModal: React.FC<AccessGroupBudgetModalProps> = ({
  accessGroup,
  isSaving,
  onCancel,
  onSubmit,
}) => {
  const { t: uiT } = useDashboardLanguage();

  const budget = accessGroup?.budget ?? null;
  const form = useZodForm(budgetSchema, { values: accessGroupBudgetFormValues(budget) });

  return (
    <Dialog open={accessGroup !== null} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>
            {budget ? uiT("ui.464c4ffd019e") : uiT("ui.b6f6f3ad07b3c05f")} {uiT("ui.3203d557ecdff8da")}
            {accessGroup?.access_group} {uiT("ui.8a331fdde7032f33")}
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          {uiT("ui.0a95f1e568d6c233")} <code>all-proxy-models</code> {uiT("ui.ffc06f68c7df49d4")}
        </p>
        <form onSubmit={form.handleSubmit((values) => onSubmit(buildAccessGroupBudgetBody(values)))} noValidate>
          <TooltipProvider>
            <FieldGroup className="mt-4">
              <FormField
                control={form.control}
                name="max_budget"
                label={labelWithHint(
                  "Max Budget (CNY)",
                  "Total the whole group may spend. Once its shared spend reaches this, every key that draws from the group is refused",
                )}
              >
                {({ ref, value, ...field }) => <NumericalInput {...field} value={value ?? ""} step={0.01} />}
              </FormField>

              <FormField
                control={form.control}
                name="soft_budget"
                label={labelWithHint(
                  "Soft Budget (CNY)",
                  "Fires an alert when the group's spend reaches this. Requests keep succeeding",
                )}
              >
                {({ ref, value, ...field }) => <NumericalInput {...field} value={value ?? ""} step={0.01} />}
              </FormField>

              <FormField
                control={form.control}
                name="budget_duration"
                label={labelWithHint(
                  "Reset Budget",
                  "How often the group's spend resets. Leave empty for a budget that never resets",
                )}
              >
                {({ id, value, onChange }) => (
                  <BudgetDurationDropdown
                    id={id}
                    value={value || null}
                    onChange={(next) => onChange(next ?? undefined)}
                  />
                )}
              </FormField>
            </FieldGroup>

            <p className="mt-3 text-xs text-muted-foreground">{uiT("ui.1c74cc58eb864884")}</p>

            <div className="mt-6 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onCancel}>
                {uiT("ui.19766ed6ccb2")}
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? uiT("ui.dc85af8f2b1d") : uiT("ui.a4cfd6832af6dbf2")}
              </Button>
            </div>
          </TooltipProvider>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AccessGroupBudgetModal;
