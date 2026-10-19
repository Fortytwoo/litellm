import { t as translateUi } from "@/i18n";
export type CoordinationFieldType = "string" | "password" | "integer" | "boolean" | "list";

export type CoordinationRedisType = "node" | "cluster" | "sentinel";

export type CoordinationSection = "connection" | "cluster" | "sentinel" | "ssl";

export type CoordinationFieldRule = (value: unknown) => string | null;

export interface CoordinationField {
  readonly name: string;
  readonly label: string;
  readonly type: CoordinationFieldType;
  readonly section: CoordinationSection;
  readonly helpText: string;
  readonly redisType: CoordinationRedisType | null;
  readonly secret: boolean;
  readonly defaultValue?: string | number | boolean;
  readonly rules?: CoordinationFieldRule[];
}

export const COORDINATION_REDIS_TYPES: readonly CoordinationRedisType[] = ["node", "cluster", "sentinel"];

export const COORDINATION_REDIS_TYPE_DESCRIPTIONS: Readonly<Record<CoordinationRedisType, string>> = {
  get node() {
    return translateUi("ui.b0be8e2b1b01cab9");
  },
  get cluster() {
    return translateUi("ui.baeddb46b74420b0");
  },
  get sentinel() {
    return translateUi("ui.2fa81c3ba1fd4d03");
  },
};

export const COORDINATION_REDIS_TYPE_LABELS: Readonly<Record<CoordinationRedisType, string>> = {
  get node() {
    return translateUi("ui.b5ff77a9cb7441eb");
  },
  get cluster() {
    return translateUi("ui.c137a7f43e23f7ff");
  },
  get sentinel() {
    return translateUi("ui.8ea9bd0d9810e449");
  },
};

const isBlank = (value: unknown): boolean => value === undefined || value === null || String(value).trim() === "";

const portRule: CoordinationFieldRule = (value) => {
  if (isBlank(value)) {
    return null;
  }
  const port = Number(value);
  return Number.isInteger(port) && port >= 1 && port <= 65535 ? null : "Port must be an integer between 1 and 65535";
};

const jsonListRule: CoordinationFieldRule = (value) => {
  if (isBlank(value)) {
    return null;
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(String(value));
  } catch {
    return "Must be a valid JSON array (use double quotes)";
  }
  return Array.isArray(parsed) ? null : "Must be a JSON array";
};

export const COORDINATION_FIELDS: readonly CoordinationField[] = [
  {
    name: "url",
    get label() {
      return translateUi("ui.90251be036fb8622");
    },
    type: "password",
    section: "connection",
    get helpText() {
      return translateUi("ui.fa8ddda32ee9abd5");
    },
    redisType: null,
    secret: true,
  },
  {
    name: "host",
    get label() {
      return translateUi("ui.4a823118b9ba8baa");
    },
    type: "string",
    section: "connection",
    get helpText() {
      return translateUi("ui.1286afa21488d0b6");
    },
    redisType: null,
    secret: false,
  },
  {
    name: "port",
    get label() {
      return translateUi("ui.72e9a59f5a1d6289");
    },
    type: "integer",
    section: "connection",
    get helpText() {
      return translateUi("ui.db48d039f0e3643f");
    },
    redisType: null,
    secret: false,
    defaultValue: "6379",
    rules: [portRule],
  },
  {
    name: "username",
    get label() {
      return translateUi("ui.e3b89e9d33f88e52");
    },
    type: "string",
    section: "connection",
    get helpText() {
      return translateUi("ui.8295a933bad0513c");
    },
    redisType: null,
    secret: false,
  },
  {
    name: "password",
    get label() {
      return translateUi("ui.e7cf3ef4f17c");
    },
    type: "password",
    section: "connection",
    get helpText() {
      return translateUi("ui.c894412fccf7e8de");
    },
    redisType: null,
    secret: true,
  },
  {
    name: "startup_nodes",
    get label() {
      return translateUi("ui.e0652497b41d0dac");
    },
    type: "list",
    section: "cluster",
    get helpText() {
      return translateUi("ui.9a30659bbcebdb3e");
    },
    redisType: "cluster",
    secret: false,
    rules: [jsonListRule],
  },
  {
    name: "sentinel_nodes",
    get label() {
      return translateUi("ui.f3c223fffb87f87f");
    },
    type: "list",
    section: "sentinel",
    get helpText() {
      return translateUi("ui.14c50618a450fbed");
    },
    redisType: "sentinel",
    secret: false,
    rules: [jsonListRule],
  },
  {
    name: "service_name",
    get label() {
      return translateUi("ui.2133ed9a6375a590");
    },
    type: "string",
    section: "sentinel",
    get helpText() {
      return translateUi("ui.871fd19dc68234ba");
    },
    redisType: "sentinel",
    secret: false,
  },
  {
    name: "sentinel_password",
    get label() {
      return translateUi("ui.7e9b01fe631dcd94");
    },
    type: "password",
    section: "sentinel",
    get helpText() {
      return translateUi("ui.2c2225beaffe589d");
    },
    redisType: "sentinel",
    secret: true,
  },
  {
    name: "ssl",
    get label() {
      return translateUi("ui.07f9736e7adea312");
    },
    type: "boolean",
    section: "ssl",
    get helpText() {
      return translateUi("ui.112e35f63ea968c5");
    },
    redisType: null,
    secret: false,
    defaultValue: false,
  },
];
