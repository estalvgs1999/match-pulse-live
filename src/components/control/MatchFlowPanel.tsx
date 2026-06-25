"use client";

import { useState } from "react";
import type { MatchStatus, MatchState } from "@/models/MatchState";

type ActiveGraphic = MatchState["activeGraphic"];
type HtftTitle = MatchState["htftTitle"];

export interface MatchFlowSelectOptions {
  timeoutSide?: "home" | "away";
  // Extra time has its own duration, distinct from the regular halves —
  // the operator sets it right when starting ET1/ET2, not in advance.
  extraTimeDurationMinutes?: number;
}

export interface MatchFlowPanelProps {
  status: MatchStatus;
  homeTeamName: string;
  awayTeamName: string;
  onSelectStatus: (status: MatchStatus, options?: MatchFlowSelectOptions) => void;
  onReset: () => void;
  // Graphics — merged in here instead of a separate card, since almost
  // every one of these is a direct consequence of (or fine-tune on top of)
  // the match phase above; a separate switcher meant two places to control
  // "what's on screen" that could disagree with each other.
  activeGraphic: ActiveGraphic;
  onSelectGraphic: (graphic: ActiveGraphic) => void;
  htftTitle: HtftTitle;
  onHtftTitleChange: (title: HtftTitle) => void;
  replayActive: boolean;
  onToggleReplay: () => void;
  // Drives the "switch to penalties?" prompt below — only relevant once
  // regulation/extra time has actually run out, not something the operator
  // should have to go hunting for in Session Mode at that exact moment.
  gameMode: MatchState["gameMode"];
  onEnterPenalties: () => void;
  lineupSide: "home" | "away";
  onLineupSideChange: (side: "home" | "away") => void;
  onOpenStandingsEditor: () => void;
  onOpenStatsEditor: () => void;
}

const GRAPHIC_STEPS: Array<{ graphic: ActiveGraphic; label: string; icon: string }> = [
  { graphic: "bug", label: "Score", icon: "scoreboard" },
  { graphic: "htft", label: "HT / FT", icon: "campaign" },
  { graphic: "prematch", label: "Pre-Match", icon: "sports" },
  { graphic: "lineups", label: "Lineups", icon: "groups" },
  { graphic: "standings", label: "Standings", icon: "leaderboard" },
  { graphic: "stats", label: "Stats", icon: "bar_chart" },
  { graphic: "none", label: "Hide", icon: "visibility_off" },
];

const HTFT_TITLES: HtftTitle[] = ["HALF TIME", "FULL TIME", "PENALTIES"];
const DEFAULT_EXTRA_TIME_MINUTES = 5;

