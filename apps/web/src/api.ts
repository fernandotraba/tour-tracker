import { AUTH_KEY, clearSession } from "./auth";
import type { Worker, TourRecord, AuthResponse } from "@tour-tracker/shared";
import { IS_MOCK, MOCK_WORKERS, MOCK_RECORDS } from "./mock";

function getSession(): { token: string; googleToken?: string } | null {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    return raw ? (JSON.parse(raw) as { token: string; googleToken?: string }) : null;
  } catch {
    return null;
  }
}

async function apiFetch<T>(path: string, options?: RequestInit & { googleToken?: string }): Promise<T> {
  const session = getSession();
  const res = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}),
      ...(options?.googleToken ? { "X-Google-Token": options.googleToken } : {}),
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
  if (IS_MOCK) {
    await new Promise((r) => setTimeout(r, 400));
    return MOCK_WORKERS.filter((w) =>
      w.name.toLowerCase().includes(q.toLowerCase()) ||
      w.phone.includes(q)
    );
  }
  const session = getSession();
  const data = await apiFetch<{ workers: Worker[] }>(
    `/api/workers/search?q=${encodeURIComponent(q)}`,
    { googleToken: session?.googleToken }
  );
  return data.workers;
}

export async function getTourRecords(): Promise<TourRecord[]> {
  if (IS_MOCK) {
    await new Promise((r) => setTimeout(r, 300));
    return MOCK_RECORDS;
  }
  const data = await apiFetch<{ records: TourRecord[] }>("/api/tour-records");
  return data.records;
}

export async function createTourRecord(payload: Partial<TourRecord>): Promise<void> {
  if (IS_MOCK) {
    await new Promise((r) => setTimeout(r, 500));
    return;
  }
  await apiFetch("/api/tour-records", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function sendToStartList(
  shift: string,
  workers: Array<{ name: string; email: string }>
): Promise<{ count: number }> {
  if (IS_MOCK) {
    await new Promise((r) => setTimeout(r, 600));
    return { count: workers.length };
  }
  return apiFetch<{ count: number }>("/api/start-list", {
    method: "POST",
    body: JSON.stringify({ shift, workers }),
  });
}

export async function updateTourRecord(
  rowIndex: number,
  payload: Partial<TourRecord>
): Promise<void> {
  if (IS_MOCK) {
    await new Promise((r) => setTimeout(r, 400));
    return;
  }
  await apiFetch(`/api/tour-records/${rowIndex}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}
