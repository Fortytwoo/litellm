import { t as translateUi } from "@/i18n";
export type CacheFieldType =
  | "string"
  | "password"
  | "integer"
  | "float"
  | "boolean"
  | "list"
  | "model-select"
  | "select";

export interface CacheFieldOption {
  readonly value: string;
  readonly label: string;
}

export type RedisType = "node" | "cluster" | "sentinel" | "semantic";

export type CacheSection = "connection" | "cluster" | "sentinel" | "semantic" | "ssl" | "cacheManagement" | "gcp";

export type CacheFieldRule = (value: unknown) => string | null;

// Marker the backend returns for a configured credential and maps back to the
// stored secret on save, so the plaintext never round-trips through the form.
export const REDACTED_VALUE = "***REDACTED***";

export interface CacheField {
  readonly name: string;
  readonly label: string;
  readonly type: CacheFieldType;
  readonly section: CacheSection;
  readonly helpText: string;
  readonly redisType: RedisType | null;
  readonly defaultValue?: string | number | boolean;
  readonly options?: readonly CacheFieldOption[];
  readonly rules?: CacheFieldRule[];
  // Credential field: never prefilled into the form, and dropped from the save
  // payload when left untouched so the redacted marker is never persisted.
  readonly secret?: boolean;
}

export const REDIS_TYPES: readonly RedisType[] = ["node", "cluster", "sentinel", "semantic"];

export const REDIS_TYPE_DESCRIPTIONS: Readonly<Record<RedisType, string>> = {
  get node() {
    return translateUi("ui.b0be8e2b1b01cab9");
  },
  get cluster() {
    return translateUi("ui.baeddb46b74420b0");
  },
  get sentinel() {
    return translateUi("ui.2fa81c3ba1fd4d03");
  },
  get semantic() {
    return translateUi("ui.6ee943329d8d637d");
  },
};

const isBlank = (value: unknown): boolean => value === undefined || value === null || String(value).trim() === "";

const portRule: CacheFieldRule = (value) => {
  if (isBlank(value)) {
    return null;
  }
  const port = Number(value);
  return Number.isInteger(port) && port >= 1 && port <= 65535 ? null : "Port must be an integer between 1 and 65535";
};

const jsonListRule: CacheFieldRule = (value) => {
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

const nonNegativeIntegerRule: CacheFieldRule = (value) => {
  if (isBlank(value)) {
    return null;
  }
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? null : "Must be a non-negative integer";
};

const numberRule: CacheFieldRule = (value) => {
  if (isBlank(value)) {
    return null;
  }
  return Number.isNaN(Number(value)) ? "Must be a number" : null;
};

export const CACHE_FIELDS: readonly CacheField[] = [
  {
    name: "url",
    get label() {
      return translateUi("ui.90251be036fb8622");
    },
    type: "string",
    section: "connection",
    get helpText() {
      return translateUi("ui.33433ae685c4398a");
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
  },
  {
    name: "port",
    get label() {
      return translateUi("ui.72e9a59f5a1d6289");
    },
    type: "string",
    section: "connection",
    get helpText() {
      return translateUi("ui.db48d039f0e3643f");
    },
    redisType: null,
    defaultValue: "6379",
    rules: [portRule],
  },
  {
    name: "db",
    get label() {
      return translateUi("ui.72fc65f362a8e659");
    },
    type: "integer",
    section: "connection",
    get helpText() {
      return translateUi("ui.e4e78100d72b41b9");
    },
    redisType: null,
    rules: [nonNegativeIntegerRule],
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
  },
  {
    name: "redis_startup_nodes",
    get label() {
      return translateUi("ui.e0652497b41d0dac");
    },
    type: "list",
    section: "cluster",
    get helpText() {
      return translateUi("ui.26d07179e4428b11");
    },
    redisType: "cluster",
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
    name: "similarity_threshold",
    get label() {
      return translateUi("ui.d29352e466462e72");
    },
    type: "float",
    section: "semantic",
    get helpText() {
      return translateUi("ui.9e7991d448400e05");
    },
    redisType: "semantic",
    defaultValue: 0.8,
    rules: [numberRule],
  },
  {
    name: "redis_semantic_cache_embedding_model",
    get label() {
      return translateUi("ui.860ec100606ba01b");
    },
    type: "model-select",
    section: "semantic",
    get helpText() {
      return translateUi("ui.2a810d9e8ad64c03");
    },
    redisType: "semantic",
  },
  {
    name: "semantic_cache_scope",
    get label() {
      return translateUi("ui.4ec46a0c64086334");
    },
    type: "select",
    section: "semantic",
    get helpText() {
      return translateUi("ui.73ebf93f9e3af159");
    },
    redisType: "semantic",
    defaultValue: "key",
    options: [
      {
        value: "key",
        get label() {
          return translateUi("ui.7b0f106f4f085016");
        },
      },
      {
        value: "end_user",
        get label() {
          return translateUi("ui.a22852d3fbfc5fb6");
        },
      },
    ],
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
    defaultValue: false,
  },
  {
    name: "ssl_cert_reqs",
    get label() {
      return translateUi("ui.fc8da32d58b6d0fa");
    },
    type: "string",
    section: "ssl",
    get helpText() {
      return translateUi("ui.e3b12e0d48fef88c");
    },
    redisType: null,
  },
  {
    name: "ssl_check_hostname",
    get label() {
      return translateUi("ui.45cbf7e22949d05e");
    },
    type: "boolean",
    section: "ssl",
    get helpText() {
      return translateUi("ui.f48f89ba2143e9d4");
    },
    redisType: null,
    defaultValue: false,
  },
  {
    name: "namespace",
    get label() {
      return translateUi("ui.c4e4e7abda206b07");
    },
    type: "string",
    section: "cacheManagement",
    get helpText() {
      return translateUi("ui.b2cfb555d84c702c");
    },
    redisType: null,
  },
  {
    name: "ttl",
    get label() {
      return translateUi("ui.19649d60fb11a6b1");
    },
    type: "float",
    section: "cacheManagement",
    get helpText() {
      return translateUi("ui.db7c7e98ab33ce5e");
    },
    redisType: null,
    rules: [numberRule],
  },
  {
    name: "max_connections",
    get label() {
      return translateUi("ui.a55f7a06fc215eef");
    },
    type: "integer",
    section: "cacheManagement",
    get helpText() {
      return translateUi("ui.2b42ecb526392728");
    },
    redisType: null,
    rules: [nonNegativeIntegerRule],
  },
  {
    name: "gcp_service_account",
    get label() {
      return translateUi("ui.17b16ffb52d73b96");
    },
    type: "string",
    section: "gcp",
    get helpText() {
      return translateUi("ui.5599f3dd3bd7dc59");
    },
    redisType: null,
  },
  {
    name: "gcp_ssl_ca_certs",
    get label() {
      return translateUi("ui.93c6fc5380d1df0c");
    },
    type: "string",
    section: "gcp",
    get helpText() {
      return translateUi("ui.f828b0677118b7d0");
    },
    redisType: null,
  },
];
