"use client";
import { t as translateUi } from "@/i18n";

import { translateText } from "@/i18n";

import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";

import { ArrowRight, ArrowUpRight, Check, Copy, KeyRound, Loader2, Send } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { components } from "@/lib/http/schema";
import { createApiClient, type RequestOptions } from "@/lib/http/client";
import { useTimeout } from "usehooks-ts";

import { cn } from "@/lib/cva.config";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { copyToClipboard } from "@/utils/dataUtils";

import anthropicLogo from "../../../../../public/assets/logos/anthropic.svg";
import openaiLogo from "../../../../../public/assets/logos/openai_small.svg";
import otelLogo from "../../../../../public/assets/logos/opentelemetry.svg";
import { agentTraceCall, apiClient, getProxyBaseUrl } from "../../../networking";
import { ActiveDot } from "../../traces/ui/ActiveDot";
import { sampleTraceExport } from "./sampleTrace";
import { FRAMEWORKS, frameworkSnippet, type FrameworkGuide } from "./tracingSetupGuides";
import type { TraceSummary } from "../../traces/types";

const COPIED_RESET_MS = 1500;
const DOCS_URL = "https://docs.litellm.ai/docs/proxy/lens";
const DEPLOYMENT_URL = `${DOCS_URL}/deployment`;
const EXAMPLE_MODEL = "openai/gpt-6.1-sol";
const SAMPLE_TRACE_POLL_MS = 1000;
export const TRACING_KEY_REQUEST = { name: "Agent tracing" } as const;
const SAMPLE_TRACE_POLL_ATTEMPTS = 15;

type Installer = "pip" | "uv";
type CodingAgent = "Claude Code" | "Codex";

const PY_INSTALL: Record<Installer, (packages: string) => string> = {
  pip: (packages) => `pip install ${packages}`,
  uv: (packages) => `uv add ${packages}`,
};

export {
  tracingEnvSnippet,
  codingAgentPrompt,
  codingAgentCommand,
  maskSecret,
  otlpEndpoints,
} from "./tracingSetupSnippets";
import {
  tracingEnvSnippet,
  codingAgentPrompt,
  codingAgentCommand,
  maskSecret,
  otlpEndpoints,
} from "./tracingSetupSnippets";

function CodeBlock({
  code,
  display = code,
  tabs,
  wrap = false,
  copyLabel = "Copy",
}: {
  code: string;
  display?: string;
  tabs?: React.ReactNode;
  wrap?: boolean;
  copyLabel?: string;
}) {
  const [copied, setCopied] = useState(false);
  useTimeout(() => setCopied(false), copied ? COPIED_RESET_MS : null);
  const copy = async () => setCopied(await copyToClipboard(code));
  return (
    <div className="overflow-hidden rounded-md border border-border bg-muted/30">
      <div className="flex h-9 items-center border-b border-border px-3">
        {tabs}
        <button
          type="button"
          onClick={() => void copy()}
          aria-label={copyLabel}
          className="ml-auto text-muted-foreground hover:text-foreground"
        >
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
        </button>
      </div>
      <pre
        className={cn(
          "m-0 px-4 py-3 font-mono text-xs leading-5 text-foreground",
          wrap ? "whitespace-pre-wrap break-words" : "overflow-x-auto",
        )}
      >
        <code>{display}</code>
      </pre>
    </div>
  );
}

function FileLabel({ children }: { children: React.ReactNode }) {
  return <span className="text-xs text-foreground">{children}</span>;
}

function LineTabs<T extends string>({
  value,
  options,
  onChange,
  logos,
}: {
  value: T;
  options: T[];
  onChange: (v: T) => void;
  logos?: Partial<Record<T, string>>;
}) {
  return (
    <div role="tablist" className="flex h-9 items-end gap-3">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          role="tab"
          aria-selected={value === option}
          onClick={() => onChange(option)}
          className={cn(
            "-mb-px inline-flex h-9 items-center gap-1.5 border-b-2 text-xs",
            value === option
              ? "border-foreground text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          {logos?.[option] && <img src={logos[option]} alt="" className="size-3.5" />}
          {option}
        </button>
      ))}
    </div>
  );
}

