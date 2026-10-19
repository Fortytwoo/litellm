"use client";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import { translateText } from "@/i18n";

import { useEffect, useState } from "react";
import { useFieldArray, useWatch, type UseFormReturn } from "react-hook-form";
import { ChevronDown, CircleAlert, Minus, Plus } from "lucide-react";

import useAuthorized from "@/app/(dashboard)/hooks/useAuthorized";
import { ALL_TEAM_MODELS, type ProjectFormValues, type ProjectSubmitValues } from "./projectFormSchema";
import { useTeams } from "@/app/(dashboard)/hooks/teams/useTeams";
import { Team } from "@/components/key_team_helpers/key_list";
import { fetchTeamModels } from "@/components/organisms/create_key_button";
import { getModelDisplayName } from "@/components/key_team_helpers/fetch_available_models_team_key";
import { getGuardrailsList } from "@/components/networking";
import { TagsInput } from "@/app/(dashboard)/guardrails/_components/content_filter/TagsInput";
import { Alert, AlertTitle } from "@/components/shared/Alert";
import { SearchSelect } from "@/components/shared/SearchSelect";
import { FieldGroup } from "@/components/ui/field";
import { FormField } from "@/components/shared/form/FormField";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "@/components/ui/input-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { teamsUserCanAssign } from "@/utils/roles";

const toOptionalNumber = (raw: string): number | undefined => {
  if (raw.trim() === "") return undefined;
  const parsed = Number(raw);
  return Number.isNaN(parsed) ? undefined : parsed;
};

interface ProjectBaseFormProps {
  form: UseFormReturn<ProjectFormValues, unknown, ProjectSubmitValues>;
  advancedOpen: boolean;
  onAdvancedOpenChange: (open: boolean) => void;
}

export type { ProjectFormValues } from "./projectFormSchema";

