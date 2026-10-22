import { t as translateUi } from "@/i18n";
import { z } from "zod";
import { cnyToUsd } from "@/utils/currency";

const analysisAccessFields = { model: z.string().nullable(), budget: z.string() };
const workerFormFields = {
  useExisting: z.boolean(),
  analysisKey: z.string().nullable(),
  access: z.object(analysisAccessFields),
};
export const analysisAccessSchema = z
  .object(analysisAccessFields)
  .superRefine((access, ctx) => {
    if (!access.model || !Number.isFinite(Number(access.budget)) || Number(access.budget) <= 0)
      ctx.addIssue({
        code: "custom",
        get message() {
          return translateUi("ui.817f158bd8f98f96");
        },
      });
  })
  .transform((access) => ({ model: access.model ?? "", budget: cnyToUsd(Number(access.budget)) }));

export type AnalysisAccess = z.input<typeof analysisAccessSchema>;

export const workerFormSchema = z.object(workerFormFields).superRefine((values, ctx) => {
  if (values.useExisting) {
    if (!values.analysisKey) {
      ctx.addIssue({
        code: "custom",
        get message() {
          return translateUi("ui.15f8d0747c6c9509");
        },
        path: ["analysisKey"],
      });
    }
  } else {
    const result = analysisAccessSchema.safeParse(values.access);
    if (!result.success) {
      ctx.addIssue({
        code: "custom",
        message: result.error.issues[0].message,
        path: ["access"],
      });
    }
  }
});

export type WorkerFormInput = z.input<typeof workerFormSchema>;
