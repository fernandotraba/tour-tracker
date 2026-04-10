import { Hono } from "hono";
import { writeStartList } from "../lib/sheets.js";

const startList = new Hono();

const VALID_SHIFTS = ["Front Half", "Back Half", "Night Shift"];

startList.post("/", async (c) => {
  const body = (await c.req.json()) as {
    shift: string;
    workers: Array<{ name: string; email: string }>;
  };

  if (!VALID_SHIFTS.includes(body.shift)) {
    return c.json({ error: `Invalid shift. Must be one of: ${VALID_SHIFTS.join(", ")}` }, 400);
  }

  try {
    await writeStartList(body.shift, body.workers ?? []);
    return c.json({ ok: true, count: body.workers?.length ?? 0 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[start-list]", msg);
    return c.json({ error: msg }, 500);
  }
});

export default startList;
