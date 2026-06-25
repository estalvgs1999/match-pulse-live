"use client";

import { useState } from "react";
import { DEFAULT_TEAM_LOGO } from "@/components/shared/defaultLogo";
import { PlayerPickerModal } from "./PlayerPickerModal";
import { LineupEditorModal } from "./LineupEditorModal";
import type { Team, RosterPlayer } from "@/models/Team";

export interface TeamPanelProps {
  team: Team | null;
  side: "home" | "away";
  score: number;
  fouls: number;
  redCards: number;
  yellowCards: number;
  onScoreChange: (delta: number) => void;
  onFoulsChange: (delta: number) => void;
  onRedCardAdd: (player: RosterPlayer) => void;
  onRedCardRemove: () => void;
  onYellowCardAdd: (player: RosterPlayer) => void;
  onYellowCardRemove: () => void;
  onGoalScorer: (player: RosterPlayer) => void;
  lineupStarting: number[];
  lineupCaptain: number | null;
  lineupCurrentPlayer: number | null;
  onLineupToggleStarting: (number: number) => void;
  onLineupSetCaptain: (number: number | null) => void;
  onLineupSetCurrentPlayer: (number: number | null) => void;
  className?: string;
}

const BORDER_BY_SIDE = { home: "border-primary", away: "border-secondary" } as const;
const LABEL_BY_SIDE = { home: "Local Team", away: "Away Team" } as const;

type ActiveModal = "goal" | "redCard" | "yellowCard" | null;

