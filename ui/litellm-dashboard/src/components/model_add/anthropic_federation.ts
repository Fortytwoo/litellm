import { t as translateUi } from "@/i18n";
import { isMaskedSecret } from "@/utils/maskedSecretUtils";
import { isBlank, type FederationField } from "./federation_field";

export type IdentitySourceId =
  | "token_file"
  | "secret_reference"
  | "internal_issuer"
  | "keycloak"
  | "environment"
  | "unrecognized";

export interface IdentitySource {
  readonly id: IdentitySourceId;
  readonly label: string;
  readonly fixedValues: Readonly<Record<string, string>>;
  readonly fields: readonly FederationField[];
}

export const MAX_ISSUER_TTL_SECONDS = 3600;

const IDENTITY_SOURCE_KEY = "anthropic_identity_source";
const ACCEPTED_REFERENCE_PREFIX = "oidc/";
const REJECTED_REFERENCE_PREFIX = "oidc/env_path/";

export const FEDERATION_CORE_FIELDS: readonly FederationField[] = [
  {
    key: "anthropic_federation_rule_id",
    get label() {
      return translateUi("ui.96f516689b6167de");
    },
    get tooltip() {
      return translateUi("ui.b1a593180664247b");
    },
    placeholder: "fdrl_...",
    required: false,
    control: "text",
  },
  {
    key: "anthropic_organization_id",
    get label() {
      return translateUi("ui.1f466322634e2d85");
    },
    get tooltip() {
      return translateUi("ui.02565e7ebd2fcbea");
    },
    required: false,
    control: "text",
  },
  {
    key: "anthropic_service_account_id",
    get label() {
      return translateUi("ui.bde626c5ca64a2b7");
    },
    get tooltip() {
      return translateUi("ui.58798538aa35a88e");
    },
    placeholder: "svac_...",
    required: false,
    control: "text",
  },
  {
    key: "anthropic_federation_workspace_id",
    get label() {
      return translateUi("ui.889d892993c3e5f0");
    },
    get tooltip() {
      return translateUi("ui.df3e0f730c3d7e90");
    },
    placeholder: "wrkspc_...",
    required: false,
    control: "text",
  },
];

export const IDENTITY_SOURCES: readonly IdentitySource[] = [
  {
    id: "token_file",
    get label() {
      return translateUi("ui.2ef829cd71fbffe8");
    },
    fixedValues: {},
    fields: [
      {
        key: "anthropic_identity_token_file",
        get label() {
          return translateUi("ui.1249f9e43e591cea");
        },
        get tooltip() {
          return translateUi("ui.5eb008993c1d901e");
        },
        placeholder: "/var/run/secrets/anthropic/token",
        required: true,
        control: "text",
      },
    ],
  },
  {
    id: "secret_reference",
    get label() {
      return translateUi("ui.5c53c74375c7e5e4");
    },
    fixedValues: {},
    fields: [
      {
        key: "anthropic_identity_token",
        get label() {
          return translateUi("ui.86c83dea48d1b9ba");
        },
        get tooltip() {
          return translateUi("ui.7823cabf7f7893e0");
        },
        get placeholder() {
          return translateUi("ui.290d737c6b981cf6");
        },
        required: true,
        control: "text",
      },
    ],
  },
  {
    id: "internal_issuer",
    get label() {
      return translateUi("ui.24890fc3eeb97d04");
    },
    fixedValues: { [IDENTITY_SOURCE_KEY]: "internal_issuer" },
    fields: [
      {
        key: "anthropic_issuer_url",
        get label() {
          return translateUi("ui.4d03ba8a838fb2de");
        },
        get tooltip() {
          return translateUi("ui.2acb6da9afd5be34");
        },
        placeholder: "https://litellm.example.com",
        required: true,
        control: "text",
      },
      {
        key: "anthropic_issuer_subject",
        get label() {
          return translateUi("ui.68971283841aecdf");
        },
        get tooltip() {
          return translateUi("ui.a800aa475b6bbfb0");
        },
        required: true,
        control: "text",
      },
      {
        key: "anthropic_issuer_audience",
        get label() {
          return translateUi("ui.545c02357695a6ff");
        },
        get tooltip() {
          return translateUi("ui.3f467a5477eea466");
        },
        required: false,
        control: "text",
      },
      {
        key: "anthropic_issuer_ttl_seconds",
        get label() {
          return translateUi("ui.6265f9b6123ce932");
        },
        get tooltip() {
          return translateUi("ui.a5cdc431db5390e2", undefined, { v0: String(MAX_ISSUER_TTL_SECONDS) });
        },
        required: false,
        control: "integer",
      },
      {
        key: "anthropic_issuer_signing_key_ref",
        get label() {
          return translateUi("ui.1bafc0fb33840f21");
        },
        get tooltip() {
          return translateUi("ui.7e52a277419f73af");
        },
        placeholder: "os.environ/ANTHROPIC_ISSUER_SIGNING_KEY",
        required: true,
        control: "text",
      },
    ],
  },
  {
    id: "keycloak",
    get label() {
      return translateUi("ui.e02d1f63a7bcb7ab");
    },
    fixedValues: { [IDENTITY_SOURCE_KEY]: "keycloak" },
    fields: [
      {
        key: "anthropic_keycloak_token_url",
        get label() {
          return translateUi("ui.e8486d1c522a44a0");
        },
        get tooltip() {
          return translateUi("ui.d0722b1482300f50");
        },
        placeholder: "https://keycloak.example.com/realms/<realm>/protocol/openid-connect/token",
        required: true,
        control: "text",
      },
      {
        key: "anthropic_keycloak_client_id",
        get label() {
          return translateUi("ui.6d364b1ba8855d35");
        },
        get tooltip() {
          return translateUi("ui.46dab1a0e40a7bd5");
        },
        required: true,
        control: "text",
      },
      {
        key: "anthropic_keycloak_client_secret_ref",
        get label() {
          return translateUi("ui.5e4731de7a91a71c");
        },
        get tooltip() {
          return translateUi("ui.4ae01bfda1d3f746");
        },
        placeholder: "os.environ/KEYCLOAK_CLIENT_SECRET",
        required: true,
        control: "text",
      },
      {
        key: "anthropic_keycloak_auth_method",
        get label() {
          return translateUi("ui.9d1f1da0231b57c4");
        },
        get tooltip() {
          return translateUi("ui.127962c1659a7cbe");
        },
        required: false,
        control: "select",
        options: ["client_secret_basic", "client_secret_post"],
      },
      {
        key: "anthropic_keycloak_scope",
        get label() {
          return translateUi("ui.b073f6c68ef87211");
        },
        get tooltip() {
          return translateUi("ui.383c67a09f620876");
        },
        required: false,
        control: "text",
      },
    ],
  },
  {
    id: "environment",
    get label() {
      return translateUi("ui.c58ee02afdc93d88");
    },
    fixedValues: {},
    fields: [],
  },
];

