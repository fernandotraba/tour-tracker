import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { searchWorkers, createTourRecord, getTourRecords, updateTourRecord } from "../api";
import type { Worker, TourRecord } from "@tour-tracker/shared";

type YN = "Y" | "N" | "";

interface ToggleState {
  dtPerformed: YN;
  dtResultsClear: YN;
  thcPositive: YN;
  docSigned: YN;
  turnedAway: YN;
}

interface QueueEntry {
  id: string;
  worker: Worker;
  schedule: string;
  tourDate: string;
  score: string;
  toggles: ToggleState;
  turnedAwayReason: string;
  notes: string;
  mode: "create" | "update";
  existingRowIndex?: number;
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

const EMPTY_TOGGLES: ToggleState = { dtPerformed: "", dtResultsClear: "", thcPositive: "", docSigned: "", turnedAway: "" };

export default function OnsiteTab() {
  const [query, setQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [schedule, setSchedule] = useState("");
  const [tourDate, setTourDate] = useState(new Date().toISOString().split("T")[0]);
  const [score, setScore] = useState("");
  const [toggles, setToggles] = useState<ToggleState>(EMPTY_TOGGLES);
  const [turnedAwayReason, setTurnedAwayReason] = useState("");
  const [notes, setNotes] = useState("");
  const [entryMode, setEntryMode] = useState<"create" | "update">("create");
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [submittingQueue, setSubmittingQueue] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  const debouncedQuery = useDebounce(query, 400);

  const { data: tourRecords = [] } = useQuery({
    queryKey: ["tour-records"],
    queryFn: getTourRecords,
    staleTime: 60_000,
  });

  const { data: workers, isFetching: searching, error: searchError } = useQuery({
    queryKey: ["workers", debouncedQuery],
    queryFn: () => searchWorkers(debouncedQuery),
    enabled: debouncedQuery.trim().length >= 2,
    retry: false,
  });

  const existingRecord: TourRecord | undefined = selectedWorker
    ? tourRecords.find(
        (r) =>
          r["Worker name"]?.toLowerCase() === selectedWorker.name.toLowerCase() ||
          (selectedWorker.email && r["Email"]?.toLowerCase() === selectedWorker.email.toLowerCase())
      )
    : undefined;

  // Pre-fill form when switching to update mode
  useEffect(() => {
    if (entryMode === "update" && existingRecord) {
      setSchedule(existingRecord["Schedule"] || "");
      setTourDate(existingRecord["Tour Date"] || new Date().toISOString().split("T")[0]);
      setScore(existingRecord["Candidate Score (1-10)"] || "");
      setToggles({
        dtPerformed: (existingRecord["DT Performed"] as YN) || "",
        dtResultsClear: (existingRecord["DT Results Clear"] as YN) || "",
        thcPositive: (existingRecord["THC Positive"] as YN) || "",
        docSigned: (existingRecord["Doc Signed"] as YN) || "",
        turnedAway: (existingRecord["Turned Away"] as YN) || "",
      });
      setTurnedAwayReason(existingRecord["Turned Away Reason"] || "");
      setNotes(existingRecord["Notes"] || "");
    } else if (entryMode === "create") {
      setSchedule("");
      setTourDate(new Date().toISOString().split("T")[0]);
      setScore("");
      setToggles(EMPTY_TOGGLES);
      setTurnedAwayReason("");
      setNotes("");
    }
  }, [entryMode]);

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
    setToggles(EMPTY_TOGGLES);
    setTurnedAwayReason("");
    setNotes("");
    setEntryMode("create");
  }

  function selectWorker(w: Worker) {
    setSelectedWorker(w);
    setQuery(w.name);
    setShowResults(false);
    setEntryMode("create");
  }

  function buildPayload(entry: {
    worker: Worker; schedule: string; tourDate: string; score: string;
    toggles: ToggleState; turnedAwayReason: string; notes: string;
  }): Partial<TourRecord> {
    return {
      "Schedule": entry.schedule,
      "Worker name": entry.worker.name,
      "Tour Date": entry.tourDate,
      "Worker Picture": entry.worker.photoUrl,
      "Candidate Score (1-10)": entry.score,
      "Email": entry.worker.email,
      "Phone Number": entry.worker.phone,
      "Console Link": entry.worker.consoleUrl,
      "DT Performed": entry.toggles.dtPerformed,
      "DT Results Clear": entry.toggles.dtResultsClear,
      "THC Positive": entry.toggles.thcPositive,
      "Doc Signed": entry.toggles.docSigned,
      "Turned Away": entry.toggles.turnedAway,
      "Turned Away Reason": entry.toggles.turnedAway === "Y" ? entry.turnedAwayReason : "",
      "Notes": entry.notes,
    };
  }

  function validateForm(): boolean {
    if (!selectedWorker) { showToast("No worker selected", "error"); return false; }
    if (!schedule) { showToast("Please select a schedule", "error"); return false; }
    if (!tourDate) { showToast("Please enter a tour date", "error"); return false; }
    if (!score) { showToast("Please enter a candidate score", "error"); return false; }
    return true;
  }

  function addToQueue() {
    if (!validateForm()) return;
    setQueue((q) => [
      ...q,
      {
        id: `${Date.now()}-${Math.random()}`,
        worker: selectedWorker!,
        schedule, tourDate, score, toggles, turnedAwayReason, notes,
        mode: entryMode,
        existingRowIndex: entryMode === "update" ? existingRecord?._rowIndex : undefined,
      },
    ]);
    showToast(`${selectedWorker!.name} added to queue`);
    resetForm();
  }

  function handleSubmitDirect() {
    if (!validateForm()) return;
    if (entryMode === "update" && existingRecord?._rowIndex) {
      updateTourRecord(existingRecord._rowIndex, buildPayload({ worker: selectedWorker!, schedule, tourDate, score, toggles, turnedAwayReason, notes }))
        .then(() => { showToast("Entry updated"); resetForm(); })
        .catch((e) => showToast(e.message, "error"));
    } else {
      submitMutation.mutate(buildPayload({ worker: selectedWorker!, schedule, tourDate, score, toggles, turnedAwayReason, notes }));
    }
  }

  async function submitQueue() {
    if (queue.length === 0) return;
    setSubmittingQueue(true);
    let success = 0, failed = 0;
    for (const entry of queue) {
      try {
        if (entry.mode === "update" && entry.existingRowIndex) {
          await updateTourRecord(entry.existingRowIndex, buildPayload(entry));
        } else {
          await createTourRecord(buildPayload(entry));
        }
        success++;
      } catch {
        failed++;
      }
    }
    setSubmittingQueue(false);
    setQueue([]);
    showToast(
      failed > 0 ? `${success} submitted, ${failed} failed` : `${success} ${success === 1 ? "entry" : "entries"} submitted`,
      failed > 0 ? "error" : "success"
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: "var(--midnight-100)", marginBottom: 4 }}>Add Tour Attendee</div>
        <div style={{ fontSize: 12, color: "var(--gray-60)" }}>Search by worker name or phone number</div>
      </div>

      {/* Queue panel */}
      {queue.length > 0 && (
        <div style={{
          background: "var(--violet-10)", border: "1px solid var(--violet-20)",
          borderRadius: 12, padding: 16, marginBottom: 24,
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--violet-70)" }}>
              Queue — {queue.length} {queue.length === 1 ? "entry" : "entries"} pending
            </div>
            <button
              className="btn btn-primary btn-sm"
              onClick={submitQueue}
              disabled={submittingQueue}
              style={{ minWidth: 140 }}
            >
              {submittingQueue ? <span className="spinner" /> : (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              )}
              {submittingQueue ? "Submitting…" : `Submit All (${queue.length})`}
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {queue.map((entry) => (
              <div key={entry.id} style={{
                display: "flex", alignItems: "center", gap: 12,
                background: "var(--white)", borderRadius: 8, padding: "10px 14px",
                border: "1px solid var(--gray-20)",
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8, background: "var(--violet-20)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 700, color: "var(--violet-70)", flexShrink: 0,
                }}>
                  {initials(entry.worker.name)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "var(--midnight-100)" }}>
                    {entry.worker.name}
                    {entry.mode === "update" && (
                      <span style={{ marginLeft: 8, fontSize: 10, background: "var(--orange-10)", color: "var(--orange-70)", padding: "1px 6px", borderRadius: 4, fontWeight: 500 }}>UPDATE</span>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--gray-60)" }}>
                    {entry.schedule} · {entry.tourDate} · Score {entry.score}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setQueue((q) => q.filter((e) => e.id !== entry.id))}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--gray-40)", padding: 4, lineHeight: 1 }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

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
            {!searching && workers?.map((w) => {
              const alreadyInTracker = tourRecords.some(
                (r) =>
                  r["Worker name"]?.toLowerCase() === w.name.toLowerCase() ||
                  (w.email && r["Email"]?.toLowerCase() === w.email.toLowerCase())
              );
              return (
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
                    <div style={{ fontSize: 13, fontWeight: 500, display: "flex", alignItems: "center", gap: 6 }}>
                      {w.name}
                      {alreadyInTracker && (
                        <span style={{ fontSize: 10, background: "var(--orange-10)", color: "var(--orange-70)", padding: "1px 6px", borderRadius: 4, fontWeight: 600 }}>IN TRACKER</span>
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--gray-60)" }}>{w.phone}{w.email ? ` · ${w.email}` : ""}</div>
                  </div>
                  <span className={`badge ${w.bgcClear ? "badge-green" : "badge-orange"}`} style={{ fontSize: 10 }}>
                    {w.bgcClear ? "BGC Clear" : w.bgcLabel}
                  </span>
                </div>
              );
            })}
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
          <div style={{ display: "flex", alignItems: "flex-start", gap: 16, padding: 16, borderRadius: 12, border: "1px solid var(--gray-20)", marginBottom: existingRecord ? 12 : 20 }}>
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

          {/* Duplicate warning banner */}
          {existingRecord && (
            <div style={{
              background: "var(--orange-10)", border: "1px solid var(--orange-30)",
              borderRadius: 10, padding: "12px 16px", marginBottom: 20,
              display: "flex", alignItems: "flex-start", gap: 12,
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--orange-70)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--orange-70)", marginBottom: 6 }}>
                  Already in tracker — Tour {existingRecord["Tour Date"] || "unknown date"} · {existingRecord["Schedule"] || "unknown schedule"}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => setEntryMode("create")}
                    style={{
                      height: 28, padding: "0 12px", borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: "pointer",
                      border: "1px solid",
                      background: entryMode === "create" ? "var(--orange-70)" : "transparent",
                      color: entryMode === "create" ? "white" : "var(--orange-70)",
                      borderColor: "var(--orange-70)",
                    }}
                  >
                    Add new entry
                  </button>
                  <button
                    type="button"
                    onClick={() => setEntryMode("update")}
                    style={{
                      height: 28, padding: "0 12px", borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: "pointer",
                      border: "1px solid",
                      background: entryMode === "update" ? "var(--orange-70)" : "transparent",
                      color: entryMode === "update" ? "white" : "var(--orange-70)",
                      borderColor: "var(--orange-70)",
                    }}
                  >
                    Update existing
                  </button>
                </div>
              </div>
            </div>
          )}

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
                onClick={handleSubmitDirect}
                disabled={submitMutation.isPending}
              >
                {submitMutation.isPending ? <span className="spinner" /> : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                )}
                {submitMutation.isPending ? "Submitting…" : entryMode === "update" ? "Update Entry" : "Submit Entry"}
              </button>
              <button
                className="btn btn-ghost"
                onClick={addToQueue}
                type="button"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Add to Queue
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