function Step({ title, children }: { title: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <h3 className="mb-3 text-sm font-medium text-foreground">{title}</h3>
      {children}
    </section>
  );
}

type SendState =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "waiting" }
  | { kind: "ready"; trace: TraceSummary }
  | { kind: "failed"; message: string };

const SEND_LABEL: Record<Exclude<SendState["kind"], "ready">, string> = {
  get idle() {
    return translateUi("ui.b4391a31a8e9ba7c");
  },
  get sending() {
    return translateUi("ui.b8ed5279e897be5d");
  },
  get waiting() {
    return translateUi("ui.a6ecda238a216ca8");
  },
  get failed() {
    return translateUi("ui.b4391a31a8e9ba7c");
  },
};

const delay = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

async function waitForTrace(accessToken: string, traceId: string): Promise<TraceSummary | null> {
  for (let attempt = 0; attempt < SAMPLE_TRACE_POLL_ATTEMPTS; attempt++) {
    try {
      return (await agentTraceCall(accessToken, traceId)).summary;
    } catch {
      await delay(SAMPLE_TRACE_POLL_MS);
    }
  }
  return null;
}

function SendTestTrace({
  accessToken,
  traceUrl,
  tracingKey,
  onOpenTrace,
}: {
  accessToken: string;
  traceUrl: string;
  tracingKey: string | null;
  onOpenTrace: (trace: TraceSummary) => void;
}) {
  const { t: uiT } = useDashboardLanguage();

  const [state, setState] = useState<SendState>({ kind: "idle" });
  const send = async () => {
    setState({ kind: "sending" });
    const sample = sampleTraceExport(Date.now());
    try {
      if (!tracingKey) throw new Error("Generate a tracing key first");
      const client = createApiClient({ getBaseUrl: () => traceUrl });
      const options: RequestOptions = {
        credentials: "omit",
        redirect: "error",
        accessToken: tracingKey,
        body: sample.body,
        signal: AbortSignal.timeout(15000),
      };
      await client.post("/v1/traces", options);
    } catch {
      setState({ kind: "failed", message: translateUi("ui.860ee7ed11532e5f") });
      return;
    }
    setState({ kind: "waiting" });
    const trace = await waitForTrace(accessToken, sample.traceId);
    setState(trace ? { kind: "ready", trace } : { kind: "failed", message: translateUi("ui.15e121bf57971329") });
  };
  if (state.kind === "ready") {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <span role="status" className="inline-flex items-center gap-1 text-sm text-emerald-700 dark:text-emerald-400">
          <Check aria-hidden="true" className="size-4" /> {uiT("ui.ba7af1179065642e")}
        </span>
        <Button onClick={() => onOpenTrace(state.trace)}>
          {uiT("ui.bd38ee3d52633f7f")} <ArrowRight aria-hidden="true" className="size-4" />
        </Button>
      </div>
    );
  }
  const busy = state.kind === "sending" || state.kind === "waiting";
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button variant="outline" onClick={() => void send()} disabled={busy || !tracingKey || !traceUrl}>
        {busy ? (
          <Loader2 aria-hidden="true" className="size-4 animate-spin" />
        ) : (
          <Send aria-hidden="true" className="size-4" />
        )}
        {SEND_LABEL[state.kind]}
      </Button>
      {state.kind === "failed" && <p className="text-sm text-destructive">{state.message}</p>}
    </div>
  );
}

