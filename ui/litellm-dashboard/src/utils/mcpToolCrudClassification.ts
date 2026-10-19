import { t as translateUi } from "@/i18n";
export type CrudOp = "read" | "create" | "update" | "delete" | "unknown";

const DELETE_RE = /\b(delete|remove|destroy|purge|drop|erase|unlink)\b/i;
const CREATE_RE = /\b(create|add|insert|new|post|submit|register|make|generate|write|upload)\b/i;
const UPDATE_RE = /\b(update|edit|modify|change|patch|put|set|rename|move|transform)\b/i;
const READ_RE = /\b(get|read|list|fetch|search|find|query|retrieve|show|view|check|describe|info)\b/i;

export interface MCPToolEntry {
  name: string;
  description?: string;
}

/**
 * Classifies a tool by its name first; falls back to description only when
 * the name alone yields no match. This prevents incidental phrasing in
 * free-form descriptions (e.g. "removes noise from…") from promoting a safe
 * tool into a high-risk bucket.
 *
 * READ is checked before DELETE/UPDATE so that tools like `get_removed_entries`
 * or `list_deleted_items` — where the primary verb is a read operation — are
 * not silently blocked by the delete-by-default policy for new servers.
 */
export function classifyToolOp(name: string, description = ""): CrudOp {
  const nameLower = name.toLowerCase();
  if (READ_RE.test(nameLower)) return "read";
  if (DELETE_RE.test(nameLower)) return "delete";
  if (UPDATE_RE.test(nameLower)) return "update";
  if (CREATE_RE.test(nameLower)) return "create";

  // Only consult description when the name is unrecognised.
  if (description) {
    const descLower = description.toLowerCase();
    if (READ_RE.test(descLower)) return "read";
    if (DELETE_RE.test(descLower)) return "delete";
    if (UPDATE_RE.test(descLower)) return "update";
    if (CREATE_RE.test(descLower)) return "create";
  }

  return "unknown";
}

export function groupToolsByCrud(tools: MCPToolEntry[]): Record<CrudOp, MCPToolEntry[]> {
  const groups: Record<CrudOp, MCPToolEntry[]> = {
    read: [],
    create: [],
    update: [],
    delete: [],
    unknown: [],
  };
  for (const tool of tools) {
    const op = classifyToolOp(tool.name, tool.description);
    groups[op].push(tool);
  }
  return groups;
}

export const CRUD_GROUP_META: Record<
  CrudOp,
  { label: string; description: string; risk: "low" | "medium" | "high" | "unknown" }
> = {
  read: {
    get label() {
      return translateUi("ui.9b9a8d05a7ec353b");
    },
    get description() {
      return translateUi("ui.3cb0d9edb6638412");
    },
    risk: "low",
  },
  create: {
    get label() {
      return translateUi("ui.4759498ac2a7");
    },
    get description() {
      return translateUi("ui.1bf6006d26e9cf6b");
    },
    risk: "medium",
  },
  update: {
    get label() {
      return translateUi("ui.c1c1009d3f37ec05");
    },
    get description() {
      return translateUi("ui.bb2361f9cdab3993");
    },
    risk: "medium",
  },
  delete: {
    get label() {
      return translateUi("ui.e2d0a54968ea");
    },
    get description() {
      return translateUi("ui.99ee346f1d3ead04");
    },
    risk: "high",
  },
  unknown: {
    get label() {
      return translateUi("ui.f97e9da0e3b879f0");
    },
    get description() {
      return translateUi("ui.e7c9b3173f42e928");
    },
    risk: "unknown",
  },
};
