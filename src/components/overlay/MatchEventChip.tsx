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

function toRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function MatchEventChip({ timeoutActive, timeoutTeam, replayActive }: MatchEventChipProps) {
  const teamColor = timeoutTeam?.color ?? "#67f58b";

  return (
    <div className={styles.container}>
      <div
        className={cx(styles.timeoutBanner, timeoutActive && styles.timeoutBannerVisible)}
        style={{
          background: [
            `radial-gradient(ellipse 60% 170% at 0% 50%, ${toRgba(teamColor, 0.18)} 0%, transparent 55%)`,
            "#0c120e",
          ].join(", "),
        }}
      >
        {/* Solid accent strip in team color */}
        <div
          className={styles.timeoutAccent}
          style={{ backgroundColor: teamColor }}
        />
        <div className={styles.timeoutInfo}>
          <span className={styles.timeoutLabel} style={{ color: teamColor }}>
            Timeout
          </span>
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
