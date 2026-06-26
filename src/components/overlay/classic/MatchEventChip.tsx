"use client";

import styles from "./MatchEventChip.module.css";

export interface MatchEventChipTeam {
  name: string;
  color: string;
}

export interface MatchEventChipProps {
  timeoutActive: boolean;
  timeoutTeam: MatchEventChipTeam | null;
  replayActive: boolean;
}

function cx(...classes: Array<string | false | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export function MatchEventChip({ timeoutActive, timeoutTeam, replayActive }: MatchEventChipProps) {
  return (
    <div className={styles.container}>
      <div className={cx(styles.timeoutBanner, timeoutActive && styles.timeoutBannerVisible)}>
        <div
          className={styles.timeoutAccent}
          style={{ backgroundColor: timeoutTeam?.color ?? "#67f58b" }}
        />
        <div className={styles.timeoutInfo}>
          <span className={styles.timeoutLabel}>Timeout</span>
          <span className={styles.timeoutTeam}>{timeoutTeam?.name ?? ""}</span>
        </div>
      </div>

      <div className={cx(styles.replayPill, replayActive && styles.replayPillVisible)}>
        <span className={styles.replayDot} />
        <span className={styles.replayText}>Replay</span>
      </div>
    </div>
  );
}
