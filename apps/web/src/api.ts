import { AUTH_KEY, clearSession } from "./auth";
import type { Worker, TourRecord, AuthResponse } from "@tour-tracker/shared";

function getToken(): string | null {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return null;
    return (JSON.parse(raw) as { token: string }).token;
  } catch {
    return null;
  }
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken();
  const res = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options?.headers ?? {}),
    },
  });

  if (res.status === 401) {
    clearSession();
    window.location.reload();
    throw new Error("Session expired");
  }

  const data = (await res.json()) as T & { error?: string };
  if ("error" in data && data.error) throw new Error(data.error);
  return data;
}

export async function verifyGoogleToken(accessToken: string): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/api/auth/verify", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export async function searchWorkers(q: string): Promise<Worker[]> {
  const data = await apiFetch<{ workers: Worker[] }>(
    `/api/workers/search?q=${encodeURIComponent(q)}`
  );
  return data.workers;
}

export async function getTourRecords(): Promise<TourRecord[]> {
  const data = await apiFetch<{ records: TourRecord[] }>("/api/tour-records");
  return data.records;
}

export async function createTourRecord(payload: Partial<TourRecord>): Promise<void> {
  await apiFetch("/api/tour-records", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateTourRecord(
  rowIndex: number,
  payload: Partial<TourRecord>
): Promise<void> {
  await apiFetch(`/api/tour-records/${rowIndex}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}
