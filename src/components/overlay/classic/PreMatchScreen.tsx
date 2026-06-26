"use client";

import styles from "./PreMatchScreen.module.css";
import { DEFAULT_TEAM_LOGO } from "@/components/shared/defaultLogo";

export interface PreMatchScreenTeam {
  name: string;
  logoUrl?: string;
  color: string;
}

export interface PreMatchScreenProps {
  visible: boolean;
  homeTeam: PreMatchScreenTeam;
  awayTeam: PreMatchScreenTeam;
  tournament: string;
  matchday: string;
  date: string; // ISO 8601
  stadium: string;
}

function cx(...classes: Array<string | false | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const months = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

export function PreMatchScreen({
  visible,
  homeTeam,
  awayTeam,
  tournament,
  matchday,
  date,
  stadium,
}: PreMatchScreenProps) {
  return (
    <div className={cx(styles.wrapper, visible && styles.wrapperVisible)}>
      <div className={styles.header}>
        <span className={styles.headerAccent} />
        <span className={styles.headerTournament}>{tournament || "PARTIDO"}</span>
        {matchday && (
          <>
            <span className={styles.headerSep} />
            <span className={styles.headerMatchday}>{matchday}</span>
          </>
        )}
      </div>

      <div className={styles.teamsRow}>
        <div className={styles.teamZone}>
          <div className={styles.logoRing}>
            <img src={homeTeam.logoUrl || DEFAULT_TEAM_LOGO} alt="" />
          </div>
          <span className={styles.teamName}>{homeTeam.name}</span>
        </div>

        <div className={styles.vsDivider}>
          <div className={styles.vsLine} />
          <span className={styles.vsText}>VS</span>
          <div className={styles.vsLine} />
        </div>

        <div className={styles.teamZone}>
          <div className={styles.logoRing}>
            <img src={awayTeam.logoUrl || DEFAULT_TEAM_LOGO} alt="" />
          </div>
          <span className={styles.teamName}>{awayTeam.name}</span>
        </div>
      </div>

      <div className={styles.footer}>
        <span className={styles.footerValue}>{date ? formatDate(date) : "—"}</span>
        {stadium && (
          <>
            <span className={styles.footerDot} />
            <span className={styles.footerValue}>{stadium}</span>
          </>
        )}
      </div>
    </div>
  );
}
