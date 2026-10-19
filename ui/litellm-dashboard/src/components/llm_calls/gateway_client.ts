import OpenAI, { type ClientOptions } from "openai";
import { getProxyBaseUrl } from "@/components/networking";
import { getAuthHeaderName } from "@/lib/http/runtime";
import { managedFetch } from "@/lib/http/managedSession";

type GatewayClientOptions = Pick<ClientOptions, "baseURL" | "defaultHeaders" | "fetch" | "maxRetries" | "timeout"> & {
  accessToken: string;
};

export function createGatewayClient({ accessToken, ...options }: GatewayClientOptions): OpenAI {
  const authHeader = getAuthHeaderName();
  const config: ClientOptions = {
    ...options,
    ...(process.env.NEXT_PUBLIC_MANAGED_GATEWAY === "1" ? { fetch: managedFetch, maxRetries: 0 } : {}),
    apiKey: accessToken,
    baseURL: options.baseURL || getProxyBaseUrl(),
    dangerouslyAllowBrowser: true,
    defaultHeaders: {
      Authorization: null,
      [authHeader]: `Bearer ${accessToken}`,
      ...options.defaultHeaders,
    },
  };
  return new OpenAI.OpenAI(config);
}