export function ProjectBaseForm({ form, advancedOpen, onAdvancedOpenChange }: ProjectBaseFormProps) {
  const { t: uiT } = useDashboardLanguage();

  const { accessToken, userId, userRole } = useAuthorized();
  const { data: teams } = useTeams();

  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [modelsToPick, setModelsToPick] = useState<string[]>([]);
  const [guardrailsList, setGuardrailsList] = useState<string[]>([]);

  const modelLimits = useFieldArray({ control: form.control, name: "modelLimits" });
  const metadata = useFieldArray({ control: form.control, name: "metadata" });
  const emptyModelLimit: NonNullable<ProjectFormValues["modelLimits"]>[number] = {
    model: "",
    tpm: undefined,
    rpm: undefined,
    itpm: undefined,
    otpm: undefined,
  };

  const teamIdValue = useWatch({ control: form.control, name: "team_id" });
  const isBlocked = useWatch({ control: form.control, name: "isBlocked" });

  useEffect(() => {
    const fetchGuardrails = async () => {
      if (!accessToken) return;
      try {
        const response = await getGuardrailsList(accessToken);
        const names = response.guardrails.map((g: { guardrail_name: string }) => g.guardrail_name);
        setGuardrailsList(names);
      } catch (error) {
        console.error("Failed to fetch guardrails:", error);
      }
    };
    fetchGuardrails();
  }, [accessToken]);

  useEffect(() => {
    if (teamIdValue && teams) {
      const team = teams.find((t) => t.team_id === teamIdValue) ?? null;
      if (team && team.team_id !== selectedTeam?.team_id) {
        setSelectedTeam(team);
      }
    }
  }, [teamIdValue, teams, selectedTeam?.team_id]);

  useEffect(() => {
    if (userId && userRole && accessToken && selectedTeam) {
      fetchTeamModels(userId, userRole, accessToken, selectedTeam.team_id).then((models) => {
        const allModels = Array.from(new Set([...(selectedTeam.models ?? []), ...models]));
        setModelsToPick(allModels);
      });
    } else {
      setModelsToPick([]);
    }
  }, [selectedTeam, accessToken, userId, userRole]);

  const handleTeamChange = (teamId: string | null) => {
    const team = teams?.find((t) => t.team_id === teamId) ?? null;
    setSelectedTeam(team);
    form.setValue("models", []);
  };

  const teamOptions = (teamsUserCanAssign(teams ?? null, userRole, userId) ?? []).map((team) => ({
    value: team.team_id,
    label: team.team_alias || team.team_id,
    sublabel: team.team_id,
  }));

  const modelOptions = [
    { value: ALL_TEAM_MODELS, label: uiT("ui.48f6183707a2") },
    ...modelsToPick.map((model) => ({ value: model, label: getModelDisplayName(model) })),
  ];
  const modelsPlaceholder = translateText(selectedTeam ? "Select models" : "Select a team first");

  return (
    <div className="mt-6">
      <p className="text-xs font-semibold tracking-[0.05em] text-foreground uppercase">{uiT("ui.d094b334d8099b1e")}</p>
      <Separator className="mt-2 mb-4" />

      <FieldGroup>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <FormField control={form.control} name="project_alias" label={uiT("ui.875ea40080d7838f")}>
            {({ ref, ...field }) => (
              <Input {...field} value={field.value ?? ""} ref={ref} placeholder={uiT("ui.27a6345d1bac7d6d")} />
            )}
          </FormField>

          <FormField control={form.control} name="team_id" label={uiT("ui.5985039f106d")}>
            {({ id, value, onChange, ref: _ref, ...field }) => (
              <SearchSelect
                {...field}
                inputId={id}
                options={teamOptions}
                value={value}
                onValueChange={(next) => {
                  onChange(next);
                  handleTeamChange(next);
                }}
                placeholder={uiT("ui.b696f7d9c4a8")}
                allowClear
              />
            )}
          </FormField>
        </div>

        <FormField control={form.control} name="description" label={uiT("ui.526e0087cc3f")}>
          {({ ref, ...field }) => (
            <Textarea
              {...field}
              value={field.value ?? ""}
              ref={ref}
              rows={3}
              placeholder={uiT("ui.eb50e2e74e3e29b5")}
            />
          )}
        </FormField>

        <FormField
          control={form.control}
          name="models"
          label={uiT("ui.a68a4a58771c17b4")}
          description={!selectedTeam ? uiT("ui.a0069090c62da671") : undefined}
        >
          {({ id, value, onChange, "aria-invalid": ariaInvalid, "aria-describedby": ariaDescribedBy }) => (
            <Select
              multiple
              items={modelOptions}
              value={value}
              onValueChange={(next: string[]) => onChange(next.includes(ALL_TEAM_MODELS) ? [ALL_TEAM_MODELS] : next)}
              disabled={!selectedTeam}
            >
              <SelectTrigger id={id} aria-invalid={ariaInvalid} aria-describedby={ariaDescribedBy} className="w-full">
                <SelectValue placeholder={modelsPlaceholder}>
                  {(selected: string[]) =>
                    selected.length === 0
                      ? modelsPlaceholder
                      : modelOptions
                          .filter((option) => selected.includes(option.value))
                          .map((option) => option.label)
                          .join(", ")
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {modelOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value} title={option.label}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </FormField>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <FormField control={form.control} name="max_budget" label={uiT("ui.afa99ea4a8c3")}>
            {({ ref, value, onChange, ...field }) => (
              <InputGroup>
                <InputGroupAddon>
                  <InputGroupText>$</InputGroupText>
                </InputGroupAddon>
                <InputGroupInput
                  {...field}
                  ref={ref}
                  type="number"
                  min={0}
                  placeholder="0.00"
                  value={Number.isNaN(value) ? "" : value ?? ""}
                  onInput={(event) => {
                    if (event.currentTarget.validity.badInput || Number.isNaN(value)) {
                      onChange(
                        event.currentTarget.validity.badInput
                          ? Number.NaN
                          : toOptionalNumber(event.currentTarget.value) ?? null,
                      );
                    }
                  }}
                  onChange={(event) =>
                    onChange(event.target.validity.badInput ? Number.NaN : toOptionalNumber(event.target.value) ?? null)
                  }
                />
              </InputGroup>
            )}
          </FormField>
        </div>
      </FieldGroup>

      <Collapsible
        open={advancedOpen}
        onOpenChange={onAdvancedOpenChange}
        className="mt-6 rounded-lg border border-border bg-muted"
      >
        <CollapsibleTrigger
          render={
            <button type="button" className="flex w-full items-center gap-2 px-4 py-3 text-left">
              <ChevronDown
                className={`size-4 text-muted-foreground transition-transform ${advancedOpen ? "" : "-rotate-90"}`}
              />
              <span className="text-sm font-semibold text-foreground">{uiT("ui.22d4f6088b718aa4")}</span>
            </button>
          }
        />
        <CollapsibleContent className="px-4 pb-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-foreground">{uiT("ui.f700aad7aa8fca34")}</span>
            <FormField control={form.control} name="isBlocked" className="w-auto">
              {({ id, value, onChange, ref: _ref, ...field }) => (
                <Switch {...field} id={id} checked={value} onCheckedChange={onChange} />
              )}
            </FormField>
          </div>

          {isBlocked ? (
            <Alert variant="warning" className="mt-3">
              <CircleAlert />
              <AlertTitle>{uiT("ui.030aacc9e9d32877")}</AlertTitle>
            </Alert>
          ) : null}

          <Separator className="my-4" />

          <FormField
            control={form.control}
            name="guardrails"
            label={uiT("ui.443f975eefe8")}
            description={uiT("ui.6a7e444cc660148e")}
          >
            {({ id, value, onChange }) => (
              <TagsInput
                id={id}
                value={value ?? []}
                onValueChange={onChange}
                options={guardrailsList.map((name) => ({ label: name, value: name }))}
                placeholder={uiT("ui.25c531a59a96bbe3")}
              />
            )}
          </FormField>

          <Separator className="my-4" />

          <p className="mb-3 text-sm font-semibold text-foreground">{uiT("ui.bb859f4773e5f2f4")}</p>
          {modelLimits.fields.map((field, index) => (
            <div
              key={field.id}
              className="mb-2 grid grid-cols-1 items-start gap-2 sm:grid-cols-2 xl:grid-cols-[minmax(0,2fr)_repeat(4,minmax(0,1fr))_auto]"
            >
              <FormField control={form.control} name={`modelLimits.${index}.model`} label={uiT("ui.5e2c614c23f0")}>
                {({ ref, ...control }) => (
                  <Input {...control} value={control.value ?? ""} ref={ref} placeholder={uiT("ui.a1882d90f572ef07")} />
                )}
              </FormField>
              <FormField control={form.control} name={`modelLimits.${index}.tpm`} label={uiT("ui.703406a2fc47")}>
                {({ ref, value, onChange, ...control }) => (
                  <Input
                    {...control}
                    ref={ref}
                    type="number"
                    min={0}
                    placeholder={uiT("ui.703406a2fc47")}
                    value={value ?? ""}
                    onChange={(event) => onChange(toOptionalNumber(event.target.value))}
                  />
                )}
              </FormField>
              <FormField control={form.control} name={`modelLimits.${index}.rpm`} label={uiT("ui.e543e799b809")}>
                {({ ref, value, onChange, ...control }) => (
                  <Input
                    {...control}
                    ref={ref}
                    type="number"
                    min={0}
                    placeholder={uiT("ui.e543e799b809")}
                    value={value ?? ""}
                    onChange={(event) => onChange(toOptionalNumber(event.target.value))}
                  />
                )}
              </FormField>
              <FormField control={form.control} name={`modelLimits.${index}.itpm`} label={uiT("ui.bf8fd4ac4876f881")}>
                {({ ref, value, onChange, ...control }) => (
                  <Input
                    {...control}
                    ref={ref}
                    type="number"
                    min={0}
                    placeholder={uiT("ui.bf8fd4ac4876f881")}
                    value={value ?? ""}
                    onChange={(event) => onChange(toOptionalNumber(event.target.value))}
                  />
                )}
              </FormField>
              <FormField control={form.control} name={`modelLimits.${index}.otpm`} label={uiT("ui.ca6163e1b53f9c45")}>
                {({ ref, value, onChange, ...control }) => (
                  <Input
                    {...control}
                    ref={ref}
                    type="number"
                    min={0}
                    placeholder={uiT("ui.ca6163e1b53f9c45")}
                    value={value ?? ""}
                    onChange={(event) => onChange(toOptionalNumber(event.target.value))}
                  />
                )}
              </FormField>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="mt-1 text-destructive"
                onClick={() => modelLimits.remove(index)}
                aria-label={uiT("ui.0b397ebbf60e897a", { v0: String(index + 1) })}
              >
                <Minus />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            className="w-full border-dashed"
            onClick={() => modelLimits.append(emptyModelLimit)}
          >
            <Plus />
            {uiT("ui.8171172cbcf572bf")}
          </Button>

          <Separator className="my-4" />

          <p className="mb-3 text-sm font-semibold text-foreground">{uiT("ui.9eddf573cb50")}</p>
          {metadata.fields.map((field, index) => (
            <div key={field.id} className="mb-2 flex items-start gap-2">
              <FormField control={form.control} name={`metadata.${index}.key`}>
                {({ ref, ...control }) => (
                  <Input {...control} value={control.value ?? ""} ref={ref} placeholder={uiT("ui.99a52df3ff3d")} />
                )}
              </FormField>
              <FormField control={form.control} name={`metadata.${index}.value`}>
                {({ ref, ...control }) => (
                  <Input {...control} value={control.value ?? ""} ref={ref} placeholder={uiT("ui.8e37953d23daca5f")} />
                )}
              </FormField>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="mt-1 text-destructive"
                onClick={() => metadata.remove(index)}
                aria-label={uiT("ui.99cadb8ad8002126", { v0: String(index + 1) })}
              >
                <Minus />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            className="w-full border-dashed"
            onClick={() => metadata.append({ key: "", value: "" })}
          >
            <Plus />
            {uiT("ui.dc1bfef3c80dc7c2")}
          </Button>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
