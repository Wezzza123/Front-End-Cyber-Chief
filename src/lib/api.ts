const BASE_URL = "http://147.93.55.224:8181";

async function post(path: string, body: any) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const contentType = res.headers.get("content-type") || "";
  const data = contentType.includes("application/json") ? await res.json() : null;

  // Return both status and parsed data so callers can make decisions
  return { status: res.status, ok: res.ok, data };
}


export async function register(firstName: string, lastName: string, email: string, password: string) {
  return post("/api/Auth/register", { firstName, lastName, email, password });
}

export async function login(email: string, password: string) {
  return post("/api/Auth/login", { email, password });
}

export async function forgotPassword(email: string) {
  return post("/api/Auth/forgot-password", { email });
}

export async function resetPassword(email: string, token: string, newPassword: string) {
  return post("/api/Auth/reset-password", { email, token, newPassword });
}

// Request OTP for email (endpoint expects email as query param; using POST with query)
export async function requestOtpForEmail(email: string) {
  const url = `/api/Security/request-otp-for-email?email=${encodeURIComponent(email)}`;
  return post(url, {});
}

// Verify OTP and check breaches (GET with query params)
export async function verifyAndCheck(email: string, otp: string) {
  const url = `${BASE_URL}/api/Security/verify-and-check?email=${encodeURIComponent(email)}&otp=${encodeURIComponent(otp)}`;
  const res = await fetch(url, { method: "GET" });
  const contentType = res.headers.get("content-type") || "";
  const data = contentType.includes("application/json") ? await res.json() : null;
  return { status: res.status, ok: res.ok, data };
}

/** GET /api/Security/inspect-password?password=... */
export type PasswordInspectResponse = {
  maskedPassword?: string;
  score?: number;
  scoreText?: string;
  entropyBits?: number;
  crackTimeSeconds?: number;
  crackTimeDisplay?: string;
  pwnedCount?: number;
  isPwned?: boolean;
  summary?: string;
};

export async function inspectPassword(password: string, token?: string | null) {
  const url = `${BASE_URL}/api/Security/inspect-password?password=${encodeURIComponent(password)}`;
  const headers: HeadersInit = { Accept: "*/*" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(url, { method: "GET", headers });
  const contentType = res.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? ((await res.json()) as PasswordInspectResponse)
    : null;
  return { status: res.status, ok: res.ok, data };
}

export type WebScanHistoryItem = {
  target: string;
  status: string;
  createdAt: string;
};

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` } as const;
}

/** POST /api/WebScan/start?request=<url> — requires Bearer token. May return cached completed scans. */
export type WebScanStartResponse = {
  scan_id?: string;
  status?: string;
  cached?: boolean;
  message?: string;
};

export async function webScanStart(requestUrl: string, token: string) {
  const url = `${BASE_URL}/api/WebScan/start?request=${encodeURIComponent(requestUrl)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { ...authHeaders(token) },
  });
  const contentType = res.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? ((await res.json()) as WebScanStartResponse)
    : null;
  return { status: res.status, ok: res.ok, data };
}

function normalizeHistoryPayload(raw: unknown): WebScanHistoryItem[] {
  if (Array.isArray(raw)) return raw as WebScanHistoryItem[];
  if (raw && typeof raw === "object") {
    const o = raw as Record<string, unknown>;
    for (const key of ["data", "items", "results", "history", "scans"]) {
      const v = o[key];
      if (Array.isArray(v)) return v as WebScanHistoryItem[];
    }
  }
  return [];
}

/** GET /api/WebScan/my-history — Bearer token only; no query params (API docs). */
export async function webScanHistory(token: string) {
  const res = await fetch(`${BASE_URL}/api/WebScan/my-history`, {
    headers: { ...authHeaders(token) },
  });
  const contentType = res.headers.get("content-type") || "";
  let data: WebScanHistoryItem[] = [];
  if (contentType.includes("application/json")) {
    const raw = await res.json();
    data = normalizeHistoryPayload(raw);
  }
  return { status: res.status, ok: res.ok, data };
}

/** GET /api/WebScan/status?target=<url> */
export async function webScanStatus(target: string, token: string) {
  const url = `${BASE_URL}/api/WebScan/status?target=${encodeURIComponent(target)}`;
  const res = await fetch(url, { headers: { ...authHeaders(token) } });
  const contentType = res.headers.get("content-type") || "";
  const raw =
    contentType.includes("application/json") ? await res.json() : await res.text();
  const status =
    typeof raw === "string"
      ? raw
      : raw && typeof raw === "object" && "status" in raw
        ? String((raw as { status: unknown }).status)
        : null;
  return { status: res.status, ok: res.ok, scanStatus: status, raw };
}

/** GET /api/WebScan/report?target=<url> — PDF blob */
export async function webScanReport(target: string, token: string) {
  const url = `${BASE_URL}/api/WebScan/report?target=${encodeURIComponent(target)}`;
  const res = await fetch(url, { headers: { ...authHeaders(token) } });
  const blob = res.ok ? await res.blob() : null;
  return { status: res.status, ok: res.ok, blob };
}

/** UrlExpander (shallow scan) — API shapes use PascalCase in JSON */
export type UrlExpanderSecurityAnalysis = {
  IsSafe?: boolean;
  ThreatLevel?: string;
  Message?: string;
  Warnings?: string[];
  RedFlags?: string[];
  WarningCount?: number;
  RedFlagCount?: number;
};

export type UrlExpanderExtractResult = {
  Status?: string;
  OriginalURL?: string;
  ExpandedURL?: string;
  RedirectChain?: string[];
  RedirectCount?: number;
  SecurityAnalysis?: UrlExpanderSecurityAnalysis;
  ProcessedAt?: string;
};

export type UrlExpanderHistoryItem = {
  url: string;
  analyzedAt: string;
  result: UrlExpanderExtractResult;
};

/** GET /api/UrlExpander/extract?url=<url> */
export async function urlExpanderExtract(targetUrl: string, token: string) {
  const url = `${BASE_URL}/api/UrlExpander/extract?url=${encodeURIComponent(targetUrl)}`;
  const res = await fetch(url, { headers: { ...authHeaders(token) } });
  const contentType = res.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? ((await res.json()) as UrlExpanderExtractResult)
    : null;
  return { status: res.status, ok: res.ok, data };
}

/** GET /api/UrlExpander/my-history — Bearer token only */
export async function urlExpanderMyHistory(token: string) {
  const res = await fetch(`${BASE_URL}/api/UrlExpander/my-history`, {
    headers: { ...authHeaders(token) },
  });
  const contentType = res.headers.get("content-type") || "";
  let data: UrlExpanderHistoryItem[] = [];
  if (contentType.includes("application/json")) {
    const raw = await res.json();
    data = Array.isArray(raw) ? (raw as UrlExpanderHistoryItem[]) : [];
  }
  return { status: res.status, ok: res.ok, data };
}

export const API = {
  BASE_URL,
  register,
  login,
  forgotPassword,
  resetPassword,
  inspectPassword,
  webScanStart,
  webScanHistory,
  webScanStatus,
  webScanReport,
  urlExpanderExtract,
  urlExpanderMyHistory,
};

export default API;
