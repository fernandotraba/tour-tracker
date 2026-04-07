// ── Worker ────────────────────────────────────────────────────────────────────

export interface Worker {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  photoUrl: string;
  consoleUrl: string;
  accountStatus: string;
  bgcClear: boolean;
  bgcLabel: string;
}

// ── Tour record ───────────────────────────────────────────────────────────────

export interface TourRecord {
  _rowIndex: number;
  // Onsite
  "Schedule": string;
  "Worker name": string;
  "Tour Date": string;
  "Worker Picture": string;
  "Candidate Score (1-10)": string;
  "DT Performed": string;
  "DT Results Clear": string;
  "THC Positive": string;
  "Doc Signed": string;
  "Notes": string;
  // GWOps
  "Email": string;
  "Phone Number": string;
  "Console Link": string;
  "Start Date": string;
  "Name sent on list": string;
  "Added to Shifts": string;
  // NY WOps
  "Paid for tour?": string;
  "BG Results Clear?": string;
  // Allow any extra columns the sheet may have
  [key: string]: string | number;
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export interface SessionUser {
  email: string;
  name: string;
  picture: string;
}

export interface AuthResponse extends SessionUser {
  token: string;
}