function TraceReceipt({
  connected,
  checked,
  checking,
  onCheck,
}: {
  connected: boolean;
  checked: boolean;
  checking: boolean;
  onCheck: () => void;
}) {
  const { t: uiT } = useDashboardLanguage();

  const missingAfterCheck = checked && !checking && !connected;
  return (
    <section className="mt-6 border-t pt-6" aria-label={uiT("ui.366c4ea02901292f")}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p role="status" className="text-sm font-medium">
            {connected ? uiT("ui.3b4aa1c3fa41f392") : uiT("ui.2e4a20bfb50a8225")}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{uiT("ui.2c612788d814191e")}</p>
        </div>
        <Button variant="outline" onClick={onCheck} disabled={checking}>
          {checking && <Loader2 aria-hidden="true" className="size-4 animate-spin" />}
          {checking ? uiT("ui.ec963ffc911b8401") : uiT("ui.ed720bdb7f2e7755")}
        </Button>
      </div>
      {missingAfterCheck && (
        <p className="mt-3 text-sm leading-6 text-muted-foreground">{uiT("ui.01c6f10550239ab8")}</p>
      )}
    </section>
  );
}

function TracingKey({
  accessToken,
  tracingKey,
  onCreated,
}: {
  accessToken: string;
  tracingKey: string | null;
  onCreated: (key: string) => void;
}) {
  const { t: uiT } = useDashboardLanguage();

  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [pendingActivation, setPendingActivation] = useState(false);
  const create = async () => {
    setCreating(true);
    setError("");
    try {
      const result = await apiClient.post<components["schemas"]["IngestionKeyCreated"]>("/lens/tracing/keys", {
        accessToken,
        body: TRACING_KEY_REQUEST,
      });
      if (!result.key) throw new Error("The proxy did not return the new key");
      setPendingActivation(!result.active);
      onCreated(result.key);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not create a key");
    } finally {
      setCreating(false);
    }
  };
  if (tracingKey) {
    return (
      <div className="space-y-2">
        {pendingActivation && (
          <p role="status" className="text-sm text-muted-foreground">
            {uiT("ui.1b9be258a879eb78")}
          </p>
        )}
        <CodeBlock
          code={tracingKey}
          display={maskSecret(tracingKey)}
          tabs={<FileLabel>{uiT("ui.2549e6c76df4f619")}</FileLabel>}
        />
        <p className="text-sm text-muted-foreground">{uiT("ui.e23f620210220421")}</p>
      </div>
    );
  }
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button variant="outline" onClick={() => void create()} disabled={creating}>
        {creating ? (
          <Loader2 aria-hidden="true" className="size-4 animate-spin" />
        ) : (
          <KeyRound aria-hidden="true" className="size-4" />
        )}
        {uiT("ui.ff31812003f22c34")}
      </Button>
      <span className="text-sm text-muted-foreground">{uiT("ui.0b40063deb1a6dd8")}</span>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

function EndpointValue({ value }: { value: string }) {
  const { t: uiT } = useDashboardLanguage();

  const [copied, setCopied] = useState(false);
  useTimeout(() => setCopied(false), copied ? COPIED_RESET_MS : null);
  const copy = async () => setCopied(await copyToClipboard(value));
  return (
    <button
      type="button"
      onClick={() => void copy()}
      aria-label={uiT("ui.3f3ebff426db5fa6", { v0: String(value) })}
      className="group inline-flex min-w-0 items-center gap-2 text-left font-mono text-xs text-foreground"
    >
      <span className="break-all">{value}</span>
      {copied ? (
        <Check aria-hidden="true" className="size-3.5 shrink-0" />
      ) : (
        <Copy aria-hidden="true" className="size-3.5 shrink-0 text-muted-foreground group-hover:text-foreground" />
      )}
    </button>
  );
}

function Endpoints({ proxyUrl, children }: { proxyUrl: string; children?: React.ReactNode }) {
  const { t: uiT } = useDashboardLanguage();

  return (
    <section className="mt-6" aria-labelledby="otel-endpoints">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 id="otel-endpoints" className="inline-flex items-center gap-2 text-sm font-medium">
          <img src={otelLogo.src} alt="" className="size-5" />
          {uiT("ui.51bfffbcdbcfbc00")}
        </h3>
        {children}
      </div>
      <dl className="mt-3 grid gap-x-6 gap-y-3 rounded-md border bg-muted/30 p-4 md:grid-cols-2">
        {otlpEndpoints(proxyUrl).map(([label, value, copyable]) => (
          <div key={label} className={cn("min-w-0", label === "Traces endpoint" && "md:col-span-2")}>
            <dt className="text-xs text-muted-foreground">{translateText(label)}</dt>
            <dd className="mt-0.5">
              {copyable ? <EndpointValue value={value} /> : <span className="text-xs">{value}</span>}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

const CODING_AGENT_LOGOS: Record<CodingAgent, string> = {
  "Claude Code": anthropicLogo.src,
  Codex: openaiLogo.src,
};

function setupTitle(enabled: boolean, connected: boolean) {
  if (!enabled) return "Set up Lens";
  return connected ? "Connect another agent" : "Connect your agent";
}

interface ConnectAgentProps {
  accessToken: string;
  onOpenTrace: (trace: TraceSummary) => void;
  connected: boolean;
  checked: boolean;
  checking: boolean;
  onCheck: () => void;
  readOnly: boolean;
  canMintTracingKey: boolean;
  framework: string;
  setFramework: (framework: string) => void;
  installer: Installer;
  setInstaller: (installer: Installer) => void;
  tracingKey: string | null;
  setTracingKey: (key: string) => void;
}

export function useLensService(accessToken: string) {
  return useQuery({
    queryKey: ["lens-service", accessToken],
    queryFn: () => apiClient.get<components["schemas"]["ServiceConnection"]>("/lens/service", { accessToken }),
    refetchInterval: 15000,
  });
}

function EnableTracing({
  connection,
  checking,
  onCheck,
}: {
  connection: components["schemas"]["ServiceConnection"];
  checking: boolean;
  onCheck: () => void;
}) {
  const { t: uiT } = useDashboardLanguage();

  const configured = connection.configured ?? connection.connected;
  let message = "Lens is connected. Set its public tracing address so your agents know where to send traces.";
  if (!configured) {
    message =
      "Enable Lens in your existing Helm or Docker deployment. It runs alongside LiteLLM and stores your traces.";
  } else if (!connection.connected) {
    message =
      "Lens is configured, but LiteLLM cannot reach it. Check that the Lens service is running and both services use the same service secret.";
  } else if (!connection.status.storage_ready) {
    message = "Lens is connected, but its trace storage is unavailable. Check the ClickHouse connection.";
  }
  return (
    <div className="space-y-4">
      <p className="text-sm font-medium">{configured ? uiT("ui.4b463d9b7ca12361") : uiT("ui.3bfe61916c50a7d2")}</p>
      <p className="text-sm leading-6 text-muted-foreground">{translateText(message)}</p>
      {!configured && (
        <p className="text-sm text-muted-foreground">
          {connection.release ? (
            <>
              {uiT("ui.cbc250de35415ad9")} <code>{connection.release}</code> {uiT("ui.d8fea1a8d13a0ec7")}
            </>
          ) : (
            uiT("ui.ba2c06745a73a394")
          )}{" "}
          {uiT("ui.141c7cc5eab20895")}
        </p>
      )}
      <div className="flex flex-wrap gap-3">
        <a
          className="inline-flex items-center gap-1 text-sm underline underline-offset-4"
          href={`${DEPLOYMENT_URL}#using-helm`}
          target="_blank"
          rel="noreferrer"
        >
          {uiT("ui.aea5f28c643fc0d7")} <ArrowUpRight aria-hidden="true" className="size-3.5" />
        </a>
        <a
          className="inline-flex items-center gap-1 text-sm underline underline-offset-4"
          href={`${DEPLOYMENT_URL}#using-docker`}
          target="_blank"
          rel="noreferrer"
        >
          {uiT("ui.5b0615347f6bdf13")} <ArrowUpRight aria-hidden="true" className="size-3.5" />
        </a>
      </div>
      <Button variant="outline" onClick={onCheck} disabled={checking}>
        {checking && <Loader2 aria-hidden="true" className="size-4 animate-spin" />}
        {checking ? uiT("ui.ec963ffc911b8401") : uiT("ui.6cd8cd183c21312a")}
      </Button>
    </div>
  );
}

function CodingAgentSetup({
  proxyUrl,
  traceUrl,
  guide,
  model,
}: {
  proxyUrl: string;
  traceUrl: string;
  guide: FrameworkGuide;
  model: string;
}) {
  const { t: uiT } = useDashboardLanguage();

  const [codingAgent, setCodingAgent] = useState<CodingAgent>("Claude Code");
  const [copied, setCopied] = useState<string | null>(null);
  const command = codingAgentCommand(codingAgent, codingAgentPrompt(proxyUrl, traceUrl, guide, model));
  useTimeout(() => setCopied(null), copied === null ? null : COPIED_RESET_MS);
  const copy = async () => {
    if (await copyToClipboard(command)) setCopied(command);
  };
  return (
    <section className="mt-6" aria-labelledby="connect-project">
      <h3 id="connect-project" className="text-sm font-medium">
        {uiT("ui.389360eb4cd775db")}
      </h3>
      <div className="mt-3 overflow-hidden rounded-md border">
        <div className="border-b bg-muted/30 px-4">
          <LineTabs
            value={codingAgent}
            options={["Claude Code", "Codex"]}
            onChange={(value) => {
              setCodingAgent(value);
              setCopied(null);
            }}
            logos={CODING_AGENT_LOGOS}
          />
        </div>
        <div className="p-4">
          <p className="text-sm leading-6 text-muted-foreground">
            {uiT("ui.b1e0016e27d4831f")} <code className="text-xs">LITELLM_TRACING_KEY</code>{" "}
            {uiT("ui.e952eb0749f7f5d9")}
          </p>
          <Button className="mt-3" onClick={() => void copy()}>
            {copied === command ? (
              <Check aria-hidden="true" className="size-4" />
            ) : (
              <Copy aria-hidden="true" className="size-4" />
            )}
            {copied === command ? uiT("ui.8d525e5f158b") : uiT("ui.d931d96e8f4c8304")}
          </Button>
          <details className="mt-3">
            <summary className="w-fit cursor-pointer text-xs text-muted-foreground">
              {uiT("ui.e4bedd4ec5d2a99f")}
            </summary>
            <pre className="mt-3 max-h-56 overflow-auto whitespace-pre-wrap rounded-md bg-muted/40 p-3 text-xs leading-5">
              <code>{command}</code>
            </pre>
          </details>
        </div>
      </div>
    </section>
  );
}

function ConnectAgent({
  accessToken,
  onOpenTrace,
  connected,
  checked,
  checking,
  onCheck,
  readOnly,
  canMintTracingKey,
  framework,
  setFramework,
  installer,
  setInstaller,
  tracingKey,
  setTracingKey,
}: ConnectAgentProps) {
  const { t: uiT } = useDashboardLanguage();

  const proxyUrl = getProxyBaseUrl().replace(/\/$/, "");
  const connection = useLensService(accessToken);
  const traceUrl = connection.data?.url ?? "";
  const guide = FRAMEWORKS.find((f) => f.id === framework) ?? FRAMEWORKS[0];
  const install = guide.install?.startsWith("pip install ")
    ? PY_INSTALL[installer](guide.install.slice("pip install ".length))
    : guide.install;
  const model = EXAMPLE_MODEL;
  const quickstart = frameworkSnippet(guide, proxyUrl, model, traceUrl);
  if (!traceUrl)
    return (
      <p role="status" className="text-sm text-muted-foreground">
        {connection.isPending ? uiT("ui.53ebe100847077fe") : uiT("ui.8c63aa04cac12dc7")}
      </p>
    );
  return (
    <>
      {!connection.data?.connected && (
        <p role="alert" className="text-sm text-destructive">
          {uiT("ui.6b409a2d69e48936")}
        </p>
      )}
      {connection.data?.connected && !connection.data.status.storage_ready && (
        <p role="alert" className="text-sm text-destructive">
          {uiT("ui.c0444e6a67ff995d")}
        </p>
      )}
      <div className="mt-6 space-y-2">
        <label id="tracing-framework" className="block text-sm font-medium">
          {uiT("ui.4caed0b2b01d712b")}
        </label>
        <Select
          value={framework}
          onValueChange={(value) => {
            if (value) setFramework(value);
          }}
        >
          <SelectTrigger aria-labelledby="tracing-framework" className="w-full">
            <SelectValue>
              <img src={guide.logo} alt="" className="size-4 shrink-0 object-contain" />
              {guide.label}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {FRAMEWORKS.map((f) => (
              <SelectItem key={f.id} value={f.id}>
                <img src={f.logo} alt="" className="size-4 shrink-0 object-contain" />
                {f.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Step title={uiT("ui.e045f6ffe017f006")}>
        {canMintTracingKey && !readOnly ? (
          <TracingKey accessToken={accessToken} tracingKey={tracingKey} onCreated={setTracingKey} />
        ) : (
          <p className="text-sm text-muted-foreground">{uiT("ui.4ab004302240705d")}</p>
        )}
      </Step>
      <div className="mt-6 border-t pt-6">
        {install && (
          <Step title={uiT("ui.28cf1ec4677d123b")}>
            <CodeBlock
              code={install}
              wrap
              tabs={
                guide.language === "typescript" ? (
                  <FileLabel>{uiT("ui.d79677188687e7b3")}</FileLabel>
                ) : (
                  <LineTabs value={installer} options={["pip", "uv"]} onChange={setInstaller} />
                )
              }
            />
          </Step>
        )}
        {guide.plugin && (
          <Step title={uiT("ui.e778c905d78acee3")}>
            <p className="text-sm leading-6 text-muted-foreground">
              {uiT("ui.e0e3b2ebb188e223")}{" "}
              <a className="underline underline-offset-4" href={guide.plugin.url} target="_blank" rel="noreferrer">
                {guide.plugin.label}
              </a>
              . {guide.plugin.instruction}
            </p>
          </Step>
        )}
        <Step title={uiT("ui.4f9fc4fc50db996e")}>
          <p className="mb-3 text-sm leading-6 text-muted-foreground">
            {tracingKey ? (
              <>
                {uiT("ui.37864f903238d776")} <code>LITELLM_API_KEY</code> {uiT("ui.b4ed5af4274d03ed")}
              </>
            ) : (
              <>
                {uiT("ui.b6f6f3ad07b3c05f")} <code>LITELLM_TRACING_KEY</code> {uiT("ui.1305384c28801b91")}{" "}
                <code>LITELLM_API_KEY</code> {uiT("ui.abffb3a24bab9573")}
              </>
            )}
          </p>
          <CodeBlock
            copyLabel="Copy tracing configuration"
            code={tracingEnvSnippet(traceUrl, tracingKey)}
            display={tracingEnvSnippet(traceUrl, tracingKey && maskSecret(tracingKey))}
            tabs={<FileLabel>{uiT("ui.a733285486d54383")}</FileLabel>}
            wrap
          />
        </Step>
        <Step title={uiT("ui.1c270c0502b6626a")}>
          <p className="mb-3 text-sm leading-6 text-muted-foreground">
            {guide.existingModel ? uiT("ui.629fb9b37bebf7d6") : uiT("ui.e8ad1765ae913915")}
            {uiT("ui.95e154398a4bc009")} <code>research_agent</code> {uiT("ui.55fc9d51ca1bc22a")}
            {!guide.existingModel && " Use a model configured on this proxy."}
          </p>
          <CodeBlock code={quickstart} tabs={<FileLabel>{guide.fileName}</FileLabel>} wrap />
          {guide.note && <p className="mt-3 text-sm leading-6 text-muted-foreground">{guide.note}</p>}
          {!guide.existingModel && (
            <div className="mt-3">
              <CodeBlock
                code={guide.language === "typescript" ? "npx tsx agent.mts" : "python agent.py"}
                tabs={<FileLabel>{uiT("ui.a733285486d54383")}</FileLabel>}
              />
            </div>
          )}
          <a
            href={`${DOCS_URL}/first-trace?framework=${guide.id}`}
            className="mt-3 inline-flex items-center gap-1 text-sm underline underline-offset-4"
            target="_blank"
            rel="noreferrer"
          >
            {uiT("ui.d7493b10c873f1c7")} <ArrowUpRight aria-hidden="true" className="size-3.5" />
          </a>
        </Step>
      </div>
      <CodingAgentSetup proxyUrl={proxyUrl} traceUrl={traceUrl} guide={guide} model={model} />
      <Endpoints proxyUrl={traceUrl}>
        {!readOnly && (
          <SendTestTrace
            accessToken={accessToken}
            traceUrl={traceUrl}
            tracingKey={tracingKey}
            onOpenTrace={onOpenTrace}
          />
        )}
      </Endpoints>
      <TraceReceipt connected={connected} checked={checked} checking={checking} onCheck={onCheck} />
    </>
  );
}

type TracingSetupProps = {
  detail: string | null;
  accessToken: string;
  onOpenTrace: (trace: TraceSummary) => void;
  connected?: boolean;
  onCheck?: () => void;
  checking?: boolean;
  readOnly?: boolean;
  canMintTracingKey?: boolean;
};

export function TracingSetupFields({
  accessToken,
  onOpenTrace,
  connected = false,
  onCheck,
  checking = false,
  readOnly = false,
  canMintTracingKey = false,
}: TracingSetupProps) {
  const { t: uiT } = useDashboardLanguage();

  const [framework, setFramework] = useState(FRAMEWORKS[0].id);
  const [installer, setInstaller] = useState<Installer>("pip");
  const [tracingKey, setTracingKey] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const connection = useLensService(accessToken);
  const check = () => {
    setChecked(true);
    void connection.refetch();
    onCheck?.();
  };
  if (connection.isPending)
    return (
      <p role="status" className="text-sm text-muted-foreground">
        {uiT("ui.53ebe100847077fe")}
      </p>
    );
  if (!connection.data)
    return (
      <div className="space-y-3">
        <p role="alert" className="text-sm text-muted-foreground">
          {uiT("ui.4297819db8acca43")}
        </p>
        <Button variant="outline" onClick={check}>
          {uiT("ui.d8b8392e2c542950")}
        </Button>
      </div>
    );
  if (!connection.data.connected || !connection.data.status.storage_ready || !connection.data.url)
    return <EnableTracing connection={connection.data} checking={checking || connection.isFetching} onCheck={check} />;
  return (
    <ConnectAgent
      framework={framework}
      setFramework={setFramework}
      installer={installer}
      setInstaller={setInstaller}
      tracingKey={tracingKey}
      setTracingKey={setTracingKey}
      accessToken={accessToken}
      onOpenTrace={onOpenTrace}
      connected={connected}
      checked={checked}
      checking={checking || connection.isFetching}
      onCheck={check}
      readOnly={readOnly}
      canMintTracingKey={canMintTracingKey}
    />
  );
}

export function TracingSetupCard(props: TracingSetupProps) {
  const { t: uiT } = useDashboardLanguage();

  const connection = useLensService(props.accessToken);
  const enabled = Boolean(connection.data?.connected && connection.data.status.storage_ready && connection.data.url);

  return (
    <div className="w-full max-w-3xl pb-8" data-testid="tracing-setup-card">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <h2 className="text-xl font-semibold tracking-tight">
          {translateText(setupTitle(enabled, props.connected ?? false))}
        </h2>
        <span role="status" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          {enabled ? (
            <ActiveDot />
          ) : (
            <span aria-hidden="true" className="size-1.5 rounded-full bg-muted-foreground/50" />
          )}
          {enabled ? uiT("ui.6f1a1263a5df54d8") : uiT("ui.1a367c79441e13b7")}
        </span>
        <a
          className="ml-auto inline-flex shrink-0 items-center gap-1 text-sm underline underline-offset-4"
          href={DOCS_URL}
          target="_blank"
          rel="noreferrer"
        >
          {uiT("ui.7af023c43013")} <ArrowUpRight aria-hidden="true" className="size-3.5" />
        </a>
      </div>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        {enabled ? uiT("ui.6b75bff82cfec991") : uiT("ui.95ab56f063564aa8")}
      </p>
      <TracingSetupFields {...props} />
    </div>
  );
}
