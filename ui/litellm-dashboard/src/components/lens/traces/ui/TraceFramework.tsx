import { t as translateUi } from "@/i18n";
import anthropicLogo from "../../../../../public/assets/logos/anthropic.svg";
import crewaiLogo from "../../../../../public/assets/logos/crewai-color.svg";
import cursorLogo from "../../../../../public/assets/logos/cursor.svg";
import copilotLogo from "../../../../../public/assets/logos/github_copilot.svg";
import googleAdkLogo from "../../../../../public/assets/logos/google-adk.png";
import langchainLogo from "../../../../../public/assets/logos/langchain.svg";
import langgraphLogo from "../../../../../public/assets/logos/langgraph-color.svg";
import llamaIndexLogo from "../../../../../public/assets/logos/llamaindex-color.svg";
import openaiLogo from "../../../../../public/assets/logos/openai_small.svg";
import openaiAgentsLogo from "../../../../../public/assets/logos/openai-agents.svg";
import pydanticAiLogo from "../../../../../public/assets/logos/pydantic-ai-color.svg";
import strandsLogo from "../../../../../public/assets/logos/strands.svg";
import vercelLogo from "../../../../../public/assets/logos/vercel.svg";
import { Logo } from "@/components/molecules/logo/Logo";
import { cn } from "@/lib/cva.config";

import type { TraceSummary } from "../types";

export interface TraceFramework {
  readonly id: string;
  readonly label: string;
  readonly logo: string;
}

/**
 * Ids are the slugs the trace normalizer emits (litellm-rust `Integration`, kebab-case) plus the raw
 * `ls_integration` values LangChain reports. A trace lists every framework seen on its spans, so the
 * registry runs most-specific first: an agent framework beats the model SDK it wraps.
 */
const FRAMEWORKS: readonly TraceFramework[] = [
  {
    id: "claude-agent-sdk",
    get label() {
      return translateUi("ui.88c65262d2135f45");
    },
    logo: anthropicLogo.src,
  },
  {
    id: "claude-code",
    get label() {
      return translateUi("ui.246ef8c1130d56f5");
    },
    logo: anthropicLogo.src,
  },
  {
    id: "openai-codex",
    get label() {
      return translateUi("ui.616efbe96852d8c9");
    },
    logo: openaiLogo.src,
  },
  {
    id: "cursor",
    get label() {
      return translateUi("ui.2c014f8f8986f1b2");
    },
    logo: cursorLogo.src,
  },
  {
    id: "copilot",
    get label() {
      return translateUi("ui.ed249d417dcd38db");
    },
    logo: copilotLogo.src,
  },
  {
    id: "deepagents",
    get label() {
      return translateUi("ui.3e0c17c45a45aa12");
    },
    logo: langchainLogo.src,
  },
  {
    id: "langgraph",
    get label() {
      return translateUi("ui.845bbc27a312cec7");
    },
    logo: langgraphLogo.src,
  },
  {
    id: "langchain",
    get label() {
      return translateUi("ui.63c34d5ded165a69");
    },
    logo: langchainLogo.src,
  },
  {
    id: "langchain_create_agent",
    get label() {
      return translateUi("ui.63c34d5ded165a69");
    },
    logo: langchainLogo.src,
  },
  {
    id: "langchain_chat_model",
    get label() {
      return translateUi("ui.63c34d5ded165a69");
    },
    logo: langchainLogo.src,
  },
  {
    id: "crewai",
    get label() {
      return translateUi("ui.5ed19ca34161ab69");
    },
    logo: crewaiLogo.src,
  },
  {
    id: "google-adk",
    get label() {
      return translateUi("ui.5595402fe7a883ec");
    },
    logo: googleAdkLogo.src,
  },
  {
    id: "llama-index",
    get label() {
      return translateUi("ui.bbef28c9ea693db8");
    },
    logo: llamaIndexLogo.src,
  },
  {
    id: "openai-agents",
    get label() {
      return translateUi("ui.b90951441f1013fb");
    },
    logo: openaiAgentsLogo.src,
  },
  {
    id: "pydantic-ai",
    get label() {
      return translateUi("ui.e6b55c0756869a37");
    },
    logo: pydanticAiLogo.src,
  },
  {
    id: "strands",
    get label() {
      return translateUi("ui.cae0bb48f7a53cea");
    },
    logo: strandsLogo.src,
  },
  {
    id: "vercel-ai-sdk",
    get label() {
      return translateUi("ui.490c9cb0b3e768b1");
    },
    logo: vercelLogo.src,
  },
  {
    id: "openai",
    get label() {
      return translateUi("ui.c688ca3f868cdd08");
    },
    logo: openaiLogo.src,
  },
];

export const traceFramework = (summary: Pick<TraceSummary, "frameworks">): TraceFramework | null =>
  FRAMEWORKS.find((framework) => summary.frameworks?.includes(framework.id)) ?? null;

export function FrameworkLogo({ framework, className }: { framework: TraceFramework; className?: string }) {
  return (
    <span aria-hidden className="contents">
      <Logo src={framework.logo} label={framework.label} className={cn("size-3.5 shrink-0", className)} />
    </span>
  );
}
