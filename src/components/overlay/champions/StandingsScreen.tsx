"use client";

import styles from "./StandingsScreen.module.css";
import type { BracketRound, StandingsRow } from "@/models/MatchState";

export interface StandingsScreenProps {
  visible: boolean;
  tournamentName: string;
  format: "league" | "bracket";
  rows: StandingsRow[];
  rounds: BracketRound[];
}

function cx(...classes: Array<string | false | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

function LeagueTable({ rows }: { rows: StandingsRow[] }) {
  return (
    <>
      <div className={styles.tableHeader}>
        <span className={cx(styles.colHead, styles.colHeadTeam)}>#</span>
        <span className={cx(styles.colHead, styles.colHeadTeam)}>Team</span>
        <span className={styles.colHead}>PJ</span>
        <span className={styles.colHead}>G</span>
        <span className={styles.colHead}>E</span>
        <span className={styles.colHead}>P</span>
        <span className={styles.colHead}>Pts</span>
      </div>
      {rows.map((row, i) => (
        <div key={i} className={styles.tableRow}>
          <span className={styles.rowPos}>{i + 1}</span>
          <span className={styles.rowTeam}>{row.team}</span>
          <span className={styles.rowStat}>{row.played}</span>
          <span className={styles.rowStat}>{row.won}</span>
          <span className={styles.rowStat}>{row.drawn}</span>
          <span className={styles.rowStat}>{row.lost}</span>
          <span className={styles.rowPts}>{row.points}</span>
        </div>
      ))}
    </>
  );
}

function Bracket({ rounds }: { rounds: BracketRound[] }) {
  return (
    <div className={styles.bracketContainer}>
      {rounds.map((round, i) => (
        <div key={i} className={styles.bracketRound}>
          <h3 className={styles.roundLabel}>{round.name}</h3>
          <div className={styles.roundMatchups}>
            {round.matchups.map((m, j) => (
              <div key={j} className={styles.matchup}>
                <div className={styles.matchupTeam}>
                  <span className={styles.matchupTeamName}>{m.teamA}</span>
                  <span className={cx(styles.matchupScore, m.scoreA === null && styles.matchupScoreNull)}>
                    {m.scoreA ?? "–"}
                  </span>
                </div>
                <div className={styles.matchupTeam}>
                  <span className={styles.matchupTeamName}>{m.teamB}</span>
                  <span className={cx(styles.matchupScore, m.scoreB === null && styles.matchupScoreNull)}>
                    {m.scoreB ?? "–"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function StandingsScreen({ visible, tournamentName, format, rows, rounds }: StandingsScreenProps) {
  return (
    <div className={cx(styles.wrapper, visible && styles.wrapperVisible)}>
      <div className={styles.header}>
        <span className={styles.headerBadge} />
        <span className={styles.headerLabel}>Standings</span>
        <span className={styles.headerTournament}>{tournamentName}</span>
      </div>
      <div className={styles.body}>
        {format === "league" ? <LeagueTable rows={rows} /> : <Bracket rounds={rounds} />}
      </div>
    </div>
  );
}
