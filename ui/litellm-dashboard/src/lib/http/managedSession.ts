/** Non-secret UI readiness marker. Authentication always uses the BFF HttpOnly cookie. */
export const COOKIE_SESSION = "managed-cookie-session";
let csrf = "";
export function setManagedCsrf(value: string): void {
  csrf = value;
}

/** Route native dashboard APIs through the same-origin, permission-checking BFF. */
export async function managedRequest(request: Request): Promise<Request> {
  if (process.env.NEXT_PUBLIC_MANAGED_GATEWAY !== "1") return request;
  const url = new URL(request.url);
  const origin = globalThis.location?.origin;
  if (origin && url.origin !== origin) throw new Error("Managed gateway requests require the page origin");
  const headers = new Headers(request.headers);
  headers.delete("authorization");
  if (!["GET", "HEAD"].includes(request.method)) headers.set("x-csrf-token", csrf);
  if (!url.pathname.startsWith("/admin/api/") && !url.pathname.startsWith("/admin/native/"))
    url.pathname = "/admin/native" + url.pathname;
  return new Request(url, {
    method: request.method,
    headers,
    body: request.body ? await request.arrayBuffer() : null,
    signal: request.signal,
    credentials: "same-origin",
    redirect: "error",
  });
}

export const managedFetch: typeof fetch = async (input, init) => {
  if (process.env.NEXT_PUBLIC_MANAGED_GATEWAY !== "1") return globalThis.fetch(input, init);
  const target = input instanceof Request ? input : new URL(String(input), globalThis.location?.origin).toString();
  return globalThis.fetch(await managedRequest(new Request(target, init)));
};
