import { Hono } from "hono";
import { searchWorkers } from "../lib/traba.js";

const workers = new Hono();

workers.get("/search", async (c) => {
  const q = c.req.query("q");
  if (!q || q.trim().length < 2) return c.json({ workers: [] });
  const results = await searchWorkers(q.trim());
  return c.json({ workers: results });
});

export default workers;
