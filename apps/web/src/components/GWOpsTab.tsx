import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getTourRecords, updateTourRecord } from "../api";
import type { TourRecord } from "@tour-tracker/shared";

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

interface RowState {
  startDate: string;
  nameSent: string;
  addedToShifts: string;
}

export default function GWOpsTab() {
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
      startDate: String(r["Start Date"] ?? ""),
      nameSent: String(r["Name sent on list"] ?? ""),
      addedToShifts: String(r["Added to Shifts"] ?? r["Added to shifts?"] ?? ""),
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
        "Name sent on list": state.nameSent,
        "Added to Shifts": state.addedToShifts,
      },
    });
  }

  const records = (data ?? []).filter((r) => r["Worker name"] || r["Worker Name"]);

  if (isLoading) return <div style={{ padding: 24, color: "var(--gray-60)" }}><span className="spinner" /> Loading…</div>;

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: "var(--midnight-100)", marginBottom: 4 }}>GWOps Queue</div>
        <div style={{ fontSize: 12, color: "var(--gray-60)" }}>Fill in Start Date, Name Sent on List, and Added to Shifts</div>
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
                <th>BGC</th>
                <th>Console</th>
                <th>Start Date</th>
                <th>Name Sent</th>
                <th>Added to Shifts</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {records.map((r) => {
                const name = String(r["Worker name"] || r["Worker Name"] || "—");
                const photo = r["Worker Picture"] ?? "";
                const consoleLink = r["Console Link"] ?? "";
                const bgcRaw = r["BG Results Clear?"] ?? r["BGC Results"] ?? "";
                const bgcClear = bgcRaw === "Y" || bgcRaw === "ELIGIBLE";
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
                        <div>
                          <div style={{ fontWeight: 500 }}>{name}</div>
                          <div style={{ fontSize: 11, color: "var(--gray-60)" }}>{r["Email"] ?? ""}</div>
                        </div>
                      </div>
                    </td>
                    <td>{r["Tour Date"] || "—"}</td>
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
                    <td><input className="inline-date" type="date" value={state.startDate} onChange={(e) => setRow(r._rowIndex, { startDate: e.target.value })} /></td>
                    <td>
                      <select className="inline-select" value={state.nameSent} onChange={(e) => setRow(r._rowIndex, { nameSent: e.target.value })}>
                        <option value="">—</option>
                        <option value="Y">Y</option>
                        <option value="N">N</option>
                      </select>
                    </td>
                    <td>
                      <select className="inline-select" value={state.addedToShifts} onChange={(e) => setRow(r._rowIndex, { addedToShifts: e.target.value })}>
                        <option value="">—</option>
                        <option value="Y">Y</option>
                        <option value="N">N</option>
                      </select>
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <button
                          disabled={isSaving}
                          onClick={() => saveRow(r)}
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
