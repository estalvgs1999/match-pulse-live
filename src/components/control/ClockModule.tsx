"use client";

import { useEffect, useRef, useState } from "react";
import { formatMatchClock, visiblePenaltyWindow } from "@/lib/format";
import { deriveClockDisplay } from "@/lib/clock-display";
import type { Clock, PenaltyResult } from "@/models/MatchState";

export interface ClockModuleProps {
  clock: Clock;
  elapsedSeconds: number;
  period: string;
  onStart: () => void;
  onPause: () => void;
  onSync: (elapsedSeconds: number) => void;
  // Penalty shootout replaces the clock view entirely while active — a
  // shootout doesn't run off the match clock, so there's nothing useful
  // to show alongside it. See onExitPenalties for how it closes.
  gameMode: "normal" | "penalties";
  homePenalties: PenaltyResult[];
  awayPenalties: PenaltyResult[];
  homeTeamName: string;
  awayTeamName: string;
  onPenaltyChange: (side: "home" | "away", index: number, value: PenaltyResult) => void;
  onExitPenalties: () => void;
}

function PenaltyButton({ result, onClick }: { result: PenaltyResult; onClick: () => void }) {
  if (result === 1) {
    return (
      <button
        type="button"
        className="w-11 h-11 md:w-14 md:h-14 rounded-lg border-2 border-tertiary bg-tertiary/20 flex items-center justify-center"
        onClick={onClick}
      >
        <span className="material-symbols-outlined text-xl md:text-2xl text-tertiary">check</span>
      </button>
    );
  }
  if (result === 2) {
    return (
      <button
        type="button"
        className="w-11 h-11 md:w-14 md:h-14 rounded-lg border-2 border-error bg-error/20 flex items-center justify-center"
        onClick={onClick}
      >
        <span className="material-symbols-outlined text-xl md:text-2xl text-error">close</span>
      </button>
    );
  }
  return (
    <button
      type="button"
      className="w-11 h-11 md:w-14 md:h-14 rounded-lg border border-outline-variant bg-surface-container hover:border-primary transition-colors"
      onClick={onClick}
    />
  );
}

