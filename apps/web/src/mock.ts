import type { Worker, TourRecord, AuthResponse } from "@tour-tracker/shared";

export const IS_MOCK = import.meta.env.VITE_MOCK === "true";

export const MOCK_USER: AuthResponse = {
  email: "felix@traba.work",
  name: "Felix Ops",
  picture: "",
  token: "mock-token",
};

export const MOCK_WORKERS: Worker[] = [
  {
    id: "w1", name: "Maria Garcia", firstName: "Maria", lastName: "Garcia",
    email: "maria.garcia@email.com", phone: "5135551234",
    photoUrl: "", consoleUrl: "#", accountStatus: "APPROVED",
    bgcClear: true, bgcLabel: "ELIGIBLE",
  },
  {
    id: "w2", name: "James Johnson", firstName: "James", lastName: "Johnson",
    email: "james.j@email.com", phone: "5135555678",
    photoUrl: "", consoleUrl: "#", accountStatus: "APPROVED",
    bgcClear: false, bgcLabel: "PENDING",
  },
  {
    id: "w3", name: "Ana Torres", firstName: "Ana", lastName: "Torres",
    email: "ana.torres@email.com", phone: "5135559012",
    photoUrl: "", consoleUrl: "#", accountStatus: "APPROVED",
    bgcClear: true, bgcLabel: "ELIGIBLE",
  },
  {
    id: "w4", name: "Marcus Williams", firstName: "Marcus", lastName: "Williams",
    email: "marcus.w@email.com", phone: "5135553456",
    photoUrl: "", consoleUrl: "#", accountStatus: "APPROVED",
    bgcClear: true, bgcLabel: "ELIGIBLE",
  },
  {
    id: "w5", name: "Sofia Reyes", firstName: "Sofia", lastName: "Reyes",
    email: "sofia.r@email.com", phone: "5135557890",
    photoUrl: "", consoleUrl: "#", accountStatus: "APPROVED",
    bgcClear: false, bgcLabel: "CONSIDER",
  },
];

export const MOCK_RECORDS: TourRecord[] = [
  {
    _rowIndex: 2,
    "Schedule": "Front Half",
    "Worker name": "Maria Garcia", "Tour Date": "2026-04-08", "Worker Picture": "",
    "Candidate Score (1-10)": "9",
    "DT Performed": "Y", "DT Results Clear": "Y", "THC Positive": "N", "Doc Signed": "Y",
    "Notes": "Strong candidate, great attitude", "Turned Away": "N", "Turned Away Reason": "",
    "Email": "maria.garcia@email.com", "Phone Number": "5135551234", "Console Link": "#",
    "Start Date": "2026-04-14", "Name sent on list": "Y",
    "Added to Shifts": "Y", "Attendance Confirmed Pre-List": "Y", "Attendance Confirmed Pre-Shift": "",
    "Paid for tour?": "Y", "BG Results Clear?": "Y",
  },
  {
    _rowIndex: 3,
    "Schedule": "Back Half",
    "Worker name": "James Johnson", "Tour Date": "2026-04-09", "Worker Picture": "",
    "Candidate Score (1-10)": "8",
    "DT Performed": "Y", "DT Results Clear": "Y", "THC Positive": "N", "Doc Signed": "Y",
    "Notes": "", "Turned Away": "N", "Turned Away Reason": "",
    "Email": "james.j@email.com", "Phone Number": "5135555678", "Console Link": "#",
    "Start Date": "2026-04-14", "Name sent on list": "N",
    "Added to Shifts": "", "Attendance Confirmed Pre-List": "", "Attendance Confirmed Pre-Shift": "",
    "Paid for tour?": "Y", "BG Results Clear?": "",
  },
  {
    _rowIndex: 4,
    "Schedule": "Night Shift",
    "Worker name": "Marcus Williams", "Tour Date": "2026-04-09", "Worker Picture": "",
    "Candidate Score (1-10)": "7.5",
    "DT Performed": "Y", "DT Results Clear": "Y", "THC Positive": "N", "Doc Signed": "Y",
    "Notes": "Bilingual — Spanish/English", "Turned Away": "N", "Turned Away Reason": "",
    "Email": "marcus.w@email.com", "Phone Number": "5135553456", "Console Link": "#",
    "Start Date": "", "Name sent on list": "",
    "Added to Shifts": "", "Attendance Confirmed Pre-List": "", "Attendance Confirmed Pre-Shift": "",
    "Paid for tour?": "N", "BG Results Clear?": "Y",
  },
  {
    _rowIndex: 5,
    "Schedule": "Front Half",
    "Worker name": "Sofia Reyes", "Tour Date": "2026-04-10", "Worker Picture": "",
    "Candidate Score (1-10)": "6",
    "DT Performed": "Y", "DT Results Clear": "Y", "THC Positive": "N", "Doc Signed": "Y",
    "Notes": "", "Turned Away": "N", "Turned Away Reason": "",
    "Email": "sofia.r@email.com", "Phone Number": "5135557890", "Console Link": "#",
    "Start Date": "", "Name sent on list": "",
    "Added to Shifts": "", "Attendance Confirmed Pre-List": "", "Attendance Confirmed Pre-Shift": "",
    "Paid for tour?": "", "BG Results Clear?": "",
  },
  {
    _rowIndex: 6,
    "Schedule": "Back Half",
    "Worker name": "Ana Torres", "Tour Date": "2026-04-10", "Worker Picture": "",
    "Candidate Score (1-10)": "3.5",
    "DT Performed": "Y", "DT Results Clear": "N", "THC Positive": "Y", "Doc Signed": "N",
    "Notes": "Failed DT — THC positive", "Turned Away": "N", "Turned Away Reason": "",
    "Email": "ana.torres@email.com", "Phone Number": "5135559012", "Console Link": "#",
    "Start Date": "", "Name sent on list": "",
    "Added to Shifts": "", "Attendance Confirmed Pre-List": "", "Attendance Confirmed Pre-Shift": "",
    "Paid for tour?": "Y", "BG Results Clear?": "N",
  },
  {
    _rowIndex: 7,
    "Schedule": "Front Half",
    "Worker name": "David Kim", "Tour Date": "2026-04-11", "Worker Picture": "",
    "Candidate Score (1-10)": "",
    "DT Performed": "N", "DT Results Clear": "", "THC Positive": "", "Doc Signed": "N",
    "Notes": "Language barrier — no English", "Turned Away": "Y", "Turned Away Reason": "Language barrier",
    "Email": "david.kim@email.com", "Phone Number": "5135552222", "Console Link": "#",
    "Start Date": "", "Name sent on list": "",
    "Added to Shifts": "", "Attendance Confirmed Pre-List": "", "Attendance Confirmed Pre-Shift": "",
    "Paid for tour?": "N", "BG Results Clear?": "",
  },
];
