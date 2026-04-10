import type { Worker } from "@tour-tracker/shared";

const TRABA_API = "https://prod.traba.tech/v1";
const CONSOLE_BASE = "https://console.traba.work/workers";

function getToken(userToken?: string): string {
  const token = userToken ?? process.env.TRABA_API_TOKEN;
  if (!token) throw new Error("No Traba token available. Set TRABA_API_TOKEN or pass user token.");
  return token.startsWith("Bearer ") ? token : `Bearer ${token}`;
}

async function trabaFetch<T>(path: string, token: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${TRABA_API}${path}`, {
    ...options,
    headers: {
      Authorization: token,
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string> ?? {}),
    },
  });
  if (!res.ok) throw new Error(`Traba API ${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatWorker(w: any): Worker {
  const bgc = (w.backgroundCheck ?? w.workerMetric?.backgroundCheck) as { assessment?: string } | undefined;
  const assessment = bgc?.assessment ?? null;
  const id = (w.id ?? w.uid) as string;
  return {
    id,
    name: `${w.firstName} ${w.lastName}`,
    firstName: w.firstName as string,
    lastName: w.lastName as string,
    email: (w.email as string) ?? "",
    phone: (w.phoneNumber as string) ?? "",
    photoUrl: (w.photoUrl as string) ?? "",
    consoleUrl: `${CONSOLE_BASE}/${id}`,
    accountStatus: (w.accountStatus as string) ?? "",
    bgcClear: assessment === "ELIGIBLE",
    bgcLabel: assessment?.replace(/_/g, " ") ?? "Pending",
  };
}

export async function searchWorkers(query: string, userToken?: string): Promise<Worker[]> {
  const token = getToken(userToken);

  const digits = query.replace(/\D/g, "");
  const isPhone = digits.length >= 7 && /^[\d\s\-()+]+$/.test(query.trim());

  if (isPhone) {
    const phoneNumber = digits.length === 10 ? `+1${digits}` : `+${digits}`;
    const body = {
      parameters: { phoneNumber, accountStatuses: ["APPROVED"] },
      includes: { workerMetric: true },
      select: {
        accountStatus: ["accountStatus"],
        worker: ["id", "firstName", "lastName", "phoneNumber", "photoUrl"],
      },
      withCount: true,
    };
    const data = await trabaFetch<{ workers?: unknown[] }>(
      "/workers/search?startAt=0&limit=5&orderBy=firstName&sortOrder=asc",
      token,
      { method: "POST", body: JSON.stringify(body) }
    );
    return (data.workers ?? []).map(formatWorker);
  }

  const parts = query.trim().split(/\s+/);
  const body: Record<string, unknown> = {
    parameters: {
      firstName: parts[0],
      ...(parts.length > 1 && { lastName: parts.slice(1).join(" ") }),
      accountStatuses: ["APPROVED"],
    },
    includes: { workerMetric: true },
    select: {
      accountStatus: ["accountStatus"],
      worker: ["id", "firstName", "lastName", "phoneNumber", "photoUrl"],
    },
    withCount: true,
  };

  const data = await trabaFetch<{ workers?: unknown[] }>(
    "/workers/search?startAt=0&limit=8&orderBy=firstName&sortOrder=asc",
    token,
    { method: "POST", body: JSON.stringify(body) }
  );
  return (data.workers ?? []).map(formatWorker);
}
