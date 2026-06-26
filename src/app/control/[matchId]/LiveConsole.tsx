"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMatchInfo } from "@/hooks/useMatchInfo";
import { useMatchState } from "@/hooks/useMatchState";
import { useServerOffset } from "@/hooks/useServerOffset";
import { useMatchClock } from "@/hooks/useMatchClock";
import { TeamPanel } from "@/components/control/TeamPanel";
import { ClockModule } from "@/components/control/ClockModule";
import { MatchFlowPanel, type MatchFlowSelectOptions } from "@/components/control/MatchFlowPanel";
import { MatchSettingsModal } from "@/components/control/MatchSettingsModal";
import { StandingsEditorModal } from "@/components/control/StandingsEditorModal";
import { StatsEditorModal } from "@/components/control/StatsEditorModal";
import type { RosterPlayer } from "@/models/Team";
import { DEFAULT_CLOCK, type MatchStatus, type PenaltyResult } from "@/models/MatchState";
import { countMade } from "@/lib/format";

function useObsStatus(matchId: string) {
  const [connected, setConnected] = useState<boolean | null>(null);
  useEffect(() => {
    let active = true;
    async function check() {
      try {
        const res = await fetch(`/api/matches/${matchId}/obs-status`);
        if (res.ok) {
          const data = await res.json();
          if (active) setConnected(data.connected);
        }
      } catch { /* ignore */ }
    }
    check();
    const id = setInterval(check, 5_000);
    return () => { active = false; clearInterval(id); };
  }, [matchId]);
  return connected;
}

function OBSHeaderButton({ matchId, onClick }: { matchId: string; onClick: () => void }) {
  const obsConnected = useObsStatus(matchId);
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Conexión OBS"
      className="relative flex items-center gap-1.5 px-3 h-9 rounded-full bg-surface-container-highest border border-outline-variant text-on-surface-variant hover:text-primary hover:border-primary transition-colors text-xs font-bold"
    >
      <span className="material-symbols-outlined text-base">monitor</span>
      <span className="hidden sm:inline">OBS</span>
      {obsConnected !== null && (
        <span className={`absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full border border-background ${
          obsConnected ? "bg-tertiary" : "bg-error"
        }`} />
      )}
    </button>
  );
}

function OBSFooterStatus({ matchId }: { matchId: string }) {
  const obsConnected = useObsStatus(matchId);
  return (
    <span className="flex items-center gap-2">
      {obsConnected === null ? (
        <span className="w-1.5 h-1.5 rounded-full bg-outline animate-pulse" />
      ) : obsConnected ? (
        <span className="relative flex w-1.5 h-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-tertiary opacity-75" />
          <span className="relative inline-flex rounded-full w-1.5 h-1.5 bg-tertiary" />
        </span>
      ) : (
        <span className="w-1.5 h-1.5 rounded-full bg-error" />
      )}
      OBS:{" "}
      <span className={obsConnected ? "text-tertiary" : obsConnected === false ? "text-error" : ""}>
        {obsConnected === null ? "Verificando" : obsConnected ? "Conectado" : "Desconectado"}
      </span>
    </span>
  );
}

const NAV_ITEMS = [
  { icon: "dashboard", label: "Dashboard", active: false, href: "/dashboard" },
  { icon: "groups", label: "Teams", active: false, href: "/dashboard/teams" },
];

