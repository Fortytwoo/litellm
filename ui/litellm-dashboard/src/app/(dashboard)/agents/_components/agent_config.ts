import { t as translateUi } from "@/i18n";
import { parseIdentityForForm } from "./agent_identity";
/**
 * Shared configuration for agent form fields
 * Used across create, view, and update operations
 */

import {
  EMPTY_KILL_SWITCH_FORM,
  buildKillSwitchFromForm,
  parseKillSwitchForForm,
  type KillSwitchConfig,
  type KillSwitchFormValue,
} from "./kill_switch_config";

export interface FieldConfig {
  name: string;
  label: string;
  type: "text" | "textarea" | "url" | "switch" | "list" | "select";
  required?: boolean;
  tooltip?: string;
  placeholder?: string;
  defaultValue?: any;
  rows?: number;
  validation?: any[];
  options?: string[];
  helpText?: string;
}

export interface SectionConfig {
  key: string;
  title: string;
  fields: FieldConfig[];
  defaultExpanded?: boolean;
}

export const AGENT_FORM_CONFIG: {
  basic: SectionConfig;
  skills: SectionConfig;
  capabilities: SectionConfig;
  optional: SectionConfig;
  litellm: SectionConfig;
  cost: SectionConfig;
  tracing: SectionConfig;
} = {
  basic: {
    key: "basic",
    get title() {
      return translateUi("ui.d094b334d8099b1e");
    },
    defaultExpanded: true,
    fields: [
      {
        name: "name",
        get label() {
          return translateUi("ui.18d67c992b71ce69");
        },
        type: "text",
        required: true,
        get placeholder() {
          return translateUi("ui.d64fb47b17785cde");
        },
      },
      {
        name: "description",
        get label() {
          return translateUi("ui.526e0087cc3f");
        },
        type: "textarea",
        required: false,
        get placeholder() {
          return translateUi("ui.5e15ce7fc160ce58");
        },
        rows: 3,
      },
      {
        name: "url",
        label: "URL",
        type: "url",
        required: false,
        placeholder: "http://localhost:9999/",
        get tooltip() {
          return translateUi("ui.8a2285ba4d4e3213");
        },
      },
      {
        name: "version",
        get label() {
          return translateUi("ui.dd167905de0defca");
        },
        type: "text",
        placeholder: "1.0.0",
        defaultValue: "1.0.0",
      },
      {
        name: "protocolVersion",
        get label() {
          return translateUi("ui.291267b5e04ce1b5");
        },
        type: "select",
        options: ["1.0", "0.3"],
        defaultValue: "1.0",
        get tooltip() {
          return translateUi("ui.6a99fd7fda6804bf");
        },
        get helpText() {
          return translateUi("ui.97377c4460fccabd");
        },
      },
    ],
  },
  skills: {
    key: "skills",
    get title() {
      return translateUi("ui.66d0f523a379");
    },
    fields: [
      {
        name: "skills",
        get label() {
          return translateUi("ui.66d0f523a379");
        },
        type: "list",
        defaultValue: [],
      },
    ],
  },
  capabilities: {
    key: "capabilities",
    get title() {
      return translateUi("ui.9460f16ac9b5171e");
    },
    fields: [
      {
        name: "streaming",
        get label() {
          return translateUi("ui.a951c5945635e2d3");
        },
        type: "switch",
        defaultValue: false,
      },
      {
        name: "pushNotifications",
        get label() {
          return translateUi("ui.3b1776f544c9f4b0");
        },
        type: "switch",
      },
      {
        name: "stateTransitionHistory",
        get label() {
          return translateUi("ui.7cf48623858f12d3");
        },
        type: "switch",
      },
    ],
  },
  optional: {
    key: "optional",
    get title() {
      return translateUi("ui.22cacf9e2be2ffa0");
    },
    fields: [
      {
        name: "iconUrl",
        get label() {
          return translateUi("ui.5522df36679f818e");
        },
        type: "url",
        placeholder: "https://example.com/icon.png",
      },
      {
        name: "documentationUrl",
        get label() {
          return translateUi("ui.33db6f919e9e2d29");
        },
        type: "url",
        placeholder: "https://docs.example.com",
      },
      {
        name: "supportsAuthenticatedExtendedCard",
        get label() {
          return translateUi("ui.f004595b5dcf413f");
        },
        type: "switch",
      },
    ],
  },
  litellm: {
    key: "litellm",
    get title() {
      return translateUi("ui.1898c7d608a9afc1");
    },
    fields: [
      {
        name: "model",
        get label() {
          return translateUi("ui.0da3c71f8f09d1b4");
        },
        type: "text",
      },
      {
        name: "make_public",
        get label() {
          return translateUi("ui.24139936d627112e");
        },
        type: "switch",
      },
    ],
  },
  cost: {
    key: "cost",
    get title() {
      return translateUi("ui.20a90e67e23542a2");
    },
    fields: [
      {
        name: "cost_per_query",
        get label() {
          return translateUi("ui.689e32fd9ef7fee6");
        },
        type: "text",
        placeholder: "0.0",
        get tooltip() {
          return translateUi("ui.042bf57b08e6138b");
        },
      },
      {
        name: "input_cost_per_token",
        get label() {
          return translateUi("ui.0e0681b8302e9b52");
        },
        type: "text",
        placeholder: "0.000001",
        get tooltip() {
          return translateUi("ui.516d815b578767bb");
        },
      },
      {
        name: "output_cost_per_token",
        get label() {
          return translateUi("ui.a3ea3cb505b2a617");
        },
        type: "text",
        placeholder: "0.000002",
        get tooltip() {
          return translateUi("ui.a8355dbd865ff822");
        },
      },
    ],
  },
  tracing: {
    key: "tracing",
    get title() {
      return translateUi("ui.69e561abfb584b5e");
    },
    fields: [
      {
        name: "enable_tracing",
        get label() {
          return translateUi("ui.d1d1652a1ca4a2a7");
        },
        type: "switch",
        defaultValue: false,
        get tooltip() {
          return translateUi("ui.b44988e4375cf344");
        },
      },
    ],
  },
};

