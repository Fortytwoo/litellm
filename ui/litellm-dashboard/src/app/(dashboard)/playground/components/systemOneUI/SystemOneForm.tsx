"use client";
import { t as translateUi } from "@/i18n";

import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useId, useMemo, useState } from "react";
import { AddButton, FormFrame, RemoveButton } from "./DecisionFormControls";
import {
  blankQuestion,
  freeName,
  readForm,
  removeAt,
  renameKey,
  replaceAt,
  retype,
  withNoulCriterion,
  withoutKey,
  type ChoiceQuestion,
  type FormPayload,
  type FormQuestion,
  type NoulQuestion,
  type QuestionType,
  type ScoreQuestion,
} from "./lib/formPayload";
import type { SystemOnePayloadValidation } from "./lib/validatePayload";

const QUESTION_TYPES: readonly QuestionType[] = ["choice", "noul", "score"];
const TYPE_LABELS: Record<QuestionType, string> = {
  get choice() {
    return translateUi("ui.efa0389ac6fce142");
  },
  get noul() {
    return translateUi("ui.4fd68e1d9814fb1b");
  },
  get score() {
    return translateUi("ui.38e5a46cbc5a");
  },
};
const TYPE_HELP: Record<QuestionType, string | undefined> = {
  choice: undefined,
  noul: "The model returns the probability that the answer is yes",
  score: undefined,
};

const isQuestionType = (value: unknown): value is QuestionType => QUESTION_TYPES.some((type) => type === value);

interface SystemOneFormProps {
  value: string;
  onChange: (value: string) => void;
  validation: SystemOnePayloadValidation;
  onReset: () => void;
}

interface QuestionEditorProps<Q extends FormQuestion> {
  question: Q;
  onChange: (question: FormQuestion) => void;
}

interface KeyInputProps {
  value: string;
  taken: readonly string[];
  onCommit: (value: string) => void;
  label: string;
  placeholder?: string;
}

function keyError(next: string, current: string, taken: readonly string[]): string | undefined {
  if (next === "") {
    return "Enter a name";
  }
  if (next !== current && taken.includes(next)) {
    return `"${next}" is already used`;
  }
  return undefined;
}