export function LiveConsole({ matchId }: { matchId: string }) {
  const router = useRouter();
  const info = useMatchInfo(matchId);
  const { state, patch } = useMatchState(matchId);
  const { offsetMs } = useServerOffset();
  const elapsedSeconds = useMatchClock(state?.clock ?? DEFAULT_CLOCK, offsetMs);
  const [wallClock, setWallClock] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [standingsEditorOpen, setStandingsEditorOpen] = useState(false);
  const [statsEditorOpen, setStatsEditorOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [obsOpen, setObsOpen] = useState(false);

  useEffect(() => {
    const update = () => setWallClock(new Date().toLocaleTimeString("en-GB"));
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  // Resilience: keep the last known state in LocalStorage so the operator
  // doesn't lose context on a network blip. Syncing it back to Mongo on
  // reconnect is a future-phase concern (see plan).
  useEffect(() => {
    if (state) localStorage.setItem(`mpl-state-${matchId}`, JSON.stringify(state));
  }, [matchId, state]);

  if (!info || !state) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-on-surface-variant text-sm">
        Loading match console...
      </div>
    );
  }

  // The match minute for the scoresheet — elapsedSeconds is already the
  // real time since this PERIOD started (the clock's anchor, not the
  // on-screen countdown), so converting the displayed countdown back to
  // elapsed time (as a naive implementation might) would just undo work
  // the system already does. periodOffsetMinutes carries forward the
  // length of every period that's already been played (see
  // handleMatchStatusSelect), so this is valid across 1st/2nd half and
  // both extra times without special-casing any of them.
  // Math.ceil matches "round up once past the zeroth second" exactly: an
  // exact multiple of 60 (e.g. 8:00) stays at that minute, anything past
  // it (8:01) rounds up to the next one.
  // Arrow consts (not `function`) so TS keeps the `state`-is-non-null
  // narrowing from the early return above inside their closures.
  const matchMinute = (): number => {
    return Math.ceil(elapsedSeconds / 60) + state.periodOffsetMinutes;
  };

  const scorerLine = (player: RosterPlayer) => {
    return `${player.name} ${matchMinute()}'`;
  };

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  // Minutes already on the books going into the period that's about to
  // END (whatever's currently configured as the regulation length) —
  // shared by both the 2nd-half-kickoff and extra-time transitions below,
  // since both are "the period that just finished adds its length to the
  // running offset" in the same way.
  const minutesJustPlayed = () => Math.round((state.clock.durationSeconds ?? 1200) / 60);

  // Each phase is a direct jump (not a strict sequence) — the operator can
  // restart from any of these points at any time, per the brief. Arrow
  // function (not `function`) so TS keeps the `state`-is-non-null
  // narrowing from the early return above inside this closure.
  const handleMatchStatusSelect = async (newStatus: MatchStatus, options?: MatchFlowSelectOptions) => {
    switch (newStatus) {
      case "in_progress":
        if (state.matchStatus === "pending") {
          // Fresh kickoff: reset the clock to 0 and go, in one atomic step.
          await patch({
            matchStatus: "in_progress",
            activeGraphic: "bug",
            period: "1P",
            periodOffsetMinutes: 0,
            timeoutSide: null,
            clockAction: "restart",
            syncSeconds: 0,
          });
        } else if (state.matchStatus === "half_time") {
          // Second-half kickoff: same atomic reset as the first, but the
          // period advances instead of resetting to 1P, and the offset
          // picks up the just-finished 1st half's length so goal minutes
          // continue counting from 21 instead of resetting to 1.
          await patch({
            matchStatus: "in_progress",
            activeGraphic: "bug",
            period: "2P",
            periodOffsetMinutes: minutesJustPlayed(),
            timeoutSide: null,
            clockAction: "restart",
            syncSeconds: 0,
          });
        } else {
          // Resuming from timeout/etc — just go live again, clock picks up
          // wherever the operator left it, period unchanged.
          await patch({ matchStatus: "in_progress", activeGraphic: "bug", timeoutSide: null });
        }
        break;
      case "timeout":
        await patch({
          matchStatus: "timeout",
          timeoutSide: options?.timeoutSide ?? null,
          clockAction: "pause",
        });
        break;
      case "half_time":
        await patch({
          matchStatus: "half_time",
          activeGraphic: "htft",
          htftTitle: "HALF TIME",
          clockAction: "pause",
        });
        break;
      case "full_time":
        await patch({
          matchStatus: "full_time",
          activeGraphic: "htft",
          htftTitle: "FULL TIME",
          clockAction: "pause",
        });
        break;
      case "extra_time": {
        // ET1 — starts from full_time, regulation just finished. Its
        // duration is whatever the operator just typed in, not the
        // regular-halves length (those run on their own clock setting).
        const minutes = options?.extraTimeDurationMinutes ?? 5;
        await patch({
          matchStatus: "extra_time",
          activeGraphic: "bug",
          period: "ET1",
          periodOffsetMinutes: state.periodOffsetMinutes + minutesJustPlayed(),
          clockConfig: { durationSeconds: minutes * 60, direction: "down" },
          clockAction: "restart",
          syncSeconds: 0,
        });
        break;
      }
      case "extra_time_2": {
        // ET2 — starts from ET1, which just finished; minutesJustPlayed()
        // reads ET1's own configured length (still on the clock at this
        // point, before this same patch overwrites it for ET2).
        const minutes = options?.extraTimeDurationMinutes ?? 5;
        await patch({
          matchStatus: "extra_time_2",
          activeGraphic: "bug",
          period: "ET2",
          periodOffsetMinutes: state.periodOffsetMinutes + minutesJustPlayed(),
          clockConfig: { durationSeconds: minutes * 60, direction: "down" },
          clockAction: "restart",
          syncSeconds: 0,
        });
        break;
      }
      case "ended":
        // Locks the document — see route.ts. This is the one transition
        // that's meant to be hard to walk back from by accident.
        await patch({
          matchStatus: "ended",
          activeGraphic: "htft",
          htftTitle: "FULL TIME",
          clockAction: "pause",
          locked: true,
        });
        break;
      case "pending":
        await patch({ matchStatus: "pending", clockAction: "pause" });
        break;
    }
  };

  const toggleLineupStarting = (side: "home" | "away", number: number) => {
    if (side === "home") {
      const next = state.homeLineupStarting.includes(number)
        ? state.homeLineupStarting.filter((n) => n !== number)
        : state.homeLineupStarting.length < 5
          ? [...state.homeLineupStarting, number]
          : state.homeLineupStarting;
      patch({ homeLineupStarting: next });
    } else {
      const next = state.awayLineupStarting.includes(number)
        ? state.awayLineupStarting.filter((n) => n !== number)
        : state.awayLineupStarting.length < 5
          ? [...state.awayLineupStarting, number]
          : state.awayLineupStarting;
      patch({ awayLineupStarting: next });
    }
  };

  // Sudden death: re-checked on every single tap (not just at the 5-round
  // boundary), so it equally covers the initial 5-round decision and every
  // 1-for-1 round after it. Once both sides have every current round
  // decided and the make-count is still tied, append one more round to
  // each — the overlay/operator grid only ever display the last 5 (see
  // lib/format.ts's visiblePenaltyWindow), so this just grows the
  // underlying history, never the visible width.
  const handlePenaltyChange = (side: "home" | "away", index: number, value: PenaltyResult) => {
    const homeNext =
      side === "home" ? state.homePenalties.map((r, i) => (i === index ? value : r)) : state.homePenalties;
    const awayNext =
      side === "away" ? state.awayPenalties.map((r, i) => (i === index ? value : r)) : state.awayPenalties;

    const bothFullyDecided = homeNext.every((r) => r !== 0) && awayNext.every((r) => r !== 0);
    const tied = countMade(homeNext) === countMade(awayNext);
    const shouldExtend = homeNext.length === awayNext.length && bothFullyDecided && tied;

    patch({
      homePenalties: shouldExtend ? [...homeNext, 0] : homeNext,
      awayPenalties: shouldExtend ? [...awayNext, 0] : awayNext,
    });
  };

  const handleResetMatch = async () => {
    // Pause first so the clock can't keep accumulating between these two
    // calls, then reset everything else (including the clock back to 0).
    await patch({ clockAction: "pause" });
    await patch({
      homeScore: 0,
      awayScore: 0,
      homeFouls: 0,
      awayFouls: 0,
      homeTotalFouls: 0,
      awayTotalFouls: 0,
      homePenalties: [0, 0, 0, 0, 0],
      awayPenalties: [0, 0, 0, 0, 0],
      homeRedCards: 0,
      awayRedCards: 0,
      homeYellowCards: 0,
      awayYellowCards: 0,
      period: "1P",
      periodOffsetMinutes: 0,
      gameMode: "normal",
      activeGraphic: "bug",
      htftTitle: "FULL TIME",
      matchStatus: "pending",
      timeoutSide: null,
      replayActive: false,
      scorers: { home: "", away: "" },
      aggregateEnabled: false,
      aggregateHomeScore: 0,
      aggregateAwayScore: 0,
      homeLineupStarting: [],
      awayLineupStarting: [],
      homeLineupCaptain: null,
      awayLineupCaptain: null,
      homeLineupCurrentPlayer: null,
      awayLineupCurrentPlayer: null,
      lineupSide: "home",
      standingsFormat: "league",
      standingsRows: [],
      bracketRounds: [],
      homeStats: { possession: 50, corners: 0, shotsTotal: 0, shotsOnTarget: 0 },
      awayStats: { possession: 50, corners: 0, shotsTotal: 0, shotsOnTarget: 0 },
      locked: false,
      clockConfig: { direction: "up", durationSeconds: null, overtimeMode: "off", overtimeAllowanceSeconds: 0 },
      clockAction: "sync",
      syncSeconds: 0,
    });
  };

  return (
    <div className="bg-background text-on-background font-body selection:bg-primary/30 min-h-screen flex overflow-x-hidden">
      {/* SIDE NAV */}
      <aside className="hidden lg:flex flex-col h-screen w-64 fixed left-0 top-0 bg-surface-container-low border-r border-outline-variant p-4 space-y-2 z-50">
        <div className="mb-8 px-2">
          <h1 className="text-lg font-headline font-bold text-on-surface">MatchPulse Live</h1>
          <p className="text-[10px] text-tertiary font-medium uppercase tracking-widest">Signal: Optimal (60fps)</p>
        </div>
        <nav className="flex-1 space-y-1">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.label}
              href={item.href ?? "#"}
              className={
                item.active
                  ? "flex items-center gap-3 px-3 py-2 bg-tertiary-container text-tertiary-fixed-dim font-bold rounded-lg transition-all active:scale-95 duration-150"
                  : "flex items-center gap-3 px-3 py-2 text-on-surface-variant hover:bg-surface-container-high transition-all active:scale-95 duration-150 rounded-lg group"
              }
            >
              <span className="material-symbols-outlined text-xl group-hover:text-primary">{item.icon}</span>
              <span className="font-body text-sm">{item.label}</span>
            </a>
          ))}
        </nav>
        <div className="mt-auto pt-4 space-y-1 border-t border-outline-variant">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-4 mt-2 text-left hover:bg-surface-container-high rounded-lg transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-surface-container-highest border border-outline-variant flex items-center justify-center">
              <span className="material-symbols-outlined text-base">person</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-on-surface">Operator</span>
              <span className="text-[10px] text-on-surface-variant uppercase">Sign out</span>
            </div>
          </button>
        </div>
      </aside>

      {/* MOBILE NAV OVERLAY */}
      {mobileNavOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileNavOpen(false)} />
          <aside className="relative w-64 bg-surface-container-low border-r border-outline-variant flex flex-col p-4 space-y-2 overflow-y-auto">
            <div className="mb-8 px-2">
              <h1 className="text-lg font-headline font-bold text-on-surface">MatchPulse Live</h1>
              <p className="text-[10px] text-tertiary font-medium uppercase tracking-widest">Signal: Optimal (60fps)</p>
            </div>
            <nav className="flex-1 space-y-1">
              {NAV_ITEMS.map((item) => (
                <a
                  key={item.label}
                  href="#"
                  onClick={() => setMobileNavOpen(false)}
                  className={
                    item.active
                      ? "flex items-center gap-3 px-3 py-2 bg-tertiary-container text-tertiary-fixed-dim font-bold rounded-lg transition-all active:scale-95 duration-150"
                      : "flex items-center gap-3 px-3 py-2 text-on-surface-variant hover:bg-surface-container-high transition-all active:scale-95 duration-150 rounded-lg group"
                  }
                >
                  <span className="material-symbols-outlined text-xl group-hover:text-primary">{item.icon}</span>
                  <span className="font-body text-sm">{item.label}</span>
                </a>
              ))}
            </nav>
            <div className="mt-auto pt-4 space-y-1 border-t border-outline-variant">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-4 mt-2 text-left hover:bg-surface-container-high rounded-lg transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-surface-container-highest border border-outline-variant flex items-center justify-center">
                  <span className="material-symbols-outlined text-base">person</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-on-surface">Operator</span>
                  <span className="text-[10px] text-on-surface-variant uppercase">Sign out</span>
                </div>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* MAIN */}
      <main className="flex-1 lg:ml-64 lg:h-screen lg:overflow-hidden flex flex-col bg-background">
        <header className="w-full top-0 sticky bg-background flex justify-between items-center px-4 md:px-6 py-2.5 border-b border-outline-variant z-40">
          <div className="flex items-center gap-3 md:gap-8">
            <button
              type="button"
              className="lg:hidden w-9 h-9 flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open navigation menu"
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
            <span className="text-xl font-headline font-black tracking-tighter text-on-background">
              MatchPulse Live
            </span>
            <nav className="hidden md:flex gap-6 text-sm tracking-tight">
              <span className="text-on-surface-variant">{info.match.tournament}</span>
              <span className="text-on-surface-variant">{info.match.matchday}</span>
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <OBSHeaderButton matchId={matchId} onClick={() => setObsOpen(true)} />
            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              aria-label="Match settings"
              className="w-9 h-9 rounded-full bg-surface-container-highest border border-outline-variant text-on-surface-variant flex items-center justify-center hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined text-lg">settings</span>
            </button>
          </div>
        </header>

        <div className="p-4 flex-1 lg:min-h-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 lg:overflow-y-auto custom-scrollbar">
          {/* HOME — source pos 1, auto-places cols 1-3 on desktop */}
          <TeamPanel
            team={info.homeTeam}
            side="home"
            score={state.homeScore}
            fouls={state.homeFouls}
            totalFouls={state.homeTotalFouls + state.homeFouls}
            foulTracking={state.foulTracking}
            redCards={state.homeRedCards}
            yellowCards={state.homeYellowCards}
            onScoreChange={(delta) => patch({ homeScore: Math.max(0, state.homeScore + delta) })}
            onFoulsChange={(delta) => patch({ homeFouls: Math.max(0, state.homeFouls + delta) })}
            onRedCardAdd={(player) =>
              patch({
                homeRedCards: state.homeRedCards + 1,
                playerEvent: { type: "redCard", side: "home", number: player.number, name: player.name },
              })
            }
            onRedCardRemove={() => patch({ homeRedCards: Math.max(0, state.homeRedCards - 1) })}
            onYellowCardAdd={(player) =>
              patch({
                homeYellowCards: state.homeYellowCards + 1,
                playerEvent: { type: "yellowCard", side: "home", number: player.number, name: player.name },
              })
            }
            onYellowCardRemove={() => patch({ homeYellowCards: Math.max(0, state.homeYellowCards - 1) })}
            onGoalScorer={(player) =>
              patch({
                homeScore: state.homeScore + 1,
                scorers: { home: `${state.scorers.home}${state.scorers.home ? "\n" : ""}${scorerLine(player)}` },
                playerEvent: { type: "goal", side: "home", number: player.number, name: player.name },
              })
            }
            lineupStarting={state.homeLineupStarting}
            lineupCaptain={state.homeLineupCaptain}
            lineupCurrentPlayer={state.homeLineupCurrentPlayer}
            onLineupToggleStarting={(number) => toggleLineupStarting("home", number)}
            onLineupSetCaptain={(number) => patch({ homeLineupCaptain: number })}
            onLineupSetCurrentPlayer={(number) => patch({ homeLineupCurrentPlayer: number })}
          />

          {/* CENTER — order-first surfaces Clock first on mobile/tablet; lg:order-none
              restores source order on desktop so auto-placement gives cols 4-9 */}
          <section className="col-span-1 md:col-span-2 lg:col-span-6 order-first lg:order-none lg:h-full flex flex-col gap-4">
            <ClockModule
              clock={state.clock}
              elapsedSeconds={elapsedSeconds}
              period={state.period}
              onStart={() => patch({ clockAction: "start" })}
              onPause={() => patch({ clockAction: "pause" })}
              onSync={(seconds) => patch({ clockAction: "sync", syncSeconds: seconds })}
              gameMode={state.gameMode}
              homePenalties={state.homePenalties}
              awayPenalties={state.awayPenalties}
              homeTeamName={info.homeTeam?.shortName ?? "HOME"}
              awayTeamName={info.awayTeam?.shortName ?? "AWAY"}
              onPenaltyChange={handlePenaltyChange}
              onExitPenalties={() => patch({ gameMode: "normal" })}
            />
            <MatchFlowPanel
              status={state.matchStatus}
              homeTeamName={info.homeTeam?.shortName ?? "HOME"}
              awayTeamName={info.awayTeam?.shortName ?? "AWAY"}
              onSelectStatus={handleMatchStatusSelect}
              onReset={handleResetMatch}
              activeGraphic={state.activeGraphic}
              onSelectGraphic={(graphic) => patch({ activeGraphic: graphic })}
              htftTitle={state.htftTitle}
              onHtftTitleChange={(title) => patch({ htftTitle: title })}
              replayActive={state.replayActive}
              onToggleReplay={() => patch({ replayActive: !state.replayActive })}
              gameMode={state.gameMode}
              onEnterPenalties={() =>
                patch({ gameMode: "penalties", htftTitle: "PENALTIES", activeGraphic: "bug" })
              }
              lineupSide={state.lineupSide}
              onLineupSideChange={(side) => patch({ lineupSide: side })}
              onOpenStandingsEditor={() => setStandingsEditorOpen(true)}
              onOpenStatsEditor={() => setStatsEditorOpen(true)}
            />
          </section>

          {/* AWAY — source pos 3, auto-places cols 10-12 on desktop */}
          <TeamPanel
            team={info.awayTeam}
            side="away"
            score={state.awayScore}
            fouls={state.awayFouls}
            totalFouls={state.awayTotalFouls + state.awayFouls}
            foulTracking={state.foulTracking}
            redCards={state.awayRedCards}
            yellowCards={state.awayYellowCards}
            onScoreChange={(delta) => patch({ awayScore: Math.max(0, state.awayScore + delta) })}
            onFoulsChange={(delta) => patch({ awayFouls: Math.max(0, state.awayFouls + delta) })}
            onRedCardAdd={(player) =>
              patch({
                awayRedCards: state.awayRedCards + 1,
                playerEvent: { type: "redCard", side: "away", number: player.number, name: player.name },
              })
            }
            onRedCardRemove={() => patch({ awayRedCards: Math.max(0, state.awayRedCards - 1) })}
            onYellowCardAdd={(player) =>
              patch({
                awayYellowCards: state.awayYellowCards + 1,
                playerEvent: { type: "yellowCard", side: "away", number: player.number, name: player.name },
              })
            }
            onYellowCardRemove={() => patch({ awayYellowCards: Math.max(0, state.awayYellowCards - 1) })}
            onGoalScorer={(player) =>
              patch({
                awayScore: state.awayScore + 1,
                scorers: { away: `${state.scorers.away}${state.scorers.away ? "\n" : ""}${scorerLine(player)}` },
                playerEvent: { type: "goal", side: "away", number: player.number, name: player.name },
              })
            }
            lineupStarting={state.awayLineupStarting}
            lineupCaptain={state.awayLineupCaptain}
            lineupCurrentPlayer={state.awayLineupCurrentPlayer}
            onLineupToggleStarting={(number) => toggleLineupStarting("away", number)}
            onLineupSetCaptain={(number) => patch({ awayLineupCaptain: number })}
            onLineupSetCurrentPlayer={(number) => patch({ awayLineupCurrentPlayer: number })}
          />
        </div>

        {/* DESKTOP FOOTER */}
        <footer className="hidden lg:flex h-10 bg-surface-container-low border-t border-outline-variant px-6 items-center justify-between text-[10px] font-bold text-on-surface-variant tracking-wider uppercase">
          <div className="flex gap-6">
            <OBSFooterStatus matchId={matchId} />
          </div>
          <div className="flex gap-6">
            <span>{wallClock}</span>
          </div>
        </footer>

        {/* MOBILE BOTTOM NAV */}
        <nav className="lg:hidden sticky bottom-0 bg-surface-container-low border-t border-outline-variant flex z-40">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.label}
              href="#"
              className={`flex-1 flex flex-col items-center gap-1 py-2.5 text-[9px] font-bold uppercase tracking-widest transition-colors ${
                item.active ? "text-tertiary" : "text-on-surface-variant"
              }`}
            >
              <span className={`material-symbols-outlined text-xl ${item.active ? "text-tertiary" : ""}`} style={item.active ? { fontVariationSettings: "'FILL' 1" } : undefined}>
                {item.icon}
              </span>
              {item.label.split(" ")[0]}
            </a>
          ))}
        </nav>
      </main>

      <MatchSettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        homeTeamName={info.homeTeam?.shortName ?? "HOME"}
        awayTeamName={info.awayTeam?.shortName ?? "AWAY"}
        aggregateEnabled={state.aggregateEnabled}
        aggregateHomeScore={state.aggregateHomeScore}
        aggregateAwayScore={state.aggregateAwayScore}
        onAggregateToggle={() => patch({ aggregateEnabled: !state.aggregateEnabled })}
        onAggregateScoreChange={(side, delta) =>
          side === "home"
            ? patch({ aggregateHomeScore: Math.max(0, state.aggregateHomeScore + delta) })
            : patch({ aggregateAwayScore: Math.max(0, state.aggregateAwayScore + delta) })
        }
        clock={state.clock}
        onClockConfigChange={(config) => patch({ clockConfig: config })}
        foulTracking={state.foulTracking}
        onFoulTrackingToggle={() => patch({ foulTracking: !state.foulTracking })}
        locked={state.locked}
        onUnlock={() => patch({ locked: false })}
      />

      <StandingsEditorModal
        open={standingsEditorOpen}
        onClose={() => setStandingsEditorOpen(false)}
        format={state.standingsFormat}
        onFormatChange={(format) => patch({ standingsFormat: format })}
        rows={state.standingsRows}
        onRowsChange={(rows) => patch({ standingsRows: rows })}
        rounds={state.bracketRounds}
        onRoundsChange={(rounds) => patch({ bracketRounds: rounds })}
        onGoLive={() => patch({ activeGraphic: "standings" })}
        isLive={state.activeGraphic === "standings"}
      />

      <StatsEditorModal
        open={statsEditorOpen}
        onClose={() => setStatsEditorOpen(false)}
        homeTeamName={info.homeTeam?.shortName ?? "HOME"}
        awayTeamName={info.awayTeam?.shortName ?? "AWAY"}
        homeStats={state.homeStats}
        awayStats={state.awayStats}
        onChange={(side, statsPatch) =>
          side === "home"
            ? patch({ homeStats: { ...state.homeStats, ...statsPatch } })
            : patch({ awayStats: { ...state.awayStats, ...statsPatch } })
        }
        onGoLive={() => patch({ activeGraphic: "stats" })}
        isLive={state.activeGraphic === "stats"}
      />

      {obsOpen && <OBSModal matchId={matchId} onClose={() => setObsOpen(false)} />}
    </div>
  );
}

