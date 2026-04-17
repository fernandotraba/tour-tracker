import { neon } from "@neondatabase/serverless";

let _sql: ReturnType<typeof neon> | null = null;

export function getDb() {
  if (!_sql) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set");
    _sql = neon(url);
  }
  return _sql;
}

// Map TourRecord field names to DB column names
export const FIELD_TO_COL: Record<string, string> = {
  "Worker name": "worker_name",
  "Tour Date": "tour_date",
  "Worker Picture": "worker_picture",
  "Candidate Score (1-10)": "candidate_score",
  "Schedule": "schedule",
  "Email": "email",
  "Phone Number": "phone_number",
  "Console Link": "console_link",
  "DT Performed": "dt_performed",
  "DT Results Clear": "dt_results_clear",
  "THC Positive": "thc_positive",
  "Doc Signed": "doc_signed",
  "Turned Away": "turned_away",
  "Turned Away Reason": "turned_away_reason",
  "Notes": "notes",
  "Start Date": "start_date",
  "Name sent on list": "name_sent_on_list",
  "Added to Shifts": "added_to_shifts",
  "Attendance Confirmed Pre-List": "attendance_confirmed_pre_list",
  "Attendance Confirmed Pre-Shift": "attendance_confirmed_pre_shift",
  "Paid for tour?": "paid_for_tour",
  "BG Results Clear?": "bg_results_clear",
};

export const COL_TO_FIELD = Object.fromEntries(
  Object.entries(FIELD_TO_COL).map(([k, v]) => [v, k])
);

export async function ensureSchema() {
  const sql = getDb();
  await sql`
    CREATE TABLE IF NOT EXISTS tour_records (
      id               SERIAL PRIMARY KEY,
      row_index        INTEGER UNIQUE,
      worker_name      TEXT,
      tour_date        TEXT,
      worker_picture   TEXT,
      candidate_score  TEXT,
      schedule         TEXT,
      email            TEXT,
      phone_number     TEXT,
      console_link     TEXT,
      dt_performed     TEXT,
      dt_results_clear TEXT,
      thc_positive     TEXT,
      doc_signed       TEXT,
      turned_away      TEXT,
      turned_away_reason TEXT,
      notes            TEXT,
      start_date       TEXT,
      name_sent_on_list TEXT,
      added_to_shifts  TEXT,
      attendance_confirmed_pre_list  TEXT,
      attendance_confirmed_pre_shift TEXT,
      paid_for_tour    TEXT,
      bg_results_clear TEXT,
      created_at       TIMESTAMPTZ DEFAULT NOW(),
      updated_at       TIMESTAMPTZ DEFAULT NOW()
    )
  `;
}

export async function upsertRecord(
  rowIndex: number,
  data: Record<string, string>
): Promise<void> {
  const sql = getDb();

  // Build col → value map from sheet field names
  const cols: Record<string, string> = { row_index: String(rowIndex) };
  for (const [field, value] of Object.entries(data)) {
    const col = FIELD_TO_COL[field];
    if (col) cols[col] = value ?? "";
  }

  const colNames = Object.keys(cols);
  const colValues = Object.values(cols);

  // Build parameterised upsert dynamically
  const placeholders = colValues.map((_, i) => `$${i + 1}`).join(", ");
  const colList = colNames.join(", ");
  const updateSet = colNames
    .filter((c) => c !== "row_index")
    .map((c, i) => {
      const idx = colNames.indexOf(c) + 1;
      return `${c} = $${idx}`;
    })
    .join(", ");

  await sql(
    `INSERT INTO tour_records (${colList}) VALUES (${placeholders})
     ON CONFLICT (row_index) DO UPDATE SET ${updateSet}, updated_at = NOW()`,
    colValues
  );
}

export async function updateRecord(
  rowIndex: number,
  data: Record<string, string>
): Promise<void> {
  const sql = getDb();

  const cols: [string, string][] = [];
  for (const [field, value] of Object.entries(data)) {
    const col = FIELD_TO_COL[field];
    if (col) cols.push([col, value ?? ""]);
  }

  if (!cols.length) return;

  const setClauses = cols.map((c, i) => `${c[0]} = $${i + 1}`).join(", ");
  const values = [...cols.map((c) => c[1]), String(rowIndex)];

  await sql(
    `UPDATE tour_records SET ${setClauses}, updated_at = NOW() WHERE row_index = $${cols.length + 1}`,
    values
  );
}
