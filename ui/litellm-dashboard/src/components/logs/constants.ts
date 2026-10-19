import { t as translateUi } from "@/i18n";
export const ERROR_CODE_OPTIONS: { label: string; value: string }[] = [
  {
    get label() {
      return translateUi("ui.c56342be68eb");
    },
    value: "400",
  },
  {
    get label() {
      return translateUi("ui.386bcf7dc4fa");
    },
    value: "401",
  },
  {
    get label() {
      return translateUi("ui.cc8348cca450");
    },
    value: "403",
  },
  {
    get label() {
      return translateUi("ui.2d857a3660e0");
    },
    value: "404",
  },
  {
    get label() {
      return translateUi("ui.8de0c9c674f2");
    },
    value: "408",
  },
  {
    get label() {
      return translateUi("ui.73511fb4ed1a");
    },
    value: "422",
  },
  {
    get label() {
      return translateUi("ui.245f28c2939b");
    },
    value: "429",
  },
  {
    get label() {
      return translateUi("ui.f93f5872b966");
    },
    value: "500",
  },
  {
    get label() {
      return translateUi("ui.9e4a323ce906");
    },
    value: "502",
  },
  {
    get label() {
      return translateUi("ui.a0a273a16908");
    },
    value: "503",
  },
  {
    get label() {
      return translateUi("ui.9563a2ec1dc7");
    },
    value: "529",
  },
];

/** Call types that represent MCP tool invocations (shared across columns, index, drawer). */
export const MCP_CALL_TYPES = ["call_mcp_tool", "list_mcp_tools"];

/** Call types that represent agent/A2A requests (e.g. asend_message). */
export const AGENT_CALL_TYPES = ["asend_message"];

/** Call types that represent Batch API operations (creation and retrieval, sync and async). */
export const BATCH_CALL_TYPES = ["acreate_batch", "create_batch", "aretrieve_batch", "retrieve_batch"];

export const SPAN_TYPE_LABELS: Record<string, string> = {
  llm: "LLM",
  agent: "Agent",
  mcp: "MCP",
  batch: "Batch",
};

export const CREDENTIAL_LABELS: Record<string, string> = {
  true: "Client OAuth token",
  false: "Configured key",
};

export const QUICK_SELECT_OPTIONS: { label: string; value: number; unit: string }[] = [
  {
    get label() {
      return translateUi("ui.97c4332acb7b");
    },
    value: 1,
    unit: "minutes",
  },
  {
    get label() {
      return translateUi("ui.74b39d60ef72");
    },
    value: 15,
    unit: "minutes",
  },
  {
    get label() {
      return translateUi("ui.fb4408ad40f0");
    },
    value: 1,
    unit: "hours",
  },
  {
    get label() {
      return translateUi("ui.10779be5d5ef");
    },
    value: 4,
    unit: "hours",
  },
  {
    get label() {
      return translateUi("ui.615c5daff4b8");
    },
    value: 24,
    unit: "hours",
  },
  {
    get label() {
      return translateUi("ui.b84372e5cb3a");
    },
    value: 7,
    unit: "days",
  },
];
