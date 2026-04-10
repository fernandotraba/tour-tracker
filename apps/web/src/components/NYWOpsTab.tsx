import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getTourRecords, updateTourRecord } from "../api";
import type { TourRecord } from "@tour-tracker/shared";

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

interface RowState { paid: string; bgc: string; }

export default function NYWOpsTab() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["records"], queryFn: getTourRecords });
  const [rowState, setRowState] = useState<Record<number, RowState>>({});
  const [saved, setSaved] = useState<Record<number, boolean>>({});

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
      paid: String(r["Paid for tour?"] ?? ""),
      bgc: String(r["BG Results Clear?"] ?? r["BGC Results"] ?? ""),
    };
  }

  function setRow(rowIndex: number, update: Partial<RowState>) {
    setRowState((s) => ({ ...s, [rowIndex]: { ...getRow({ _rowIndex: rowIndex } as TourRecord), ...update } }));
  }

  const records = (data ?? [])
    .filter((r) => (r["Worker name"] || r["Worker Name"]) && r["Turned Away"] !== "Y");

  if (isLoading) return <div style={{ padding: 24, color: "var(--gray-60)" }}><span className="spinner" /> Loading…</div>;

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: "var(--midnight-100)", marginBottom: 4 }}>NY WOps Queue</div>
        <div style={{ fontSize: 12, color: "var(--gray-60)" }}>Fill in Paid for Tour and BGC Results</div>
      </div>

      {!records.length ? (
        <div style={{ textAlign: "center", padding: "48px 24px", color: "var(--gray-60)" }}>No tour records found</div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Worker</th>
                <th>Tour Date</th>
                <th>Score</th>
                <th>DT Clear</th>
                <th>Paid for Tour</th>
                <th>Essential BG Results</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {records.map((r) => {
                const name = String(r["Worker name"] || r["Worker Name"] || "—");
                const photo = r["Worker Picture"] ?? "";
                const scoreRaw = r["Candidate Score (1-10)"] ?? "";
                const scoreN = parseFloat(String(scoreRaw));
                const scoreIneligible = !isNaN(scoreN) && scoreN > 0 && scoreN < 5;
                const dtClear = r["DT Results Clear"] ?? "";
                const state = getRow(r);
                const isSaving = updateMutation.isPending && updateMutation.variables?.rowIndex === r._rowIndex;

                return (
                  <tr key={r._rowIndex}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        {photo
                          ? <img src={photo} style={{ width: 32, height: 32, borderRadius: 6, objectFit: "cover", flexShrink: 0 }} />
                          : <div style={{ width: 32, height: 32, borderRadius: 6, background: "var(--violet-10)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 600, color: "var(--violet-60)", flexShrink: 0 }}>{initials(name)}</div>
                        }
                        <div style={{ fontWeight: 500 }}>{name}</div>
                      </div>
                    </td>
                    <td>{r["Tour Date"] || "—"}</td>
                    <td>
                      {scoreRaw ? (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                          <span style={{ fontWeight: 600 }}>{scoreRaw}</span>
                          {scoreIneligible && (
                            <span className="badge badge-red" style={{ fontSize: 10 }}>Ineligible</span>
                          )}
                        </span>
                      ) : "—"}
                    </td>
                    <td>
                      <span className={`badge ${dtClear === "Y" ? "badge-green" : dtClear === "N" ? "badge-red" : "badge-gray"}`} style={{ fontSize: 10 }}>
                        {dtClear || "—"}
                      </span>
                    </td>
                    <td>
                      <select className="inline-select" value={state.paid} onChange={(e) => setRow(r._rowIndex, { paid: e.target.value })}>
                        <option value="">—</option>
                        <option value="Y">Y</option>
                        <option value="N">N</option>
                      </select>
                    </td>
                    <td>
                      <select className="inline-select" value={state.bgc} onChange={(e) => setRow(r._rowIndex, { bgc: e.target.value })}>
                        <option value="">—</option>
                        <option value="Y">Y</option>
                        <option value="N">N</option>
                        <option value="Pending">Pending</option>
                      </select>
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <button
                          disabled={isSaving}
                          onClick={() =>
                            updateMutation.mutate({
                              rowIndex: r._rowIndex,
                              payload: { "Paid for tour?": state.paid, "BG Results Clear?": state.bgc },
                            })
                          }
                          style={{
                            height: 28, padding: "0 12px", borderRadius: 6,
                            background: "var(--violet-60)", color: "white",
                            fontFamily: "Poppins, sans-serif", fontSize: 11, fontWeight: 500,
                            border: "none", cursor: "pointer",
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
    </div>
  );
}
