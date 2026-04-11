import type { Worker, TourRecord, AuthResponse } from "@tour-tracker/shared";

export const IS_MOCK = import.meta.env.VITE_MOCK === "true";

export const MOCK_USER: AuthResponse = {
  email: "demo@traba.work",
  name: "Demo User",
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
];

export const MOCK_RECORDS: TourRecord[] = [
  {
    _rowIndex: 2,
    "Schedule": "Front Half",
    "Worker name": "Maria Garcia",
    "Tour Date": "2026-04-08",
    "Worker Picture": "",
    "Candidate Score (1-10)": "8.5",
    "DT Performed": "Y", "DT Results Clear": "Y", "THC Positive": "N",
    "Doc Signed": "Y", "Notes": "", "Turned Away": "N", "Turned Away Reason": "",
    "Email": "maria.garcia@email.com", "Phone Number": "5135551234",
    "Console Link": "#", "Start Date": "2026-04-14",
    "Name sent on list": "Y", "Added to Shifts": "",
    "Attendance Confirmed Pre-List": "", "Attendance Confirmed Pre-Shift": "",
    "Paid for tour?": "Y", "BG Results Clear?": "Y",
  },
  {
    _rowIndex: 3,
    "Schedule": "Back Half",
    "Worker name": "James Johnson",
    "Tour Date": "2026-04-09",
    "Worker Picture": "",
    "Candidate Score (1-10)": "7",
    "DT Performed": "Y", "DT Results Clear": "Y", "THC Positive": "N",
    "Doc Signed": "Y", "Notes": "", "Turned Away": "N", "Turned Away Reason": "",
    "Email": "james.j@email.com", "Phone Number": "5135555678",
    "Console Link": "#", "Start Date": "",
    "Name sent on list": "", "Added to Shifts": "",
    "Attendance Confirmed Pre-List": "", "Attendance Confirmed Pre-Shift": "",
    "Paid for tour?": "N", "BG Results Clear?": "",
  },
  {
    _rowIndex: 4,
    "Schedule": "Night Shift",
    "Worker name": "Ana Torres",
    "Tour Date": "2026-04-10",
    "Worker Picture": "",
    "Candidate Score (1-10)": "4",
    "DT Performed": "Y", "DT Results Clear": "N", "THC Positive": "Y",
    "Doc Signed": "N", "Notes": "Failed DT", "Turned Away": "N", "Turned Away Reason": "",
    "Email": "ana.torres@email.com", "Phone Number": "5135559012",
    "Console Link": "#", "Start Date": "",
    "Name sent on list": "", "Added to Shifts": "",
    "Attendance Confirmed Pre-List": "", "Attendance Confirmed Pre-Shift": "",
    "Paid for tour?": "", "BG Results Clear?": "",
  },
];
