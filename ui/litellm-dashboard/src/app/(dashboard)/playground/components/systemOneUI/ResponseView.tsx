"use client";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, LoaderCircle } from "lucide-react";
import { useState } from "react";
import type { SystemOneAnswer, SystemOneResponse } from "./lib/schemas";
import type { OpenAIDecisionsResponse } from "./lib/openAIDecisions";

const SCORE_FORMAT = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });

interface ResponseViewProps {
  response?: SystemOneResponse | OpenAIDecisionsResponse;
  view?: "form" | "curl";
  fallbackModel?: string;
  latencyMs?: number;
  error?: string;
  isLoading: boolean;
}

function ProbabilityMeter({
  label,
  probability,
  selected = false,
}: {
  label: string;
  probability: number;
  selected?: boolean;
}) {
  const { t: uiT } = useDashboardLanguage();

  const percentage = Math.round(probability * 100);
  return (
    <div className="grid gap-1.5">
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className={selected ? "font-semibold" : "text-muted-foreground"}>{label}</span>
        <span className={selected ? "font-semibold tabular-nums" : "tabular-nums"}>{percentage}%</span>
      </div>
      <div
        role="meter"
        aria-label={uiT("ui.7cc623bacd18cfb8", { v0: String(label) })}
        aria-valuenow={percentage}
        aria-valuetext={selected ? `${percentage}%, selected` : `${percentage}%`}
        aria-valuemin={0}
        aria-valuemax={100}
        className="h-2 overflow-hidden rounded-full bg-muted"
      >
        <div
          className={`h-full rounded-full ${selected ? "bg-primary" : "bg-primary/40"}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function AnswerDetails({ answer }: { answer: SystemOneAnswer }) {
  const { t: uiT } = useDashboardLanguage();

  if (answer.type === "noul") {
    const percentage = Math.round(answer.noul * 100);
    return (
      <div className="grid gap-3">
        <p className="text-sm font-medium">
          {percentage}
          {uiT("ui.c6461a1d9a3b91a6")}
        </p>
        <ProbabilityMeter label={uiT("ui.85a39ab345d672ff")} probability={answer.noul} />
      </div>
    );
  }

  if (answer.type === "choice") {
    const options = Object.entries(answer.probabilities).sort(([, first], [, second]) => second - first);
    return (
      <div className="grid gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">{uiT("ui.eb5cadfc856da81b")}</span>
          <Badge>{answer.choice}</Badge>
          {answer.confidence !== undefined && (
            <Badge variant="outline">
              {Math.round(answer.confidence * 100)}
              {uiT("ui.5c89e1e680ef7eff")}
            </Badge>
          )}
        </div>
        <div className="grid gap-3">
          {options.map(([label, probability]) => (
            <ProbabilityMeter key={label} label={label} probability={probability} selected={label === answer.choice} />
          ))}
        </div>
      </div>
    );
  }

  const levels = Object.entries(answer.probabilities).sort(([first], [second]) => Number(first) - Number(second));
  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground">{uiT("ui.38e5a46cbc5a")}</span>
        <Badge>{SCORE_FORMAT.format(answer.score)}</Badge>
        {answer.confidence !== undefined && (
          <Badge variant="outline">
            {Math.round(answer.confidence * 100)}
            {uiT("ui.5c89e1e680ef7eff")}
          </Badge>
        )}
      </div>
      <div className="grid gap-3">
        {levels.map(([level, probability]) => {
          const description = answer.legend?.[level];
          const label =
            description === undefined
              ? level
              : `${level}: ${typeof description === "string" ? description : JSON.stringify(description)}`;
          return (
            <ProbabilityMeter
              key={level}
              label={label}
              probability={probability}
              selected={Number(level) === Math.round(answer.score)}
            />
          );
        })}
      </div>
    </div>
  );
}

function OpenAIAnswerDetails({ answer }: { answer: OpenAIDecisionsResponse["answers"][number] }) {
  const { t: uiT } = useDashboardLanguage();

  switch (answer.type) {
    case "refusal":
      return <p className="text-sm text-muted-foreground">{uiT("ui.f5d6752da2d33cea")}</p>;
    case "predicate":
      return <AnswerDetails answer={{ type: "noul", noul: answer.probability }} />;
    case "choice":
      return (
        <AnswerDetails
          answer={{
            type: "choice",
            choice: String(answer.choice),
            confidence: answer.confidence,
            probabilities: Object.fromEntries(
              answer.probabilities.map(({ value, probability }) => [String(value), probability]),
            ),
          }}
        />
      );
    case "score":
      return (
        <AnswerDetails
          answer={{
            type: "score",
            score: answer.score,
            confidence: answer.confidence,
            probabilities: Object.fromEntries(
              answer.probabilities.map(({ value, probability }) => [String(value), probability]),
            ),
            legend: Object.fromEntries(answer.probabilities.map(({ value, label }) => [String(value), label])),
          }}
        />
      );
  }
}

function RawResponse({ response }: { response: NonNullable<ResponseViewProps["response"]> }) {
  const { t: uiT } = useDashboardLanguage();

  return (
    <section aria-label={uiT("ui.fe7f1a8e633f5311")}>
      <pre className="whitespace-pre-wrap wrap-anywhere rounded-md bg-muted p-3 font-mono text-xs">
        {JSON.stringify(response, null, 2)}
      </pre>
    </section>
  );
}

function AnswerCards({ answers }: { answers: SystemOneResponse["answers"] | OpenAIDecisionsResponse["answers"] }) {
  const cards = Array.isArray(answers)
    ? answers.map((answer, index) => ({
        id: index,
        name: answer.name ?? `Question ${index + 1}`,
        type: answer.type,
        details: <OpenAIAnswerDetails answer={answer} />,
      }))
    : Object.entries(answers).map(([id, answer]) => ({
        id,
        name: id,
        type: answer.type,
        details: <AnswerDetails answer={answer} />,
      }));
  return cards.map(({ id, name, type, details }) => (
    <Card key={id} size="sm">
      <CardHeader>
        <CardTitle className="font-mono">{name}</CardTitle>
        <CardAction>
          <Badge variant="secondary">{type}</Badge>
        </CardAction>
      </CardHeader>
      <CardContent>{details}</CardContent>
    </Card>
  ));
}

export default function ResponseView({
  response,
  view = "form",
  fallbackModel,
  latencyMs,
  error,
  isLoading,
}: ResponseViewProps) {
  const { t: uiT } = useDashboardLanguage();

  const [showRaw, setShowRaw] = useState(false);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
          <LoaderCircle className="size-4 animate-spin" />
          {uiT("ui.1e1c866df92f4e09")}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>{uiT("ui.ace716f474022753")}</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!response) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{uiT("ui.c7d2bcbafc3d400b")}</CardTitle>
          <CardDescription>{uiT("ui.772ae0b635f02c2a")}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const model = response.model ?? fallbackModel;

  return (
    <Card className="wrap-anywhere">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="grid gap-1">
            <CardTitle>{view === "curl" ? uiT("ui.074303137346910d") : uiT("ui.c7d2bcbafc3d400b")}</CardTitle>
            {model && <CardDescription>{model}</CardDescription>}
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {latencyMs !== undefined && <Badge variant="outline">{Math.round(latencyMs)} ms</Badge>}
            {response.usage && (
              <Badge variant="outline">
                {response.usage.input_tokens} {uiT("ui.7a994109e5b76541")} {response.usage.output_tokens}{" "}
                {uiT("ui.b6798bcee84a53a9")}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid gap-3">
        {view === "curl" ? <RawResponse response={response} /> : <AnswerCards answers={response.answers} />}
        {view === "form" && (
          <Collapsible open={showRaw} onOpenChange={setShowRaw}>
            <CollapsibleTrigger
              render={
                <Button variant="ghost" size="sm">
                  <ChevronDown className="size-4" />
                  {uiT("ui.587372398f62e266")}
                </Button>
              }
            />
            <CollapsibleContent>
              <RawResponse response={response} />
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardContent>
    </Card>
  );
}