export function TeamPanel({
  team,
  side,
  score,
  fouls,
  redCards,
  yellowCards,
  onScoreChange,
  onFoulsChange,
  onRedCardAdd,
  onRedCardRemove,
  onYellowCardAdd,
  onYellowCardRemove,
  onGoalScorer,
  lineupStarting,
  lineupCaptain,
  lineupCurrentPlayer,
  onLineupToggleStarting,
  onLineupSetCaptain,
  onLineupSetCurrentPlayer,
  className,
}: TeamPanelProps) {
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [lineupOpen, setLineupOpen] = useState(false);

  // Full name here — plenty of room, and it's clearer for the operator than
  // the 3-4 letter broadcast code shown on the overlay (see MainBug).
  const name = (team?.name ?? team?.shortName ?? (side === "home" ? "HOME" : "AWAY")).toUpperCase();
  const accentColor = team?.colors.accent ?? "#67f58b";

  function handleSelect(player: RosterPlayer) {
    if (activeModal === "goal") onGoalScorer(player);
    if (activeModal === "redCard") onRedCardAdd(player);
    if (activeModal === "yellowCard") onYellowCardAdd(player);
    setActiveModal(null);
  }

  const modalTitle =
    activeModal === "goal"
      ? "Quick Select Scorer"
      : activeModal === "redCard"
        ? "Select Player — Red Card"
        : "Select Player — Yellow Card";

  return (
    <section className={`col-span-1 lg:col-span-3 lg:h-full flex flex-col gap-3${className ? ` ${className}` : ""}`}>
      <div className="glass-panel rounded-xl p-4 md:p-6 flex-1 flex flex-col items-center justify-between gap-4 md:gap-5">
        <div className={`w-16 h-16 md:w-20 md:h-20 rounded-full border-2 ${BORDER_BY_SIDE[side]} bg-surface-container p-2`}>
          <img className="w-full h-full object-contain" src={team?.logoUrl || DEFAULT_TEAM_LOGO} alt="" />
        </div>
        <div className="text-center">
          <h3 className="font-headline font-bold text-2xl leading-tight">{name}</h3>
          <span className="text-xs text-on-surface-variant uppercase tracking-widest">
            {LABEL_BY_SIDE[side]}
          </span>
        </div>

        {/* Goal Counter */}
        <div className="flex items-center justify-between w-full bg-surface-container-highest rounded-lg p-2.5 border border-outline-variant">
          <button
            type="button"
            className="w-12 h-12 md:w-14 md:h-14 flex items-center justify-center rounded text-2xl bg-surface-container hover:bg-error/20 text-error transition-colors"
            onClick={() => onScoreChange(-1)}
            aria-label="Decrease score"
          >
            -
          </button>
          <span className="text-5xl md:text-6xl font-headline font-black digital-font">{score}</span>
          <button
            type="button"
            className="w-12 h-12 md:w-14 md:h-14 flex items-center justify-center rounded text-2xl bg-surface-container hover:bg-tertiary/20 text-tertiary transition-colors"
            onClick={() => onScoreChange(1)}
            aria-label="Increase score"
          >
            +
          </button>
        </div>

        <button
          type="button"
          onClick={() => setActiveModal("goal")}
          className="w-full flex items-center justify-between bg-surface-container border border-outline-variant px-4 py-3 rounded-lg text-sm text-left hover:border-primary transition-colors"
        >
          <span className="text-on-surface-variant uppercase text-xs tracking-widest">Goal Scorer</span>
          <span className="material-symbols-outlined">add_circle</span>
        </button>

        {/* Fouls + Cards, merged into one row — was two stacked border-t
            blocks (with a 5-dot foul bar), now a single 3-up grid so the
            column doesn't grow taller than the viewport. */}
        <div className="w-full pt-5 border-t border-outline-variant grid grid-cols-3 gap-3">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] text-on-surface-variant uppercase">Fouls</span>
              <span className="text-base font-bold text-tertiary">{fouls}</span>
            </div>
            <div className="flex gap-1.5">
              <button
                type="button"
                className="flex-1 material-symbols-outlined text-on-surface-variant hover:text-error bg-surface-container-highest rounded-lg py-2.5"
                onClick={() => onFoulsChange(-1)}
                aria-label="Decrease fouls"
              >
                remove
              </button>
              <button
                type="button"
                className="flex-1 material-symbols-outlined text-on-surface-variant hover:text-tertiary bg-surface-container-highest rounded-lg py-2.5"
                onClick={() => onFoulsChange(1)}
                aria-label="Increase fouls"
              >
                add
              </button>
            </div>
          </div>
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] text-on-surface-variant uppercase">Red</span>
              <span className="text-base font-bold text-error">{redCards}</span>
            </div>
            <div className="flex gap-1.5">
              <button
                type="button"
                className="flex-1 material-symbols-outlined text-on-surface-variant hover:text-error disabled:opacity-30 disabled:hover:text-on-surface-variant bg-surface-container-highest rounded-lg py-2.5"
                onClick={onRedCardRemove}
                disabled={redCards === 0}
                aria-label="Remove red card"
              >
                remove
              </button>
              <button
                type="button"
                className="flex-1 material-symbols-outlined text-on-surface-variant hover:text-error bg-surface-container-highest rounded-lg py-2.5"
                onClick={() => setActiveModal("redCard")}
                aria-label="Add red card"
              >
                add
              </button>
            </div>
          </div>
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] text-on-surface-variant uppercase">Yellow</span>
              <span className="text-base font-bold text-[#f5c518]">{yellowCards}</span>
            </div>
            <div className="flex gap-1.5">
              <button
                type="button"
                className="flex-1 material-symbols-outlined text-on-surface-variant hover:text-[#f5c518] disabled:opacity-30 disabled:hover:text-on-surface-variant bg-surface-container-highest rounded-lg py-2.5"
                onClick={onYellowCardRemove}
                disabled={yellowCards === 0}
                aria-label="Remove yellow card"
              >
                remove
              </button>
              <button
                type="button"
                className="flex-1 material-symbols-outlined text-on-surface-variant hover:text-[#f5c518] bg-surface-container-highest rounded-lg py-2.5"
                onClick={() => setActiveModal("yellowCard")}
                aria-label="Add yellow card"
              >
                add
              </button>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setLineupOpen(true)}
          className="w-full flex items-center justify-between bg-surface-container border border-outline-variant px-4 py-3 rounded-lg text-sm text-left hover:border-primary transition-colors"
        >
          <span className="text-on-surface-variant uppercase text-xs tracking-widest">
            Lineup ({lineupStarting.length}/5)
          </span>
          <span className="material-symbols-outlined">groups</span>
        </button>
      </div>

      <PlayerPickerModal
        open={activeModal !== null}
        title={modalTitle}
        players={team?.roster ?? []}
        accentColor={accentColor}
        onSelect={handleSelect}
        onClose={() => setActiveModal(null)}
      />

      <LineupEditorModal
        open={lineupOpen}
        onClose={() => setLineupOpen(false)}
        team={team}
        accentColor={accentColor}
        startingNumbers={lineupStarting}
        captainNumber={lineupCaptain}
        currentPlayerNumber={lineupCurrentPlayer}
        onToggleStarting={onLineupToggleStarting}
        onSetCaptain={onLineupSetCaptain}
        onSetCurrentPlayer={onLineupSetCurrentPlayer}
      />
    </section>
  );
}
