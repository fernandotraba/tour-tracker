import { Hono } from "hono";
import { searchWorkers } from "../lib/traba.js";

const workers = new Hono();

workers.get("/search", async (c) => {
  const q = c.req.query("q");
  if (!q || q.trim().length < 2) return c.json({ workers: [] });
  // Forward the user's Google token from the frontend for per-user Traba API auth.
  // Falls back to TRABA_API_TOKEN env var if header is absent (local dev).
  const userToken = c.req.header("X-Google-Token") ?? undefined;
  try {
    const results = await searchWorkers(q.trim(), userToken);
    return c.json({ workers: results });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[workers/search]", msg);
    return c.json({ error: msg }, 500);
  }
});

export default workers;
