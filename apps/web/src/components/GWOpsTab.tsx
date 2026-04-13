import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
// sendToStartList is called directly (not via useMutation) to support sequential multi-shift sends
import { getTourRecords, updateTourRecord, sendToStartList } from "../api";
import type { TourRecord } from "@tour-tracker/shared";

const SHIFTS = ["Front Half", "Back Half", "Night Shift"] as const;

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

function scoreNum(r: TourRecord): number {
  const raw = r["Candidate Score (1-10)"];
  const n = parseFloat(String(raw ?? ""));
  return isNaN(n) ? 0 : n;
}

function isIneligible(r: TourRecord): boolean {
  const s = scoreNum(r);
  return s > 0 && s < 5;
}

interface RowState {
  startDate: string;
  schedule: string;
  nameSent: string;
}

export default function GWOpsTab() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["records"], queryFn: getTourRecords });
  const [rowState, setRowState] = useState<Record<number, RowState>>({});
  const [saved, setSaved] = useState<Record<number, boolean>>({});
  const [showSendModal, setShowSendModal] = useState(false);
  const [sendToast, setSendToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [sending, setSending] = useState(false);

  async function handleSendAll(byShift: Record<string, Array<{ name: string; email: string }>>) {
    setSending(true);
    try {
      let total = 0;
      for (const [shift, workers] of Object.entries(byShift)) {
        await sendToStartList(shift, workers);
        total += workers.length;
      }
      setShowSendModal(false);
      setSendToast({ msg: `${total} worker${total === 1 ? "" : "s"} sent to start list`, type: "success" });
    } catch (e) {
      setSendToast({ msg: e instanceof Error ? e.message : "Failed to send", type: "error" });
    } finally {
      setSending(false);
      setTimeout(() => setSendToast(null), 4000);
    }
  }

  const updateMutation = useMutation({
    mutationFn: ({ rowIndex, payload }: { rowIndex: number; payload: Partial<TourRecord> }) =>
      updateTourRecord(rowIndex, payload),
    onSuccess: (_, { rowIndex }) => {
      setSaved((s) => ({ ...s, [rowIndex]: true }));
      setTimeout(() => setSaved((s) => ({ ...s, [rowIndex]: false })), 2500);
      qc.invalidateQueries({ queryKey: ["records"] });
    },
  });

  function getRow(r: TourRecord): RowState {
    return rowState[r._rowIndex] ?? {
      startDate: String(r["Start Date"] ?? ""),
      schedule: String(r["Schedule"] ?? ""),
      nameSent: String(r["Name sent on list"] ?? ""),
    };
  }

  function setRow(rowIndex: number, update: Partial<RowState>) {
    setRowState((s) => ({ ...s, [rowIndex]: { ...getRow({ _rowIndex: rowIndex } as TourRecord), ...update } }));
  }

  function saveRow(r: TourRecord) {
    const state = getRow(r);
    updateMutation.mutate({
      rowIndex: r._rowIndex,
      payload: {
        "Start Date": state.startDate,
        "Schedule": state.schedule,
        "Name sent on list": state.nameSent,
      },
    });
  }

  const allRecords = (data ?? []).filter((r) => r["Worker name"] || r["Worker Name"]);

  // Exclude turned-away candidates
  const records = allRecords
    .filter((r) => r["Turned Away"] !== "Y")
    .sort((a, b) => {
      // Score desc (ineligible sink to bottom within this sort)
      const diff = scoreNum(b) - scoreNum(a);
      if (diff !== 0) return diff;
      // Tour date asc (oldest first)
      return String(a["Tour Date"] ?? "").localeCompare(String(b["Tour Date"] ?? ""));
    });

  if (isLoading) return <div style={{ padding: 24, color: "var(--gray-60)" }}><span className="spinner" /> Loading…</div>;

  return (
    <div>
      <div style={{ marginBottom: 20, display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, color: "var(--midnight-100)", marginBottom: 4 }}>GWOps Queue</div>
          <div style={{ fontSize: 12, color: "var(--gray-60)" }}>
            Candidates who attended the tour — confirm attendance and fill placement details
          </div>
        </div>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => setShowSendModal(true)}
          disabled={!records.length}
        >
          Send to Start List
        </button>
      </div>

      {/* Send to Start List modal */}
      {showSendModal && (() => {
        const eligible = records.filter((r) => !isIneligible(r) && getRow(r).startDate && getRow(r).schedule);
        const noSchedule = records.filter((r) => !isIneligible(r) && getRow(r).startDate && !getRow(r).schedule);
        const byShift = eligible.reduce<Record<string, Array<{ name: string; email: string }>>>((acc, r) => {
          const shift = getRow(r).schedule;
          if (!acc[shift]) acc[shift] = [];
          acc[shift].push({ name: String(r["Worker name"] || r["Worker Name"] || ""), email: String(r["Email"] ?? "") });
          return acc;
        }, {});
        const total = eligible.length;
        return (
          <div style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 200,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <div style={{
              background: "var(--white)", borderRadius: 14, padding: 28,
              width: 440, maxWidth: "90vw", boxShadow: "0 8px 32px rgba(0,0,0,0.14)",
            }}>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Send to Start List</div>
              <div style={{ fontSize: 12, color: "var(--gray-60)", marginBottom: 20 }}>
                Workers are sent to the tab matching their selected schedule.
              </div>

              {noSchedule.length > 0 && (
                <div style={{ background: "var(--orange-5, #fff8f0)", border: "1px solid var(--orange-30, #ffd6a0)", borderRadius: 8, padding: "10px 12px", marginBottom: 16, fontSize: 12, color: "var(--orange-70, #b45300)" }}>
                  {noSchedule.length} worker{noSchedule.length === 1 ? "" : "s"} with a start date but no schedule set — they will be skipped.
                </div>
              )}

              {total === 0 ? (
                <div style={{ fontSize: 12, color: "var(--gray-50)", fontStyle: "italic", marginBottom: 20 }}>
                  No workers ready to send. Set Start Date and Schedule in the table first.
                </div>
              ) : (
                <div style={{ marginBottom: 20 }}>
                  {Object.entries(byShift).map(([shift, workers]) => (
                    <div key={shift} style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--violet-70)", marginBottom: 6 }}>
                        {shift} ({workers.length})
                      </div>
                      <div style={{ border: "1px solid var(--gray-20)", borderRadius: 8, overflow: "hidden" }}>
                        {workers.map((w, i) => (
                          <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "7px 12px", borderBottom: i < workers.length - 1 ? "1px solid var(--gray-10)" : "none", fontSize: 12 }}>
                            <span style={{ fontWeight: 500 }}>{w.name}</span>
                            <span style={{ color: "var(--gray-60)" }}>{w.email}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button className="btn btn-ghost btn-sm" onClick={() => setShowSendModal(false)}>Cancel</button>
                <button
                  className="btn btn-primary btn-sm"
                  disabled={total === 0 || sending}
                  onClick={() => handleSendAll(byShift)}
                >
                  {sending ? "Sending…" : `Send ${total} worker${total === 1 ? "" : "s"}`}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {!records.length ? (
        <div style={{ textAlign: "center", padding: "48px 24px", color: "var(--gray-60)" }}>No tour records found</div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th style={{ width: 40 }}>#</th>
                <th>Worker</th>
                <th>Tour Date</th>
                <th>Onsite Schedule</th>
                <th>Score</th>
                <th>DT Clear</th>
                <th>Doc Signed</th>
                <th>BGC</th>
                <th>Console</th>
                <th>Start Date</th>
                <th>Schedule</th>
                <th>Name Sent</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {records.map((r, idx) => {
                const ineligible = isIneligible(r);
                const score = scoreNum(r);
                const name = String(r["Worker name"] || r["Worker Name"] || "—");
                const photo = r["Worker Picture"] ?? "";
                const consoleLink = r["Console Link"] ?? "";
                const bgcRaw = r["BG Results Clear?"] ?? r["BGC Results"] ?? "";
                const bgcClear = bgcRaw === "Y" || bgcRaw === "ELIGIBLE";
                const dtRaw = String(r["DT Results Clear"] ?? "");
                const dtClear = dtRaw === "Y";
                const docSigned = String(r["Doc Signed"] ?? "");
                const state = getRow(r);
                const isSaving = updateMutation.isPending && updateMutation.variables?.rowIndex === r._rowIndex;

                const rowStyle: React.CSSProperties = ineligible
                  ? { opacity: 0.6, background: "var(--red-5, #fff5f5)" }
                  : {};

                return (
                  <tr key={r._rowIndex} style={rowStyle}>
                    <td>
                      <span style={{
                        display: "inline-flex", alignItems: "center", justifyContent: "center",
                        width: 24, height: 24, borderRadius: 6,
                        background: ineligible ? "var(--gray-10)" : idx === 0 ? "var(--violet-60)" : idx === 1 ? "var(--violet-40)" : idx === 2 ? "var(--violet-20)" : "var(--gray-10)",
                        color: ineligible ? "var(--gray-50)" : idx < 3 ? (idx === 0 ? "white" : "var(--violet-80)") : "var(--gray-60)",
                        fontSize: 11, fontWeight: 700,
                      }}>
                        {ineligible ? "—" : idx + 1}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        {photo
                          ? <img src={photo} style={{ width: 32, height: 32, borderRadius: 6, objectFit: "cover", flexShrink: 0 }} referrerPolicy="no-referrer" />
                          : <div style={{ width: 32, height: 32, borderRadius: 6, background: "var(--violet-10)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 600, color: "var(--violet-60)", flexShrink: 0 }}>{initials(name)}</div>
                        }
                        <div>
                          <div style={{ fontWeight: 500 }}>{name}</div>
                          <div style={{ fontSize: 11, color: "var(--gray-60)" }}>{r["Email"] ?? ""}</div>
                        </div>
                      </div>
                    </td>
                    <td>{r["Tour Date"] || "—"}</td>
                    <td>
                      {r["Schedule"]
                        ? String(r["Schedule"]).split(", ").map((s) => (
                            <span key={s} className="badge badge-violet" style={{ fontSize: 10, marginRight: 4 }}>{s}</span>
                          ))
                        : <span style={{ color: "var(--gray-40)", fontSize: 12 }}>—</span>}
                    </td>
                    <td>
                      {score > 0 ? (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                          <span style={{ fontWeight: 600 }}>{score}</span>
                          {ineligible && (
                            <span className="badge badge-red" style={{ fontSize: 10 }}>Ineligible</span>
                          )}
                        </span>
                      ) : "—"}
                    </td>
                    <td>
                      <span className={`badge ${dtClear ? "badge-green" : dtRaw ? "badge-orange" : "badge-gray"}`} style={{ fontSize: 10 }}>
                        {dtClear ? "Clear" : dtRaw || "—"}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${docSigned === "Y" ? "badge-green" : docSigned ? "badge-orange" : "badge-gray"}`} style={{ fontSize: 10 }}>
                        {docSigned === "Y" ? "Signed" : docSigned || "—"}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${bgcClear ? "badge-green" : bgcRaw ? "badge-orange" : "badge-gray"}`} style={{ fontSize: 10 }}>
                        {bgcClear ? "Clear" : bgcRaw || "Pending"}
                      </span>
                    </td>
                    <td>
                      {consoleLink
                        ? <a href={consoleLink} target="_blank" rel="noreferrer" style={{ color: "var(--violet-60)", textDecoration: "none", fontSize: 12 }}>Open ↗</a>
                        : "—"}
                    </td>
                    <td>
                      <input
                        className="inline-date"
                        type="date"
                        value={state.startDate}
                        disabled={ineligible}
                        onChange={(e) => setRow(r._rowIndex, { startDate: e.target.value })}
                      />
                    </td>
                    <td>
                      <select
                        className="inline-select"
                        value={state.schedule}
                        disabled={ineligible}
                        onChange={(e) => setRow(r._rowIndex, { schedule: e.target.value })}
                      >
                        <option value="">—</option>
                        {SHIFTS.map((s) => <option key={s}>{s}</option>)}
                      </select>
                    </td>
                    <td>
                      <select
                        className="inline-select"
                        value={state.nameSent}
                        disabled={ineligible}
                        onChange={(e) => setRow(r._rowIndex, { nameSent: e.target.value })}
                      >
                        <option value="">—</option>
                        <option value="Y">Y</option>
                        <option value="N">N</option>
                      </select>
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <button
                          disabled={isSaving || ineligible}
                          onClick={() => saveRow(r)}
                          style={{
                            height: 28, padding: "0 12px", borderRadius: 6,
                            background: ineligible ? "var(--gray-20)" : "var(--violet-60)",
                            color: ineligible ? "var(--gray-50)" : "white",
                            fontFamily: "Poppins, sans-serif", fontSize: 11, fontWeight: 500,
                            border: "none",
                            cursor: ineligible ? "not-allowed" : "pointer",
                          }}
                        >
                          {isSaving ? "…" : "Save"}
                        </button>
                        {saved[r._rowIndex] && <span style={{ fontSize: 11, color: "var(--green-70)" }}>Saved ✓</span>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {sendToast && (
        <div style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 999,
          background: sendToast.type === "error" ? "var(--red-70)" : "var(--midnight-100)",
          color: "white", padding: "12px 20px", borderRadius: 10,
          fontSize: 13, fontWeight: 500,
        }}>
          {sendToast.msg}
        </div>
      )}
    </div>
  );
}
