"use client";

import { useEffect } from "react";
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
}

const EMPTY_ROW: StandingsRow = { team: "", played: 0, won: 0, drawn: 0, lost: 0, points: 0 };
const EMPTY_MATCHUP: BracketMatchup = { teamA: "", teamB: "", scoreA: null, scoreB: null };

function numberField(
  value: number,
  onChange: (next: number) => void,
  label: string
) {
  return (
    <input
      type="number"
      inputMode="numeric"
      aria-label={label}
      className="w-12 bg-surface-container-low border border-outline-variant rounded text-center text-xs py-1.5 text-on-surface"
      value={value}
      onChange={(e) => onChange(parseInt(e.target.value, 10) || 0)}
    />
  );
}

export function StandingsEditorModal({
  open,
  onClose,
  format,
  onFormatChange,
  rows,
  onRowsChange,
  rounds,
  onRoundsChange,
}: StandingsEditorModalProps) {
  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  function updateRow(index: number, patch: Partial<StandingsRow>) {
    onRowsChange(rows.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  function updateMatchup(roundIndex: number, matchupIndex: number, patch: Partial<typeof EMPTY_MATCHUP>) {
    onRoundsChange(
      rounds.map((round, i) =>
        i === roundIndex
          ? { ...round, matchups: round.matchups.map((m, j) => (j === matchupIndex ? { ...m, ...patch } : m)) }
          : round
      )
    );
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
            {rows.map((row, i) => (
              <div key={i} className="grid grid-cols-[1fr_repeat(5,40px)_28px] gap-2 items-center">
                <input
                  type="text"
                  aria-label="Team name"
                  className="bg-surface-container-low border border-outline-variant rounded px-2 py-1.5 text-xs text-on-surface"
                  value={row.team}
                  onChange={(e) => updateRow(i, { team: e.target.value })}
                />
                {numberField(row.played, (v) => updateRow(i, { played: v }), "Played")}
                {numberField(row.won, (v) => updateRow(i, { won: v }), "Won")}
                {numberField(row.drawn, (v) => updateRow(i, { drawn: v }), "Drawn")}
                {numberField(row.lost, (v) => updateRow(i, { lost: v }), "Lost")}
                {numberField(row.points, (v) => updateRow(i, { points: v }), "Points")}
                <button
                  type="button"
                  onClick={() => onRowsChange(rows.filter((_, idx) => idx !== i))}
                  aria-label="Remove row"
                  className="material-symbols-outlined text-sm text-on-surface-variant hover:text-error"
                >
                  close
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => onRowsChange([...rows, { ...EMPTY_ROW }])}
              className="w-full mt-2 py-2 rounded-lg border border-outline-variant bg-surface-container-high text-[10px] font-bold uppercase text-on-surface-variant hover:border-primary transition-all"
            >
              + Add Row
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            {rounds.map((round, ri) => (
              <div key={ri} className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    aria-label="Round name"
                    className="flex-1 bg-surface-container-low border border-outline-variant rounded px-2 py-1.5 text-xs font-bold text-on-surface"
                    value={round.name}
                    onChange={(e) =>
                      onRoundsChange(rounds.map((r, i) => (i === ri ? { ...r, name: e.target.value } : r)))
                    }
                  />
                  <button
                    type="button"
                    onClick={() => onRoundsChange(rounds.filter((_, i) => i !== ri))}
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
                      onChange={(e) => updateMatchup(ri, mi, { teamA: e.target.value })}
                    />
                    <input
                      type="number"
                      aria-label="Score A"
                      className="bg-surface-container-low border border-outline-variant rounded text-center text-xs py-1.5 text-on-surface"
                      value={m.scoreA ?? ""}
                      onChange={(e) =>
                        updateMatchup(ri, mi, { scoreA: e.target.value === "" ? null : parseInt(e.target.value, 10) })
                      }
                    />
                    <input
                      type="text"
                      aria-label="Team B"
                      className="bg-surface-container-low border border-outline-variant rounded px-2 py-1.5 text-xs text-on-surface"
                      value={m.teamB}
                      onChange={(e) => updateMatchup(ri, mi, { teamB: e.target.value })}
                    />
                    <input
                      type="number"
                      aria-label="Score B"
                      className="bg-surface-container-low border border-outline-variant rounded text-center text-xs py-1.5 text-on-surface"
                      value={m.scoreB ?? ""}
                      onChange={(e) =>
                        updateMatchup(ri, mi, { scoreB: e.target.value === "" ? null : parseInt(e.target.value, 10) })
                      }
                    />
                    <button
                      type="button"
                      onClick={() =>
                        onRoundsChange(
                          rounds.map((r, i) =>
                            i === ri ? { ...r, matchups: r.matchups.filter((_, j) => j !== mi) } : r
                          )
                        )
                      }
                      aria-label="Remove matchup"
                      className="material-symbols-outlined text-sm text-on-surface-variant hover:text-error"
                    >
                      close
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    onRoundsChange(
                      rounds.map((r, i) => (i === ri ? { ...r, matchups: [...r.matchups, { ...EMPTY_MATCHUP }] } : r))
                    )
                  }
                  className="ml-3 px-3 py-1 rounded-md border border-outline-variant bg-surface-container-high text-[9px] font-bold uppercase text-on-surface-variant hover:border-primary transition-all"
                >
                  + Add Matchup
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => onRoundsChange([...rounds, { name: `Round ${rounds.length + 1}`, matchups: [] }])}
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
