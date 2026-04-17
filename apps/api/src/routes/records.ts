import { Hono } from "hono";
import { readAllRecords, appendRecord, updateCells } from "../lib/sheets.js";
import { upsertRecord, updateRecord } from "../lib/db.js";
import type { TourRecord } from "@tour-tracker/shared";

const records = new Hono();

records.get("/", async (c) => {
  const data = await readAllRecords();
  return c.json({ records: data });
});

records.post("/", async (c) => {
  const body = await c.req.json<Partial<TourRecord>>();

  // Write to Sheets first (Sheets is source of truth, assigns row index)
  await appendRecord(body);

  // Read back to get the new row index, then sync to Neon
  // We do this fire-and-forget so it doesn't block the response
  (async () => {
    try {
      const all = await readAllRecords();
      const latest = all[all.length - 1];
      if (latest?._rowIndex) {
        await upsertRecord(latest._rowIndex, body as Record<string, string>);
      }
    } catch (e) {
      console.error("[neon sync post]", e);
    }
  })();

  return c.json({ success: true });
});

records.patch("/:rowIndex", async (c) => {
  const rowIndex = parseInt(c.req.param("rowIndex"), 10);
  if (isNaN(rowIndex) || rowIndex < 2)
    return c.json({ error: "Invalid row index" }, 400);

  const body = await c.req.json<Partial<TourRecord>>();

  // Write to both in parallel — Sheets is source of truth, Neon mirrors it
  await Promise.all([
    updateCells(rowIndex, body),
    updateRecord(rowIndex, body as Record<string, string>).catch((e) =>
      console.error("[neon sync patch]", e)
    ),
  ]);

  return c.json({ success: true });
});

export default records;
