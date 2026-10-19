"use client";
import { t as translateUi } from "@/i18n";

import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useId, useMemo } from "react";
import { AddButton, FormFrame, RemoveButton } from "./DecisionFormControls";
import { freeName, removeAt, replaceAt } from "./lib/formPayload";
import {
  readDecisionsForm,
  retypeDecisionQuestion,
  type DecisionsFormPayload,
  type DecisionsFormQuestion,
  type DecisionsQuestionType,
} from "./lib/openAIDecisionsForm";
import type { OpenAIDecisionsRequest } from "./lib/openAIDecisions";
import type { PayloadValidation } from "./lib/validatePayload";

const QUESTION_TYPES: readonly DecisionsQuestionType[] = ["predicate", "choice", "score"];
const TYPE_LABELS = {
  get predicate() {
    return translateUi("ui.c403f8fb2b274aa8");
  },
  get choice() {
    return translateUi("ui.efa0389ac6fce142");
  },
  get score() {
    return translateUi("ui.38e5a46cbc5a");
  },
};

interface QuestionEditorProps<Q extends DecisionsFormQuestion = DecisionsFormQuestion> {
  question: Q;
  onChange: (question: DecisionsFormQuestion) => void;
}

function Choices({ question, onChange }: QuestionEditorProps<Extract<DecisionsFormQuestion, { type: "choice" }>>) {
  const { t: uiT } = useDashboardLanguage();

  const choices = question.choices ?? [];
  const write = (next: typeof choices) => onChange({ ...question, choices: next });

  return (
    <div className="grid gap-2">
      <span className="text-sm font-medium">{uiT("ui.2f75b64ac9163e81")}</span>
      {choices.map((choice, index) => (
        <div key={index} className="grid gap-2 rounded-md border p-2">
          <div className="flex items-center gap-2">
            <Select
              value={typeof choice.value === "string" ? "text" : String(choice.value)}
              onValueChange={(type) => {
                if (type === "text" || type === "true" || type === "false") {
                  const value = type === "text" ? String(choice.value) : type === "true";
                  write(replaceAt(choices, index, { ...choice, value }));
                }
              }}
            >
              <SelectTrigger className="w-40" aria-label={uiT("ui.9b385ad65b0fcc08", { v0: String(index + 1) })}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">{uiT("ui.71988c4d8e0803ba")}</SelectItem>
                <SelectItem value="true">{uiT("ui.ae51a03f624affdc")}</SelectItem>
                <SelectItem value="false">{uiT("ui.4cfee39a60736aae")}</SelectItem>
              </SelectContent>
            </Select>
            {typeof choice.value === "string" && (
              <Input
                aria-label={uiT("ui.e59c2b5037fe776c", { v0: String(index + 1) })}
                value={choice.value}
                onChange={(event) => write(replaceAt(choices, index, { ...choice, value: event.target.value }))}
              />
            )}
            <RemoveButton
              label={uiT("ui.a590444b2bdc463c", { v0: String(index + 1) })}
              onClick={() => write(removeAt(choices, index))}
            />
          </div>
          <Input
            aria-label={uiT("ui.a5136b1682035d89", { v0: String(index + 1) })}
            value={choice.description ?? ""}
            placeholder={uiT("ui.c7b7b7f01360f6a5")}
            onChange={(event) => write(replaceAt(choices, index, { ...choice, description: event.target.value }))}
          />
        </div>
      ))}
      <AddButton
        onClick={() =>
          write([
            ...choices,
            {
              value: freeName(
                choices.map((c) => String(c.value)),
                "option",
              ),
            },
          ])
        }
      >
        {uiT("ui.a1827a12bb439024")}
      </AddButton>
    </div>
  );
}

function Levels({ question, onChange }: QuestionEditorProps<Extract<DecisionsFormQuestion, { type: "score" }>>) {
  const { t: uiT } = useDashboardLanguage();

  const levels = question.levels ?? [];
  const write = (next: typeof levels) => onChange({ ...question, levels: next });

  return (
    <div className="grid gap-2">
      <span className="text-sm font-medium">{uiT("ui.911e176589a08c82")}</span>
      {levels.map((level, index) => (
        <div key={index} className="flex items-center gap-2">
          <Input
            aria-label={uiT("ui.e67f4620160349bd", { v0: String(index + 1) })}
            value={level.label}
            placeholder={uiT("ui.0e66373f45dcf3dd")}
            onChange={(event) => write(replaceAt(levels, index, { ...level, label: event.target.value }))}
          />
          <Input
            aria-label={uiT("ui.409144d379120698", { v0: String(index + 1) })}
            value={level.description ?? ""}
            placeholder={uiT("ui.c7b7b7f01360f6a5")}
            onChange={(event) => write(replaceAt(levels, index, { ...level, description: event.target.value }))}
          />
          <RemoveButton
            label={uiT("ui.972f9d524c461e85", { v0: String(index + 1) })}
            onClick={() => write(removeAt(levels, index))}
          />
        </div>
      ))}
      <AddButton onClick={() => write([...levels, { label: String(levels.length) }])}>
        {uiT("ui.d55a99ac1912686d")}
      </AddButton>
    </div>
  );
}

