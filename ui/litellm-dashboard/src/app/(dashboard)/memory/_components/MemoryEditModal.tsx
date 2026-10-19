"use client";
import { LocalizedText } from "@/contexts/LanguageContext";

import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";

import { CircleHelp } from "lucide-react";
import React, { useEffect, useState } from "react";
import { z } from "zod";

import type { MemoryRow } from "@/components/networking";
import { FieldGroup } from "@/components/ui/field";
import { FormField } from "@/components/shared/form/FormField";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useZodForm } from "@/lib/forms/useZodForm";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const memorySchema = z.object({
  key: z.string().min(1, "Key is required"),
  value: z.string().min(1, "Value is required"),
  metadata: z.string(),
});

type MemoryFormValues = z.output<typeof memorySchema>;

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

const EMPTY_MEMORY: MemoryFormValues = { key: "", value: "", metadata: "" };

interface MemoryEditModalProps {
  open: boolean;
  mode: "create" | "edit";
  initialRow?: MemoryRow;
  onClose: () => void;
  onSave: (key: string, value: string, metadataText: string, isCreate: boolean) => Promise<boolean>;
}

export const MemoryEditModal: React.FC<MemoryEditModalProps> = ({ open, mode, initialRow, onClose, onSave }) => {
  const { t: uiT } = useDashboardLanguage();

  const form = useZodForm(memorySchema, { defaultValues: EMPTY_MEMORY, mode: "onChange" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (mode === "edit" && initialRow) {
      form.reset({
        key: initialRow.key,
        value: initialRow.value,
        metadata: initialRow.metadata != null ? JSON.stringify(initialRow.metadata, null, 2) : "",
      });
      return;
    }
    form.reset(EMPTY_MEMORY);
  }, [open, mode, initialRow, form]);

  const handleOk = form.handleSubmit(async (values) => {
    setSubmitting(true);
    const ok = await onSave(values.key.trim(), values.value, values.metadata, mode === "create");
    setSubmitting(false);
    if (!ok) return;
    form.reset(EMPTY_MEMORY);
    onClose();
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        if (!open) {
          form.reset(EMPTY_MEMORY);
          onClose();
        }
      }}
    >
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "create"
              ? uiT("ui.65a3bd29134fcd8d")
              : uiT("ui.f1be7e63b84c48df", { v0: String(initialRow?.key ?? "") })}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={(event) => event.preventDefault()} noValidate>
          <TooltipProvider>
            <FieldGroup>
              <FormField
                control={form.control}
                name="key"
                label={labelWithHint(
                  "Key",
                  "Globally unique — two memories cannot share a key. Namespace your own keys if you need per-user isolation (e.g. user:123:notes).",
                )}
              >
                {({ ref, ...field }) => (
                  <Input {...field} ref={ref} placeholder={uiT("ui.4e3f60656aa97853")} disabled={mode === "edit"} />
                )}
              </FormField>

              <FormField
                control={form.control}
                name="value"
                label={labelWithHint("Value", "Markdown/text injected into LLM context. Plain strings are fine.")}
              >
                {({ ref, ...field }) => (
                  <Textarea {...field} ref={ref} rows={8} placeholder={uiT("ui.4646e5c9f657a0a1")} />
                )}
              </FormField>

              <FormField
                control={form.control}
                name="metadata"
                label={labelWithHint(
                  <span>
                    {uiT("ui.9eddf573cb50")} <span className="text-muted-foreground">{uiT("ui.9935941459eca6fd")}</span>
                  </span>,
                  "Optional structured metadata — must be valid JSON if provided.",
                )}
              >
                {({ ref, ...field }) => (
                  <Textarea {...field} ref={ref} rows={4} placeholder='{"tags": ["example"]}' className="font-mono" />
                )}
              </FormField>
            </FieldGroup>
          </TooltipProvider>
        </form>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              form.reset(EMPTY_MEMORY);
              onClose();
            }}
          >
            {uiT("ui.19766ed6ccb2")}
          </Button>
          <Button onClick={handleOk} disabled={submitting} aria-busy={submitting}>
            {mode === "create" ? uiT("ui.4759498ac2a7") : uiT("ui.1509f561f241")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MemoryEditModal;
