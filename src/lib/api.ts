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

export const API = { BASE_URL, register, login, forgotPassword, resetPassword };

export default API;
