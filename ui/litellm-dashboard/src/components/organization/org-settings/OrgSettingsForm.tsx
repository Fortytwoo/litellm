"use client";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import { t as translateUi } from "@/i18n";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as React from "react";

import { organizationKeys } from "@/app/(dashboard)/hooks/organizations/useOrganizations";
import { ModelSelect } from "@/components/ModelSelect/ModelSelect";
import MCPServerSelector from "@/components/mcp_server_management/MCPServerSelector";
import { toast } from "@/lib/toast";
import type { Organization } from "@/components/networking";
import { FieldGroup } from "@/components/ui/field";
import { FormField } from "@/components/shared/form/FormField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import VectorStoreSelector from "@/components/vector_store_management/VectorStoreSelector";
import { pickDirty } from "@/lib/forms/pickDirty";
import { useZodForm } from "@/lib/forms/useZodForm";
import { fetchClient } from "@/lib/http/api";

import { buildOrgPatch, orgToForm, type OrgPatchBody } from "./mapper";
import { orgSettingsSchema } from "./schema";

export const NO_RESET = "never";

export const BUDGET_DURATION_OPTIONS = [
  {
    value: NO_RESET,
    get label() {
      return translateUi("ui.c49ea0b73d1c");
    },
  },
  {
    value: "24h",
    get label() {
      return translateUi("ui.6f31304cdfd0");
    },
  },
  {
    value: "7d",
    get label() {
      return translateUi("ui.8850eced986e");
    },
  },
  {
    value: "30d",
    get label() {
      return translateUi("ui.9169e3ca73ee");
    },
  },
] as const;

const defaultPatchOrganization = async (organizationId: string, body: OrgPatchBody): Promise<unknown> => {
  const { data } = await fetchClient.PATCH("/v2/organization/{organization_id}", {
    params: { path: { organization_id: organizationId } },
    body,
  });
  return data;
};

interface OrgSettingsFormProps {
  organizationId: string;
  org: Organization;
  accessToken: string;
  onCancel: () => void;
  onSaved: () => void;
  patchOrganization?: (organizationId: string, body: OrgPatchBody) => Promise<unknown>;
}

export const OrgSettingsForm = ({
  organizationId,
  org,
  accessToken,
  onCancel,
  onSaved,
  patchOrganization = defaultPatchOrganization,
}: OrgSettingsFormProps) => {
  const { t: uiT } = useDashboardLanguage();

  const queryClient = useQueryClient();
  const form = useZodForm(orgSettingsSchema, { defaultValues: orgToForm(org) });
  const { isDirty } = form.formState;

  const mutation = useMutation({
    mutationFn: (body: OrgPatchBody) => patchOrganization(organizationId, body),
    onSuccess: () => {
      toast.success(translateUi("ui.7e077bab54d72f3b"));
      queryClient.invalidateQueries({ queryKey: organizationKeys.all });
      onSaved();
    },
    onError: (error: unknown) =>
      toast.fromError(error instanceof Error ? error.message : "Failed to update organization settings"),
  });

  const onSubmit = form.handleSubmit((values) => {
    mutation.mutate(buildOrgPatch(pickDirty(values, form.formState.dirtyFields)));
  });

  return (
    <form onSubmit={onSubmit} noValidate>
      <FieldGroup>
        <FormField control={form.control} name="organization_alias" label={uiT("ui.4cbd90732447a928")}>
          {({ ref, ...field }) => <Input {...field} ref={ref} />}
        </FormField>

        <FormField control={form.control} name="models" label={uiT("ui.d17d2d78d76e")}>
          {(field) => (
            <ModelSelect
              value={field.value}
              onChange={field.onChange}
              context="organization"
              options={{ includeSpecialOptions: true, showAllProxyModelsOverride: true }}
            />
          )}
        </FormField>

        <FormField control={form.control} name="max_budget" label={uiT("ui.afa99ea4a8c3")}>
          {({ ref, ...field }) => <Input {...field} ref={ref} type="number" step="any" min={0} />}
        </FormField>

        <FormField control={form.control} name="budget_duration" label={uiT("ui.66b0753db929")}>
          {({ id, value, onChange, "aria-invalid": ariaInvalid, "aria-describedby": ariaDescribedBy }) => (
            <Select
              items={BUDGET_DURATION_OPTIONS}
              value={value === "" ? NO_RESET : value}
              onValueChange={(selected) => onChange(selected === NO_RESET ? "" : selected)}
            >
              <SelectTrigger id={id} aria-invalid={ariaInvalid} aria-describedby={ariaDescribedBy}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BUDGET_DURATION_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </FormField>

        <FormField control={form.control} name="tpm_limit" label={uiT("ui.fc2295c5aa4194d7")}>
          {({ ref, ...field }) => <Input {...field} ref={ref} type="number" step={1} min={0} />}
        </FormField>

        <FormField control={form.control} name="rpm_limit" label={uiT("ui.78a5a4ba4bb627b1")}>
          {({ ref, ...field }) => <Input {...field} ref={ref} type="number" step={1} min={0} />}
        </FormField>

        <FormField control={form.control} name="vector_stores" label={uiT("ui.a6110d660e9b")}>
          {(field) => (
            <VectorStoreSelector
              value={field.value}
              onChange={field.onChange}
              accessToken={accessToken}
              placeholder={uiT("ui.9b0282c14af0")}
            />
          )}
        </FormField>

        <FormField control={form.control} name="mcp" label={uiT("ui.aec31adce0563873")}>
          {(field) => (
            <MCPServerSelector
              value={field.value}
              onChange={field.onChange}
              accessToken={accessToken}
              placeholder={uiT("ui.1ccf27a4854f37df")}
            />
          )}
        </FormField>

        <FormField control={form.control} name="metadata" label={uiT("ui.9eddf573cb50")}>
          {({ ref, ...field }) => <Textarea {...field} ref={ref} rows={4} />}
        </FormField>
      </FieldGroup>

      <div className="sticky z-chrome bg-card p-4 border-t border-border -bottom-6 -inset-x-6 mt-6">
        <div className="flex justify-end items-center gap-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={mutation.isPending}>
            {uiT("ui.19766ed6ccb2")}
          </Button>
          <Button type="submit" disabled={!isDirty || mutation.isPending}>
            {mutation.isPending ? uiT("ui.dc85af8f2b1d") : uiT("ui.35322b5bb5a2")}
          </Button>
        </div>
      </div>
    </form>
  );
};
