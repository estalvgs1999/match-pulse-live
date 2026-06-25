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
  // Other leg(s)' score only — this leg's running score is added on top
  // when rendering, never duplicated into this prop.
  aggregateHomeScore: number;
  aggregateAwayScore: number;
}

function cx(...classes: Array<string | false | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

// Re-triggers the goalImpact CSS animation whenever the combined score
// changes, mirroring scores.html's triggerScorePulse() (which forced a
// reflow to restart the animation). Skips the initial mount.
function useScorePulse(homeScore: number, awayScore: number): boolean {
  const [pulsing, setPulsing] = useState(false);
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    setPulsing(true);
    const timeout = setTimeout(() => setPulsing(false), 500);
    return () => clearTimeout(timeout);
  }, [homeScore, awayScore]);

  return pulsing;
}

function FoulPills({ count, color }: { count: number; color: string }) {
  return (
    <div className={styles.pillsContainer}>
      {Array.from({ length: 5 }, (_, i) => (
        <div
          key={i}
          className={cx(styles.foulPill, i < count && styles.foulPillActive)}
          style={i < count ? { backgroundColor: color, color } : undefined}
        />
      ))}
    </div>
  );
}

function PenaltyDots({ results }: { results: PenaltyResult[] }) {
  // Sudden death can grow the array past 5 — always show only the most
  // recent 5, queue-style, so the broadcast graphic never widens.
  const visible = visiblePenaltyWindow(results);
  return (
    <div className={styles.penaltyDotsContainer}>
      {visible.map((result, i) => (
        <div
          key={i}
          className={cx(
            styles.pDot,
            result === 1 && styles.pDotScored,
            result === 2 && styles.pDotMissed
          )}
        />
      ))}
    </div>
  );
}

function RedCards({ count }: { count: number }) {
  return (
    <div className={styles.redCardsTeam}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className={styles.redCardIcon} />
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
  // The fouls/penalties bar (and its OT satellite) steps aside while the
  // player chip is showing, then comes back out once it clears — they
  // never occupy the screen at the same time.
  const hasPlayerEvent = playerEvent !== null;
  const bottomBarVisible = visible && !hasPlayerEvent;
  // A shootout doesn't run off the match clock and isn't part of the
  // two-leg aggregate — both step aside so the score box can read as the
  // shootout's own dedicated scoreboard, not "match score + extra panels".
  const isPenalties = mode === "penalties";
  const displayHomeScore = isPenalties ? countMade(homePenalties) : homeScore;
  const displayAwayScore = isPenalties ? countMade(awayPenalties) : awayScore;

  return (
    <div className={cx(styles.scoreboardWrapper, visible ? styles.wrapperVisible : styles.wrapperHidden)}>
      <div className={cx(styles.redCardsContainer, visible && styles.redCardsContainerVisible)}>
        <RedCards count={homeRedCards} />
        <RedCards count={awayRedCards} />
      </div>

      {aggregateEnabled && (
        <div className={cx(styles.aggregateTab, visible && !isPenalties && styles.aggregateTabVisible)}>
          <p className={styles.aggregateTabLabel}>AGG</p>
          <p className={styles.aggregateTabScore}>
            {aggregateHomeScore + homeScore} - {aggregateAwayScore + awayScore}
          </p>
        </div>
      )}

      <div className={cx(styles.timePanel, visible && !isPenalties && styles.timePanelVisible)}>
        <p className={styles.periodText}>{period}</p>
        <p className={styles.timeText}>{formatMatchClock(primarySeconds)}</p>
      </div>

      <div className={cx(styles.bottomBar, bottomBarVisible && styles.bottomBarVisible)}>
        {mode === "normal" ? (
          <div className={styles.bottomBarRow}>
            <FoulPills count={homeFouls} color={homeTeam.color} />
            <span className={styles.textLabelCenter}>FOULS</span>
            <FoulPills count={awayFouls} color={awayTeam.color} />
          </div>
        ) : (
          <div className={styles.bottomBarRow}>
            <PenaltyDots results={homePenalties} />
            <span className={styles.textLabelCenter}>PENALTIES</span>
            <PenaltyDots results={awayPenalties} />
          </div>
        )}
      </div>

      {/* Satellite badge attached to the fouls bar's right edge, mirroring
          how the time pill attaches to the main bar — same white pill
          shape/shadow and label+time structure, not a stacked row. */}
      <div
        className={cx(
          styles.overtimePanel,
          bottomBarVisible && inOvertime && styles.overtimePanelVisible
        )}
      >
        <p className={styles.overtimePanelLabel}>OT</p>
        <p className={styles.overtimePanelTime}>+{formatMatchClock(overtimeSeconds)}</p>
      </div>

      <div className={cx(styles.mainBar, visible && styles.mainBarVisible)}>
        <div className={cx(styles.teamGroup, styles.teamGroupLeft)}>
          <div
            className={cx(styles.dot, styles.dotActive)}
            style={{ backgroundColor: homeTeam.color, color: homeTeam.color }}
          />
          <div
            className={styles.logoWrapper}
            style={{ borderColor: homeTeam.color, boxShadow: `0 0 10px ${homeTeam.color}60` }}
          >
            <img src={homeTeam.logoUrl || DEFAULT_TEAM_LOGO} alt="" />
          </div>
          <span className={styles.teamName}>{homeTeam.name}</span>
        </div>

        <div className={cx(styles.scoreBox, pulsing && styles.scoreBoxPulse)}>
          <span className={styles.scoreNum}>{displayHomeScore}</span>
          <div className={styles.scoreDivider} />
          <span className={styles.scoreNum}>{displayAwayScore}</span>
        </div>

        <div className={cx(styles.teamGroup, styles.teamGroupRight)}>
          <span className={styles.teamName}>{awayTeam.name}</span>
          <div
            className={styles.logoWrapper}
            style={{ borderColor: awayTeam.color, boxShadow: `0 0 10px ${awayTeam.color}60` }}
          >
            <img src={awayTeam.logoUrl || DEFAULT_TEAM_LOGO} alt="" />
          </div>
          <div
            className={cx(styles.dot, styles.dotActive)}
            style={{ backgroundColor: awayTeam.color, color: awayTeam.color }}
          />
        </div>
      </div>

      <PlayerEventChip
        event={playerEvent}
        teamColor={playerEvent?.side === "away" ? awayTeam.color : homeTeam.color}
      />
    </div>
  );
}
