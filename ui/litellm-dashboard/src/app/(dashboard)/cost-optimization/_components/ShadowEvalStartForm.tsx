"use client";
import { t as translateUi } from "@/i18n";

import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";

import React, { useMemo, useState } from "react";

import { useInfiniteKeys } from "@/app/(dashboard)/hooks/keys/useKeys";
import { useInfiniteUsers } from "@/app/(dashboard)/hooks/users/useUsers";
import useAuthorized from "@/app/(dashboard)/hooks/useAuthorized";
import {
  useAutoRouters,
  usePlainChatModelDeployments,
  usePlainChatModelGroups,
  usePlainModelGroups,
} from "@/app/(dashboard)/hooks/models/useModels";
import { buildModelAvailability, deploymentRefsFromModelInfo, resolveAvailableModels } from "@/lib/autorouter_presets";
import { MultiSelect } from "@/components/shared/MultiSelect";
import { PaginatedMultiSelect } from "@/components/shared/PaginatedMultiSelect";
import TeamMultiSelect from "@/components/common_components/team_multi_select";
import { userOptionLabel } from "@/components/common_components/UserDropdown";
import { SearchSelect, type SearchSelectOption } from "@/components/shared/SearchSelect";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { useStartShadowEval, type ShadowEvalJob } from "./useShadowEval";

type ShadowEvalDirection = ShadowEvalJob["direction"];

const MAX_ROUTERS = 4;
const MAX_MODELS = 100;
const RECOMMENDED_JUDGE_MODELS = ["anthropic/claude-sonnet-5", "openai/gpt-4o", "gemini/gemini-2.5-pro"] as const;

const DIRECTION_OPTIONS: readonly { value: ShadowEvalDirection; label: string }[] = [
  {
    value: "forward",
    get label() {
      return translateUi("ui.4cf020c5b5fc288b");
    },
  },
  {
    value: "reverse",
    get label() {
      return translateUi("ui.b6c702f6c936b357");
    },
  },
] as const;

const START_FORM_DESCRIPTION: Record<ShadowEvalDirection, string> = {
  forward:
    "Duplicates a sampled slice of the selected targets' traffic (keys, teams, or users) through the auto-router and has an LLM judge compare both answers blind. Each target gets its own spend budget. The router's answers are never served to users; judge calls bill to the sampled traffic's own identity.",
  reverse:
    "Duplicates a sampled slice of the traffic the auto-router already serves against a fixed baseline model and has an LLM judge compare both answers blind. Each target gets its own spend budget. The baseline's answers are never served to users; judge calls bill to the sampled traffic's own identity.",
};

const DURATION_OPTIONS = [
  {
    value: "1",
    get label() {
      return translateUi("ui.fa665d95d29e83bc");
    },
  },
  {
    value: "3",
    get label() {
      return translateUi("ui.360719440e92c924");
    },
  },
  {
    value: "7",
    get label() {
      return translateUi("ui.7f920bb639c93075");
    },
  },
  {
    value: "14",
    get label() {
      return translateUi("ui.60acc36e5d51315d");
    },
  },
  {
    value: "30",
    get label() {
      return translateUi("ui.ffd7280513ce285e");
    },
  },
] as const;

const Field: React.FC<{ label: string; htmlFor?: string; className?: string; children: React.ReactNode }> = ({
  label,
  htmlFor,
  className,
  children,
}) => (
  <div className={`space-y-1.5 ${className ?? ""}`}>
    <Label htmlFor={htmlFor} className="text-xs">
      {label}
    </Label>
    {children}
  </div>
);