interface QuestionCardProps extends QuestionEditorProps {
  index: number;
  onRemove: () => void;
}

function QuestionCard({ question, index, onChange, onRemove }: QuestionCardProps) {
  const { t: uiT } = useDashboardLanguage();

  const instructionsId = useId();

  return (
    <fieldset
      aria-label={uiT("ui.49c0fedf36489ef4", { v0: String(index + 1) })}
      className="grid gap-3 rounded-md border p-3"
    >
      <div className="flex flex-wrap items-center gap-2">
        <Input
          aria-label={uiT("ui.5180bbe3d210160c")}
          className="min-w-0 flex-1"
          value={question.name ?? ""}
          placeholder={uiT("ui.65e054f342b589d3")}
          onChange={(event) => onChange({ ...question, name: event.target.value })}
        />
        <Select
          value={question.type}
          onValueChange={(type) => {
            const next = QUESTION_TYPES.find((value) => value === type);
            if (next) onChange(retypeDecisionQuestion(question, next));
          }}
        >
          <SelectTrigger className="w-36" aria-label={uiT("ui.aff0f8d3121720d7")}>
            <SelectValue>{TYPE_LABELS[question.type]}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {QUESTION_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {TYPE_LABELS[type]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <RemoveButton label={uiT("ui.e4db2f5cb2287f10", { v0: String(index + 1) })} onClick={onRemove} />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor={instructionsId}>{uiT("ui.934652dce41d")}</Label>
        <Textarea
          id={instructionsId}
          rows={2}
          value={question.instructions ?? ""}
          placeholder={uiT("ui.81cf41f53c7cf4ba")}
          onChange={(event) => onChange({ ...question, instructions: event.target.value })}
        />
      </div>
      {question.type === "choice" && <Choices question={question} onChange={onChange} />}
      {question.type === "score" && <Levels question={question} onChange={onChange} />}
    </fieldset>
  );
}

interface OpenAIDecisionsFormProps {
  value: string;
  onChange: (value: string) => void;
  validation: PayloadValidation<OpenAIDecisionsRequest>;
  onReset: () => void;
}

export default function OpenAIDecisionsForm({ value, onChange, validation, onReset }: OpenAIDecisionsFormProps) {
  const { t: uiT } = useDashboardLanguage();

  const inputId = useId();
  const safetyId = useId();
  const form = useMemo(() => readDecisionsForm(value), [value]);

  if (form === undefined) {
    return (
      <FormFrame validation={validation}>
        <p className="text-sm text-muted-foreground">{uiT("ui.f4a0031f2e91d5af")}</p>
        <Button variant="outline" className="w-fit" onClick={onReset}>
          {uiT("ui.04dec147e2e13081")}
        </Button>
      </FormFrame>
    );
  }

  const questions = form.questions ?? [];
  const write = (next: DecisionsFormPayload) => onChange(JSON.stringify(next, null, 2));
  const writeQuestions = (next: DecisionsFormQuestion[]) => write({ ...form, questions: next });

  return (
    <FormFrame validation={validation}>
      <div className="grid gap-1.5">
        {Array.isArray(form.input) ? (
          <>
            <p className="text-sm text-muted-foreground">{uiT("ui.920a5e18bb3ee797")}</p>
          </>
        ) : (
          <>
            <Label htmlFor={inputId}>{uiT("ui.36ecb4f86691")}</Label>
            <Textarea
              id={inputId}
              rows={4}
              value={form.input ?? ""}
              placeholder={uiT("ui.c22c907511b87da3")}
              onChange={(event) => write({ ...form, input: event.target.value })}
            />
          </>
        )}
      </div>
      {questions.map((question, index) => (
        <QuestionCard
          key={index}
          index={index}
          question={question}
          onChange={(next) => writeQuestions(replaceAt(questions, index, next))}
          onRemove={() => writeQuestions(removeAt(questions, index))}
        />
      ))}
      <AddButton
        onClick={() =>
          writeQuestions([
            ...questions,
            {
              type: "predicate",
              name: freeName(
                questions.map((q) => q.name ?? ""),
                "question",
              ),
              instructions: "",
            },
          ])
        }
      >
        {uiT("ui.f9496b764efa5ff2")}
      </AddButton>
      <div className="grid gap-1.5">
        <Label htmlFor={safetyId}>{uiT("ui.3a9377badc4336d7")}</Label>
        <Input
          id={safetyId}
          value={form.safety_identifier ?? ""}
          placeholder={uiT("ui.59be71333c96")}
          onChange={(event) => write({ ...form, safety_identifier: event.target.value || undefined })}
        />
      </div>
    </FormFrame>
  );
}
