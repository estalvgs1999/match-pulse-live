"use client";

import { useEffect } from "react";
import type { Team } from "@/models/Team";

export interface LineupEditorModalProps {
  open: boolean;
  onClose: () => void;
  team: Team | null;
  accentColor: string;
  startingNumbers: number[];
  captainNumber: number | null;
  currentPlayerNumber: number | null;
  onToggleStarting: (number: number) => void;
  onSetCaptain: (number: number | null) => void;
  onSetCurrentPlayer: (number: number | null) => void;
}

export function LineupEditorModal({
  open,
  onClose,
  team,
  accentColor,
  startingNumbers,
  captainNumber,
  currentPlayerNumber,
  onToggleStarting,
  onSetCaptain,
  onSetCurrentPlayer,
}: LineupEditorModalProps) {
  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const roster = team?.roster ?? [];
  const startingCount = startingNumbers.length;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-6"
      onClick={onClose}
    >
      <div
        className="bg-surface-container-low border border-outline-variant rounded-2xl p-6 w-full max-w-lg shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
            Lineup Editor — {team?.name ?? ""}
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
        <p className="text-[11px] text-on-surface-variant mb-5">
          Tap a player to add/remove from the Starting 5 ({startingCount}/5). Star sets the captain, the eye sets
          who&apos;s spotlighted on the overlay right now.
        </p>

        {roster.length === 0 ? (
          <p className="text-xs text-on-surface-variant text-center py-6">No roster loaded</p>
        ) : (
          <div className="space-y-1.5 max-h-[55vh] overflow-y-auto custom-scrollbar">
            {roster.map((player) => {
              const isStarting = startingNumbers.includes(player.number);
              const isCaptain = captainNumber === player.number;
              const isCurrent = currentPlayerNumber === player.number;
              const atCap = !isStarting && startingCount >= 5;
              return (
                <div
                  key={player.number}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg border transition-all ${
                    isStarting ? "bg-tertiary-container/20" : "bg-surface-container"
                  }`}
                  style={isStarting ? { borderColor: accentColor } : { borderColor: "var(--color-outline-variant)" }}
                >
                  <button
                    type="button"
                    onClick={() => onSetCaptain(isCaptain ? null : player.number)}
                    aria-label={isCaptain ? "Remove captain" : "Set captain"}
                    className={`material-symbols-outlined text-lg shrink-0 ${
                      isCaptain ? "text-[#f5c518]" : "text-on-surface-variant hover:text-[#f5c518]"
                    }`}
                    style={isCaptain ? { fontVariationSettings: "'FILL' 1" } : undefined}
                  >
                    star
                  </button>
                  <button
                    type="button"
                    onClick={() => onSetCurrentPlayer(isCurrent ? null : player.number)}
                    aria-label={isCurrent ? "Clear spotlight" : "Spotlight this player"}
                    className={`material-symbols-outlined text-lg shrink-0 ${
                      isCurrent ? "text-primary" : "text-on-surface-variant hover:text-primary"
                    }`}
                    style={isCurrent ? { fontVariationSettings: "'FILL' 1" } : undefined}
                  >
                    visibility
                  </button>
                  <button
                    type="button"
                    onClick={() => !atCap && onToggleStarting(player.number)}
                    disabled={atCap}
                    className="flex-1 flex items-center gap-3 text-left disabled:opacity-40"
                  >
                    <span
                      className="w-7 h-7 rounded-md border flex items-center justify-center text-xs font-bold shrink-0"
                      style={{ borderColor: accentColor, color: accentColor }}
                    >
                      {player.number}
                    </span>
                    <span className="text-sm font-bold text-on-surface">{player.name}</span>
                    <span className="text-[10px] text-on-surface-variant uppercase ml-auto">
                      {player.position}
                    </span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
