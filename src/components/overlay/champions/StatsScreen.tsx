"use client";

import styles from "./StatsScreen.module.css";
import { DEFAULT_TEAM_LOGO } from "@/components/shared/defaultLogo";
import type { TeamStats } from "@/models/MatchState";

export interface StatsScreenTeam {
  name: string;
  logoUrl?: string;
  color: string;
}

export interface StatsScreenProps {
  visible: boolean;
  homeTeam: StatsScreenTeam;
  awayTeam: StatsScreenTeam;
  homeScore: number;
  awayScore: number;
  homeFouls: number;
  awayFouls: number;
  homeRedCards: number;
  awayRedCards: number;
  homeYellowCards: number;
  awayYellowCards: number;
  homeStats: TeamStats;
  awayStats: TeamStats;
}

function cx(...classes: Array<string | false | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

function StatRow({
  label,
  home,
  away,
  format = (n: number) => String(n),
}: {
  label: string;
  home: number;
  away: number;
  format?: (n: number) => string;
}) {
  const total = home + away || 1;
  const homePct = (home / total) * 100;
  return (
    <div className={styles.statRow}>
      <div className={styles.statRowHeader}>
        <span className={styles.statValue}>{format(home)}</span>
        <span className={styles.statLabel}>{label}</span>
        <span className={styles.statValue}>{format(away)}</span>
      </div>
      <div className={styles.statBarRow}>
        <div className={styles.statBarTrack}>
          <div className={styles.statBarHome} style={{ width: `${homePct}%`, backgroundColor: "#1A56DB" }} />
          <div className={styles.statBarAway} style={{ width: `${100 - homePct}%`, backgroundColor: "rgba(91,155,255,0.3)" }} />
        </div>
      </div>
    </div>
  );
}

export function StatsScreen({
  visible,
  homeTeam,
  awayTeam,
  homeScore,
  awayScore,
  homeFouls,
  awayFouls,
  homeRedCards,
  awayRedCards,
  homeYellowCards,
  awayYellowCards,
  homeStats,
  awayStats,
}: StatsScreenProps) {
  return (
    <div className={cx(styles.wrapper, visible && styles.wrapperVisible)}>
      <div className={styles.header}>
        <div className={styles.headerTeam}>
          <div className={styles.logoWrapper}>
            <img src={homeTeam.logoUrl || DEFAULT_TEAM_LOGO} alt="" />
          </div>
          <span className={styles.headerTeamName}>{homeTeam.name}</span>
        </div>
        <span className={styles.headerLabel}>Match Stats</span>
        <div className={cx(styles.headerTeam, styles.headerTeamRight)}>
          <span className={styles.headerTeamName}>{awayTeam.name}</span>
          <div className={styles.logoWrapper}>
            <img src={awayTeam.logoUrl || DEFAULT_TEAM_LOGO} alt="" />
          </div>
        </div>
      </div>

      <div className={styles.body}>
        <StatRow label="Goals" home={homeScore} away={awayScore} />
        <StatRow label="Possession" home={homeStats.possession} away={awayStats.possession} format={(n) => `${n}%`} />
        <StatRow label="Corners" home={homeStats.corners} away={awayStats.corners} />
        <StatRow label="Total Shots" home={homeStats.shotsTotal} away={awayStats.shotsTotal} />
        <StatRow label="Shots on Target" home={homeStats.shotsOnTarget} away={awayStats.shotsOnTarget} />
        <StatRow label="Fouls" home={homeFouls} away={awayFouls} />
        <StatRow label="Cards" home={homeYellowCards + homeRedCards} away={awayYellowCards + awayRedCards} />
      </div>
    </div>
  );
}