const KeySelect: React.FC<{ value: string[]; onChange: (tokens: string[]) => void }> = ({ value, onChange }) => {
  const { t: uiT } = useDashboardLanguage();

  const [search, setSearch] = useState("");
  const { data, isPending, isError, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteKeys(50, {
    selectedKeyAlias: search || null,
  });
  const options = useMemo<SearchSelectOption[]>(
    () =>
      (data?.pages ?? [])
        .flatMap((page) => page.keys)
        .map((key) => ({
          label: key.key_alias || key.key_name || key.token,
          value: key.token,
          sublabel: key.token,
        })),
    [data],
  );
  return (
    <PaginatedMultiSelect
      inputId="shadow-eval-key"
      options={options}
      value={value}
      onValueChange={onChange}
      onSearchChange={setSearch}
      onLoadMore={() => void fetchNextPage()}
      hasNextPage={hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
      isLoading={isPending}
      placeholder={uiT("ui.3983ab99edef46f3")}
      emptyText={uiT("ui.e7c5fa5b3dcc175a")}
      errorText={isError ? uiT("ui.de709b3dc138a363") : undefined}
    />
  );
};

const UserSelect: React.FC<{ value: string[]; onChange: (ids: string[]) => void }> = ({ value, onChange }) => {
  const { t: uiT } = useDashboardLanguage();

  const [search, setSearch] = useState("");
  const { data, isPending, isError, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteUsers(
    50,
    search || undefined,
  );
  const options = useMemo<SearchSelectOption[]>(
    () =>
      Array.from(
        new Map(
          (data?.pages ?? [])
            .flatMap((page) => page.users)
            .map((user) => [user.user_id, { label: userOptionLabel(user), value: user.user_id }] as const),
        ).values(),
      ),
    [data],
  );
  return (
    <PaginatedMultiSelect
      inputId="shadow-eval-user"
      options={options}
      value={value}
      onValueChange={onChange}
      onSearchChange={setSearch}
      onLoadMore={() => void fetchNextPage()}
      hasNextPage={hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
      isLoading={isPending}
      placeholder={uiT("ui.872c68953b10e5b3")}
      emptyText={uiT("ui.4d2b8a8498f19b72")}
      errorText={isError ? uiT("ui.a97673e6d28cb132") : undefined}
    />
  );
};

const RouterField: React.FC<{
  options: SearchSelectOption[];
  routerNames: string[];
  onChange: (names: string[]) => void;
  direction: ShadowEvalDirection;
}> = ({ options, routerNames, onChange, direction }) => {
  const { t: uiT } = useDashboardLanguage();
  return (
    <Field label={uiT("ui.fefb951fca9bf901")}>
      <MultiSelect
        options={options}
        value={routerNames}
        onValueChange={onChange}
        placeholder={uiT("ui.dcd73dac9fcbc08e")}
        emptyText={uiT("ui.daafa46dd8e33c35")}
      />
      {routerNames.length > MAX_ROUTERS && (
        <p className="text-xs text-destructive">
          {uiT("ui.39662e2c14a92ffc")} {MAX_ROUTERS} auto-routers
        </p>
      )}
      {direction === "reverse" && routerNames.length > 1 && (
        <p className="text-xs text-destructive">{uiT("ui.d201abb9a9155ba9")}</p>
      )}
      {direction === "forward" && routerNames.length > 1 && (
        <p className="text-xs text-muted-foreground">{uiT("ui.b030b31c4baee14e")}</p>
      )}
    </Field>
  );
};

interface StartFormValidityInputs {
  accessToken: string | null | undefined;
  apiKeyIds: string[];
  teamIds: string[];
  userIds: string[];
  models: string[];
  routerNames: string[];
  direction: ShadowEvalDirection;
  baselineModel: string | null;
  judgeModel: string | null;
  percentage: string;
  maxBudget: string;
}

const startFormValidity = (inputs: StartFormValidityInputs) => {
  const parsedPct = Number.parseFloat(inputs.percentage);
  const percentageValid = parsedPct >= 0.1 && parsedPct <= 100;
  const parsedMaxBudget = Number.parseFloat(inputs.maxBudget);
  const maxBudgetValid = parsedMaxBudget >= 0.01 && parsedMaxBudget <= 10000;
  const baselinePicked = inputs.direction === "forward" || Boolean(inputs.baselineModel);
  const targetsPicked = inputs.apiKeyIds.length + inputs.teamIds.length + inputs.userIds.length > 0;
  const routerCountValid = inputs.routerNames.length >= 1 && inputs.routerNames.length <= MAX_ROUTERS;
  const routersMatchDirection = inputs.direction === "forward" || inputs.routerNames.length === 1;
  const routersValid = routerCountValid && routersMatchDirection;
  const scopeValid = routersValid && (inputs.direction === "reverse" || inputs.models.length <= MAX_MODELS);
  const modelsPicked = scopeValid && Boolean(inputs.judgeModel) && baselinePicked;
  const filled = targetsPicked && modelsPicked;
  const boundsValid = percentageValid && maxBudgetValid;
  const valid = Boolean(inputs.accessToken) && filled && boundsValid;
  return { parsedPct, parsedMaxBudget, percentageValid, maxBudgetValid, valid };
};

interface StartBodyInputs {
  apiKeyIds: string[];
  teamIds: string[];
  userIds: string[];
  models: string[];
  routerNames: string[];
  direction: ShadowEvalDirection;
  baselineModel: string | null;
  shadowPercentage: number;
  durationDays: number;
  maxBudget: number;
  judgeModel: string;
}

const buildStartBody = (inputs: StartBodyInputs) => ({
  api_key_ids: inputs.apiKeyIds,
  team_ids: inputs.teamIds,
  user_ids: inputs.userIds,
  models: inputs.direction === "forward" ? inputs.models : [],
  router_names: inputs.routerNames,
  direction: inputs.direction,
  ...(inputs.direction === "reverse" ? { baseline_model: inputs.baselineModel ?? undefined } : {}),
  shadow_percentage: inputs.shadowPercentage,
  duration_days: inputs.durationDays,
  max_budget: inputs.maxBudget,
  judge_model: inputs.judgeModel,
});

export const StartForm: React.FC = () => {
  const { t: uiT } = useDashboardLanguage();

  const { accessToken } = useAuthorized();
  const [apiKeyIds, setApiKeyIds] = useState<string[]>([]);
  const [teamIds, setTeamIds] = useState<string[]>([]);
  const [userIds, setUserIds] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [routerNames, setRouterNames] = useState<string[]>([]);
  const [direction, setDirection] = useState<ShadowEvalDirection>("forward");
  const [baselineModel, setBaselineModel] = useState<string | null>(null);
  const [percentage, setPercentage] = useState("10");
  const [durationDays, setDurationDays] = useState("7");
  const [judgeModel, setJudgeModel] = useState<string | null>(null);
  const [maxBudget, setMaxBudget] = useState("10");
  const { data: autoRouters } = useAutoRouters();
  const configuredGroups = usePlainModelGroups();
  const chatGroups = usePlainChatModelGroups();
  const chatDeployments = usePlainChatModelDeployments();
  const modelOptions = useMemo<SearchSelectOption[]>(
    () => [...configuredGroups].toSorted((a, b) => a.localeCompare(b)).map((name) => ({ label: name, value: name })),
    [configuredGroups],
  );
  const chatOptions = useMemo(
    () => modelOptions.filter((option) => chatGroups.has(option.value)),
    [modelOptions, chatGroups],
  );
  const chatAvailability = useMemo(
    () => buildModelAvailability(chatGroups, deploymentRefsFromModelInfo(chatDeployments)),
    [chatDeployments, chatGroups],
  );
  const recommendedJudgeModels = useMemo(
    () => new Set(RECOMMENDED_JUDGE_MODELS.flatMap((model) => resolveAvailableModels(model, chatAvailability))),
    [chatAvailability],
  );
  const judgeOptions = useMemo(
    () =>
      chatOptions.map((option) =>
        recommendedJudgeModels.has(option.value) ? { ...option, sublabel: "Recommended" } : option,
      ),
    [chatOptions, recommendedJudgeModels],
  );
  const start = useStartShadowEval();

  const routerOptions = useMemo<SearchSelectOption[]>(() => {
    const names = new Set(
      (autoRouters ?? []).map((deployment) => deployment.model_name).filter((name): name is string => Boolean(name)),
    );
    return [...names].toSorted().map((name) => ({ label: name, value: name }));
  }, [autoRouters]);

  const validityInputs: StartFormValidityInputs = {
    accessToken,
    apiKeyIds,
    teamIds,
    userIds,
    models,
    routerNames,
    direction,
    baselineModel,
    judgeModel,
    percentage,
    maxBudget,
  };
  const { parsedPct, parsedMaxBudget, percentageValid, maxBudgetValid, valid } = startFormValidity(validityInputs);
  const handleStart = () => {
    if (!valid || !judgeModel) return;
    const bodyInputs: StartBodyInputs = {
      apiKeyIds,
      teamIds,
      userIds,
      models,
      routerNames,
      direction,
      baselineModel,
      shadowPercentage: parsedPct,
      durationDays: Number.parseInt(durationDays, 10),
      maxBudget: parsedMaxBudget,
      judgeModel,
    };
    start.mutate(buildStartBody(bodyInputs));
  };

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-foreground">{uiT("ui.3c25fe474bd4f943")}</CardTitle>
        <p className="text-xs text-muted-foreground">{START_FORM_DESCRIPTION[direction]}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label={uiT("ui.9c8a9579abe55bdc")}>
            <Select
              value={direction}
              onValueChange={(v: string | null) => setDirection(v === "reverse" ? "reverse" : "forward")}
            >
              <SelectTrigger className="w-full">
                <SelectValue>{DIRECTION_OPTIONS.find((o) => o.value === direction)?.label}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {DIRECTION_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label={uiT("ui.d6f4579bcfd70689")} htmlFor="shadow-eval-key">
            <KeySelect value={apiKeyIds} onChange={setApiKeyIds} />
          </Field>
          <Field label={uiT("ui.32db026a28364029")}>
            <TeamMultiSelect value={teamIds} onChange={setTeamIds} placeholder={uiT("ui.8f700e9ccdc8d122")} />
          </Field>
          <Field label={uiT("ui.6f993b588497f6b6")} htmlFor="shadow-eval-user">
            <UserSelect value={userIds} onChange={setUserIds} />
          </Field>
          {direction === "forward" && (
            <Field label={uiT("ui.829d961d04da68a3")}>
              <MultiSelect
                options={modelOptions}
                value={models}
                onValueChange={setModels}
                placeholder={uiT("ui.94f1a1453e63e26c")}
                emptyText={uiT("ui.fb2770bd40fd14ba")}
              />
              {models.length > MAX_MODELS ? (
                <p className="text-xs text-destructive">
                  {uiT("ui.39662e2c14a92ffc")} {MAX_MODELS} {uiT("ui.8edcc26c0f6c7256")}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">{uiT("ui.e2087a4aa6446c86")}</p>
              )}
            </Field>
          )}
          <RouterField
            options={routerOptions}
            routerNames={routerNames}
            onChange={setRouterNames}
            direction={direction}
          />
          <Field label={uiT("ui.01e2971717d54d95")} htmlFor="shadow-eval-pct">
            <div className="flex items-center gap-2">
              <Input
                id="shadow-eval-pct"
                type="number"
                min={0.1}
                max={100}
                step={0.1}
                className="w-24"
                value={percentage}
                onChange={(e) => setPercentage(e.target.value)}
              />
              <span className="text-sm text-muted-foreground">{uiT("ui.499977bddecffe0e")}</span>
            </div>
            <div>
              {percentage.trim() !== "" && !percentageValid && (
                <p className="text-xs text-destructive">{uiT("ui.1e3bdcd4609a051f")}</p>
              )}
            </div>
          </Field>
          <Field label={uiT("ui.4fc52a3c4c55")}>
            <Select value={durationDays} onValueChange={(v: string | null) => setDurationDays(v ?? "7")}>
              <SelectTrigger className="w-full">
                <SelectValue>{DURATION_OPTIONS.find((o) => o.value === durationDays)?.label}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {DURATION_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label={uiT("ui.3c54f765f71ffae6")}>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">$</span>
              <Input
                type="number"
                min={0.01}
                max={10000}
                step={0.01}
                className="w-24"
                value={maxBudget}
                onChange={(e) => setMaxBudget(e.target.value)}
              />
              <span className="text-sm text-muted-foreground">{uiT("ui.fd1e0e178e105f8c")}</span>
            </div>
            {maxBudget.trim() !== "" && !maxBudgetValid && (
              <p className="text-xs text-destructive">{uiT("ui.b7a96511ff0bac31")}</p>
            )}
          </Field>
          {direction === "reverse" && (
            <Field label={uiT("ui.91e44ce0eb5df720")}>
              <SearchSelect
                options={chatOptions}
                value={baselineModel}
                onValueChange={setBaselineModel}
                placeholder={uiT("ui.7a1e61f977438cbb")}
                emptyText={uiT("ui.f6656605958fc94c")}
              />
            </Field>
          )}
          <Field label={uiT("ui.2b566109cfdfd661")} className="sm:col-span-2">
            <SearchSelect
              options={judgeOptions}
              value={judgeModel}
              onValueChange={setJudgeModel}
              placeholder={uiT("ui.250cf8a36e5b1455")}
              emptyText={uiT("ui.f6656605958fc94c")}
            />
          </Field>
        </div>
        <Button disabled={!valid || start.isPending} onClick={handleStart}>
          {start.isPending ? uiT("ui.82b93630a921dddf") : uiT("ui.dc5e96ac332f4c42")}
        </Button>
      </CardContent>
    </Card>
  );
};
