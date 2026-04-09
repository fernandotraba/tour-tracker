import type { Worker } from "@tour-tracker/shared";

const MCP_URL = process.env.TRABA_MCP_URL ?? "https://ops-prod.traba.tech/v1/mcp";
const CONSOLE_BASE = "https://console.traba.work/workers";

async function callMcp(toolName: string, args: Record<string, unknown>, token: string) {
  const res = await fetch(MCP_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "tools/call",
      params: { name: toolName, arguments: args },
      id: Date.now(),
    }),
  });

  if (!res.ok) throw new Error(`Traba API ${res.status}: ${await res.text()}`);

  const contentType = res.headers.get("content-type") ?? "";

  if (contentType.includes("text/event-stream")) {
    const text = await res.text();
    for (const line of text.split("\n").filter((l) => l.startsWith("data: "))) {
      try {
        const parsed = JSON.parse(line.slice(6)) as { result?: { content?: Array<{ text: string }> } };
        const txt = parsed.result?.content?.[0]?.text;
        if (txt) return JSON.parse(txt);
      } catch {}
    }
    throw new Error("Could not parse SSE response");
  }

  const data = (await res.json()) as { error?: { message: string }; result?: { content?: Array<{ text: string }> } };
  if (data.error) throw new Error(data.error.message);
  const txt = data.result?.content?.[0]?.text;
  if (!txt) throw new Error("Empty result from Traba API");
  return JSON.parse(txt);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatWorker(w: any): Worker {
  const bgc = w.backgroundCheck as { assessment?: string } | undefined;
  const assessment = bgc?.assessment ?? null;
  return {
    id: w.uid as string,
    name: `${w.firstName} ${w.lastName}`,
    firstName: w.firstName as string,
    lastName: w.lastName as string,
    email: (w.email as string) ?? "",
    phone: (w.phoneNumber as string) ?? "",
    photoUrl: (w.photoUrl as string) ?? "",
    consoleUrl: `${CONSOLE_BASE}/${w.uid}`,
    accountStatus: (w.accountStatus as string) ?? "",
    bgcClear: assessment === "ELIGIBLE",
    bgcLabel: assessment?.replace(/_/g, " ") ?? "Pending",
  };
}

export async function searchWorkers(query: string, token: string): Promise<Worker[]> {
  const digits = query.replace(/\D/g, "");
  const isPhone = digits.length >= 7 && /^[\d\s\-()+]+$/.test(query.trim());

  if (isPhone) {
    const e164 = `+1${digits.replace(/^1/, "")}`;
    const result = (await callMcp("get_worker", { phone: e164 }, token)) as { worker?: unknown };
    if (!result?.worker) return [];
    return [formatWorker(result.worker)];
  }

  const parts = query.trim().split(/\s+/);
  const args: Record<string, unknown> = { firstName: parts[0], limit: 8 };
  if (parts.length > 1) args.lastName = parts.slice(1).join(" ");

  const result = (await callMcp("raw_worker_search", args, token)) as { workers?: Array<{ id: string }> };
  if (!result?.workers?.length) return [];

  const profiles = await Promise.all(
    result.workers.slice(0, 5).map(async (w) => {
      try {
        const full = (await callMcp("get_worker", { id: w.id }, token)) as { worker?: unknown };
        return full?.worker ? formatWorker(full.worker) : null;
      } catch {
        return null;
      }
    })
  );

  return profiles.filter((p): p is Worker => p !== null);
}
