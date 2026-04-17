import { Hono } from "hono";
import { readAllRecords } from "../lib/sheets.js";
import { ensureSchema, upsertRecord } from "../lib/db.js";

const admin = new Hono();

// POST /api/admin/sync
// Reads all rows from Google Sheets and upserts them into Neon.
// Safe to run multiple times (idempotent via ON CONFLICT row_index).
admin.post("/sync", async (c) => {
  try {
    await ensureSchema();
    const records = await readAllRecords();

    let synced = 0;
    let failed = 0;

    for (const record of records) {
      try {
        const { _rowIndex, ...fields } = record;
        await upsertRecord(_rowIndex, fields as Record<string, string>);
        synced++;
      } catch (e) {
        console.error(`[sync] row ${record._rowIndex}`, e);
        failed++;
      }
    }

    return c.json({
      ok: true,
      synced,
      failed,
      total: records.length,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[sync]", msg);
    return c.json({ error: msg }, 500);
  }
});

export default admin;
