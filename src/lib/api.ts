const BASE_URL = "https://api.cybershield.tecisfun.cloud";
const AUTH_BASE_URL = "https://cybershield.tecisfun.cloud";

export type DashboardScannedUrlItem = {
  url: string;
  score: number;
};

/** GET /api/Dashboard/all-scanned-urls — recent URL checks with scores */
export async function dashboardAllScannedUrls(token?: string | null) {
  const headers: HeadersInit = { Accept: "*/*" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE_URL}/api/Dashboard/all-scanned-urls`, { headers });
  const contentType = res.headers.get("content-type") || "";
  let data: DashboardScannedUrlItem[] = [];
  if (contentType.includes("application/json")) {
    const raw = await res.json();
    data = Array.isArray(raw)
      ? (raw as DashboardScannedUrlItem[]).filter(
          (row) => typeof row?.url === "string" && typeof row?.score === "number"
        )
      : [];
  }
  return { status: res.status, ok: res.ok, data };
}

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

export type ConfirmEmailResponse = {
  message?: string;
  success?: boolean;
};

/** GET /api/auth/confirm-email?userId=...&token=... (no auth header, no body) */
export async function confirmEmail(userId: string, token: string) {
  const url = `${AUTH_BASE_URL}/api/auth/confirm-email?userId=${encodeURIComponent(userId)}&token=${encodeURIComponent(token)}`;
  const headers: HeadersInit = { Accept: "*/*" };
  const res = await fetch(url, { method: "GET", headers });
  const contentType = res.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? ((await res.json()) as ConfirmEmailResponse)
    : null;
  return { status: res.status, ok: res.ok, data };
}

export type ValidateResetTokenResponse = {
  message?: string;
  success?: boolean;
};

/** GET /api/auth/validate-reset-token?email=...&token=... (no auth header needed) */
export async function validateResetToken(email: string, token: string) {
  const url = `${AUTH_BASE_URL}/api/auth/validate-reset-token?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`;
  const headers: HeadersInit = { Accept: "*/*" };
  const res = await fetch(url, { method: "GET", headers });
  const contentType = res.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? ((await res.json()) as ValidateResetTokenResponse)
    : null;
  return { status: res.status, ok: res.ok, data };
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

/** --- Triage (deep URL analysis) --- */

export type TriageSubmitUrlResponse = {
  success?: boolean;
  message?: string;
  sampleId?: string;
  alreadyCached?: boolean;
  analysis?: { score?: number; tags?: string[] };
  sample?: { id?: string; target?: string; score?: number; created?: string; completed?: string };
  signatures?: unknown;
  build?: string;
};

export type TriageSampleStatusResponse = {
  success?: boolean;
  sampleId?: string;
  status?: string;
  score?: number;
  message?: string;
};

export type TriageOverviewResponse = {
  success?: boolean;
  sampleId?: string;
  score?: number;
  severity?: string;
  target?: string;
  tags?: string[];
  highRiskSignatures?: { name: string; score: number; description?: string }[];
  message?: string;
};

export type TriageHistoryScan = {
  url: string;
  sampleId: string;
  status: string;
  score?: number;
  severity?: string;
  scannedAt: string;
};

export function triageExtractSampleId(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const o = data as Record<string, unknown>;
  if (typeof o.sampleId === "string") return o.sampleId;
  const s = o.sample;
  if (s && typeof s === "object" && s !== null && "id" in s) {
    return String((s as { id: unknown }).id);
  }
  return null;
}

/** POST /api/Triage/url?url= — Bearer required */
export async function triageSubmitUrl(targetUrl: string, token: string) {
  const url = `${BASE_URL}/api/Triage/url?url=${encodeURIComponent(targetUrl)}`;
  const res = await fetch(url, { method: "POST", headers: { ...authHeaders(token) } });
  const contentType = res.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? ((await res.json()) as TriageSubmitUrlResponse)
    : null;
  return { status: res.status, ok: res.ok, data };
}

/** GET /api/Triage/sample/{id} — no auth */
export async function triageSampleStatus(sampleId: string) {
  const res = await fetch(`${BASE_URL}/api/Triage/sample/${encodeURIComponent(sampleId)}`);
  const contentType = res.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? ((await res.json()) as TriageSampleStatusResponse)
    : null;
  return { status: res.status, ok: res.ok, data };
}

/** GET /api/Triage/sample/{id}/overview — no auth */
export async function triageSampleOverview(sampleId: string) {
  const res = await fetch(`${BASE_URL}/api/Triage/sample/${encodeURIComponent(sampleId)}/overview`);
  const contentType = res.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? ((await res.json()) as TriageOverviewResponse)
    : null;
  return { status: res.status, ok: res.ok, data };
}

/** GET /api/Triage/my-history — Bearer required */
export async function triageMyHistory(token: string) {
  const res = await fetch(`${BASE_URL}/api/Triage/my-history`, {
    headers: { ...authHeaders(token) },
  });
  const contentType = res.headers.get("content-type") || "";
  let scans: TriageHistoryScan[] = [];
  if (contentType.includes("application/json")) {
    const raw = (await res.json()) as { scans?: TriageHistoryScan[] };
    scans = Array.isArray(raw.scans) ? raw.scans : [];
  }
  return { status: res.status, ok: res.ok, data: scans };
}

export type TriageReportView = {
  sampleId: string;
  target?: string;
  score?: number;
  severity?: string;
  tags?: string[];
  signatures: { name: string; score?: number; description?: string }[];
};

/** --- Container scanning API --- */
export type ContainerStartScanBody = {
  image: string;
  tag?: string | null;
  source?: string | null;
  dockerImageId?: string | null;
  repositoryId?: string | null;
};

export type ContainerStartScanResponse = {
  message?: string;
  imageName?: string;
  status?: string;
  progress?: number;
  id?: string;
  summaryId?: string;
};

export async function containerStartScan(body: ContainerStartScanBody, token: string) {
  const res = await fetch(`${BASE_URL}/api/Container/start-scan`, {
    method: "POST",
    headers: { ...authHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const contentType = res.headers.get("content-type") || "";
  const data = contentType.includes("application/json") ? await res.json() : null;
  return { status: res.status, ok: res.ok, data } as { status: number; ok: boolean; data: ContainerStartScanResponse | null };
}

export type ContainerHistoryItem = {
  id?: string;
  name?: string; // image name
  tag?: string | null;
  status?: string;
  progres?: number | null; // sometimes spelled progres/progress
  progress?: number | null;
  summaryId?: string | null;
};

export async function containerHistory(token: string) {
  const res = await fetch(`${BASE_URL}/api/Container/my-history`, {
    headers: { ...authHeaders(token) },
  });
  const contentType = res.headers.get("content-type") || "";
  let data: ContainerHistoryItem[] = [];
  if (contentType.includes("application/json")) {
    const raw = await res.json();
    data = Array.isArray(raw) ? raw : raw?.data ?? [];
  }
  return { status: res.status, ok: res.ok, data } as { status: number; ok: boolean; data: ContainerHistoryItem[] };
}

export type ImageSummary = {
  id?: string;
  imageName?: string;
  startedAt?: string;
  finishedAt?: string;
  totalVulnerabilities?: number;
  criticalVulnerabilities?: number;
  highetVulnerabilities?: number;
  mediumVulnerabilities?: number;
  lowetVulnerabilities?: number;
  vulnerabilities?: Array<Record<string, unknown>>;
};

export async function containerImageSummary(imageName: string, token: string) {
  const url = `${BASE_URL}/api/Container/image-summary?imagename=${encodeURIComponent(imageName)}`;
  const res = await fetch(url, { headers: { ...authHeaders(token) } });
  const contentType = res.headers.get("content-type") || "";
  const data = contentType.includes("application/json") ? await res.json() : null;
  return { status: res.status, ok: res.ok, data } as { status: number; ok: boolean; data: ImageSummary | null };
}

/** Normalize POST body when API returns full analysis (alternate response shape). */
export function triageReportFromSubmitPayload(data: unknown): TriageReportView | null {
  if (!data || typeof data !== "object") return null;
  const o = data as TriageSubmitUrlResponse;
  const sampleId = triageExtractSampleId(data);
  if (!sampleId) return null;
  const analysis = o.analysis;
  const sample = o.sample;
  const sigs = o.signatures;
  const names: { name: string; score?: number; description?: string }[] = [];
  if (Array.isArray(sigs)) {
    for (const s of sigs) {
      if (typeof s === "string") {
        names.push({ name: s });
        continue;
      }
      if (s && typeof s === "object") {
        const x = s as Record<string, unknown>;
        const name = String(x.name ?? x.label ?? x.title ?? "Signature");
        names.push({
          name,
          score: typeof x.score === "number" ? x.score : undefined,
          description:
            typeof x.description === "string"
              ? x.description
              : typeof x.desc === "string"
                ? x.desc
                : undefined,
        });
      }
    }
  }
  const hasAnalysis = Boolean(analysis && (analysis.score != null || (analysis.tags && analysis.tags.length)));
  const hasSample = Boolean(sample && (sample.target || sample.score != null));
  if (!hasAnalysis && !hasSample && names.length === 0) return null;
  return {
    sampleId,
    target: sample?.target,
    score: analysis?.score ?? sample?.score,
    severity: undefined,
    tags: analysis?.tags,
    signatures: names,
  };
}

export function triageReportFromOverview(data: TriageOverviewResponse | null, sampleId: string): TriageReportView | null {
  if (!data) return null;
  const sigs = data.highRiskSignatures ?? [];
  return {
    sampleId: data.sampleId ?? sampleId,
    target: data.target,
    score: data.score,
    severity: data.severity,
    tags: data.tags,
    signatures: sigs.map((s) => ({
      name: s.name,
      score: s.score,
      description: s.description,
    })),
  };
}

export const API = {
  BASE_URL,
  dashboardAllScannedUrls,
  register,
  login,
  forgotPassword,
  resetPassword,
  confirmEmail,
  validateResetToken,
  inspectPassword,
  webScanStart,
  webScanHistory,
  webScanStatus,
  webScanReport,
  urlExpanderExtract,
  urlExpanderMyHistory,
  triageSubmitUrl,
  triageSampleStatus,
  triageSampleOverview,
  triageMyHistory,
  containerStartScan,
  containerHistory,
  containerImageSummary,
};

export default API;
