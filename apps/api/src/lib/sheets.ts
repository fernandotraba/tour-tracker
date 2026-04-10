import { google } from "googleapis";
import type { TourRecord } from "@tour-tracker/shared";

const SHEET_ID = "10K_wZq-BVnl_56YxCNRhO8imtLRL53z5p9PtkxvIQ6U";
const START_LIST_SHEET_ID = process.env.START_LIST_SHEET_ID ?? "1bKhDJZxTQ0QpB5Em3OTOdzC8V2eW4lFLrTRnZQGhNFc";

// Name = col B (index 1), Email = col H (index 7) — same across all 3 tabs
const START_LIST_NAME_COL = "B";
const START_LIST_EMAIL_COL = "H";

export async function writeStartList(
  shift: string,
  workers: Array<{ name: string; email: string }>
): Promise<void> {
  const sheets = await getSheets();
  const tab = shift; // "Front Half", "Back Half", or "Night Shift"

  const clearRange1 = `'${tab}'!${START_LIST_NAME_COL}2:${START_LIST_NAME_COL}1000`;
  const clearRange2 = `'${tab}'!${START_LIST_EMAIL_COL}2:${START_LIST_EMAIL_COL}1000`;

  await sheets.spreadsheets.values.batchClear({
    spreadsheetId: START_LIST_SHEET_ID,
    requestBody: { ranges: [clearRange1, clearRange2] },
  });

  if (!workers.length) return;

  const nameValues = workers.map((w) => [w.name]);
  const emailValues = workers.map((w) => [w.email]);

  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: START_LIST_SHEET_ID,
    requestBody: {
      valueInputOption: "USER_ENTERED",
      data: [
        { range: `'${tab}'!${START_LIST_NAME_COL}2`, values: nameValues },
        { range: `'${tab}'!${START_LIST_EMAIL_COL}2`, values: emailValues },
      ],
    },
  });
}
const SHEET_GID = "2073822165";

let sheetsClient: ReturnType<typeof google.sheets> | null = null;
let sheetTabName: string | null = null;
let headerMap: Record<string, number> = {};

async function getSheets() {
  if (sheetsClient) return sheetsClient;
  const creds = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!creds) throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON not configured");
  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(creds),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  sheetsClient = google.sheets({ version: "v4", auth });
  return sheetsClient;
}

async function findSheetTabName(): Promise<string> {
  if (sheetTabName) return sheetTabName;
  const sheets = await getSheets();
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID });
  const tab = meta.data.sheets?.find(
    (s) => String(s.properties?.sheetId) === SHEET_GID
  );
  sheetTabName = tab?.properties?.title ?? meta.data.sheets?.[0]?.properties?.title ?? "Sheet1";
  return sheetTabName;
}

async function getHeaderMap(forceRefresh = false): Promise<Record<string, number>> {
  if (!forceRefresh && Object.keys(headerMap).length > 0) return headerMap;
  const sheets = await getSheets();
  const tab = await findSheetTabName();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `'${tab}'!1:1`,
  });
  const raw = res.data.values?.[0] ?? [];
  headerMap = {};
  (raw as string[]).forEach((h, i) => {
    if (h?.trim()) headerMap[h.trim()] = i;
  });
  return headerMap;
}

function colLetter(idx: number): string {
  let result = "";
  let i = idx;
  while (i >= 0) {
    result = String.fromCharCode(65 + (i % 26)) + result;
    i = Math.floor(i / 26) - 1;
  }
  return result;
}

export async function readAllRecords(): Promise<TourRecord[]> {
  const sheets = await getSheets();
  const tab = await findSheetTabName();
  const headers = await getHeaderMap();

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `'${tab}'!A:AZ`,
  });

  const rows = (res.data.values ?? []) as string[][];
  if (rows.length <= 1) return [];

  return rows.slice(1).map((row, i) => {
    const record: TourRecord = { _rowIndex: i + 2 } as TourRecord;
    Object.entries(headers).forEach(([name, col]) => {
      record[name] = row[col] ?? "";
    });
    return record;
  });
}

export async function appendRecord(data: Partial<TourRecord>): Promise<void> {
  const sheets = await getSheets();
  const tab = await findSheetTabName();
  const headers = await getHeaderMap(true);

  const maxCol = Math.max(...Object.values(headers)) + 1;
  const row = new Array<string>(maxCol).fill("");

  Object.entries(data).forEach(([key, value]) => {
    if (headers[key] !== undefined) {
      row[headers[key]!] = value != null ? String(value) : "";
    }
  });

  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: `'${tab}'!A:A`,
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: [row] },
  });
}

export async function updateCells(
  rowIndex: number,
  data: Partial<TourRecord>
): Promise<void> {
  const sheets = await getSheets();
  const tab = await findSheetTabName();
  const headers = await getHeaderMap();

  const updates = Object.entries(data)
    .filter(([key]) => headers[key] !== undefined)
    .map(([key, value]) => ({
      range: `'${tab}'!${colLetter(headers[key]!)}${rowIndex}`,
      values: [[value != null ? String(value) : ""]],
    }));

  if (!updates.length) return;

  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: SHEET_ID,
    requestBody: { valueInputOption: "USER_ENTERED", data: updates },
  });
}