export const SKILL_FIELD_CONFIG = {
  id: {
    name: "id",
    get label() {
      return translateUi("ui.9f565edfc9f9df77");
    },
    required: true,
    get placeholder() {
      return translateUi("ui.4d82c7210b8b919e");
    },
  },
  name: {
    name: "name",
    get label() {
      return translateUi("ui.72588b0c1d102da3");
    },
    required: true,
    get placeholder() {
      return translateUi("ui.b51e4794091a232d");
    },
  },
  description: {
    name: "description",
    get label() {
      return translateUi("ui.526e0087cc3f");
    },
    required: true,
    get placeholder() {
      return translateUi("ui.5279cd30dc9a0e2c");
    },
    rows: 2,
  },
  tags: {
    name: "tags",
    get label() {
      return translateUi("ui.1331275bc537");
    },
    required: true,
    get placeholder() {
      return translateUi("ui.7622936efb45a349");
    },
  },
  examples: {
    name: "examples",
    get label() {
      return translateUi("ui.e68ee04dff59551b");
    },
    get placeholder() {
      return translateUi("ui.91b13b5a9febb791");
    },
  },
};

/**
 * Get default form values from configuration
 */
export const getDefaultFormValues = () => {
  const defaults: any = {
    defaultInputModes: ["text"],
    defaultOutputModes: ["text"],
    kill_switch: { ...EMPTY_KILL_SWITCH_FORM },
  };

  Object.values(AGENT_FORM_CONFIG).forEach((section) => {
    section.fields.forEach((field) => {
      if (field.defaultValue !== undefined) {
        defaults[field.name] = field.defaultValue;
      }
    });
  });

  return defaults;
};

/**
 * Build agent data from form values according to AgentConfig spec
 */
export const buildAgentDataFromForm = (values: any, existingAgent?: any) => {
  const agentData: any = {
    agent_name: values.agent_name,
    agent_card_params: {
      protocolVersion: values.protocolVersion || "1.0",
      name: values.name || values.agent_name,
      description: values.description || "",
      url: values.url || "",
      version: values.version || "1.0.0",
      defaultInputModes: existingAgent?.agent_card_params?.defaultInputModes || ["text"],
      defaultOutputModes: existingAgent?.agent_card_params?.defaultOutputModes || ["text"],
      capabilities: {
        streaming: values.streaming === true,
        ...(values.pushNotifications !== undefined && { pushNotifications: values.pushNotifications }),
        ...(values.stateTransitionHistory !== undefined && { stateTransitionHistory: values.stateTransitionHistory }),
      },
      skills: values.skills || [],
      ...(values.iconUrl && { iconUrl: values.iconUrl }),
      ...(values.documentationUrl && { documentationUrl: values.documentationUrl }),
      ...(values.supportsAuthenticatedExtendedCard !== undefined && {
        supportsAuthenticatedExtendedCard: values.supportsAuthenticatedExtendedCard,
      }),
    },
  };

  const params: Record<string, any> = {};

  if (values.model) params.model = values.model;
  if (values.make_public !== undefined) params.make_public = values.make_public;
  if (values.cost_per_query) params.cost_per_query = parseFloat(values.cost_per_query);
  if (values.input_cost_per_token) params.input_cost_per_token = parseFloat(values.input_cost_per_token);
  if (values.output_cost_per_token) params.output_cost_per_token = parseFloat(values.output_cost_per_token);

  if (Object.keys(params).length > 0) {
    agentData.litellm_params = params;
  }

  if (values.tpm_limit != null) agentData.tpm_limit = values.tpm_limit;
  if (values.rpm_limit != null) agentData.rpm_limit = values.rpm_limit;
  if (values.session_tpm_limit != null) agentData.session_tpm_limit = values.session_tpm_limit;
  if (values.session_rpm_limit != null) agentData.session_rpm_limit = values.session_rpm_limit;
  // static_headers: convert [{header, value}, ...] → {header: value, ...}
  if (Array.isArray(values.static_headers) && values.static_headers.length > 0) {
    const staticHeaders: Record<string, string> = {};
    values.static_headers.forEach((entry: { header?: string; value?: string }) => {
      const key = entry?.header?.trim();
      if (key) staticHeaders[key] = entry?.value ?? "";
    });
    if (Object.keys(staticHeaders).length > 0) {
      agentData.static_headers = staticHeaders;
    }
  }

  // extra_headers: already an array of strings from Select tags
  if (Array.isArray(values.extra_headers) && values.extra_headers.length > 0) {
    agentData.extra_headers = values.extra_headers;
  }

  applyKillSwitchToPayload(agentData, values.kill_switch, existingAgent);

  return agentData;
};

