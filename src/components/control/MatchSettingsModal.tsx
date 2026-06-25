"use client";

import { useEffect, useState } from "react";
import type { Clock } from "@/models/MatchState";

export interface ClockConfigUpdate {
  direction?: "up" | "down";
  durationSeconds?: number | null;
  overtimeMode?: "off" | "fixed" | "automatic";
  overtimeAllowanceSeconds?: number;
}

export interface MatchSettingsModalProps {
  open: boolean;
  onClose: () => void;
  homeTeamName: string;
  awayTeamName: string;
  // Two-leg tie support — these are the OTHER leg(s)' totals, not this
  // leg's score (that's tracked live by TeamPanel). The overlay adds them
  // together for the on-air "AGG" total. Set-once-before-kickoff config,
  // not something touched every match, so it lives here rather than in
  // the live operational panels.
  aggregateEnabled: boolean;
  aggregateHomeScore: number;
  aggregateAwayScore: number;
  onAggregateToggle: () => void;
  onAggregateScoreChange: (side: "home" | "away", delta: number) => void;
  // Clock setup — moved here from a second settings surface inside
  // ClockModule itself, so there's exactly one place for "configure the
  // match" instead of two (gear icon here, tune icon there).
  clock: Clock;
  onClockConfigChange: (config: ClockConfigUpdate) => void;
  // "End Match" locks the document (see route.ts) — this is the deliberate
  // escape hatch for operator error, separate from the regular patch flow
  // so it can't happen by accident.
  locked: boolean;
  onUnlock: () => void;
}

function ToggleButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 text-[10px] font-bold rounded transition-all ${
        active ? "bg-tertiary text-on-tertiary" : "text-on-surface-variant hover:text-on-surface"
      }`}
    >
      {children}
    </button>
  );
}

export function MatchSettingsModal({
  open,
  onClose,
  homeTeamName,
  awayTeamName,
  aggregateEnabled,
  aggregateHomeScore,
  aggregateAwayScore,
  onAggregateToggle,
  onAggregateScoreChange,
  clock,
  onClockConfigChange,
  locked,
  onUnlock,
}: MatchSettingsModalProps) {
  const [durationMinutes, setDurationMinutes] = useState(String(Math.floor((clock.durationSeconds ?? 0) / 60)));
  const [durationSeconds, setDurationSeconds] = useState(
    String((clock.durationSeconds ?? 0) % 60).padStart(2, "0")
  );
  const [allowanceMinutes, setAllowanceMinutes] = useState(
    String(Math.round(clock.overtime.allowanceSeconds / 60) || 6)
  );
  const [confirmingUnlock, setConfirmingUnlock] = useState(false);

  // Re-sync the duration inputs from the live clock each time the modal
  // opens — otherwise a stale typed value from a previous open could
  // overwrite a duration that changed elsewhere (e.g. a match reset) the
  // next time the operator blurs the field. Adjusted during render (React's
  // documented pattern for "reset state when a prop changes") rather than
  // in an effect, so the reset lands in the same pass as the render that
  // needs it.
  const [prevOpen, setPrevOpen] = useState(false);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      const total = clock.durationSeconds ?? 0;
      setDurationMinutes(String(Math.floor(total / 60)));
      setDurationSeconds(String(total % 60).padStart(2, "0"));
    }
  }

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  function commitDuration() {
    const m = parseInt(durationMinutes, 10) || 0;
    const s = parseInt(durationSeconds, 10) || 0;
    onClockConfigChange({ durationSeconds: m * 60 + s });
  }

  function clearDuration() {
    setDurationMinutes("0");
    setDurationSeconds("0");
    onClockConfigChange({ durationSeconds: null });
  }

  function handleUnlockClick() {
    if (!confirmingUnlock) {
      setConfirmingUnlock(true);
      setTimeout(() => setConfirmingUnlock(false), 4000);
      return;
    }
    setConfirmingUnlock(false);
    onUnlock();
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-6"
      onClick={onClose}
    >
      <div
        className="bg-surface-container-low border border-outline-variant rounded-2xl p-6 w-full max-w-md shadow-2xl max-h-[85vh] overflow-y-auto custom-scrollbar"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
            Match Settings
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

        <div className="space-y-5">
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-tertiary">Clock</h4>

          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
              Direction
            </span>
            <div className="flex bg-surface-container p-1 rounded-lg border border-outline-variant">
              <ToggleButton active={clock.direction === "up"} onClick={() => onClockConfigChange({ direction: "up" })}>
                Count Up
              </ToggleButton>
              <ToggleButton
                active={clock.direction === "down"}
                onClick={() => onClockConfigChange({ direction: "down" })}
              >
                Count Down
              </ToggleButton>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3">
            <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
              Period Length
            </span>
            <div className="flex items-center gap-1.5">
              <input
                className="w-12 bg-surface-container-low border border-outline-variant rounded text-center text-xs py-1.5 text-on-surface"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                onBlur={commitDuration}
                inputMode="numeric"
                aria-label="Period minutes"
              />
              <span className="text-on-surface-variant text-xs">:</span>
              <input
                className="w-12 bg-surface-container-low border border-outline-variant rounded text-center text-xs py-1.5 text-on-surface"
                value={durationSeconds}
                onChange={(e) => setDurationSeconds(e.target.value)}
                onBlur={commitDuration}
                inputMode="numeric"
                aria-label="Period seconds"
              />
              <button
                type="button"
                onClick={clearDuration}
                title="No fixed length (plain stopwatch)"
                className="material-symbols-outlined text-sm text-on-surface-variant hover:text-error ml-1"
              >
                close
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
              Overtime
            </span>
            <div className="flex bg-surface-container p-1 rounded-lg border border-outline-variant">
              <ToggleButton
                active={clock.overtime.mode === "off"}
                onClick={() => onClockConfigChange({ overtimeMode: "off" })}
              >
                Off
              </ToggleButton>
              <ToggleButton
                active={clock.overtime.mode === "fixed"}
                onClick={() =>
                  onClockConfigChange({
                    overtimeMode: "fixed",
                    overtimeAllowanceSeconds: (parseInt(allowanceMinutes, 10) || 0) * 60,
                  })
                }
              >
                Fixed
              </ToggleButton>
              <ToggleButton
                active={clock.overtime.mode === "automatic"}
                onClick={() => onClockConfigChange({ overtimeMode: "automatic" })}
              >
                Auto
              </ToggleButton>
            </div>
          </div>

          {clock.overtime.mode === "fixed" && (
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-on-surface-variant">Allowance (minutes)</span>
              <input
                className="w-16 bg-surface-container-low border border-outline-variant rounded text-center text-xs py-1.5 text-on-surface"
                value={allowanceMinutes}
                onChange={(e) => setAllowanceMinutes(e.target.value)}
                onBlur={() =>
                  onClockConfigChange({ overtimeAllowanceSeconds: (parseInt(allowanceMinutes, 10) || 0) * 60 })
                }
                inputMode="numeric"
                aria-label="Overtime allowance in minutes"
              />
            </div>
          )}
        </div>

        <div className="mt-7 pt-5 border-t border-outline-variant">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
              Aggregate Score (Two-Leg Tie)
            </span>
            <button
              type="button"
              onClick={onAggregateToggle}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase transition-all ${
                aggregateEnabled
                  ? "border-tertiary bg-tertiary-container text-tertiary-fixed-dim active-glow-tertiary"
                  : "border-outline-variant bg-surface-container-high hover:border-primary"
              }`}
            >
              <span className="material-symbols-outlined text-sm">scoreboard</span>
              {aggregateEnabled ? "On" : "Off"}
            </button>
          </div>

          {aggregateEnabled && (
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-2">
                <span className="text-[10px] text-on-surface-variant uppercase block text-center">
                  {homeTeamName} — Prior Legs
                </span>
                <div className="flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => onAggregateScoreChange("home", -1)}
                    className="w-8 h-8 rounded-lg bg-surface-container-high border border-outline-variant flex items-center justify-center hover:border-primary"
                  >
                    <span className="material-symbols-outlined text-sm">remove</span>
                  </button>
                  <span className="w-8 text-center text-sm font-bold text-on-surface tabular-nums">
                    {aggregateHomeScore}
                  </span>
                  <button
                    type="button"
                    onClick={() => onAggregateScoreChange("home", 1)}
                    className="w-8 h-8 rounded-lg bg-surface-container-high border border-outline-variant flex items-center justify-center hover:border-primary"
                  >
                    <span className="material-symbols-outlined text-sm">add</span>
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <span className="text-[10px] text-on-surface-variant uppercase block text-center">
                  {awayTeamName} — Prior Legs
                </span>
                <div className="flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => onAggregateScoreChange("away", -1)}
                    className="w-8 h-8 rounded-lg bg-surface-container-high border border-outline-variant flex items-center justify-center hover:border-primary"
                  >
                    <span className="material-symbols-outlined text-sm">remove</span>
                  </button>
                  <span className="w-8 text-center text-sm font-bold text-on-surface tabular-nums">
                    {aggregateAwayScore}
                  </span>
                  <button
                    type="button"
                    onClick={() => onAggregateScoreChange("away", 1)}
                    className="w-8 h-8 rounded-lg bg-surface-container-high border border-outline-variant flex items-center justify-center hover:border-primary"
                  >
                    <span className="material-symbols-outlined text-sm">add</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {locked && (
          <div className="mt-7 pt-5 border-t border-outline-variant">
            <div className="flex items-center justify-between gap-3 mb-3">
              <span className="text-[10px] font-bold uppercase tracking-widest text-error">
                Match Ended — Locked
              </span>
            </div>
            <p className="text-[11px] text-on-surface-variant mb-3">
              This match is locked and no longer accepts changes. Unlock only to correct a mistake.
            </p>
            <button
              type="button"
              onClick={handleUnlockClick}
              className={`w-full py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
                confirmingUnlock
                  ? "bg-error text-on-error"
                  : "bg-error/10 text-error border border-error/30 hover:bg-error/20"
              }`}
            >
              {confirmingUnlock ? "Tap again to confirm unlock" : "Unlock Match"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
