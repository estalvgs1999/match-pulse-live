"use client";

import styles from "./HTFTScreen.module.css";
import { DEFAULT_TEAM_LOGO } from "@/components/shared/defaultLogo";

export interface HTFTScreenTeam {
  name: string;
  logoUrl?: string;
}

export interface HTFTScreenProps {
  visible: boolean;
  title: "HALF TIME" | "FULL TIME" | "PENALTIES";
  homeTeam: HTFTScreenTeam;
  awayTeam: HTFTScreenTeam;
  homeScore: number;
  awayScore: number;
  homeScorers: string;
  awayScorers: string;
}

function cx(...classes: Array<string | false | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

/* Scorers are appended over time so the newest is at the END of the string.
   Reversing puts the most recent scorer at the TOP of the dark section. */
function ScorerList({ text, alignRight }: { text: string; alignRight?: boolean }) {
  const lines = text.split("\n").filter((l) => l.trim() !== "").reverse();
  return (
    <div className={cx(styles.scorerCol, alignRight && styles.scorerColRight)}>
      {lines.map((line, i) => (
        <div key={i} className={styles.scorerLine}>{line}</div>
      ))}
    </div>
  );
}

export function HTFTScreen({
  visible,
  title,
  homeTeam,
  awayTeam,
  homeScore,
  awayScore,
  homeScorers,
  awayScorers,
}: HTFTScreenProps) {
  return (
    <div className={cx(styles.wrapper, visible && styles.wrapperVisible)}>
      {/* Dark scorer band — ALWAYS rendered, even when no scorers */}
      <div className={styles.scorersSection}>
        <ScorerList text={homeScorers} />
        <ScorerList text={awayScorers} alignRight />
      </div>

      {/* Main navy section: logos at edges, names, score */}
      <div className={styles.main}>
        {/* Home logo — center on left card edge */}
        <div className={cx(styles.logoWrapper, styles.logoLeft)}>
          <img src={homeTeam.logoUrl || DEFAULT_TEAM_LOGO} alt="" />
        </div>

        {/* Home name */}
        <div className={cx(styles.team, styles.teamLeft)}>
          <span className={styles.teamName}>{homeTeam.name}</span>
        </div>

        {/* Score + HT/FT label */}
        <div className={styles.center}>
          <div className={styles.scoreBox}>
            <span className={styles.scoreNum}>{homeScore}</span>
            <span className={styles.scoreSep}>–</span>
            <span className={styles.scoreNum}>{awayScore}</span>
          </div>
          <span className={styles.title}>{title}</span>
        </div>

        {/* Away name */}
        <div className={cx(styles.team, styles.teamRight)}>
          <span className={styles.teamName}>{awayTeam.name}</span>
        </div>

        {/* Away logo — center on right card edge */}
        <div className={cx(styles.logoWrapper, styles.logoRight)}>
          <img src={awayTeam.logoUrl || DEFAULT_TEAM_LOGO} alt="" />
        </div>
      </div>
    </div>
  );
}
