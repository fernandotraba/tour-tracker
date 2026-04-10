import { useState, useRef, useCallback, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { searchWorkers, createTourRecord } from "../api";
import type { Worker } from "@tour-tracker/shared";

type YN = "Y" | "N" | "";

interface ToggleState {
  dtPerformed: YN;
  dtResultsClear: YN;
  thcPositive: YN;
  docSigned: YN;
  turnedAway: YN;
}

const TURNED_AWAY_REASONS = [
  "Language barrier",
  "THC / intoxicated",
  "Disengaged / poor attitude",
  "Previously worked at Reach",
  "Failed English assessment",
  "Other",
];

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

function YNToggle({ value, onChange }: { value: YN; onChange: (v: YN) => void }) {
  return (
    <div style={{ display: "flex", gap: 4 }}>
      {(["Y", "N"] as YN[]).map((v) => (
        <button
          key={v} type="button"
          onClick={() => onChange(value === v ? "" : v)}
          style={{
            height: 32, width: 42, borderRadius: 6, cursor: "pointer",
            fontSize: 12, fontWeight: 500, border: "1px solid var(--gray-20)",
            background: value === v ? (v === "Y" ? "var(--green-10)" : "var(--red-10)") : "var(--white)",
            color: value === v ? (v === "Y" ? "var(--green-70)" : "var(--red-70)") : "var(--gray-60)",
            borderColor: value === v ? (v === "Y" ? "var(--green-60)" : "var(--red-60)") : "var(--gray-20)",
            transition: "all 0.15s",
          }}
        >
          {v}
        </button>
      ))}
    </div>
  );
}

export default function OnsiteTab() {
  const [query, setQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [schedule, setSchedule] = useState("");
  const [tourDate, setTourDate] = useState(new Date().toISOString().split("T")[0]);
  const [score, setScore] = useState("");
  const [toggles, setToggles] = useState<ToggleState>({ dtPerformed: "", dtResultsClear: "", thcPositive: "", docSigned: "", turnedAway: "" });
  const [turnedAwayReason, setTurnedAwayReason] = useState("");
  const [notes, setNotes] = useState("");
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  const debouncedQuery = useDebounce(query, 400);

  const { data: workers, isFetching: searching, error: searchError } = useQuery({
    queryKey: ["workers", debouncedQuery],
    queryFn: () => searchWorkers(debouncedQuery),
    enabled: debouncedQuery.trim().length >= 2,
    retry: false,
  });

  const submitMutation = useMutation({
    mutationFn: createTourRecord,
    onSuccess: () => {
      showToast("Worker added to tracker");
      resetForm();
    },
    onError: (e) => showToast(e instanceof Error ? e.message : "Submit failed", "error"),
  });

  function showToast(msg: string, type: "success" | "error" = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  }

  function resetForm() {
    setSelectedWorker(null);
    setQuery("");
    setSchedule("");
    setTourDate(new Date().toISOString().split("T")[0]);
    setScore("");
    setToggles({ dtPerformed: "", dtResultsClear: "", thcPositive: "", docSigned: "", turnedAway: "" });
    setTurnedAwayReason("");
    setNotes("");
  }

  function selectWorker(w: Worker) {
    setSelectedWorker(w);
    setQuery(w.name);
    setShowResults(false);
  }

  function handleSubmit() {
    if (!selectedWorker) return showToast("No worker selected", "error");
    if (!schedule) return showToast("Please select a schedule", "error");
    if (!tourDate) return showToast("Please enter a tour date", "error");
    if (!score) return showToast("Please enter a candidate score", "error");

    submitMutation.mutate({
      "Schedule": schedule,
      "Worker name": selectedWorker.name,
      "Tour Date": tourDate,
      "Worker Picture": selectedWorker.photoUrl,
      "Candidate Score (1-10)": score,
      "Email": selectedWorker.email,
      "Phone Number": selectedWorker.phone,
      "Console Link": selectedWorker.consoleUrl,
      "DT Performed": toggles.dtPerformed,
      "DT Results Clear": toggles.dtResultsClear,
      "THC Positive": toggles.thcPositive,
      "Doc Signed": toggles.docSigned,
      "Turned Away": toggles.turnedAway,
      "Turned Away Reason": toggles.turnedAway === "Y" ? turnedAwayReason : "",
      "Notes": notes,
    });
  }

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: "var(--midnight-100)", marginBottom: 4 }}>Add Tour Attendee</div>
        <div style={{ fontSize: 12, color: "var(--gray-60)" }}>Search by worker name or phone number</div>
      </div>

      {/* Search */}
      <div ref={searchRef} style={{ position: "relative", maxWidth: 480, marginBottom: 24 }}>
        <svg style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--gray-40)", pointerEvents: "none" }}
          width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setShowResults(true); if (!e.target.value) setSelectedWorker(null); }}
          onFocus={() => setShowResults(true)}
          placeholder="Search worker name or phone (e.g. John Smith or 5135551234)"
          style={{
            height: 40, padding: "0 12px 0 40px", borderRadius: 8,
            border: "1px solid var(--gray-20)", fontFamily: "Poppins, sans-serif",
            fontSize: 13, color: "var(--midnight-100)", background: "var(--white)",
            width: "100%", transition: "border-color 0.15s",
          }}
          onBlur={(e) => {
            if (!searchRef.current?.contains(e.relatedTarget as Node)) setShowResults(false);
          }}
        />
        {showResults && query.trim().length >= 2 && (
          <div style={{
            position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
            background: "var(--white)", border: "1px solid var(--gray-20)", borderRadius: 8,
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)", zIndex: 50, maxHeight: 300, overflowY: "auto",
          }}>
            {searching && (
              <div style={{ padding: 14, textAlign: "center", color: "var(--gray-60)", fontSize: 12 }}>
                <span className="spinner" style={{ marginRight: 8 }} /> Searching…
              </div>
            )}
            {!searching && workers?.length === 0 && (
              <div style={{ padding: 14, textAlign: "center", color: "var(--gray-60)", fontSize: 12 }}>No workers found</div>
            )}
            {!searching && workers?.map((w) => (
              <div
                key={w.id}
                onMouseDown={() => selectWorker(w)}
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "12px 14px", cursor: "pointer",
                  borderBottom: "1px solid var(--gray-20)",
                }}
              >
                {w.photoUrl
                  ? <img src={w.photoUrl} style={{ width: 36, height: 36, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} />
                  : <div style={{ width: 36, height: 36, borderRadius: 8, background: "var(--violet-10)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 13, fontWeight: 600, color: "var(--violet-60)" }}>{initials(w.name)}</div>
                }
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{w.name}</div>
                  <div style={{ fontSize: 11, color: "var(--gray-60)" }}>{w.phone}{w.email ? ` · ${w.email}` : ""}</div>
                </div>
                <span className={`badge ${w.bgcClear ? "badge-green" : "badge-orange"}`} style={{ fontSize: 10 }}>
                  {w.bgcClear ? "BGC Clear" : w.bgcLabel}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {!selectedWorker ? (
        <div style={{ border: "1px dashed var(--gray-20)", borderRadius: 12, padding: "48px 24px", textAlign: "center", maxWidth: 480, color: "var(--gray-60)" }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 12, opacity: 0.4 }}>
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <p style={{ fontSize: 14 }}>Search for a worker above to start an entry</p>
          {searchError && <p style={{ fontSize: 12, color: "var(--red-70)", marginTop: 8 }}>{(searchError as Error).message}</p>}
        </div>
      ) : (
        <div>
          {/* Worker card */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: 16, padding: 16, borderRadius: 12, border: "1px solid var(--gray-20)", marginBottom: 20 }}>
            {selectedWorker.photoUrl
              ? <img src={selectedWorker.photoUrl} style={{ width: 64, height: 64, borderRadius: 10, objectFit: "cover", flexShrink: 0 }} />
              : <div style={{ width: 64, height: 64, borderRadius: 10, background: "var(--violet-10)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 22, fontWeight: 600, color: "var(--violet-60)" }}>{initials(selectedWorker.name)}</div>
            }
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>{selectedWorker.name}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 8 }}>
                {[
                  { icon: "✉", text: selectedWorker.email },
                  { icon: "📞", text: selectedWorker.phone },
                ].filter(i => i.text).map((item, idx) => (
                  <span key={idx} style={{ fontSize: 12, color: "var(--gray-70)" }}>{item.icon} {item.text}</span>
                ))}
                <span className={`badge ${selectedWorker.bgcClear ? "badge-green" : "badge-orange"}`}>
                  {selectedWorker.bgcClear ? "BGC Clear" : selectedWorker.bgcLabel}
                </span>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <a href={selectedWorker.consoleUrl} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                  </svg>
                  View in Console
                </a>
                <button className="btn btn-ghost btn-sm" onClick={resetForm}>Change Worker</button>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="card">
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 18 }}>Tour Details</div>
            <div className="form-grid-2" style={{ marginBottom: 16 }}>
              <div className="form-group">
                <label className="form-label">Schedule *</label>
                <select className="form-select" value={schedule} onChange={(e) => setSchedule(e.target.value)}>
                  <option value="">Select schedule</option>
                  <option>Front Half</option>
                  <option>Back Half</option>
                  <option>Night Shift</option>
                  <option>Front Half + Back Half</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Tour Date *</label>
                <input className="form-input" type="date" value={tourDate} onChange={(e) => setTourDate(e.target.value)} />
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div className="form-group" style={{ maxWidth: 160 }}>
                <label className="form-label">Candidate Score (1–10) *</label>
                <input
                  className="form-input" type="number" min="1" max="10" step="0.1"
                  placeholder="e.g. 7.5" value={score}
                  onChange={(e) => setScore(e.target.value)}
                  style={{ borderColor: score && parseFloat(score) < 5 ? "var(--red-60)" : undefined }}
                />
                {score && parseFloat(score) < 5 && (
                  <div style={{ marginTop: 4, fontSize: 11, color: "var(--red-70)", fontWeight: 500 }}>
                    Score below 5 — candidate is automatically ineligible
                  </div>
                )}
              </div>
            </div>

            <div className="divider" />
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14 }}>Drug Test & Docs</div>

            <div className="form-grid-3" style={{ marginBottom: 16 }}>
              {([
                ["dtPerformed", "DT Performed"],
                ["dtResultsClear", "DT Results Clear"],
                ["thcPositive", "THC Positive"],
                ["docSigned", "Doc Signed"],
              ] as [keyof ToggleState, string][]).map(([key, label]) => (
                <div key={key} className="form-group">
                  <label className="form-label">{label}</label>
                  <YNToggle value={toggles[key]} onChange={(v) => setToggles((t) => ({ ...t, [key]: v }))} />
                </div>
              ))}
            </div>

            <div className="divider" />
            <div style={{ marginBottom: 16 }}>
              <div className="form-group">
                <label className="form-label">Turned Away</label>
                <YNToggle value={toggles.turnedAway} onChange={(v) => setToggles((t) => ({ ...t, turnedAway: v }))} />
              </div>
              {toggles.turnedAway === "Y" && (
                <div className="form-group" style={{ maxWidth: 320, marginTop: 12 }}>
                  <label className="form-label">Reason</label>
                  <select className="form-select" value={turnedAwayReason} onChange={(e) => setTurnedAwayReason(e.target.value)}>
                    <option value="">Select reason</option>
                    {TURNED_AWAY_REASONS.map((r) => <option key={r}>{r}</option>)}
                  </select>
                </div>
              )}
            </div>

            <div className="divider" />
            <div className="form-group" style={{ marginBottom: 20 }}>
              <label className="form-label">Notes</label>
              <textarea
                className="form-textarea"
                placeholder="e.g. Ineligible — score below 5"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <button
                className="btn btn-primary"
                onClick={handleSubmit}
                disabled={submitMutation.isPending}
              >
                {submitMutation.isPending ? <span className="spinner" /> : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                )}
                {submitMutation.isPending ? "Submitting…" : "Submit Entry"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 999,
          background: toast.type === "error" ? "var(--red-70)" : "var(--midnight-100)",
          color: "white", padding: "12px 20px", borderRadius: 10,
          fontSize: 13, fontWeight: 500,
        }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}
