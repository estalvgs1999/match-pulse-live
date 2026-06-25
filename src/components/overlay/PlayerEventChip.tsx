"use client";

import styles from "./PlayerEventChip.module.css";
import type { PlayerEvent } from "@/lib/pusher-shared";

export interface PlayerEventChipProps {
  event: PlayerEvent | null;
  /** Accent color of the team the event belongs to (for the GOAL badge). */
  teamColor: string;
}

function cx(...classes: Array<string | false | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

const LABEL_BY_TYPE: Record<PlayerEvent["type"], string> = {
  goal: "Goal Scorer",
  redCard: "Red Card",
  yellowCard: "Yellow Card",
};

export function PlayerEventChip({ event, teamColor }: PlayerEventChipProps) {
  const visible = event !== null;

  return (
    <div className={cx(styles.wrapper, visible && styles.wrapperVisible)}>
      {event?.type === "goal" ? (
        <div className={styles.badge} style={{ backgroundColor: teamColor }}>
          <span className={styles.badgeText}>GOAL</span>
        </div>
      ) : (
        <div className={styles.cardIconWrap}>
          {visible && (
            <div
              className={cx(styles.cardIcon, event?.type === "yellowCard" && styles.cardIconYellow)}
            />
          )}
        </div>
      )}
      <div className={styles.info}>
        <span className={styles.eventLabel}>{event ? LABEL_BY_TYPE[event.type] : ""}</span>
        <div className={styles.playerLine}>
          <span className={styles.number}>#{event?.number ?? ""}</span>
          <span className={styles.name}>{event?.name ?? ""}</span>
        </div>
      </div>
    </div>
  );
}
