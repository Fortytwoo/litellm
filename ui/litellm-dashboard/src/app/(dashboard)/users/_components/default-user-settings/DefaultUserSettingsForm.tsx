"use client";

import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import { t as translateUi } from "@/i18n";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as React from "react";
import { useFieldArray, type Control } from "react-hook-form";

import { useInfiniteTeams } from "@/app/(dashboard)/hooks/teams/useTeams";
import { ModelSelect, MODEL_SENTINEL_OPTIONS } from "@/components/ModelSelect/ModelSelect";
import { toast } from "@/lib/toast";
import { PaginatedSearchSelect } from "@/components/shared/PaginatedSearchSelect";
import { FieldGroup } from "@/components/ui/field";
import { FormField } from "@/components/shared/form/FormField";
import type { SearchSelectOption } from "@/components/shared/SearchSelect";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useZodForm } from "@/lib/forms/useZodForm";
import { fetchClient } from "@/lib/http/api";

import { buildBody, settingsToForm, type DefaultInternalUserParams, type InternalUserSettings } from "./mapper";
import {
  defaultUserSettingsSchema,
  EMPTY_TEAM_ROW,
  type DefaultUserSettingsFormValues,
  type DefaultUserSettingsSubmitValues,
} from "./schema";

const NO_RESET = "never";

