import { t as translateUi } from "@/i18n";
import { z } from "zod";

export const ALL_TEAM_MODELS = "all-team-models";

const repeatsEarlierValue = (values: readonly string[], index: number): boolean =>
  values[index] !== "" && values.indexOf(values[index]) !== index;

const modelLimitSchema = z.object({
  model: z.string().min(1, "Missing model"),
  tpm: z.number().optional(),
  rpm: z.number().optional(),
  itpm: z.number().optional(),
  otpm: z.number().optional(),
});

export const projectFormSchema = z
  .object({
    project_alias: z.string().min(1, "Please enter a project name"),
    team_id: z
      .string()
      .nullable()
      .pipe(z.string({ error: () => translateUi("ui.53df18bb986860b9") }).min(1, "Please select a team")),
    description: z.string().optional(),
    models: z.array(z.string()),
    max_budget: z.number().nullish(),
    isBlocked: z.boolean(),
    guardrails: z.array(z.string()).optional(),
    modelLimits: z.array(modelLimitSchema).optional(),
    metadata: z
      .array(
        z.object({
          key: z.string().min(1, "Missing key"),
          value: z.string().min(1, "Missing value"),
        }),
      )
      .optional(),
  })
  .superRefine((values, ctx) => {
    const models = (values.modelLimits ?? []).map((entry) => entry.model);
    models.forEach((_, index) => {
      if (repeatsEarlierValue(models, index)) {
        ctx.addIssue({
          code: "custom",
          get message() {
            return translateUi("ui.69556f9627227f29");
          },
          path: ["modelLimits", index, "model"],
        });
      }
    });

    const keys = (values.metadata ?? []).map((entry) => entry.key);
    keys.forEach((_, index) => {
      if (repeatsEarlierValue(keys, index)) {
        ctx.addIssue({
          code: "custom",
          get message() {
            return translateUi("ui.d849552825a8392a");
          },
          path: ["metadata", index, "key"],
        });
      }
    });
  });

export type ProjectFormValues = z.input<typeof projectFormSchema>;
export type ProjectSubmitValues = z.output<typeof projectFormSchema>;

export const emptyProjectFormValues: ProjectFormValues = {
  project_alias: "",
  team_id: null,
  description: undefined,
  models: [],
  max_budget: undefined,
  isBlocked: false,
  guardrails: undefined,
  modelLimits: undefined,
  metadata: undefined,
};
