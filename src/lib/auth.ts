// Centralized auth-token storage.
//
// The token is kept in a cookie so the session survives the browser being
// closed and reopened — the user stays logged in until they explicitly log
// out. We also mirror it into localStorage because several pages already read
// `localStorage.getItem("auth_token")` directly; mirroring keeps those working
// without touching every file.

const TOKEN_KEY = "auth_token";

type JwtPayload = { exp?: number; [key: string]: unknown };

function decodeJwt(token: string): JwtPayload | null {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      window
        .atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

/** Returns the JWT expiry as a Date, or null if the token has no usable exp. */
function tokenExpiry(token: string): Date | null {
  const payload = decodeJwt(token);
  if (payload?.exp && Number.isFinite(payload.exp)) {
    return new Date(payload.exp * 1000);
  }
  return null;
}

/** Persist the token in a cookie (lasting until the JWT expires) + localStorage. */
export function setAuthToken(token: string): void {
  // Cookie lives until the JWT itself expires; fall back to 7 days (matches the
  // backend's token lifetime) if the token carries no exp claim.
  const expiry =
    tokenExpiry(token) ?? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const parts = [
    `${TOKEN_KEY}=${encodeURIComponent(token)}`,
    "path=/",
    `expires=${expiry.toUTCString()}`,
    "SameSite=Lax",
  ];
  // Only mark Secure over HTTPS so the cookie still works on http://localhost.
  if (typeof window !== "undefined" && window.location.protocol === "https:") {
    parts.push("Secure");
  }
  document.cookie = parts.join("; ");

  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // localStorage unavailable (e.g. private mode) — cookie alone is fine.
  }
}

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
}

/** Read the token from the cookie, falling back to localStorage. */
export function getAuthToken(): string | null {
  const fromCookie = readCookie(TOKEN_KEY);
  if (fromCookie) return fromCookie;
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

/** Remove the token from both the cookie and localStorage (logout). */
export function clearAuthToken(): void {
  document.cookie = `${TOKEN_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore
  }
}

/**
 * True when a non-expired token is present. An expired token is worthless
 * (the API rejects it), so we clear it here to avoid landing the user in a
 * "logged in but every request 401s" state.
 */
export function isAuthenticated(): boolean {
  const token = getAuthToken();
  if (!token) return false;

  const expiry = tokenExpiry(token);
  if (expiry && expiry.getTime() <= Date.now()) {
    clearAuthToken();
    return false;
  }
  return true;
}
