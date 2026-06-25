"use client";

import { useEffect, useRef, useState } from "react";
import type { BracketMatchup, BracketRound, StandingsRow } from "@/models/MatchState";

export interface StandingsEditorModalProps {
  open: boolean;
  onClose: () => void;
  format: "league" | "bracket";
  onFormatChange: (format: "league" | "bracket") => void;
  rows: StandingsRow[];
  onRowsChange: (rows: StandingsRow[]) => void;
  rounds: BracketRound[];
  onRoundsChange: (rounds: BracketRound[]) => void;
  onGoLive?: () => void;
  isLive?: boolean;
}

const EMPTY_ROW: StandingsRow = { team: "", played: 0, won: 0, drawn: 0, lost: 0, points: 0 };
const EMPTY_MATCHUP: BracketMatchup = { teamA: "", teamB: "", scoreA: null, scoreB: null };

export function StandingsEditorModal({
  open,
  onClose,
  format,
  onFormatChange,
  rows,
  onRowsChange,
  rounds,
  onRoundsChange,
  onGoLive,
  isLive = false,
}: StandingsEditorModalProps) {
  // Local copies — isolated from Pusher wholesale-replaces while the modal is open.
  // Synced to parent on blur (text fields) or on discrete operations (add/remove/numbers).
  const [localRows, setLocalRows] = useState<StandingsRow[]>([]);
  const [localRounds, setLocalRounds] = useState<BracketRound[]>([]);

  // Refs track the latest value synchronously so onBlur handlers flush
  // the correct data even if the handler is called before React commits
  // the setState from onChange.
  const latestRows = useRef(localRows);
  const latestRounds = useRef(localRounds);
  latestRows.current = localRows;
  latestRounds.current = localRounds;

  // Snapshot props into local state each time the modal opens.
  // Intentionally excludes rows/rounds from the dep array — we do not want
  // incoming Pusher updates to stomp the operator's in-progress edits.
  useEffect(() => {
    if (!open) return;
    setLocalRows(rows);
    setLocalRounds(rounds);
    latestRows.current = rows;
    latestRounds.current = rounds;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  // --- League row helpers ---

  function updateRowLocal(index: number, patch: Partial<StandingsRow>) {
    const updated = latestRows.current.map((r, i) => (i === index ? { ...r, ...patch } : r));
    latestRows.current = updated;
    setLocalRows(updated);
  }

  function flushRows() {
    onRowsChange(latestRows.current);
  }

  function updateRowAndFlush(index: number, patch: Partial<StandingsRow>) {
    const updated = latestRows.current.map((r, i) => (i === index ? { ...r, ...patch } : r));
    latestRows.current = updated;
    setLocalRows(updated);
    onRowsChange(updated);
  }

  function removeRow(index: number) {
    const updated = latestRows.current.filter((_, i) => i !== index);
    latestRows.current = updated;
    setLocalRows(updated);
    onRowsChange(updated);
  }

  function addRow() {
    const updated = [...latestRows.current, { ...EMPTY_ROW }];
    latestRows.current = updated;
    setLocalRows(updated);
    onRowsChange(updated);
  }

  // --- Bracket round helpers ---

  function updateMatchupLocal(ri: number, mi: number, patch: Partial<BracketMatchup>) {
    const updated = latestRounds.current.map((round, i) =>
      i === ri
        ? { ...round, matchups: round.matchups.map((m, j) => (j === mi ? { ...m, ...patch } : m)) }
        : round
    );
    latestRounds.current = updated;
    setLocalRounds(updated);
  }

  function flushRounds() {
    onRoundsChange(latestRounds.current);
  }

  function updateMatchupAndFlush(ri: number, mi: number, patch: Partial<BracketMatchup>) {
    const updated = latestRounds.current.map((round, i) =>
      i === ri
        ? { ...round, matchups: round.matchups.map((m, j) => (j === mi ? { ...m, ...patch } : m)) }
        : round
    );
    latestRounds.current = updated;
    setLocalRounds(updated);
    onRoundsChange(updated);
  }

  function updateRoundNameLocal(ri: number, name: string) {
    const updated = latestRounds.current.map((r, i) => (i === ri ? { ...r, name } : r));
    latestRounds.current = updated;
    setLocalRounds(updated);
  }

  function removeMatchup(ri: number, mi: number) {
    const updated = latestRounds.current.map((r, i) =>
      i === ri ? { ...r, matchups: r.matchups.filter((_, j) => j !== mi) } : r
    );
    latestRounds.current = updated;
    setLocalRounds(updated);
    onRoundsChange(updated);
  }

  function removeRound(ri: number) {
    const updated = latestRounds.current.filter((_, i) => i !== ri);
    latestRounds.current = updated;
    setLocalRounds(updated);
    onRoundsChange(updated);
  }

  function addMatchup(ri: number) {
    const updated = latestRounds.current.map((r, i) =>
      i === ri ? { ...r, matchups: [...r.matchups, { ...EMPTY_MATCHUP }] } : r
    );
    latestRounds.current = updated;
    setLocalRounds(updated);
    onRoundsChange(updated);
  }

  function addRound() {
    const updated = [...latestRounds.current, { name: `Round ${latestRounds.current.length + 1}`, matchups: [] }];
    latestRounds.current = updated;
    setLocalRounds(updated);
    onRoundsChange(updated);
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-6"
      onClick={onClose}
    >
      <div
        className="bg-surface-container-low border border-outline-variant rounded-2xl p-6 w-full max-w-2xl shadow-2xl max-h-[85vh] overflow-y-auto custom-scrollbar"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
            Standings Editor
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="material-symbols-outlined text-on-surface-variant hover:text-on-surface"
          >
            close
          </button>
        </div>

        <div className="flex bg-surface-container p-1 rounded-lg border border-outline-variant w-fit mb-6">
          <button
            type="button"
            onClick={() => onFormatChange("league")}
            className={`px-4 py-1.5 text-[10px] font-bold rounded transition-all ${
              format === "league" ? "bg-tertiary text-on-tertiary" : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            League
          </button>
          <button
            type="button"
            onClick={() => onFormatChange("bracket")}
            className={`px-4 py-1.5 text-[10px] font-bold rounded transition-all ${
              format === "bracket" ? "bg-tertiary text-on-tertiary" : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            Bracket
          </button>
        </div>

        {onGoLive && (
          <div className="flex items-center justify-between mb-5 pb-5 border-b border-outline-variant">
            <span className="text-xs text-on-surface-variant">
              {isLive ? "Graphic is on air" : "Configure data, then send to overlay"}
            </span>
            <button
              type="button"
              onClick={() => { onGoLive(); onClose(); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
                isLive
                  ? "border border-tertiary bg-tertiary-container text-tertiary-fixed-dim active-glow-tertiary"
                  : "bg-tertiary text-on-tertiary hover:opacity-90"
              }`}
            >
              <span className="material-symbols-outlined text-sm">
                {isLive ? "sensors" : "play_circle"}
              </span>
              {isLive ? "En Aire" : "Mostrar en pantalla"}
            </button>
          </div>
        )}

        {format === "league" ? (
          <div className="space-y-2">
            <div className="grid grid-cols-[1fr_repeat(5,40px)_28px] gap-2 text-[9px] font-bold uppercase text-on-surface-variant px-1">
              <span>Team</span>
              <span className="text-center">PJ</span>
              <span className="text-center">G</span>
              <span className="text-center">E</span>
              <span className="text-center">P</span>
              <span className="text-center">Pts</span>
              <span />
            </div>
            {localRows.map((row, i) => (
              <div key={i} className="grid grid-cols-[1fr_repeat(5,40px)_28px] gap-2 items-center">
                <input
                  type="text"
                  aria-label="Team name"
                  className="bg-surface-container-low border border-outline-variant rounded px-2 py-1.5 text-xs text-on-surface"
                  value={row.team}
                  onChange={(e) => updateRowLocal(i, { team: e.target.value })}
                  onBlur={flushRows}
                />
                <input
                  type="number"
                  inputMode="numeric"
                  aria-label="Played"
                  className="w-full bg-surface-container-low border border-outline-variant rounded text-center text-xs py-1.5 text-on-surface"
                  value={row.played}
                  onChange={(e) => updateRowAndFlush(i, { played: parseInt(e.target.value, 10) || 0 })}
                />
                <input
                  type="number"
                  inputMode="numeric"
                  aria-label="Won"
                  className="w-full bg-surface-container-low border border-outline-variant rounded text-center text-xs py-1.5 text-on-surface"
                  value={row.won}
                  onChange={(e) => updateRowAndFlush(i, { won: parseInt(e.target.value, 10) || 0 })}
                />
                <input
                  type="number"
                  inputMode="numeric"
                  aria-label="Drawn"
                  className="w-full bg-surface-container-low border border-outline-variant rounded text-center text-xs py-1.5 text-on-surface"
                  value={row.drawn}
                  onChange={(e) => updateRowAndFlush(i, { drawn: parseInt(e.target.value, 10) || 0 })}
                />
                <input
                  type="number"
                  inputMode="numeric"
                  aria-label="Lost"
                  className="w-full bg-surface-container-low border border-outline-variant rounded text-center text-xs py-1.5 text-on-surface"
                  value={row.lost}
                  onChange={(e) => updateRowAndFlush(i, { lost: parseInt(e.target.value, 10) || 0 })}
                />
                <input
                  type="number"
                  inputMode="numeric"
                  aria-label="Points"
                  className="w-full bg-surface-container-low border border-outline-variant rounded text-center text-xs py-1.5 text-on-surface"
                  value={row.points}
                  onChange={(e) => updateRowAndFlush(i, { points: parseInt(e.target.value, 10) || 0 })}
                />
                <button
                  type="button"
                  onClick={() => removeRow(i)}
                  aria-label="Remove row"
                  className="material-symbols-outlined text-sm text-on-surface-variant hover:text-error"
                >
                  close
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addRow}
              className="w-full mt-2 py-2 rounded-lg border border-outline-variant bg-surface-container-high text-[10px] font-bold uppercase text-on-surface-variant hover:border-primary transition-all"
            >
              + Add Row
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            {localRounds.map((round, ri) => (
              <div key={ri} className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    aria-label="Round name"
                    className="flex-1 bg-surface-container-low border border-outline-variant rounded px-2 py-1.5 text-xs font-bold text-on-surface"
                    value={round.name}
                    onChange={(e) => updateRoundNameLocal(ri, e.target.value)}
                    onBlur={flushRounds}
                  />
                  <button
                    type="button"
                    onClick={() => removeRound(ri)}
                    aria-label="Remove round"
                    className="material-symbols-outlined text-sm text-on-surface-variant hover:text-error"
                  >
                    close
                  </button>
                </div>
                {round.matchups.map((m, mi) => (
                  <div key={mi} className="grid grid-cols-[1fr_36px_1fr_36px_28px] gap-2 items-center pl-3">
                    <input
                      type="text"
                      aria-label="Team A"
                      className="bg-surface-container-low border border-outline-variant rounded px-2 py-1.5 text-xs text-on-surface"
                      value={m.teamA}
                      onChange={(e) => updateMatchupLocal(ri, mi, { teamA: e.target.value })}
                      onBlur={flushRounds}
                    />
                    <input
                      type="number"
                      aria-label="Score A"
                      className="bg-surface-container-low border border-outline-variant rounded text-center text-xs py-1.5 text-on-surface"
                      value={m.scoreA ?? ""}
                      onChange={(e) =>
                        updateMatchupAndFlush(ri, mi, {
                          scoreA: e.target.value === "" ? null : parseInt(e.target.value, 10),
                        })
                      }
                    />
                    <input
                      type="text"
                      aria-label="Team B"
                      className="bg-surface-container-low border border-outline-variant rounded px-2 py-1.5 text-xs text-on-surface"
                      value={m.teamB}
                      onChange={(e) => updateMatchupLocal(ri, mi, { teamB: e.target.value })}
                      onBlur={flushRounds}
                    />
                    <input
                      type="number"
                      aria-label="Score B"
                      className="bg-surface-container-low border border-outline-variant rounded text-center text-xs py-1.5 text-on-surface"
                      value={m.scoreB ?? ""}
                      onChange={(e) =>
                        updateMatchupAndFlush(ri, mi, {
                          scoreB: e.target.value === "" ? null : parseInt(e.target.value, 10),
                        })
                      }
                    />
                    <button
                      type="button"
                      onClick={() => removeMatchup(ri, mi)}
                      aria-label="Remove matchup"
                      className="material-symbols-outlined text-sm text-on-surface-variant hover:text-error"
                    >
                      close
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addMatchup(ri)}
                  className="ml-3 px-3 py-1 rounded-md border border-outline-variant bg-surface-container-high text-[9px] font-bold uppercase text-on-surface-variant hover:border-primary transition-all"
                >
                  + Add Matchup
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addRound}
              className="w-full py-2 rounded-lg border border-outline-variant bg-surface-container-high text-[10px] font-bold uppercase text-on-surface-variant hover:border-primary transition-all"
            >
              + Add Round
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
