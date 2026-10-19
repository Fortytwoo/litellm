import { frameworkSnippet, type FrameworkGuide } from "./tracingSetupGuides";
type CodingAgent = "Claude Code" | "Codex";

export const tracingEnvSnippet = (proxyUrl: string, tracingKey: string | null = null): string =>
  [
    `export LITELLM_TRACING_KEY="${tracingKey ?? "<your tracing key>"}"`,
    `export OTEL_EXPORTER_OTLP_TRACES_ENDPOINT="${proxyUrl}/v1/traces"`,
    `export OTEL_EXPORTER_OTLP_TRACES_HEADERS="Authorization=Bearer $LITELLM_TRACING_KEY"`,
    'export OTEL_EXPORTER_OTLP_PROTOCOL="http/protobuf"',
    'export OTEL_METRICS_EXPORTER="none"',
    'export OTEL_LOGS_EXPORTER="none"',
  ].join("\n");

export const codingAgentPrompt = (proxyUrl: string, traceUrl: string, guide: FrameworkGuide, model: string): string =>
  [
    `Send this ${guide.label} project's OpenTelemetry traces to LiteLLM.`,
    "Keep the existing model configuration, authentication, and application behavior. Never hardcode keys. Read the model key from LITELLM_API_KEY and the dedicated tracing key from LITELLM_TRACING_KEY.",
    "Set the trace destination wherever this project loads environment variables:",
    tracingEnvSnippet(traceUrl),
    guide.install ?? `Install and enable the ${guide.plugin?.label}: ${guide.plugin?.url}`,
    guide.plugin?.instruction ??
      "Initialize OpenTelemetry before creating the agent. If the app already configures a tracer provider, keep it and point its exporter at the destination above instead.",
    "Adapt this example to the existing application, replacing research_agent with the agent's name:",
    frameworkSnippet(guide, proxyUrl, model, traceUrl),
    guide.note ?? "",
    "Run the agent once and confirm its named run appears in Lens > Traces.",
  ]
    .filter(Boolean)
    .join("\n\n");

const shellQuote = (value: string): string => `'${value.replaceAll("'", "'\\''")}'`;

export const codingAgentCommand = (agent: CodingAgent, prompt: string): string =>
  `${agent === "Claude Code" ? "claude" : "codex"} ${shellQuote(prompt)}`;

export const maskSecret = (secret: string): string =>
  secret.length > 10 ? `${secret.slice(0, 5)}${"•".repeat(16)}${secret.slice(-4)}` : "•".repeat(secret.length);

export const otlpEndpoints = (proxyUrl: string): readonly (readonly [string, string, boolean])[] => [
  ["Traces endpoint", `${proxyUrl}/v1/traces`, true],
  ["Auth header", "Authorization: Bearer <Lens tracing key>", true],
  ["Protocol", "OTLP/HTTP (protobuf or JSON)", false],
];
