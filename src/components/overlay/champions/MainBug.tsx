"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./MainBug.module.css";
import { countMade, formatMatchClock, visiblePenaltyWindow } from "@/lib/format";
import { deriveClockDisplay } from "@/lib/clock-display";
import { DEFAULT_TEAM_LOGO } from "@/components/shared/defaultLogo";
import { PlayerEventChip } from "./PlayerEventChip";
import type { Clock, PenaltyResult } from "@/models/MatchState";
import type { PlayerEvent } from "@/lib/pusher-shared";

export interface MainBugTeam {
  name: string;
  logoUrl?: string;
  color: string;
}

export interface MainBugProps {
  visible: boolean;
  mode: "normal" | "penalties";
  period: string;
  clock: Clock;
  elapsedSeconds: number;
  homeTeam: MainBugTeam;
  awayTeam: MainBugTeam;
  homeScore: number;
  awayScore: number;
  homeFouls: number;
  awayFouls: number;
  homePenalties: PenaltyResult[];
  awayPenalties: PenaltyResult[];
  homeRedCards: number;
  awayRedCards: number;
  playerEvent: PlayerEvent | null;
  aggregateEnabled: boolean;
  aggregateHomeScore: number;
  aggregateAwayScore: number;
}

function cx(...classes: Array<string | false | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

function useScorePulse(homeScore: number, awayScore: number): boolean {
  const [pulsing, setPulsing] = useState(false);
  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) { mounted.current = true; return; }
    setPulsing(true);
    const t = setTimeout(() => setPulsing(false), 500);
    return () => clearTimeout(t);
  }, [homeScore, awayScore]);
  return pulsing;
}

function FoulPills({ count }: { count: number }) {
  return (
    <div className={styles.pillsContainer}>
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className={cx(styles.foulPill, i < count && styles.foulPillActive)} />
      ))}
    </div>
  );
}

function PenaltyDots({ results }: { results: PenaltyResult[] }) {
  const window = visiblePenaltyWindow(results);
  return (
    <div className={styles.penaltyDotsContainer}>
      {window.map((r, i) => (
        <div key={i} className={cx(styles.pDot, r === 1 && styles.pDotScored, r === 2 && styles.pDotMissed)} />
      ))}
    </div>
  );
}

export function MainBug({
  visible,
  mode,
  period,
  clock,
  elapsedSeconds,
  homeTeam,
  awayTeam,
  homeScore,
  awayScore,
  homeFouls,
  awayFouls,
  homePenalties,
  awayPenalties,
  homeRedCards,
  awayRedCards,
  playerEvent,
  aggregateEnabled,
  aggregateHomeScore,
  aggregateAwayScore,
}: MainBugProps) {
  const pulsing = useScorePulse(homeScore, awayScore);
  const { primarySeconds, overtimeSeconds, inOvertime } = deriveClockDisplay(elapsedSeconds, clock);
  const hasPlayerEvent = playerEvent !== null;
  const bottomBarVisible = visible && !hasPlayerEvent;
  const isPenalties = mode === "penalties";
  const displayHomeScore = isPenalties ? countMade(homePenalties) : homeScore;
  const displayAwayScore = isPenalties ? countMade(awayPenalties) : awayScore;

  return (
    <div className={styles.scoreboardWrapper}>
      {/* Overtime pill clips onto top of bar */}
      <div className={cx(styles.overtimePanel, bottomBarVisible && inOvertime && styles.overtimePanelVisible)}>
        <span className={styles.overtimePanelLabel}>OT</span>
        <span className={styles.overtimePanelTime}>+{formatMatchClock(overtimeSeconds)}</span>
      </div>

      {/* Red cards above bar */}
      <div className={cx(styles.redCardsContainer, visible && styles.redCardsContainerVisible)}>
        <div className={styles.redCardsTeam}>
          {Array.from({ length: homeRedCards }, (_, i) => <div key={i} className={styles.redCardIcon} />)}
        </div>
        <div className={styles.redCardsTeam}>
          {Array.from({ length: awayRedCards }, (_, i) => <div key={i} className={styles.redCardIcon} />)}
        </div>
      </div>

      {/* mainBarWrap provides a relative container so aggregateTab can
          position itself right of the bar without being clipped by
          mainBar's overflow:hidden (needed for border-radius). */}
      <div className={styles.mainBarWrap}>
        <div className={cx(styles.mainBar, visible && styles.mainBarVisible)}>
          {/* Time section */}
          {!isPenalties && (
            <div className={styles.timeSection}>
              <span className={styles.periodText}>{period}</span>
              <span className={styles.timeText}>{formatMatchClock(primarySeconds)}</span>
            </div>
          )}

          {/* Home team */}
          <div className={styles.teamSection}>
            <div className={styles.teamLogo}>
              <img src={homeTeam.logoUrl || DEFAULT_TEAM_LOGO} alt="" />
            </div>
            <span className={styles.teamCode}>{homeTeam.name}</span>
          </div>

          {/* Score */}
          <div className={cx(styles.scoreSection, pulsing && styles.scoreSectionPulse)}>
            <span className={styles.scoreNum}>{displayHomeScore}</span>
            <span className={styles.scoreSep}>–</span>
            <span className={styles.scoreNum}>{displayAwayScore}</span>
          </div>

          {/* Away team */}
          <div className={cx(styles.teamSection, styles.teamSectionRight)}>
            <span className={styles.teamCode}>{awayTeam.name}</span>
            <div className={styles.teamLogo}>
              <img src={awayTeam.logoUrl || DEFAULT_TEAM_LOGO} alt="" />
            </div>
          </div>
        </div>

        {/* Aggregate — sibling of mainBar so overflow:hidden doesn't clip it */}
        {aggregateEnabled && (
          <div className={cx(styles.aggregateTab, visible && !isPenalties && styles.aggregateTabVisible)}>
            <p className={styles.aggregateTabLabel}>AGG</p>
            <p className={styles.aggregateTabScore}>
              {aggregateHomeScore + homeScore}–{aggregateAwayScore + awayScore}
            </p>
          </div>
        )}
      </div>

      {/* Foul/penalty strip below bar */}
      <div className={cx(styles.bottomBar, bottomBarVisible && styles.bottomBarVisible)}>
        {mode === "normal" ? (
          <div className={styles.bottomBarRow}>
            <FoulPills count={homeFouls} />
            <span className={styles.textLabelCenter}>FOULS</span>
            <FoulPills count={awayFouls} />
          </div>
        ) : (
          <div className={styles.bottomBarRow}>
            <PenaltyDots results={homePenalties} />
            <span className={styles.textLabelCenter}>PENALTIES</span>
            <PenaltyDots results={awayPenalties} />
          </div>
        )}
      </div>

      {/* Player event chip — appears below the scorebug */}
      <PlayerEventChip
        event={playerEvent}
        teamColor={playerEvent?.side === "away" ? awayTeam.color : homeTeam.color}
      />
    </div>
  );
}