export const DEFAULT_IDENTITY_SOURCE: IdentitySourceId = "token_file";

const IDENTITY_SOURCE_VALUE_KEYS: readonly string[] = [
  IDENTITY_SOURCE_KEY,
  ...IDENTITY_SOURCES.flatMap((source) => source.fields.map((field) => field.key)),
];

export const ANTHROPIC_FEDERATION_FIELDS: readonly FederationField[] = [
  ...FEDERATION_CORE_FIELDS,
  ...IDENTITY_SOURCES.flatMap((source) => source.fields),
];

export const ANTHROPIC_FEDERATION_VALUE_KEYS: readonly string[] = [
  ...FEDERATION_CORE_FIELDS.map((field) => field.key),
  ...IDENTITY_SOURCE_VALUE_KEYS,
];

const UNRECOGNIZED_IDENTITY_SOURCE: IdentitySource = { id: "unrecognized", label: "", fixedValues: {}, fields: [] };

export const identitySourceById = (id: IdentitySourceId): IdentitySource =>
  IDENTITY_SOURCES.find((source) => source.id === id) ?? UNRECOGNIZED_IDENTITY_SOURCE;

export const isAnthropicProvider = (provider: string | null | undefined): boolean =>
  provider !== null && provider !== undefined && provider.toLowerCase() === "anthropic";

export const inferIdentitySource = (credentialValues: Record<string, unknown> | null | undefined): IdentitySourceId => {
  const values = credentialValues ?? {};
  const declared = values[IDENTITY_SOURCE_KEY];
  if (!isBlank(declared)) {
    return (
      IDENTITY_SOURCES.find((source) => source.fixedValues[IDENTITY_SOURCE_KEY] === declared)?.id ?? "unrecognized"
    );
  }
  if (!isBlank(values.anthropic_identity_token_file)) {
    return "token_file";
  }
  if (!isBlank(values.anthropic_identity_token)) {
    return "secret_reference";
  }
  return "environment";
};

export const identitySourceOptions = (
  storedValues: Record<string, unknown>,
): readonly { value: IdentitySourceId; label: string }[] => [
  ...(inferIdentitySource(storedValues) === "unrecognized"
    ? [
        {
          value: "unrecognized" as const,
          get label() {
            return translateUi("ui.caeaf47f1e79848e", undefined, {
              v0: String(String(storedValues[IDENTITY_SOURCE_KEY])),
            });
          },
        },
      ]
    : []),
  ...IDENTITY_SOURCES.map((source) => ({ value: source.id, label: source.label })),
];

export const validateFederationValueStored =
  (identitySource: IdentitySourceId) =>
  (_value: unknown, formValues: Record<string, unknown>): string | true =>
    identitySource === "environment" && FEDERATION_CORE_FIELDS.every((field) => isBlank(formValues[field.key]))
      ? "Enter at least one of these ids, or pick an identity source that stores a token. The proxy rejects a credential with no values"
      : true;

export const validateIdentityTokenReference = (value: unknown): string | true => {
  if (typeof value !== "string" || isBlank(value) || isMaskedSecret(value)) {
    return true;
  }
  return value.startsWith(ACCEPTED_REFERENCE_PREFIX) && !value.startsWith(REJECTED_REFERENCE_PREFIX)
    ? true
    : "Enter an oidc/ secret reference such as oidc/env/VAR_NAME. Raw tokens and oidc/env_path/ references are not accepted";
};

export const validateIssuerTtlSeconds = (value: unknown): string | true => {
  if (isBlank(value)) {
    return true;
  }
  const seconds = Number(value);
  return Number.isInteger(seconds) && seconds >= 1 && seconds <= MAX_ISSUER_TTL_SECONDS
    ? true
    : `Enter a whole number of seconds from 1 to ${MAX_ISSUER_TTL_SECONDS}`;
};

export const otherIdentitySourceKeys = (identitySource: IdentitySourceId): readonly string[] => {
  const source = identitySourceById(identitySource);
  const kept = new Set([...source.fields.map((field) => field.key), ...Object.keys(source.fixedValues)]);
  return IDENTITY_SOURCE_VALUE_KEYS.filter((key) => !kept.has(key));
};
