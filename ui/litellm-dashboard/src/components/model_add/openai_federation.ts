import { t as translateUi } from "@/i18n";
import { isBlank, type FederationField } from "./federation_field";

const OPENAI_API_HOST = "api.openai.com";

export const OPENAI_FEDERATION_FIELDS: readonly FederationField[] = [
  {
    key: "openai_identity_provider_id",
    get label() {
      return translateUi("ui.d12fca22162e825c");
    },
    get tooltip() {
      return translateUi("ui.a0718e585f2f69ed");
    },
    required: false,
    control: "text",
  },
  {
    key: "openai_service_account_id",
    get label() {
      return translateUi("ui.bde626c5ca64a2b7");
    },
    get tooltip() {
      return translateUi("ui.e378d640794ca12e");
    },
    required: false,
    control: "text",
  },
  {
    key: "openai_identity_token_file",
    get label() {
      return translateUi("ui.1249f9e43e591cea");
    },
    get tooltip() {
      return translateUi("ui.85f6a3ccf0c75c8d");
    },
    placeholder: "/var/run/secrets/kubernetes.io/serviceaccount/token",
    required: false,
    control: "text",
  },
];

export const isOpenAIProvider = (provider: string | null | undefined): boolean => provider?.toLowerCase() === "openai";

const isOpenAIApiHost = (hostname: string): boolean =>
  hostname === OPENAI_API_HOST || hostname.endsWith(`.${OPENAI_API_HOST}`);

const targetsOpenAIApi = (apiBase: string): boolean => {
  const url = URL.canParse(apiBase) ? new URL(apiBase) : null;
  return url?.protocol === "https:" && isOpenAIApiHost(url.hostname);
};

export const validateOpenAIFederationApiBase = (value: unknown): string | true =>
  typeof value !== "string" || isBlank(value) || targetsOpenAIApi(value)
    ? true
    : `Workload identity federation only reaches the OpenAI API. Enter https://${OPENAI_API_HOST}/v1 or a regional *.${OPENAI_API_HOST} URL, or leave this empty`;
