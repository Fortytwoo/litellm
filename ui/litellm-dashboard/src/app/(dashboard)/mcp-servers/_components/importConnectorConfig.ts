import { t as translateUi } from "@/i18n";
export interface MCPConnectorImportResult {
  name: string;
  server_id: string;
  alias: string;
}

export interface MCPConnectorImportSkipped {
  name: string;
  reason: string;
}

export interface MCPConnectorImportFailure {
  name: string;
  error: string;
}

export interface MCPConnectorImportResponse {
  imported: MCPConnectorImportResult[];
  skipped: MCPConnectorImportSkipped[];
  errors: MCPConnectorImportFailure[];
}

export type ParsedConnectorConfig =
  | { ok: true; payload: Record<string, unknown>; connectorCount: number }
  | { ok: false; error: string };

export const parseConnectorConfig = (text: string): ParsedConnectorConfig => {
  const trimmed = text.trim();
  if (!trimmed) {
    return {
      ok: false,
      get error() {
        return translateUi("ui.b1863a46c0d8d521");
      },
    };
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    return {
      ok: false,
      get error() {
        return translateUi("ui.2f0c38754fddc00d");
      },
    };
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return {
      ok: false,
      get error() {
        return translateUi("ui.47a32f5c3a7fa524");
      },
    };
  }
  const record = parsed as Record<string, unknown>;
  const mapping = record.mcpServers;
  if (mapping !== undefined) {
    if (typeof mapping !== "object" || mapping === null || Array.isArray(mapping)) {
      return {
        ok: false,
        get error() {
          return translateUi("ui.8f3881be02d63383");
        },
      };
    }
    const connectorCount = Object.keys(mapping).length;
    if (connectorCount === 0) {
      return {
        ok: false,
        get error() {
          return translateUi("ui.41447f275b6f8327");
        },
      };
    }
    return { ok: true, payload: { mcpServers: mapping }, connectorCount };
  }
  const list = record.mcp_servers;
  if (list !== undefined) {
    if (!Array.isArray(list)) {
      return {
        ok: false,
        get error() {
          return translateUi("ui.7a295e6c06de972f");
        },
      };
    }
    if (list.length === 0) {
      return {
        ok: false,
        get error() {
          return translateUi("ui.fee49ed8c6f2f930");
        },
      };
    }
    return { ok: true, payload: { mcp_servers: list }, connectorCount: list.length };
  }
  return {
    ok: false,
    get error() {
      return translateUi("ui.47a32f5c3a7fa524");
    },
  };
};
