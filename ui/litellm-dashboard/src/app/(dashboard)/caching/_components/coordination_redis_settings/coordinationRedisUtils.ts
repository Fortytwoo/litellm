import { t as translateUi } from "@/i18n";
import type { StatusTone } from "@/components/shared/table_cells/status_badge";
import {
  COORDINATION_FIELDS,
  CoordinationField,
  CoordinationRedisType,
  CoordinationSection,
} from "./coordinationRedisFields";
import { CoordinationRedisSettings, CoordinationRedisSource, REDACTED_VALUE } from "./types";

export type CoordinationFormValue = string | number | boolean | undefined;
export type CoordinationFormValues = Record<string, CoordinationFormValue>;

export const isFieldVisible = (field: CoordinationField, redisType: CoordinationRedisType): boolean =>
  field.redisType === null || field.redisType === redisType;

export const fieldsForSection = (section: CoordinationSection, redisType: CoordinationRedisType): CoordinationField[] =>
  COORDINATION_FIELDS.filter((field) => field.section === section && isFieldVisible(field, redisType));

const hasValue = (raw: unknown): boolean => {
  const isEmptyArray = Array.isArray(raw) && raw.length === 0;
  const isBlank = raw === undefined || raw === null || raw === "";
  return !isBlank && !isEmptyArray;
};

export const inferRedisType = (values: Record<string, unknown>): CoordinationRedisType => {
  if (hasValue(values.sentinel_nodes)) {
    return "sentinel";
  }
  if (hasValue(values.startup_nodes)) {
    return "cluster";
  }
  return "node";
};

export const configuredSecretFields = (values: Record<string, unknown>): ReadonlySet<string> =>
  new Set(COORDINATION_FIELDS.filter((field) => field.secret && hasValue(values[field.name])).map((f) => f.name));

const initialValueForField = (field: CoordinationField, raw: unknown): CoordinationFormValue => {
  if (field.secret) {
    return "";
  }

  const source = raw ?? field.defaultValue;

  if (field.type === "boolean") {
    return source === true || source === "true";
  }

  if (field.type === "list") {
    if (!hasValue(source)) {
      return "";
    }
    return typeof source === "string" ? source : JSON.stringify(source, null, 2);
  }

  if (source === undefined || source === null) {
    return "";
  }
  return String(source);
};

export const buildInitialValues = (values: Record<string, unknown>): CoordinationFormValues =>
  Object.fromEntries(COORDINATION_FIELDS.map((field) => [field.name, initialValueForField(field, values[field.name])]));

const saveValueForField = (
  field: CoordinationField,
  raw: CoordinationFormValue,
): CoordinationRedisSettings[string] | undefined => {
  if (field.secret && raw === REDACTED_VALUE) {
    return undefined;
  }

  if (field.type === "boolean") {
    return Boolean(raw);
  }

  if (field.type === "list") {
    if (typeof raw !== "string" || raw.trim() === "") {
      return undefined;
    }
    try {
      return JSON.parse(raw) as unknown[];
    } catch {
      return undefined;
    }
  }

  if (field.type === "integer") {
    if (raw === undefined || raw === null || raw === "") {
      return undefined;
    }
    const parsed = Number(raw);
    return Number.isNaN(parsed) ? undefined : parsed;
  }

  if (typeof raw !== "string") {
    return raw === undefined ? undefined : String(raw);
  }
  const trimmed = raw.trim();
  return trimmed === "" ? undefined : trimmed;
};

export const buildCoordinationPayload = (
  redisType: CoordinationRedisType,
  values: CoordinationFormValues,
): CoordinationRedisSettings => {
  const entries = COORDINATION_FIELDS.filter((field) => isFieldVisible(field, redisType)).flatMap((field) => {
    const value = saveValueForField(field, values[field.name]);
    return value === undefined ? [] : [[field.name, value] as const];
  });

  return Object.fromEntries(entries);
};

export interface SourceBadgeDescriptor {
  readonly tone: StatusTone;
  readonly label: string;
  readonly tooltip: string;
}

const SOURCE_BADGES: Readonly<Record<CoordinationRedisSource, SourceBadgeDescriptor>> = {
  coordination_redis: {
    tone: "success",
    get label() {
      return translateUi("ui.3e283ac390537298");
    },
    get tooltip() {
      return translateUi("ui.a85ccdeb747d5be7");
    },
  },
  cache_backend: {
    tone: "info",
    get label() {
      return translateUi("ui.f5bc7e5dd75febe3");
    },
    get tooltip() {
      return translateUi("ui.05b8d38aed95f319");
    },
  },
  environment: {
    tone: "info",
    get label() {
      return translateUi("ui.fd81cf9db25288e3");
    },
    get tooltip() {
      return translateUi("ui.03a2dabcc1e37c02");
    },
  },
};

const NOT_CONFIGURED_BADGE: SourceBadgeDescriptor = {
  tone: "neutral",
  get label() {
    return translateUi("ui.dd1841d295024256");
  },
  get tooltip() {
    return translateUi("ui.baccf6d11d483c0a");
  },
};

export const sourceBadge = (source: string | null | undefined): SourceBadgeDescriptor => {
  const known: Readonly<Record<string, SourceBadgeDescriptor>> = SOURCE_BADGES;
  return (source && known[source]) || NOT_CONFIGURED_BADGE;
};
