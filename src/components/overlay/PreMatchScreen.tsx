"use client";

import styles from "./PreMatchScreen.module.css";
import { DEFAULT_TEAM_LOGO } from "@/components/shared/defaultLogo";

export interface PreMatchScreenTeam {
  name: string;
  logoUrl?: string;
  color: string; // hex accent color for ring + glow
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

// Hex color (#rrggbb) to rgba — avoids 8-digit hex which some OBS-embedded
// browser versions don't parse correctly inside gradient strings.
function toRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
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
  const homeGlow = toRgba(homeTeam.color, 0.14);
  const awayGlow = toRgba(awayTeam.color, 0.14);
  const homeRing = toRgba(homeTeam.color, 0.7);
  const awayRing = toRgba(awayTeam.color, 0.7);
  const homeShadow = toRgba(homeTeam.color, 0.4);
  const awayShadow = toRgba(awayTeam.color, 0.4);

  return (
    <div className={cx(styles.wrapper, visible && styles.wrapperVisible)}>
      <div className={cx(styles.card, visible && styles.cardVisible)}>

        {/* Header — tournament + matchday */}
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

        {/* Teams row */}
        <div className={styles.teamsRow}>

          {/* Home side */}
          <div
            className={styles.teamZone}
            style={{
              background: `radial-gradient(ellipse 90% 110% at 15% 55%, ${homeGlow} 0%, transparent 65%)`,
            }}
          >
            <div
              className={styles.logoRing}
              style={{
                borderColor: homeRing,
                boxShadow: `0 0 40px ${homeShadow}, 0 0 10px ${homeShadow} inset`,
              }}
            >
              <img src={homeTeam.logoUrl || DEFAULT_TEAM_LOGO} alt="" />
            </div>
            <span className={styles.teamName}>{homeTeam.name}</span>
          </div>

          {/* VS divider */}
          <div className={styles.vsDivider}>
            <div className={styles.vsLine} />
            <span className={styles.vsText}>VS</span>
            <div className={styles.vsLine} />
          </div>

          {/* Away side */}
          <div
            className={styles.teamZone}
            style={{
              background: `radial-gradient(ellipse 90% 110% at 85% 55%, ${awayGlow} 0%, transparent 65%)`,
            }}
          >
            <div
              className={styles.logoRing}
              style={{
                borderColor: awayRing,
                boxShadow: `0 0 40px ${awayShadow}, 0 0 10px ${awayShadow} inset`,
              }}
            >
              <img src={awayTeam.logoUrl || DEFAULT_TEAM_LOGO} alt="" />
            </div>
            <span className={styles.teamName}>{awayTeam.name}</span>
          </div>
        </div>

        {/* Footer — date + stadium */}
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
    </div>
  );
}
