export interface RegenerateKeyFormValues {
  key_alias?: string | null;
  max_budget?: number | null;
  tpm_limit?: number | null;
  rpm_limit?: number | null;
  duration: string;
  grace_period: string;
}

export const buildRegenerateKeyPayload = (values: RegenerateKeyFormValues): RegenerateKeyFormValues => ({
  ...values,
});
