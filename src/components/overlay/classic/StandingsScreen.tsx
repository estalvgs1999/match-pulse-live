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
    <div className={styles.table}>
      <div className={cx(styles.row, styles.headerRow)}>
        <span className={styles.colRank} />
        <span className={styles.colTeam}>Team</span>
        <span className={styles.colStat}>PJ</span>
        <span className={styles.colStat}>G</span>
        <span className={styles.colStat}>E</span>
        <span className={styles.colStat}>P</span>
        <span className={styles.colPts}>Pts</span>
      </div>
      {rows.map((row, i) => (
        <div key={i} className={cx(styles.row, i % 2 === 1 && styles.rowAlt)}>
          <span className={styles.colRank}>{i + 1}</span>
          <span className={styles.colTeam}>{row.team}</span>
          <span className={styles.colStat}>{row.played}</span>
          <span className={styles.colStat}>{row.won}</span>
          <span className={styles.colStat}>{row.drawn}</span>
          <span className={styles.colStat}>{row.lost}</span>
          <span className={styles.colPts}>{row.points}</span>
        </div>
      ))}
    </div>
  );
}

function Bracket({ rounds }: { rounds: BracketRound[] }) {
  return (
    <div className={styles.bracket}>
      {rounds.map((round, i) => (
        <div key={i} className={styles.bracketRound}>
          <h3 className={styles.bracketRoundName}>{round.name}</h3>
          <div className={styles.bracketMatchups}>
            {round.matchups.map((m, j) => (
              <div key={j} className={styles.matchup}>
                <div className={styles.matchupTeam}>
                  <span className={styles.matchupTeamName}>{m.teamA}</span>
                  <span className={styles.matchupScore}>{m.scoreA ?? "-"}</span>
                </div>
                <div className={styles.matchupTeam}>
                  <span className={styles.matchupTeamName}>{m.teamB}</span>
                  <span className={styles.matchupScore}>{m.scoreB ?? "-"}</span>
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
        <span className={styles.headerLabel}>Standings</span>
        <span className={styles.headerTournament}>{tournamentName}</span>
      </div>
      <div className={styles.body}>
        {format === "league" ? <LeagueTable rows={rows} /> : <Bracket rounds={rounds} />}
      </div>
    </div>
  );
}
