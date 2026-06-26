"use client";

import { useEffect, useState, type CSSProperties } from "react";
import styles from "./LineupsScreen.module.css";
import { DEFAULT_TEAM_LOGO } from "@/components/shared/defaultLogo";
import { DEFAULT_PLAYER_PORTRAIT } from "@/components/shared/defaultPortrait";
import type { RosterPlayer, Team } from "@/models/Team";

export interface LineupsScreenProps {
  visible: boolean;
  team: Team | null;
  startingNumbers: number[];
  captainNumber: number | null;
  currentPlayerNumber: number | null;
}

function cx(...classes: Array<string | false | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

const GOALKEEPER_PATTERN = /portero|portera|goalkeeper|^gk$|arquero/i;
const SCAN_STEP_MS = 1100;
const ROW_STAGGER_S = 0.045;

function isGoalkeeper(position: string): boolean {
  return GOALKEEPER_PATTERN.test(position.trim());
}

function NameLabel({ name }: { name: string }) {
  const lastSpace = name.trim().lastIndexOf(" ");
  if (lastSpace === -1) {
    return <span className={styles.rowSurname}>{name}</span>;
  }
  return (
    <>
      <span className={styles.rowFirstName}>{name.slice(0, lastSpace)} </span>
      <span className={styles.rowSurname}>{name.slice(lastSpace + 1)}</span>
    </>
  );
}

function GloveIcon() {
  return (
    <svg className={styles.gloveIcon} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M7 11V5.5a1.5 1.5 0 0 1 3 0V10M10 10V4a1.5 1.5 0 0 1 3 0v6M13 10V5a1.5 1.5 0 0 1 3 0v6M16 11V7a1.5 1.5 0 0 1 3 0v6.5c0 3.6-2.7 6.5-6 6.5h-1c-3 0-5.5-2-6.5-4.7L4 10.8c-.4-.9 0-2 .9-2.4.8-.4 1.8 0 2.2.8L8 11"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PlayerRow({
  player,
  isCaptain,
  isCurrent,
  visible,
  delay,
}: {
  player: RosterPlayer;
  isCaptain: boolean;
  isCurrent: boolean;
  visible: boolean;
  delay: number;
}) {
  return (
    <div
      className={cx(styles.row, isCurrent && styles.rowCurrent, visible && styles.rowVisible)}
      style={{ "--stagger-delay": visible ? `${delay}s` : "0s" } as CSSProperties}
    >
      <span className={styles.gkSlot}>{isGoalkeeper(player.position) && <GloveIcon />}</span>
      <span className={styles.rowNumber}>{player.number}</span>
      <span className={styles.rowName}>
        <NameLabel name={player.name} />
      </span>
      {isCaptain && <span className={styles.captainBadge}>C</span>}
    </div>
  );
}

// Intro scan: walks the current-player highlight through the full roster
// once on each visible → hidden → visible cycle, then rests on none.
function useIntroScan(visible: boolean, rosterOrder: RosterPlayer[]): RosterPlayer | null {
  const [scanIndex, setScanIndex] = useState<number | null>(null);
  const [prevVisible, setPrevVisible] = useState(false);
  if (visible !== prevVisible) {
    setPrevVisible(visible);
    setScanIndex(visible ? 0 : null);
  }

  useEffect(() => {
    if (scanIndex === null || scanIndex >= rosterOrder.length) return;
    const timer = setTimeout(() => setScanIndex((i) => (i === null ? null : i + 1)), SCAN_STEP_MS);
    return () => clearTimeout(timer);
  }, [scanIndex, rosterOrder.length]);

  if (scanIndex === null || scanIndex >= rosterOrder.length) return null;
  return rosterOrder[scanIndex];
}

export function LineupsScreen({
  visible,
  team,
  startingNumbers,
  captainNumber,
  currentPlayerNumber,
}: LineupsScreenProps) {
  const roster = team?.roster ?? [];
  const effectiveStarting = startingNumbers.length > 0 ? startingNumbers : roster.slice(0, 5).map((p) => p.number);
  const starting = roster.filter((p) => effectiveStarting.includes(p.number));
  const bench = roster.filter((p) => !effectiveStarting.includes(p.number));
  const rosterOrder = [...starting, ...bench];

  const scanPlayer = useIntroScan(visible, rosterOrder);
  const effectiveCurrentNumber = scanPlayer ? scanPlayer.number : currentPlayerNumber;
  const currentPlayer = scanPlayer ?? roster.find((p) => p.number === currentPlayerNumber) ?? null;

  return (
    <div className={cx(styles.wrapper, visible && styles.wrapperVisible)}>
      <div className={styles.header}>
        <div className={styles.logoWrapper}>
          <img src={team?.logoUrl || DEFAULT_TEAM_LOGO} alt="" />
        </div>
        <span className={styles.teamName}>{team?.name ?? ""}</span>
      </div>

      <div className={styles.body}>
        <div className={cx(styles.spotlightColumn, visible && styles.spotlightColumnVisible)}>
          <img
            className={styles.portrait}
            src={currentPlayer?.portraitUrl || DEFAULT_PLAYER_PORTRAIT}
            alt=""
          />
        </div>

        <div className={styles.rosterColumn}>
          <h3 className={cx(styles.sectionLabel, visible && styles.sectionLabelVisible)}>Starting 5</h3>
          <div className={styles.rowList}>
            {starting.map((player, i) => (
              <PlayerRow
                key={player.number}
                player={player}
                isCaptain={player.number === captainNumber}
                isCurrent={player.number === effectiveCurrentNumber}
                visible={visible}
                delay={0.1 + i * ROW_STAGGER_S}
              />
            ))}
          </div>

          {bench.length > 0 && (
            <>
              <h3
                className={cx(styles.sectionLabel, styles.benchLabel, visible && styles.sectionLabelVisible)}
                style={{ transitionDelay: visible ? `${0.1 + starting.length * ROW_STAGGER_S}s` : "0s" }}
              >
                Bench
              </h3>
              <div className={styles.benchColumns}>
                {[bench.slice(0, Math.ceil(bench.length / 2)), bench.slice(Math.ceil(bench.length / 2))].map(
                  (column, colIndex) => (
                    <div key={colIndex} className={styles.rowList}>
                      {column.map((player, i) => (
                        <PlayerRow
                          key={player.number}
                          player={player}
                          isCaptain={player.number === captainNumber}
                          isCurrent={player.number === effectiveCurrentNumber}
                          visible={visible}
                          delay={0.15 + (starting.length + colIndex * column.length + i) * ROW_STAGGER_S}
                        />
                      ))}
                    </div>
                  )
                )}
              </div>
            </>
          )}
        </div>

        {team?.coach && (
          <div className={styles.coachBlock}>
            <span className={styles.coachLabel}>Head Coach</span>
            <span className={styles.coachValue}>{team.coach}</span>
          </div>
        )}
      </div>
    </div>
  );
}
