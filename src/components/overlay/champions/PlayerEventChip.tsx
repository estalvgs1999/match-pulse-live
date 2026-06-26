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

const LABEL_BY_TYPE: Record<PlayerEvent["type"], string> = {
  goal: "Goal Scorer",
  redCard: "Red Card",
  yellowCard: "Yellow Card",
};

export function PlayerEventChip({ event }: PlayerEventChipProps) {
  const visible = event !== null;
  const isGoal = event?.type === "goal";
  const isYellow = event?.type === "yellowCard";

  return (
    <div className={cx(styles.wrapper, visible && styles.wrapperVisible)}>
      {/* Accent strip or card icon */}
      {isGoal ? (
        <div className={styles.badge} />
      ) : (
        visible && (
          <div className={styles.cardIconWrap}>
            <div className={cx(styles.cardIcon, isYellow && styles.cardIconYellow)} />
          </div>
        )
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
