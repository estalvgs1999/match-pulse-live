"use client";

import { useEffect } from "react";
import type { TeamStats } from "@/models/MatchState";

export interface StatsEditorModalProps {
  open: boolean;
  onClose: () => void;
  homeTeamName: string;
  awayTeamName: string;
  homeStats: TeamStats;
  awayStats: TeamStats;
  onChange: (side: "home" | "away", patch: Partial<TeamStats>) => void;
  onGoLive?: () => void;
  isLive?: boolean;
}

function Stepper({
  label,
  value,
  onChange,
  step = 1,
  min = 0,
  max,
}: {
  label: string;
  value: number;
  onChange: (next: number) => void;
  step?: number;
  min?: number;
  max?: number;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[10px] text-on-surface-variant uppercase">{label}</span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - step))}
          aria-label={`Decrease ${label}`}
          className="w-7 h-7 rounded-md bg-surface-container-high border border-outline-variant flex items-center justify-center hover:border-primary"
        >
          <span className="material-symbols-outlined text-sm">remove</span>
        </button>
        <span className="w-8 text-center text-xs font-bold text-on-surface tabular-nums">{value}</span>
        <button
          type="button"
          onClick={() => onChange(max !== undefined ? Math.min(max, value + step) : value + step)}
          aria-label={`Increase ${label}`}
          className="w-7 h-7 rounded-md bg-surface-container-high border border-outline-variant flex items-center justify-center hover:border-primary"
        >
          <span className="material-symbols-outlined text-sm">add</span>
        </button>
      </div>
    </div>
  );
}

export function StatsEditorModal({
  open,
  onClose,
  homeTeamName,
  awayTeamName,
  homeStats,
  awayStats,
  onChange,
  onGoLive,
  isLive = false,
}: StatsEditorModalProps) {
  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-6"
      onClick={onClose}
    >
      <div
        className="bg-surface-container-low border border-outline-variant rounded-2xl p-6 w-full max-w-md shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Stats Editor</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="material-symbols-outlined text-on-surface-variant hover:text-on-surface"
          >
            close
          </button>
        </div>

        {onGoLive && (
          <div className="flex items-center justify-between mb-6 pb-6 border-b border-outline-variant">
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

        <div className="grid grid-cols-2 gap-8">
          <div className="space-y-4">
            <h4 className="text-[11px] font-bold uppercase text-tertiary text-center">{homeTeamName}</h4>
            <Stepper
              label="Possession %"
              value={homeStats.possession}
              max={100}
              onChange={(v) => onChange("home", { possession: v })}
            />
            <Stepper label="Corners" value={homeStats.corners} onChange={(v) => onChange("home", { corners: v })} />
            <Stepper
              label="Total Shots"
              value={homeStats.shotsTotal}
              onChange={(v) => onChange("home", { shotsTotal: v })}
            />
            <Stepper
              label="On Target"
              value={homeStats.shotsOnTarget}
              onChange={(v) => onChange("home", { shotsOnTarget: v })}
            />
          </div>
          <div className="space-y-4">
            <h4 className="text-[11px] font-bold uppercase text-tertiary text-center">{awayTeamName}</h4>
            <Stepper
              label="Possession %"
              value={awayStats.possession}
              max={100}
              onChange={(v) => onChange("away", { possession: v })}
            />
            <Stepper label="Corners" value={awayStats.corners} onChange={(v) => onChange("away", { corners: v })} />
            <Stepper
              label="Total Shots"
              value={awayStats.shotsTotal}
              onChange={(v) => onChange("away", { shotsTotal: v })}
            />
            <Stepper
              label="On Target"
              value={awayStats.shotsOnTarget}
              onChange={(v) => onChange("away", { shotsOnTarget: v })}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