export function MatchFlowPanel({
  status,
  homeTeamName,
  awayTeamName,
  onSelectStatus,
  onReset,
  activeGraphic,
  onSelectGraphic,
  htftTitle,
  onHtftTitleChange,
  replayActive,
  onToggleReplay,
  gameMode,
  onEnterPenalties,
  lineupSide,
  onLineupSideChange,
  onOpenStandingsEditor,
  onOpenStatsEditor,
}: MatchFlowPanelProps) {
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [pickingTimeoutSide, setPickingTimeoutSide] = useState(false);
  // Which extra-time phase is about to start (set when the operator taps
  // the Extra Time step), null when not currently prompting.
  const [pickingExtraTime, setPickingExtraTime] = useState<"extra_time" | "extra_time_2" | null>(null);
  const [extraTimeMinutes, setExtraTimeMinutes] = useState(String(DEFAULT_EXTRA_TIME_MINUTES));

  // Time's up and the score is whatever it is — only the operator knows if
  // this competition actually goes to penalties, so this is an offer, not
  // an automatic transition.
  const offerPenalties =
    gameMode === "normal" && (status === "full_time" || status === "extra_time" || status === "extra_time_2");

  // One slot in the grid does double duty as "Extra Time" / "Extra Time 2"
  // depending on where the match already is — ET2 only makes sense once
  // ET1 has happened.
  const extraTimeTarget: "extra_time" | "extra_time_2" = status === "extra_time" ? "extra_time_2" : "extra_time";
  const extraTimeLabel = extraTimeTarget === "extra_time_2" ? "Extra Time 2" : "Extra Time";
  const extraTimeIsActive = status === "extra_time" || status === "extra_time_2";

  const STEPS: Array<{ status: MatchStatus; label: string; icon: string }> = [
    { status: "in_progress", label: "Kickoff", icon: "sports_soccer" },
    { status: "timeout", label: "Timeout", icon: "pan_tool" },
    { status: "half_time", label: "Half Time", icon: "pause_circle" },
    { status: extraTimeTarget, label: extraTimeLabel, icon: "more_time" },
    { status: "full_time", label: "Full Time", icon: "flag" },
    { status: "ended", label: "End Match", icon: "stop_circle" },
  ];

  function handleStepClick(step: MatchStatus) {
    if (step === "timeout") {
      // Already in a timeout — tapping again means "resume play", same as
      // any other phase button would feel like. Otherwise ask which team
      // called it, since the overlay chip needs that.
      if (status === "timeout") {
        onSelectStatus("in_progress");
      } else {
        setPickingTimeoutSide(true);
      }
      return;
    }
    if (step === "extra_time" || step === "extra_time_2") {
      setExtraTimeMinutes(String(DEFAULT_EXTRA_TIME_MINUTES));
      setPickingExtraTime(step);
      return;
    }
    onSelectStatus(step);
  }

  function pickTimeoutSide(side: "home" | "away") {
    setPickingTimeoutSide(false);
    onSelectStatus("timeout", { timeoutSide: side });
  }

  function confirmExtraTime() {
    if (!pickingExtraTime) return;
    const minutes = parseInt(extraTimeMinutes, 10) || DEFAULT_EXTRA_TIME_MINUTES;
    onSelectStatus(pickingExtraTime, { extraTimeDurationMinutes: minutes });
    setPickingExtraTime(null);
  }

  function handleResetClick() {
    if (!confirmingReset) {
      setConfirmingReset(true);
      setTimeout(() => setConfirmingReset(false), 4000);
      return;
    }
    setConfirmingReset(false);
    onReset();
  }

  return (
    <div className="glass-panel rounded-xl p-4 md:p-6 flex-1 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-bold uppercase tracking-widest text-on-surface-variant">
          Match Flow
        </h4>
        <span className="text-xs font-bold uppercase tracking-widest text-tertiary">
          {status.replace(/_/g, " ")}
        </span>
      </div>

      {/* This block fills whatever vertical room the panel has (it's the
          flex-1 child of a flex-col parent) and spreads its two grids out
          with justify-center + a generous gap, instead of bunching them at
          the top and leaving dead space below — the Reset button (outside
          this block) then naturally lands at the bottom of the panel. */}
      <div className="flex-1 flex flex-col justify-center gap-6">
        {pickingTimeoutSide ? (
          <div>
            <p className="text-xs text-on-surface-variant uppercase tracking-widest mb-3 text-center">
              Which team called it?
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => pickTimeoutSide("home")}
                className="py-4 rounded-xl border border-primary bg-primary-container/20 text-on-surface text-sm font-bold uppercase hover:bg-primary-container/40 transition-all"
              >
                {homeTeamName}
              </button>
              <button
                type="button"
                onClick={() => pickTimeoutSide("away")}
                className="py-4 rounded-xl border border-secondary bg-secondary-container/40 text-on-surface text-sm font-bold uppercase hover:bg-secondary-container/70 transition-all"
              >
                {awayTeamName}
              </button>
            </div>
            <button
              type="button"
              onClick={() => setPickingTimeoutSide(false)}
              className="w-full mt-3 text-xs text-on-surface-variant hover:text-on-surface uppercase tracking-widest"
            >
              Cancel
            </button>
          </div>
        ) : pickingExtraTime ? (
          <div>
            <p className="text-xs text-on-surface-variant uppercase tracking-widest mb-3 text-center">
              {pickingExtraTime === "extra_time_2" ? "Extra Time 2" : "Extra Time"} length (minutes)
            </p>
            <div className="flex items-center justify-center gap-3 mb-3">
              <input
                type="number"
                inputMode="numeric"
                aria-label="Extra time minutes"
                className="w-20 bg-surface-container-low border border-outline-variant rounded-lg py-2 text-center text-on-surface text-lg font-bold"
                value={extraTimeMinutes}
                onChange={(e) => setExtraTimeMinutes(e.target.value)}
                autoFocus
              />
              <button
                type="button"
                onClick={confirmExtraTime}
                className="px-4 py-2 bg-tertiary text-on-tertiary rounded-lg text-xs font-bold uppercase"
              >
                Start
              </button>
            </div>
            <button
              type="button"
              onClick={() => setPickingExtraTime(null)}
              className="w-full text-xs text-on-surface-variant hover:text-on-surface uppercase tracking-widest"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2 md:gap-3">
            {STEPS.map((step) => {
              const isActive = step.status === extraTimeTarget ? extraTimeIsActive : status === step.status;
              return (
                <button
                  key={step.label}
                  type="button"
                  onClick={() => handleStepClick(step.status)}
                  className={`flex flex-col items-center gap-1.5 p-3 md:p-4 rounded-xl border transition-all ${
                    isActive
                      ? "border-tertiary bg-tertiary-container text-tertiary-fixed-dim active-glow-tertiary"
                      : "border-outline-variant bg-surface-container-high hover:border-primary"
                  }`}
                >
                  <span className="material-symbols-outlined text-2xl">{step.icon}</span>
                  <span className="text-[10px] font-bold uppercase text-center leading-tight">{step.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {offerPenalties && (
          <div className="flex items-center justify-between gap-3 p-3 rounded-xl border border-tertiary/40 bg-tertiary-container/15">
            <span className="text-xs font-bold text-on-surface">
              Time&apos;s up — go to penalties?
            </span>
            <button
              type="button"
              onClick={onEnterPenalties}
              className="shrink-0 px-3 py-2 rounded-lg bg-tertiary text-on-tertiary text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-opacity"
            >
              Switch to Penalties
            </button>
          </div>
        )}

        {/* Graphics — same state-machine grid language as the phase steps
            above: each button is a literal value of activeGraphic, tapping
            one selects it outright (mutually exclusive, like the steps).
            Per-graphic fine-tunes appear below the grid, contextually, only
            for whichever graphic is currently selected. */}
        <div className="pt-5 border-t border-outline-variant">
          <div className="flex items-center justify-between mb-3">
            <h5 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
              On Air Graphic
            </h5>
            <button
              type="button"
              onClick={onToggleReplay}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase transition-all ${
                replayActive
                  ? "border-tertiary bg-tertiary-container text-tertiary-fixed-dim active-glow-tertiary"
                  : "border-outline-variant bg-surface-container-high hover:border-primary"
              }`}
            >
              <span className="material-symbols-outlined text-sm">live_tv</span>
              {replayActive ? "Replay On" : "Replay"}
            </button>
          </div>

          <div className="grid grid-cols-4 md:grid-cols-7 gap-2 md:gap-3 mb-3">
            {GRAPHIC_STEPS.map((step) => {
              const isActive = activeGraphic === step.graphic;
              return (
                <button
                  key={step.graphic}
                  type="button"
                  onClick={() => onSelectGraphic(activeGraphic === step.graphic ? "none" : step.graphic)}
                  className={`flex flex-col items-center gap-1.5 p-3 md:p-4 rounded-xl border transition-all ${
                    isActive
                      ? "border-tertiary bg-tertiary-container text-tertiary-fixed-dim active-glow-tertiary"
                      : "border-outline-variant bg-surface-container-high hover:border-primary"
                  }`}
                >
                  <span className="material-symbols-outlined text-2xl">{step.icon}</span>
                  <span className="text-[10px] font-bold uppercase text-center leading-tight">{step.label}</span>
                </button>
              );
            })}
          </div>

          {activeGraphic === "htft" && (
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                HT / FT Title
              </span>
              <div className="flex bg-surface-container p-1 rounded-lg border border-outline-variant">
                {HTFT_TITLES.map((title) => (
                  <button
                    key={title}
                    type="button"
                    onClick={() => onHtftTitleChange(title)}
                    className={`px-3 py-2 text-xs font-bold rounded transition-all ${
                      htftTitle === title
                        ? "bg-tertiary text-on-tertiary"
                        : "text-on-surface-variant hover:text-on-surface"
                    }`}
                  >
                    {title}
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeGraphic === "lineups" && (
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                Lineup Side
              </span>
              <div className="flex bg-surface-container p-1 rounded-lg border border-outline-variant">
                <button
                  type="button"
                  onClick={() => onLineupSideChange("home")}
                  className={`px-3 py-2 text-xs font-bold rounded transition-all ${
                    lineupSide === "home" ? "bg-tertiary text-on-tertiary" : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  {homeTeamName}
                </button>
                <button
                  type="button"
                  onClick={() => onLineupSideChange("away")}
                  className={`px-3 py-2 text-xs font-bold rounded transition-all ${
                    lineupSide === "away" ? "bg-tertiary text-on-tertiary" : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  {awayTeamName}
                </button>
              </div>
            </div>
          )}

          {activeGraphic === "standings" && (
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                Standings Data
              </span>
              <button
                type="button"
                onClick={onOpenStandingsEditor}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-outline-variant bg-surface-container-high hover:border-primary text-xs font-bold uppercase transition-all"
              >
                <span className="material-symbols-outlined text-sm">edit</span>
                Edit
              </button>
            </div>
          )}

          {activeGraphic === "stats" && (
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                Stats Data
              </span>
              <button
                type="button"
                onClick={onOpenStatsEditor}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-outline-variant bg-surface-container-high hover:border-primary text-xs font-bold uppercase transition-all"
              >
                <span className="material-symbols-outlined text-sm">edit</span>
                Edit
              </button>
            </div>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={handleResetClick}
        className={`w-full mt-5 py-3 rounded-lg text-sm font-bold uppercase tracking-widest transition-all ${
          confirmingReset
            ? "bg-error text-on-error"
            : "bg-error/10 text-error border border-error/30 hover:bg-error/20"
        }`}
      >
        {confirmingReset ? "Tap again to confirm reset" : "Reset Match"}
      </button>
    </div>
  );
}
