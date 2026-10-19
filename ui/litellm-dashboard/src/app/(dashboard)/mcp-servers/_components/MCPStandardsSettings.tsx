"use client";
import { t as translateUi } from "@/i18n";

import { MCPServer } from "@/components/mcp_tools/types";

export interface RequiredFieldDef {
  key: string;
  label: string;
  description: string;
  check: (server: MCPServer) => boolean;
}

export interface FieldGroup {
  label: string;
  fields: RequiredFieldDef[];
}

export const FIELD_GROUPS: FieldGroup[] = [
  {
    get label() {
      return translateUi("ui.c205924de0fe");
    },
    fields: [
      {
        key: "description",
        get label() {
          return translateUi("ui.526e0087cc3f");
        },
        get description() {
          return translateUi("ui.6281f556ef39209f");
        },
        check: (s) => !!s.description?.trim(),
      },
      {
        key: "alias",
        get label() {
          return translateUi("ui.b19e02e9502bbe5a");
        },
        get description() {
          return translateUi("ui.d3892ee4f1d6d4d7");
        },
        check: (s) => !!s.alias?.trim(),
      },
    ],
  },
  {
    get label() {
      return translateUi("ui.0e570ca6fabe24f9");
    },
    fields: [
      {
        key: "source_url",
        get label() {
          return translateUi("ui.019e0db0779205ad");
        },
        get description() {
          return translateUi("ui.71a97b667aae356d");
        },
        check: (s) => !!s.source_url?.trim(),
      },
    ],
  },
  {
    get label() {
      return translateUi("ui.639a40e82b9a96f0");
    },
    fields: [
      {
        key: "url",
        get label() {
          return translateUi("ui.22f5ebc3ad3ff763");
        },
        get description() {
          return translateUi("ui.ae9a960816e73449");
        },
        check: (s) => !!s.url?.trim(),
      },
    ],
  },
  {
    get label() {
      return translateUi("ui.8f6fb4eb7f42c0e2");
    },
    fields: [
      {
        key: "auth_type",
        get label() {
          return translateUi("ui.78416c5568f50492");
        },
        get description() {
          return translateUi("ui.5035b74728683133");
        },
        check: (s) => !!s.auth_type && s.auth_type !== "none",
      },
    ],
  },
];

export const MCP_REQUIRED_FIELD_DEFS: RequiredFieldDef[] = FIELD_GROUPS.flatMap((g) => g.fields);

export const SETTINGS_KEY = "mcp_required_fields";
