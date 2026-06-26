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
      {/* Stacked two-bar timeout lower-third */}
      <div className={cx(styles.timeoutBanner, timeoutActive && styles.timeoutBannerVisible)}>
        <div className={styles.timeoutTopBar}>
          <span className={styles.timeoutAccentDot} />
          <span className={styles.timeoutLabel}>Timeout</span>
        </div>
        <div className={styles.timeoutBottomBar}>
          <span className={styles.timeoutTeam}>{timeoutTeam?.name ?? ""}</span>
        </div>
      </div>

      {/* Replay pill */}
      <div className={cx(styles.replayPill, replayActive && styles.replayPillVisible)}>
        <span className={styles.replayDot} />
        <span className={styles.replayText}>Replay</span>
      </div>
    </div>
  );
}
