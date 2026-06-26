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
  date: string;
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
      <div className={styles.card}>
        {/* Competition badge */}
        <div className={styles.badge}>
          <span className={styles.badgeLabel}>Partido</span>
          <span className={styles.tournamentName}>{tournament || "PARTIDO"}</span>
          {matchday && <span className={styles.matchday}>{matchday}</span>}
        </div>

        {/* Teams */}
        <div className={styles.teamsRow}>
          <div className={styles.teamBlock}>
            <div className={styles.logoWrap}>
              <img src={homeTeam.logoUrl || DEFAULT_TEAM_LOGO} alt="" />
            </div>
            <span className={styles.teamNameText}>{homeTeam.name}</span>
          </div>

          <div className={styles.vsBlock}>
            <div className={styles.vsLine} />
            <span className={styles.vsText}>VS</span>
            <div className={styles.vsLine} />
          </div>

          <div className={styles.teamBlock}>
            <div className={styles.logoWrap}>
              <img src={awayTeam.logoUrl || DEFAULT_TEAM_LOGO} alt="" />
            </div>
            <span className={styles.teamNameText}>{awayTeam.name}</span>
          </div>
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          {date && <span className={styles.footerText}>{formatDate(date)}</span>}
          {date && stadium && <span className={styles.footerDot} />}
          {stadium && <span className={styles.footerText}>{stadium}</span>}
        </div>
      </div>
    </div>
  );
}