export function ClockModule({
  clock,
  elapsedSeconds,
  period,
  onStart,
  onPause,
  onSync,
  gameMode,
  homePenalties,
  awayPenalties,
  homeTeamName,
  awayTeamName,
  onPenaltyChange,
  onExitPenalties,
}: ClockModuleProps) {
  const [editing, setEditing] = useState(false);
  const [minutes, setMinutes] = useState("0");
  const [seconds, setSeconds] = useState("0");

  const isRunning = clock.status === "running";
  const { primarySeconds, overtimeSeconds, inOvertime, overtimeExpired } = deriveClockDisplay(
    elapsedSeconds,
    clock
  );

  // Manual edit always corrects the *regulation* clock — in countdown mode
  // the operator types remaining time (what's on screen), which we convert
  // to elapsed seconds before calling onSync (whose contract never changed).
  function openEditor() {
    const total =
      clock.direction === "down"
        ? Math.max(0, Math.round((clock.durationSeconds ?? 0) - elapsedSeconds))
        : Math.round(elapsedSeconds);
    setMinutes(String(Math.floor(total / 60)));
    setSeconds(String(total % 60).padStart(2, "0"));
    setEditing(true);
  }

  function confirmEdit() {
    const m = parseInt(minutes, 10) || 0;
    const s = parseInt(seconds, 10) || 0;
    const entered = m * 60 + s;
    const elapsedToSync =
      clock.direction === "down" ? Math.max(0, (clock.durationSeconds ?? 0) - entered) : entered;
    onSync(elapsedToSync);
    setEditing(false);
  }

  const allPenaltiesDecided =
    homePenalties.every((r) => r !== 0) && awayPenalties.every((r) => r !== 0);

  // onExitPenalties is a fresh inline closure on every LiveConsole render
  // (which happens every second from its wall-clock display) — keeping it
  // out of the effect's deps via a ref means the scheduled timer below
  // isn't cancelled and restarted on every one of those unrelated
  // re-renders, which previously meant it could never actually reach
  // 1500ms and fire.
  const onExitPenaltiesRef = useRef(onExitPenalties);
  useEffect(() => {
    onExitPenaltiesRef.current = onExitPenalties;
  }, [onExitPenalties]);

  // Auto-close once every round is decided for both sides — a brief pause
  // so the operator sees the final dot land before the view switches back,
  // not an instant cut. onExitPenalties is also reachable manually (Back
  // to Match) at any point, since a shootout can be over early (e.g. 3-0
  // after 3 rounds) or need extending past what auto-detection covers.
  useEffect(() => {
    if (gameMode !== "penalties" || !allPenaltiesDecided) return;
    const timer = setTimeout(() => onExitPenaltiesRef.current(), 1500);
    return () => clearTimeout(timer);
  }, [gameMode, allPenaltiesDecided]);

  if (gameMode === "penalties") {
    // The array grows past 5 during sudden death (see MatchState), but the
    // operator's editing grid windows to 5 too — same queue behavior as
    // the broadcast graphic. Clicks map back to the real array index
    // (offset + i), not the 0-4 display position, so they land on the
    // round actually being shown.
    const homeWindow = visiblePenaltyWindow(homePenalties);
    const homeOffset = homePenalties.length - homeWindow.length;
    const awayWindow = visiblePenaltyWindow(awayPenalties);
    const awayOffset = awayPenalties.length - awayWindow.length;
    const suddenDeath = homePenalties.length > 5;

    return (
      <div className="glass-panel rounded-2xl p-5 md:p-8 flex-1 flex flex-col items-center justify-center relative overflow-hidden">
        <div className="flex items-center justify-between w-full mb-5 md:mb-7">
          <span className="text-xs font-bold uppercase tracking-[0.3em] text-on-surface-variant">
            Penalty Shootout{suddenDeath ? ` — Sudden Death · Round ${homePenalties.length}` : ""}
          </span>
          <button
            type="button"
            onClick={onExitPenalties}
            className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-on-surface-variant hover:text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
            Back to Match
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-8 w-full">
          <div className="space-y-3 md:space-y-4">
            <span className="text-xs text-on-surface-variant uppercase block text-center">{homeTeamName}</span>
            <div className="flex justify-center gap-1.5 md:gap-3">
              {homeWindow.map((result, i) => (
                <PenaltyButton
                  key={homeOffset + i}
                  result={result}
                  onClick={() => onPenaltyChange("home", homeOffset + i, ((result + 1) % 3) as PenaltyResult)}
                />
              ))}
            </div>
          </div>
          <div className="space-y-3 md:space-y-4">
            <span className="text-xs text-on-surface-variant uppercase block text-center">{awayTeamName}</span>
            <div className="flex justify-center gap-1.5 md:gap-3">
              {awayWindow.map((result, i) => (
                <PenaltyButton
                  key={awayOffset + i}
                  result={result}
                  onClick={() => onPenaltyChange("away", awayOffset + i, ((result + 1) % 3) as PenaltyResult)}
                />
              ))}
            </div>
          </div>
        </div>
        {allPenaltiesDecided && (
          <p className="text-xs font-bold uppercase tracking-widest text-tertiary mt-7">
            Shootout complete — returning to match...
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-2xl p-5 md:p-8 flex-1 flex flex-col items-center justify-center relative overflow-hidden">
      <div className="z-10 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <span className={`w-2 h-2 rounded-full bg-tertiary ${isRunning ? "animate-pulse" : ""}`} />
          <span className="text-xs text-on-surface-variant uppercase tracking-[0.3em]">
            {inOvertime ? "Overtime" : "Live Match Time"}
          </span>
          <span className="px-2.5 py-1 rounded bg-surface-container border border-outline-variant text-xs font-bold text-tertiary tabular-nums">
            {period}
          </span>
        </div>
        <h2 className="text-[60px] md:text-[84px] lg:text-[108px] leading-none font-headline font-black digital-font text-on-background drop-shadow-2xl">
          {formatMatchClock(primarySeconds)}
        </h2>
        {inOvertime && (
          <div className="inline-flex items-center gap-2 mt-2 px-3 py-1 rounded-full border border-[#e8780c] bg-[#e8780c]/10">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#e8780c]">Extra Time</span>
            <span className="text-sm font-bold digital-font text-[#e8780c]">
              +{formatMatchClock(overtimeSeconds)}
            </span>
          </div>
        )}
        {overtimeExpired && (
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#e8780c] mt-2">
            Overtime allowance reached
          </p>
        )}

        {editing ? (
          <div className="flex items-center justify-center gap-2 mt-7">
            <input
              className="w-16 bg-surface-container-low border border-outline-variant rounded-lg py-2 text-center text-on-surface"
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
              inputMode="numeric"
              aria-label="Minutes"
            />
            <span className="text-on-surface-variant">:</span>
            <input
              className="w-16 bg-surface-container-low border border-outline-variant rounded-lg py-2 text-center text-on-surface"
              value={seconds}
              onChange={(e) => setSeconds(e.target.value)}
              inputMode="numeric"
              aria-label="Seconds"
            />
            <button
              type="button"
              className="px-4 py-2 bg-primary text-on-primary rounded-lg text-xs font-bold"
              onClick={confirmEdit}
            >
              Set
            </button>
            <button
              type="button"
              className="px-4 py-2 bg-surface-container-highest border border-outline-variant rounded-lg text-xs font-bold"
              onClick={() => setEditing(false)}
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-5 mt-7">
            <button
              type="button"
              className="w-16 h-16 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all"
              onClick={isRunning ? onPause : onStart}
              aria-label={isRunning ? "Pause clock" : "Start clock"}
            >
              <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                {isRunning ? "pause" : "play_arrow"}
              </span>
            </button>
            <button
              type="button"
              className="w-12 h-12 rounded-full bg-surface-container-highest border border-outline-variant text-on-surface flex items-center justify-center hover:bg-surface-variant transition-all active:scale-95"
              onClick={() => onSync(0)}
              aria-label="Reset clock"
            >
              <span className="material-symbols-outlined text-xl">restart_alt</span>
            </button>
            <button
              type="button"
              className="w-12 h-12 rounded-full bg-surface-container-highest border border-outline-variant text-on-surface flex items-center justify-center hover:bg-surface-variant transition-all active:scale-95"
              onClick={openEditor}
              aria-label="Edit clock"
            >
              <span className="material-symbols-outlined text-xl">edit</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
