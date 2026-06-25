"use client";

import { useEffect } from "react";
import type { RosterPlayer } from "@/models/Team";

export interface PlayerPickerModalProps {
  open: boolean;
  title: string;
  players: RosterPlayer[];
  accentColor: string;
  onSelect: (player: RosterPlayer) => void;
  onClose: () => void;
}

export function PlayerPickerModal({
  open,
  title,
  players,
  accentColor,
  onSelect,
  onClose,
}: PlayerPickerModalProps) {
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
        className="bg-surface-container-low border border-outline-variant rounded-2xl p-6 w-full max-w-sm shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="material-symbols-outlined text-on-surface-variant hover:text-on-surface"
          >
            close
          </button>
        </div>

        {players.length === 0 ? (
          <p className="text-xs text-on-surface-variant text-center py-6">No roster loaded</p>
        ) : (
          <div className="grid grid-cols-4 gap-3 max-h-[60vh] overflow-y-auto custom-scrollbar p-1 -m-1">
            {players.map((player) => (
              <button
                key={player.number}
                type="button"
                onClick={() => onSelect(player)}
                title={player.name}
                aria-label={`#${player.number} ${player.name}`}
                className="aspect-square rounded-full border-2 flex items-center justify-center text-lg font-black transition-transform active:scale-95 hover:scale-105"
                style={{
                  borderColor: accentColor,
                  color: accentColor,
                  backgroundColor: `${accentColor}1a`,
                }}
              >
                {player.number}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
