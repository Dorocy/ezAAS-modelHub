/**
 * API stub functions — replace with real implementations when backend is connected.
 * Imported by AuthContext, SendResetLinkForm, reset-password page.
 */

import type { AuthTokenData } from "@/types/auth";

const API_BASE =
  (process.env.NEXT_PUBLIC_AAS_API_BASE ?? "") +
  (process.env.NEXT_PUBLIC_AAS_API_PORT ?? "");

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(body || res.statusText);
  }
  return res.json();
}

export async function loginWithCredentials(
  email: string,
  password: string
): Promise<AuthTokenData> {
  return request<AuthTokenData>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function signUp(email: string, password: string): Promise<void> {
  await request("/auth/signup", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function sendPasswordResetEmail(email: string): Promise<void> {
  await request("/auth/password-reset", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function resetPassword(
  token: string,
  password: string
): Promise<void> {
  await request("/auth/password-reset/confirm", {
    method: "POST",
    body: JSON.stringify({ token, password }),
  });
}
