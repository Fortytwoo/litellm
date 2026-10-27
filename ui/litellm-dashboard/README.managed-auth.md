# Managed console authentication

The managed dashboard authenticates through the BFF HttpOnly cookie. A successful `/admin/api/me` identifies the user; snapshot permissions and UI configuration determine whether dashboard consumers may mount. Only HTTP 401 clears the session marker and allows the login redirect.

HTTP 403 displays an access denial. Network and service failures display an unavailable state. Both keep protected consumers unmounted and offer an explicit refresh. A snapshot or configuration failure never grants an administrator role. An aborted initialization cannot resume configuration loading or update authentication state.

The managed UI configuration loader preserves non-success HTTP status codes before updating runtime URLs. Native dashboard authentication remains separate. Regression coverage is in `src/contexts/AuthContext.managed.test.tsx`.
