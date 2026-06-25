"use client";

import { useEffect, useState, type CSSProperties } from "react";
import styles from "./LineupsScreen.module.css";
import { DEFAULT_TEAM_LOGO } from "@/components/shared/defaultLogo";
import { DEFAULT_PLAYER_PORTRAIT } from "@/components/shared/defaultPortrait";
import { readableTextColor, dimTextColor } from "@/lib/contrast";
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
// How long each player stays spotlighted during the intro scan — slow
// enough to actually read the name/photo before it moves on, not a quick
// flicker through the roster.
const SCAN_STEP_MS = 1100;
const ROW_STAGGER_S = 0.045;

function isGoalkeeper(position: string): boolean {
  return GOALKEEPER_PATTERN.test(position.trim());
}

// Darkens a hex color by a flat percentage — used to derive the screen's
// darkest gradient stop / highlighted-row text color from the team's own
// `colors.primary`, so each team's Lineups screen is colored like their
// own broadcast package instead of one hardcoded palette for everyone.
function darken(hex: string, amount: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const channel = (shift: number) => {
    const value = Math.round(((num >> shift) & 0xff) * (1 - amount));
    return Math.max(0, Math.min(255, value));
  };
  const r = channel(16);
  const g = channel(8);
  const b = channel(0);
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

// "SAMANTHA HUGHES" -> regular "SAMANTHA" + bold "HUGHES", matching the
// reference broadcast graphic's name treatment exactly (first name(s)
// regular weight, surname bold) rather than one uniform weight.
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
  // Custom-drawn (not an icon font) to match the rest of the broadcast
  // iconography in this app, which is all bespoke CSS/SVG shapes.
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

// Intro "spotlight scan": once the screen becomes visible, walks the
// current-player highlight through the whole roster (starting, then
// bench) one at a time, then settles on no one highlighted — an
// automatic introduction, not a permanent state. Restarts every time
// `visible` flips false -> true. While scanning, this overrides whatever
// the operator has set as the manual current player; once it finishes,
// the manual value (if any) takes back over.
function useIntroScan(visible: boolean, rosterOrder: RosterPlayer[]): RosterPlayer | null {
  const [scanIndex, setScanIndex] = useState<number | null>(null);
  // React's documented pattern for "reset state when a prop changes" —
  // adjusted during render (not inside an effect), so the reset and the
  // render that needs it land in the same pass instead of an extra one.
  // Starts at `false` regardless of the initial `visible` value, so a
  // first mount that's already visible (e.g. a page reload while the
  // graphic is showing) still counts as a false->true transition and
  // kicks off the scan, instead of silently skipping it.
  const [prevVisible, setPrevVisible] = useState(false);
  if (visible !== prevVisible) {
    setPrevVisible(visible);
    setScanIndex(visible ? 0 : null);
  }

  useEffect(() => {
    // Once scanIndex reaches the end, just stop scheduling — no need to
    // reset it back to null, the render guard below already treats
    // "past the end" the same as "no scan", and this avoids setting
    // state synchronously from within the effect.
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
  // Falls back to the first five roster entries so the screen never shows
  // an empty "Starting 5" if the operator hasn't configured a lineup yet —
  // overridable any time via the lineup editor, never silently wrong once set.
  const effectiveStarting = startingNumbers.length > 0 ? startingNumbers : roster.slice(0, 5).map((p) => p.number);
  const starting = roster.filter((p) => effectiveStarting.includes(p.number));
  const bench = roster.filter((p) => !effectiveStarting.includes(p.number));
  const rosterOrder = [...starting, ...bench];

  const scanPlayer = useIntroScan(visible, rosterOrder);
  // Once the intro scan finishes it rests on "no one" rather than falling
  // back to captain/first-starting — the operator's explicit spotlight
  // pick (if any) is still respected, it just isn't a forced default.
  const effectiveCurrentNumber = scanPlayer ? scanPlayer.number : currentPlayerNumber;
  const currentPlayer = scanPlayer ?? roster.find((p) => p.number === currentPlayerNumber) ?? null;

  const accent = team?.colors.accent ?? "#67f58b";
  const primary = team?.colors.primary ?? "#134024";
  const dark = darken(primary, 0.4);
  // Header gradient runs accent → primary; check accent (lighter stop) so
  // text stays readable even when a team uses a bright/light accent color.
  const headerText = readableTextColor(accent);
  const headerTextDim = dimTextColor(accent);
  // Body gradient runs accent → primary → dark; most text sits on the
  // primary/dark half, so check primary for the body text decision.
  const bodyText = readableTextColor(primary);
  const bodyTextDim = dimTextColor(primary);
  const colorVars = {
    "--lineup-accent": accent,
    "--lineup-primary": primary,
    "--lineup-dark": dark,
    "--lineup-header-text": headerText,
    "--lineup-header-text-dim": headerTextDim,
    "--lineup-body-text": bodyText,
    "--lineup-body-text-dim": bodyTextDim,
  } as CSSProperties;

  return (
    <div className={cx(styles.wrapper, visible && styles.wrapperVisible)} style={colorVars}>
      <div className={styles.header}>
        <div
          className={styles.logoWrapper}
          style={{ borderColor: accent, boxShadow: `0 0 16px ${accent}50` }}
        >
          <img src={team?.logoUrl || DEFAULT_TEAM_LOGO} alt="" />
        </div>
        <span className={styles.teamName}>{team?.name ?? ""}</span>
      </div>

      <div className={styles.body}>
        <div className={styles.shape1} />
        <div className={styles.shape2} />
        <div className={styles.shape3} />

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
              {/* Two columns instead of one long column — halves the
                  vertical space a long bench needs, which is what makes
                  room for larger, more legible row text within the
                  fixed-height card. */}
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
