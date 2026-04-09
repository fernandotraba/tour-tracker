import { Hono } from "hono";
import { searchWorkers } from "../lib/traba.js";

const workers = new Hono();

workers.get("/search", async (c) => {
  const q = c.req.query("q");
  if (!q || q.trim().length < 2) return c.json({ workers: [] });
  const googleToken = c.req.header("X-Google-Token");
  if (!googleToken) return c.json({ error: "Missing Google token" }, 401);
  const results = await searchWorkers(q.trim(), googleToken);
  return c.json({ workers: results });
});

export default workers;
