"use client";

import type { ReactNode } from "react";
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

// A comparison row: value | bar | value | label
function StatRow({
  label,
  home,
  away,
  homeColor,
  awayColor,
  format = (n: number) => String(n),
}: {
  label: ReactNode;
  home: number;
  away: number;
  homeColor: string;
  awayColor: string;
  format?: (n: number) => string;
}) {
  const total = home + away || 1;
  const homePct = (home / total) * 100;
  return (
    <div className={styles.statRow}>
      <span className={styles.statValue}>{format(home)}</span>
      <div className={styles.statBarTrack}>
        <div className={styles.statBarHome} style={{ width: `${homePct}%`, backgroundColor: homeColor }} />
        <div className={styles.statBarAway} style={{ width: `${100 - homePct}%`, backgroundColor: awayColor }} />
      </div>
      <span className={styles.statValue}>{format(away)}</span>
      {typeof label === "string" ? (
        <span className={styles.statLabel}>{label}</span>
      ) : (
        label
      )}
    </div>
  );
}

// Cards row — shows yellow/red split as "Y/R" with colored chip icons in
// the label column so the operator can read at a glance which number is which.
function CardsRow({
  homeYellow,
  homeRed,
  awayYellow,
  awayRed,
  homeColor,
  awayColor,
}: {
  homeYellow: number;
  homeRed: number;
  awayYellow: number;
  awayRed: number;
  homeColor: string;
  awayColor: string;
}) {
  const homeTotal = homeYellow + homeRed;
  const awayTotal = awayYellow + awayRed;
  const total = homeTotal + awayTotal || 1;
  const homePct = (homeTotal / total) * 100;
  return (
    <div className={styles.statRow}>
      <span className={styles.statValue}>{homeYellow}/{homeRed}</span>
      <div className={styles.statBarTrack}>
        <div className={styles.statBarHome} style={{ width: `${homePct}%`, backgroundColor: homeColor }} />
        <div className={styles.statBarAway} style={{ width: `${100 - homePct}%`, backgroundColor: awayColor }} />
      </div>
      <span className={styles.statValue}>{awayYellow}/{awayRed}</span>
      <div className={styles.cardLabelContent}>
        <span className={`${styles.cardChip} ${styles.cardChipYellow}`} />
        <span className={styles.cardChipSep}>/</span>
        <span className={`${styles.cardChip} ${styles.cardChipRed}`} />
        <span className={styles.statLabel}>Cards</span>
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
          <div
            className={styles.logoWrapper}
            style={{ borderColor: homeTeam.color, boxShadow: `0 0 12px ${homeTeam.color}55` }}
          >
            <img src={homeTeam.logoUrl || DEFAULT_TEAM_LOGO} alt="" />
          </div>
          <span className={styles.headerTeamName}>{homeTeam.name}</span>
        </div>
        <span className={styles.headerLabel}>Match Stats</span>
        <div className={cx(styles.headerTeam, styles.headerTeamRight)}>
          <span className={styles.headerTeamName}>{awayTeam.name}</span>
          <div
            className={styles.logoWrapper}
            style={{ borderColor: awayTeam.color, boxShadow: `0 0 12px ${awayTeam.color}55` }}
          >
            <img src={awayTeam.logoUrl || DEFAULT_TEAM_LOGO} alt="" />
          </div>
        </div>
      </div>

      <div className={styles.body}>
        <StatRow label="Goals" home={homeScore} away={awayScore} homeColor={homeTeam.color} awayColor={awayTeam.color} />
        <StatRow
          label="Possession"
          home={homeStats.possession}
          away={awayStats.possession}
          homeColor={homeTeam.color}
          awayColor={awayTeam.color}
          format={(n) => `${n}%`}
        />
        <StatRow
          label="Corners"
          home={homeStats.corners}
          away={awayStats.corners}
          homeColor={homeTeam.color}
          awayColor={awayTeam.color}
        />
        <StatRow
          label="Total Shots"
          home={homeStats.shotsTotal}
          away={awayStats.shotsTotal}
          homeColor={homeTeam.color}
          awayColor={awayTeam.color}
        />
        <StatRow
          label="Shots on Target"
          home={homeStats.shotsOnTarget}
          away={awayStats.shotsOnTarget}
          homeColor={homeTeam.color}
          awayColor={awayTeam.color}
        />
        <StatRow label="Fouls" home={homeFouls} away={awayFouls} homeColor={homeTeam.color} awayColor={awayTeam.color} />
        <CardsRow
          homeYellow={homeYellowCards}
          homeRed={homeRedCards}
          awayYellow={awayYellowCards}
          awayRed={awayRedCards}
          homeColor={homeTeam.color}
          awayColor={awayTeam.color}
        />
      </div>
    </div>
  );
}
