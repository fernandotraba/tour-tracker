import { Hono } from "hono";
import { readAllRecords, appendRecord, updateCells } from "../lib/sheets.js";
import type { TourRecord } from "@tour-tracker/shared";

const records = new Hono();

records.get("/", async (c) => {
  const data = await readAllRecords();
  return c.json({ records: data });
});

records.post("/", async (c) => {
  const body = await c.req.json<Partial<TourRecord>>();
  await appendRecord(body);
  return c.json({ success: true });
});

records.patch("/:rowIndex", async (c) => {
  const rowIndex = parseInt(c.req.param("rowIndex"), 10);
  if (isNaN(rowIndex) || rowIndex < 2)
    return c.json({ error: "Invalid row index" }, 400);
  const body = await c.req.json<Partial<TourRecord>>();
  await updateCells(rowIndex, body);
  return c.json({ success: true });
});

export default records;