export const applyKillSwitchToPayload = (
  agentData: { kill_switch?: KillSwitchConfig | null },
  form: KillSwitchFormValue | undefined,
  existingAgent?: { kill_switch?: KillSwitchConfig | null },
) => {
  const killSwitch = buildKillSwitchFromForm(form);
  if (killSwitch !== undefined && (killSwitch !== null || existingAgent?.kill_switch)) {
    agentData.kill_switch = killSwitch;
  }
};

export const parseAccessGroupIdsForForm = (agent: { access_group_ids?: string[] | null }) => ({
  access_group_ids: agent.access_group_ids ?? [],
});

export const parseMcpPermissionsForForm = (agent: any) => ({
  ...parseIdentityForForm(agent),
  allowed_mcp_servers_and_groups: {
    servers: agent.object_permission?.mcp_servers ?? [],
    accessGroups: agent.object_permission?.mcp_access_groups ?? [],
    toolsets: agent.object_permission?.mcp_toolsets ?? [],
  },
  mcp_tool_permissions: agent.object_permission?.mcp_tool_permissions ?? {},
});

/**
 * Always includes every MCP key (empty when cleared) so removals persist;
 * the proxy merges object_permission per key, leaving non-MCP grants untouched.
 */
export const buildMcpObjectPermission = (values: any) => ({
  mcp_servers: values.allowed_mcp_servers_and_groups?.servers ?? [],
  mcp_access_groups: values.allowed_mcp_servers_and_groups?.accessGroups ?? [],
  mcp_toolsets: values.allowed_mcp_servers_and_groups?.toolsets ?? [],
  mcp_tool_permissions: values.mcp_tool_permissions ?? {},
});

/**
 * Parse agent data for form fields
 */
export const parseAgentForForm = (agent: any) => {
  const card = agent.agent_card_params ?? {};
  const skills =
    card.skills?.map((skill: any) => ({
      ...skill,
      tags: skill.tags,
      examples: skill.examples || [],
    })) || [];

  return {
    agent_name: agent.agent_name,
    name: card.name || agent.agent_name,
    description: card.description,
    url: card.url,
    version: card.version,
    protocolVersion: card.protocolVersion,
    streaming: card.capabilities?.streaming,
    pushNotifications: card.capabilities?.pushNotifications,
    stateTransitionHistory: card.capabilities?.stateTransitionHistory,
    skills: skills,
    iconUrl: card.iconUrl,
    documentationUrl: card.documentationUrl,
    supportsAuthenticatedExtendedCard: card.supportsAuthenticatedExtendedCard,
    model: agent.litellm_params?.model,
    make_public: agent.litellm_params?.make_public,
    cost_per_query: agent.litellm_params?.cost_per_query,
    input_cost_per_token: agent.litellm_params?.input_cost_per_token,
    output_cost_per_token: agent.litellm_params?.output_cost_per_token,
    tpm_limit: agent.tpm_limit,
    rpm_limit: agent.rpm_limit,
    session_tpm_limit: agent.session_tpm_limit,
    session_rpm_limit: agent.session_rpm_limit,
    // static_headers: {key: value} → [{header, value}, ...]
    static_headers: agent.static_headers
      ? Object.entries(agent.static_headers as Record<string, string>).map(([header, value]) => ({
          header,
          value,
        }))
      : [],
    // extra_headers: already an array of strings
    extra_headers: agent.extra_headers ?? [],
    kill_switch: parseKillSwitchForForm(agent.kill_switch),
    ...parseMcpPermissionsForForm(agent),
    ...parseAccessGroupIdsForForm(agent),
  };
};
