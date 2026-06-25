"use client";

import styles from "./PlayerEventChip.module.css";
import type { PlayerEvent } from "@/lib/pusher-shared";

export interface PlayerEventChipProps {
  event: PlayerEvent | null;
  teamColor: string;
}

function cx(...classes: Array<string | false | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

function toRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Each event type has its own left-badge accent color:
// goal → team accent; red/yellow cards → their literal card color.
function badgeColor(event: PlayerEvent, teamColor: string): string {
  if (event.type === "goal") return teamColor;
  if (event.type === "redCard") return "#ff2222";
  return "#f5c518";
}

const LABEL_BY_TYPE: Record<PlayerEvent["type"], string> = {
  goal: "Goal Scorer",
  redCard: "Red Card",
  yellowCard: "Yellow Card",
};

export function PlayerEventChip({ event, teamColor }: PlayerEventChipProps) {
  const visible = event !== null;
  const accentColor = event ? badgeColor(event, teamColor) : teamColor;

  return (
    <div
      className={cx(styles.wrapper, visible && styles.wrapperVisible)}
      style={
        visible
          ? {
              boxShadow: `0 10px 24px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.07), 0 0 32px ${toRgba(accentColor, 0.3)}`,
            }
          : undefined
      }
    >
      {/* Left badge — solid accent color */}
      <div className={styles.badge} style={{ backgroundColor: accentColor }}>
        {event?.type === "goal" ? (
          <span className={styles.badgeText}>GOAL</span>
        ) : (
          <div
            className={cx(
              styles.cardIcon,
              event?.type === "yellowCard" && styles.cardIconYellow
            )}
          />
        )}
      </div>

      {/* Event info */}
      <div className={styles.info}>
        <span className={styles.eventLabel}>{event ? LABEL_BY_TYPE[event.type] : ""}</span>
        <div className={styles.playerLine}>
          {/* Number uses the accent color (team color for goals, card color for cards) */}
          <span className={styles.number} style={{ color: accentColor }}>
            #{event?.number ?? ""}
          </span>
          <span className={styles.name}>{event?.name ?? ""}</span>
        </div>
      </div>
    </div>
  );
}
