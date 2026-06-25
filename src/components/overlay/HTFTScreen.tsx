"use client";

import styles from "./HTFTScreen.module.css";
import { DEFAULT_TEAM_LOGO } from "@/components/shared/defaultLogo";

export interface HTFTScreenTeam {
  name: string;
  logoUrl?: string;
  color: string;
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

function ScorerList({ text }: { text: string }) {
  const lines = text.split("\n").filter((line) => line.trim() !== "");
  return (
    <>
      {lines.map((line, i) => (
        <div key={i}>{line}</div>
      ))}
    </>
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
      <div className={cx(styles.tag, visible && styles.tagVisible)}>{title}</div>

      <div className={cx(styles.main, visible && styles.mainVisible)}>
        <div className={cx(styles.team, styles.teamLeft)}>
          <div
            className={styles.logoWrapper}
            style={{ borderColor: homeTeam.color, boxShadow: `0 0 18px ${homeTeam.color}55` }}
          >
            <img src={homeTeam.logoUrl || DEFAULT_TEAM_LOGO} alt="" />
          </div>
          <span className={styles.name}>{homeTeam.name}</span>
        </div>

        <div className={styles.scoreBox}>
          <span className={styles.scoreNum}>{homeScore}</span>
          <div className={styles.scoreDivider} />
          <span className={styles.scoreNum}>{awayScore}</span>
        </div>

        <div className={cx(styles.team, styles.teamRight)}>
          <span className={styles.name}>{awayTeam.name}</span>
          <div
            className={styles.logoWrapper}
            style={{ borderColor: awayTeam.color, boxShadow: `0 0 18px ${awayTeam.color}55` }}
          >
            <img src={awayTeam.logoUrl || DEFAULT_TEAM_LOGO} alt="" />
          </div>
        </div>
      </div>

      <div className={cx(styles.scorers, visible && styles.scorersVisible)}>
        <div className={cx(styles.scorerCol, styles.scorerColLeft)}>
          <ScorerList text={homeScorers} />
        </div>
        <div className={cx(styles.scorerCol, styles.scorerColRight)}>
          <ScorerList text={awayScorers} />
        </div>
      </div>
    </div>
  );
}