function KeyInput({ value, taken, onCommit, label, placeholder }: KeyInputProps) {
  const errorId = useId();
  const [draft, setDraft] = useState(value);
  const next = draft.trim();
  const error = keyError(next, value, taken);

  function commit() {
    if (error === undefined && next !== value) {
      onCommit(next);
      return;
    }
    setDraft(value);
  }

  return (
    <div className="grid min-w-0 flex-1 gap-1">
      <Input
        aria-label={label}
        aria-invalid={error !== undefined}
        aria-describedby={error === undefined ? undefined : errorId}
        value={draft}
        placeholder={placeholder}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
      />
      {error !== undefined && (
        <p id={errorId} className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

function ChoiceOptions({ question, onChange }: QuestionEditorProps<ChoiceQuestion>) {
  const { t: uiT } = useDashboardLanguage();

  const labels = Object.keys(question.criteria);
  const writeCriteria = (criteria: Record<string, string>) => onChange({ ...question, criteria });

  return (
    <div className="grid gap-2">
      <span className="text-sm font-medium">{uiT("ui.d0db8b5e364b6989")}</span>
      {Object.entries(question.criteria).map(([label, description], index) => (
        <div key={index} className="flex items-start gap-2">
          <KeyInput
            key={label}
            label={uiT("ui.958e6cec9a677d03")}
            value={label}
            taken={labels}
            onCommit={(next) => writeCriteria(renameKey(question.criteria, label, next))}
          />
          <Input
            aria-label={uiT("ui.bae9f6f1cdbb5dfd", { v0: String(label) })}
            className="flex-2"
            value={description}
            placeholder={uiT("ui.c7b7b7f01360f6a5")}
            onChange={(event) => writeCriteria({ ...question.criteria, [label]: event.target.value })}
          />
          <RemoveButton
            label={uiT("ui.5f53d58b6147ad43", { v0: String(label) })}
            onClick={() => writeCriteria(withoutKey(question.criteria, label))}
          />
        </div>
      ))}
      <AddButton onClick={() => writeCriteria({ ...question.criteria, [freeName(labels, "option")]: "" })}>
        {uiT("ui.ffbcabd155ad0e68")}
      </AddButton>
    </div>
  );
}

function NoulCriteria({ question, onChange }: QuestionEditorProps<NoulQuestion>) {
  const { t: uiT } = useDashboardLanguage();

  const yesId = useId();
  const noId = useId();

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <div className="grid gap-1.5">
        <Label htmlFor={yesId}>{uiT("ui.7efc4f7deacced0b")}</Label>
        <Input
          id={yesId}
          value={question.criteria?.true ?? ""}
          placeholder={uiT("ui.59be71333c96")}
          onChange={(event) => onChange(withNoulCriterion(question, "true", event.target.value))}
        />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor={noId}>{uiT("ui.4a953df54ff655d4")}</Label>
        <Input
          id={noId}
          value={question.criteria?.false ?? ""}
          placeholder={uiT("ui.59be71333c96")}
          onChange={(event) => onChange(withNoulCriterion(question, "false", event.target.value))}
        />
      </div>
    </div>
  );
}

function ScoreLevels({ question, onChange }: QuestionEditorProps<ScoreQuestion>) {
  const { t: uiT } = useDashboardLanguage();

  const writeCriteria = (criteria: string[]) => onChange({ ...question, criteria });

  return (
    <div className="grid gap-2">
      <span className="text-sm font-medium">{uiT("ui.911e176589a08c82")}</span>
      {question.criteria.map((level, index) => (
        <div key={index} className="flex items-center gap-2">
          <span className="w-6 shrink-0 text-right text-xs text-muted-foreground tabular-nums">{index}</span>
          <Input
            aria-label={uiT("ui.1883efeb2cef6a14", { v0: String(index) })}
            value={level}
            placeholder={uiT("ui.ef6ba9aee6cae7a7")}
            onChange={(event) => writeCriteria(replaceAt(question.criteria, index, event.target.value))}
          />
          <RemoveButton
            label={uiT("ui.972f9d524c461e85", { v0: String(index) })}
            onClick={() => writeCriteria(removeAt(question.criteria, index))}
          />
        </div>
      ))}
      <AddButton onClick={() => writeCriteria([...question.criteria, ""])}>{uiT("ui.d55a99ac1912686d")}</AddButton>
    </div>
  );
}

function CriteriaEditor({ question, onChange }: QuestionEditorProps<FormQuestion>) {
  switch (question.type) {
    case "choice":
      return <ChoiceOptions question={question} onChange={onChange} />;
    case "noul":
      return <NoulCriteria question={question} onChange={onChange} />;
    case "score":
      return <ScoreLevels question={question} onChange={onChange} />;
  }
}

interface QuestionCardProps extends QuestionEditorProps<FormQuestion> {
  name: string;
  taken: readonly string[];
  onRename: (name: string) => void;
  onRemove: () => void;
}

function QuestionCard({ name, question, taken, onChange, onRename, onRemove }: QuestionCardProps) {
  const { t: uiT } = useDashboardLanguage();

  const instructionsId = useId();

  return (
    <fieldset
      aria-label={uiT("ui.49c0fedf36489ef4", { v0: String(name) })}
      className="grid gap-3 rounded-md border p-3"
    >
      <div className="flex flex-wrap items-start gap-2">
        <KeyInput key={name} label={uiT("ui.5180bbe3d210160c")} value={name} taken={taken} onCommit={onRename} />
        <Select
          value={question.type}
          onValueChange={(type) => isQuestionType(type) && onChange(retype(question, type))}
        >
          <SelectTrigger className="w-36" aria-label={uiT("ui.aff0f8d3121720d7")}>
            <SelectValue>{TYPE_LABELS[question.type]}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {QUESTION_TYPES.map((type) => (
              <SelectItem key={type} value={type} title={TYPE_HELP[type]}>
                {TYPE_LABELS[type]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <RemoveButton label={uiT("ui.e4db2f5cb2287f10", { v0: String(name) })} onClick={onRemove} />
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
      <CriteriaEditor question={question} onChange={onChange} />
    </fieldset>
  );
}

export default function SystemOneForm({ value, onChange, validation, onReset }: SystemOneFormProps) {
  const { t: uiT } = useDashboardLanguage();

  const stateId = useId();
  const form = useMemo(() => readForm(value), [value]);

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

  const questions = form.questions ?? {};
  const names = Object.keys(questions);
  const write = (next: FormPayload) => onChange(JSON.stringify(next, null, 2));
  const writeQuestions = (next: Record<string, FormQuestion>) => write({ ...form, questions: next });

  return (
    <FormFrame validation={validation}>
      <div className="grid gap-1.5">
        <Label htmlFor={stateId}>{uiT("ui.36ecb4f86691")}</Label>
        <p className="text-xs text-muted-foreground">{uiT("ui.61723a2ad92a1749")}</p>
        <Textarea
          id={stateId}
          rows={4}
          value={form.state ?? ""}
          placeholder={uiT("ui.c22c907511b87da3")}
          onChange={(event) => write({ ...form, state: event.target.value })}
        />
      </div>
      {Object.entries(questions).map(([name, question], index) => (
        <QuestionCard
          key={index}
          name={name}
          question={question}
          taken={names}
          onChange={(next) => writeQuestions({ ...questions, [name]: next })}
          onRename={(next) => writeQuestions(renameKey(questions, name, next))}
          onRemove={() => writeQuestions(withoutKey(questions, name))}
        />
      ))}
      <AddButton onClick={() => writeQuestions({ ...questions, [freeName(names, "question")]: blankQuestion() })}>
        {uiT("ui.f9496b764efa5ff2")}
      </AddButton>
    </FormFrame>
  );
}