function OBSModal({ matchId, onClose }: { matchId: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const obsConnected = useObsStatus(matchId);
  const url =
    typeof window !== "undefined"
      ? `${window.location.origin}/overlay/${matchId}`
      : `/overlay/${matchId}`;

  function copy() {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70" onClick={onClose}>
      <div className="obsidian-card rounded-xl w-full max-w-md p-6 space-y-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-bold text-on-surface text-lg">Conexión OBS</h2>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Agrega esta URL como Browser Source en OBS
            </p>
          </div>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface transition-colors">
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Connection status */}
        <div className={`flex items-center gap-3 rounded-lg px-4 py-3 border ${
          obsConnected === null
            ? "border-outline-variant bg-surface-container"
            : obsConnected
              ? "border-tertiary/40 bg-tertiary/5"
              : "border-error/40 bg-error/5"
        }`}>
          {obsConnected === null ? (
            <span className="h-2.5 w-2.5 rounded-full bg-outline animate-pulse flex-shrink-0" />
          ) : obsConnected ? (
            <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-tertiary opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-tertiary" />
            </span>
          ) : (
            <span className="h-2.5 w-2.5 rounded-full bg-error flex-shrink-0" />
          )}
          <div>
            <p className={`text-xs font-bold uppercase tracking-wider ${
              obsConnected === null ? "text-on-surface-variant" : obsConnected ? "text-tertiary" : "text-error"
            }`}>
              {obsConnected === null ? "Verificando..." : obsConnected ? "OBS Conectado" : "OBS Desconectado"}
            </p>
            <p className="text-[10px] text-on-surface-variant mt-0.5">
              {obsConnected === null
                ? "Comprobando estado del overlay"
                : obsConnected
                  ? "El overlay está activo y recibiendo datos"
                  : "El overlay no está abierto en OBS"}
            </p>
          </div>
        </div>

        <div className="bg-surface-container-highest rounded-lg p-3 font-mono text-xs text-on-surface break-all">
          {url}
        </div>
        <div className="space-y-2 text-xs text-on-surface-variant">
          <p className="flex items-start gap-2">
            <span className="material-symbols-outlined text-base text-primary flex-shrink-0">monitor</span>
            Resolución recomendada: <strong className="text-on-surface">1920 × 1080</strong>
          </p>
          <p className="flex items-start gap-2">
            <span className="material-symbols-outlined text-base text-primary flex-shrink-0">layers</span>
            Activa <strong className="text-on-surface">"Control audio via OBS"</strong> y desactiva el fondo
            personalizado para transparencia total.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={copy}
            className="flex-1 flex items-center justify-center gap-2 bg-primary hover:bg-primary-container text-on-primary font-bold py-2.5 rounded-lg text-sm transition-colors"
          >
            <span className="material-symbols-outlined text-base">{copied ? "check" : "content_copy"}</span>
            {copied ? "¡Copiado!" : "Copiar URL"}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 border border-outline-variant text-on-surface-variant hover:text-on-surface rounded-lg text-sm transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