const BUDGET_DURATION_OPTIONS = [
  {
    value: NO_RESET,
    get label() {
      return translateUi("ui.c49ea0b73d1c");
    },
  },
  {
    value: "1h",
    get label() {
      return translateUi("ui.2b2a51df70a1");
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

const TEAM_ROLE_OPTIONS = [
  {
    value: "user",
    get label() {
      return translateUi("ui.b512d97e7cbf");
    },
  },
  {
    value: "admin",
    get label() {
      return translateUi("ui.c1c224b03cd9");
    },
  },
] as const;

const modelSentinelLabel = (model: string): string =>
  MODEL_SENTINEL_OPTIONS.find((option) => option.value === model)?.label ?? model;

const TEAMS_PAGE_SIZE = 50;

const SETTINGS_QUERY_KEY = ["internalUserSettings"] as const;

const defaultFetchSettings = async (): Promise<InternalUserSettings> => {
  const { data } = await fetchClient.GET("/get/internal_user_settings");
  if (data === undefined) {
    throw new Error("Failed to load default user settings");
  }
  return data;
};

const defaultUpdateSettings = async (body: DefaultInternalUserParams): Promise<void> => {
  await fetchClient.PATCH("/update/internal_user_settings", { body });
};

interface RoleOption {
  value: string;
  label: string;
  description: string;
}

type SettingsControl = Control<DefaultUserSettingsFormValues, unknown, DefaultUserSettingsSubmitValues>;

const TeamPickerField = ({ control, index }: { control: SettingsControl; index: number }) => {
  const { t: uiT } = useDashboardLanguage();

  const [search, setSearch] = React.useState("");
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteTeams(
    TEAMS_PAGE_SIZE,
    search === "" ? undefined : search,
  );

  const options = React.useMemo<SearchSelectOption[]>(
    () =>
      (data?.pages ?? []).flatMap((page) =>
        page.teams.map((team) => ({
          label: team.team_alias || team.team_id,
          value: team.team_id,
          sublabel: team.team_id,
        })),
      ),
    [data],
  );

  return (
    <FormField control={control} name={`teams.${index}.team_id`} label={uiT("ui.5985039f106d")}>
      {({ id, value, onChange, "aria-invalid": ariaInvalid, "aria-describedby": ariaDescribedBy }) => (
        <PaginatedSearchSelect
          options={options}
          value={value}
          onValueChange={onChange}
          onSearchChange={setSearch}
          onLoadMore={() => void fetchNextPage()}
          hasNextPage={hasNextPage}
          isLoading={isLoading}
          isFetchingNextPage={isFetchingNextPage}
          placeholder={uiT("ui.790c881f4e76")}
          emptyText={uiT("ui.c83a06f9875f")}
          inputId={id}
          aria-invalid={ariaInvalid}
          aria-describedby={ariaDescribedBy}
        />
      )}
    </FormField>
  );
};

const TeamsField = ({ control }: { control: SettingsControl }) => {
  const { t: uiT } = useDashboardLanguage();

  const { fields, append, remove } = useFieldArray({ control, name: "teams" });

  return (
    <div className="flex w-full flex-col gap-3">
      <div>
        <p className="text-sm font-medium">{uiT("ui.05e6997e8076")}</p>
        <p className="text-sm text-muted-foreground">{uiT("ui.c97870c862cc")}</p>
      </div>

      {fields.map((field, index) => (
        <div key={field.id} className="rounded-lg border border-border p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-medium">
              {uiT("ui.5985039f106d")} {index + 1}
            </p>
            <Button type="button" variant="destructive" size="sm" onClick={() => remove(index)}>
              {uiT("ui.c3812fc4acb8")}
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <TeamPickerField control={control} index={index} />

            <FormField control={control} name={`teams.${index}.max_budget_in_team`} label={uiT("ui.fff32eae19c4")}>
              {({ ref, ...budgetField }) => (
                <Input
                  {...budgetField}
                  ref={ref}
                  type="number"
                  step="any"
                  min={0}
                  placeholder={uiT("ui.59be71333c96")}
                />
              )}
            </FormField>

            <FormField control={control} name={`teams.${index}.user_role`} label={uiT("ui.5c4e91007e9b")}>
              {({ id, value, onChange, "aria-invalid": ariaInvalid, "aria-describedby": ariaDescribedBy }) => (
                <Select
                  items={TEAM_ROLE_OPTIONS}
                  value={value}
                  onValueChange={(selected) => onChange(selected ?? "user")}
                >
                  <SelectTrigger
                    id={id}
                    className="w-full"
                    aria-invalid={ariaInvalid}
                    aria-describedby={ariaDescribedBy}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TEAM_ROLE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </FormField>
          </div>
        </div>
      ))}

      <Button type="button" variant="outline" onClick={() => append(EMPTY_TEAM_ROW)}>
        {uiT("ui.ffbbac1184a1")}
      </Button>
    </div>
  );
};

const ViewRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <p className="text-sm font-medium">{label}</p>
    <p className="text-sm text-muted-foreground">{children}</p>
  </div>
);

interface SettingsViewProps {
  values: DefaultUserSettingsFormValues;
  roleOptions: readonly RoleOption[];
}

const SettingsView = ({ values, roleOptions }: SettingsViewProps) => {
  const { t: uiT } = useDashboardLanguage();

  const roleLabel = roleOptions.find((option) => option.value === values.user_role)?.label ?? values.user_role;
  const durationValue = values.budget_duration === "" ? NO_RESET : values.budget_duration;
  const durationLabel =
    BUDGET_DURATION_OPTIONS.find((option) => option.value === durationValue)?.label ?? values.budget_duration;

  return (
    <div className="flex flex-col gap-4">
      <ViewRow label={uiT("ui.5bcfbd6bd78a")}>{roleLabel === "" ? uiT("ui.4895f73177ab") : roleLabel}</ViewRow>
      <ViewRow label={uiT("ui.afa99ea4a8c3")}>
        {values.max_budget === "" ? uiT("ui.4895f73177ab") : values.max_budget}
      </ViewRow>
      <ViewRow label={uiT("ui.66b0753db929")}>{durationLabel}</ViewRow>
      <ViewRow label={uiT("ui.fbe494fbd195")}>
        {values.models.length === 0 ? uiT("ui.4895f73177ab") : values.models.map(modelSentinelLabel).join(", ")}
      </ViewRow>
      <div>
        <p className="text-sm font-medium">{uiT("ui.05e6997e8076")}</p>
        {values.teams.length === 0 ? (
          <p className="text-sm text-muted-foreground">{uiT("ui.dc937b598926")}</p>
        ) : (
          values.teams.map((team) => (
            <p key={team.team_id} className="text-sm text-muted-foreground">
              {team.team_id}
              {team.max_budget_in_team !== "" && (
                <>
                  {" "}
                  · ${team.max_budget_in_team} {uiT("ui.b31eb1f9a652")}
                </>
              )}
              <> · {team.user_role}</>
            </p>
          ))
        )}
      </div>
    </div>
  );
};

interface SettingsFormProps {
  initialValues: DefaultUserSettingsFormValues;
  roleOptions: readonly RoleOption[];
  updateSettings: (body: DefaultInternalUserParams) => Promise<void>;
  onCancel: () => void;
  onSaved: () => void;
}

const SettingsForm = ({ initialValues, roleOptions, updateSettings, onCancel, onSaved }: SettingsFormProps) => {
  const { t: uiT } = useDashboardLanguage();

  const queryClient = useQueryClient();
  const form = useZodForm(defaultUserSettingsSchema, { defaultValues: initialValues });
  const { isDirty } = form.formState;

  const mutation = useMutation({
    mutationFn: (values: DefaultUserSettingsSubmitValues) => updateSettings(buildBody(values)),
    onSuccess: (_result, values) => {
      toast.success(translateUi("ui.eba41e0a1b7b"));
      queryClient.invalidateQueries({ queryKey: SETTINGS_QUERY_KEY });
      form.reset(values);
      onSaved();
    },
    onError: (error: unknown) =>
      toast.fromError(error instanceof Error ? error.message : "Failed to update default user settings"),
  });

  const onSubmit = form.handleSubmit((values) => mutation.mutate(values));

  return (
    <form onSubmit={onSubmit} noValidate>
      <FieldGroup>
        <FormField
          control={form.control}
          name="user_role"
          label={uiT("ui.5bcfbd6bd78a")}
          description={uiT("ui.a0e3f71045d7")}
        >
          {({ id, value, onChange, "aria-invalid": ariaInvalid, "aria-describedby": ariaDescribedBy }) => (
            <Select
              items={roleOptions}
              value={value === "" ? null : value}
              onValueChange={(selected) => onChange(selected ?? "")}
            >
              <SelectTrigger id={id} className="w-full" aria-invalid={ariaInvalid} aria-describedby={ariaDescribedBy}>
                <SelectValue placeholder={uiT("ui.4895f73177ab")} />
              </SelectTrigger>
              <SelectContent>
                {roleOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <span>{option.label}</span>
                    {option.description !== "" && (
                      <span className="text-xs text-muted-foreground">{option.description}</span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </FormField>

        <FormField
          control={form.control}
          name="max_budget"
          label={uiT("ui.afa99ea4a8c3")}
          description={uiT("ui.ca105dd47c66")}
        >
          {({ ref, ...field }) => <Input {...field} ref={ref} type="number" step="any" min={0} />}
        </FormField>

        <FormField
          control={form.control}
          name="budget_duration"
          label={uiT("ui.66b0753db929")}
          description={uiT("ui.54d1100b3e00")}
        >
          {({ id, value, onChange, "aria-invalid": ariaInvalid, "aria-describedby": ariaDescribedBy }) => (
            <Select
              items={BUDGET_DURATION_OPTIONS}
              value={value === "" ? NO_RESET : value}
              onValueChange={(selected) => onChange(selected === null || selected === NO_RESET ? "" : selected)}
            >
              <SelectTrigger id={id} className="w-full" aria-invalid={ariaInvalid} aria-describedby={ariaDescribedBy}>
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

        <FormField
          control={form.control}
          name="models"
          label={uiT("ui.fbe494fbd195")}
          description={uiT("ui.274eefd21156")}
        >
          {(field) => (
            <ModelSelect
              value={field.value}
              onChange={field.onChange}
              context="global"
              options={{ includeSpecialOptions: true }}
            />
          )}
        </FormField>

        <TeamsField control={form.control} />
      </FieldGroup>

      <div className="mt-6 flex items-center justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            form.reset(initialValues);
            onCancel();
          }}
          disabled={mutation.isPending}
        >
          {uiT("ui.19766ed6ccb2")}
        </Button>
        <Button type="submit" disabled={!isDirty || mutation.isPending}>
          {mutation.isPending ? uiT("ui.dc85af8f2b1d") : uiT("ui.35322b5bb5a2")}
        </Button>
      </div>
    </form>
  );
};

const SettingsCard = ({ action, children }: { action?: React.ReactNode; children: React.ReactNode }) => {
  const { t: uiT } = useDashboardLanguage();
  return (
    <Card>
      <CardHeader>
        <CardTitle>{uiT("ui.021d7bfda9c4")}</CardTitle>
        <CardDescription>{uiT("ui.340b3797a252")}</CardDescription>
        {action !== undefined && <CardAction>{action}</CardAction>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
};

export interface DefaultUserSettingsFormProps {
  possibleUIRoles?: Record<string, Record<string, string>> | null;
  fetchSettings?: () => Promise<InternalUserSettings>;
  updateSettings?: (body: DefaultInternalUserParams) => Promise<void>;
}

export const DefaultUserSettingsForm = ({
  possibleUIRoles,
  fetchSettings = defaultFetchSettings,
  updateSettings = defaultUpdateSettings,
}: DefaultUserSettingsFormProps) => {
  const { t: uiT } = useDashboardLanguage();

  const [isEditing, setIsEditing] = React.useState(false);
  const { data, isPending, isError } = useQuery({ queryKey: SETTINGS_QUERY_KEY, queryFn: fetchSettings });

  const roleOptions = React.useMemo<RoleOption[]>(
    () =>
      Object.entries(possibleUIRoles ?? {})
        .filter(([role]) => role.includes("internal_user"))
        .map(([role, meta]) => ({ value: role, label: meta.ui_label || role, description: meta.description ?? "" })),
    [possibleUIRoles],
  );

  const initialValues = React.useMemo(() => (data === undefined ? undefined : settingsToForm(data.values)), [data]);

  if (isPending) {
    return (
      <SettingsCard>
        <Skeleton className="h-64 w-full" />
      </SettingsCard>
    );
  }

  if (isError || initialValues === undefined) {
    return (
      <SettingsCard>
        <p role="alert">{uiT("ui.ebfa97e3ab1d")}</p>
      </SettingsCard>
    );
  }

  return (
    <SettingsCard
      action={
        isEditing ? undefined : (
          <Button type="button" onClick={() => setIsEditing(true)}>
            {uiT("ui.cddc5824575b")}
          </Button>
        )
      }
    >
      {isEditing ? (
        <SettingsForm
          initialValues={initialValues}
          roleOptions={roleOptions}
          updateSettings={updateSettings}
          onCancel={() => setIsEditing(false)}
          onSaved={() => setIsEditing(false)}
        />
      ) : (
        <SettingsView values={initialValues} roleOptions={roleOptions} />
      )}
    </SettingsCard>
  );
};
