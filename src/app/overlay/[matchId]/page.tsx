"use client";

import { use } from "react";
import { useMatchInfo } from "@/hooks/useMatchInfo";
import { useMatchState } from "@/hooks/useMatchState";
import { useServerOffset } from "@/hooks/useServerOffset";
import { useMatchClock } from "@/hooks/useMatchClock";
import { usePlayerEventChip } from "@/hooks/usePlayerEventChip";
import { MainBug } from "@/components/overlay/MainBug";
import { HTFTScreen } from "@/components/overlay/HTFTScreen";
import { LineupsScreen } from "@/components/overlay/LineupsScreen";
import { StandingsScreen } from "@/components/overlay/StandingsScreen";
import { StatsScreen } from "@/components/overlay/StatsScreen";
import { MatchEventChip } from "@/components/overlay/MatchEventChip";
import { PreMatchScreen } from "@/components/overlay/PreMatchScreen";
import { DEFAULT_CLOCK } from "@/models/MatchState";

export default function OverlayPage({
  params,
}: {
  params: Promise<{ matchId: string }>;
}) {
  const { matchId } = use(params);
  const info = useMatchInfo(matchId);
  const { state } = useMatchState(matchId);
  const { offsetMs } = useServerOffset();
  const elapsedSeconds = useMatchClock(state?.clock ?? DEFAULT_CLOCK, offsetMs);
  const playerEvent = usePlayerEventChip(matchId);

  // Stay blank (transparent) until both hydrate — avoids flashing default
  // values over the broadcast feed. Same path runs on a fresh OBS source
  // load and on a crash-recovery reload: there's no special case for either.
  if (!info || !state) {
    return null;
  }

  const homeTeam = {
    name: info.homeTeam?.shortName ?? "HOME",
    logoUrl: info.homeTeam?.logoUrl,
    color: info.homeTeam?.colors.accent ?? "#67f58b",
  };
  const awayTeam = {
    name: info.awayTeam?.shortName ?? "AWAY",
    logoUrl: info.awayTeam?.logoUrl,
    color: info.awayTeam?.colors.accent ?? "#67f58b",
  };
  // HT/FT has the room (and the requirement) to spell out full team names,
  // unlike MainBug's narrow team-code slots — a separate pair rather than
  // changing `homeTeam`/`awayTeam`, which MainBug still needs short.
  const homeTeamFull = { ...homeTeam, name: info.homeTeam?.name ?? "HOME" };
  const awayTeamFull = { ...awayTeam, name: info.awayTeam?.name ?? "AWAY" };

  return (
    <div className="fixed inset-0 overflow-hidden" style={{ background: "transparent" }}>
      <MainBug
        visible={state.activeGraphic === "bug"}
        mode={state.gameMode}
        period={state.period}
        clock={state.clock}
        elapsedSeconds={elapsedSeconds}
        homeTeam={homeTeam}
        awayTeam={awayTeam}
        homeScore={state.homeScore}
        awayScore={state.awayScore}
        homeFouls={state.homeFouls}
        awayFouls={state.awayFouls}
        homePenalties={state.homePenalties}
        awayPenalties={state.awayPenalties}
        homeRedCards={state.homeRedCards}
        awayRedCards={state.awayRedCards}
        playerEvent={playerEvent}
        aggregateEnabled={state.aggregateEnabled}
        aggregateHomeScore={state.aggregateHomeScore}
        aggregateAwayScore={state.aggregateAwayScore}
      />
      <HTFTScreen
        visible={state.activeGraphic === "htft"}
        title={state.htftTitle}
        homeTeam={homeTeamFull}
        awayTeam={awayTeamFull}
        homeScore={state.homeScore}
        awayScore={state.awayScore}
        homeScorers={state.scorers.home}
        awayScorers={state.scorers.away}
      />
      <LineupsScreen
        visible={state.activeGraphic === "lineups"}
        team={state.lineupSide === "home" ? info.homeTeam : info.awayTeam}
        startingNumbers={state.lineupSide === "home" ? state.homeLineupStarting : state.awayLineupStarting}
        captainNumber={state.lineupSide === "home" ? state.homeLineupCaptain : state.awayLineupCaptain}
        currentPlayerNumber={
          state.lineupSide === "home" ? state.homeLineupCurrentPlayer : state.awayLineupCurrentPlayer
        }
      />
      <StandingsScreen
        visible={state.activeGraphic === "standings"}
        tournamentName={info.match.tournament}
        format={state.standingsFormat}
        rows={state.standingsRows}
        rounds={state.bracketRounds}
      />
      <StatsScreen
        visible={state.activeGraphic === "stats"}
        homeTeam={homeTeamFull}
        awayTeam={awayTeamFull}
        homeScore={state.homeScore}
        awayScore={state.awayScore}
        homeFouls={state.homeFouls}
        awayFouls={state.awayFouls}
        homeRedCards={state.homeRedCards}
        awayRedCards={state.awayRedCards}
        homeYellowCards={state.homeYellowCards}
        awayYellowCards={state.awayYellowCards}
        homeStats={state.homeStats}
        awayStats={state.awayStats}
      />
      <PreMatchScreen
        visible={state.activeGraphic === "prematch"}
        homeTeam={homeTeamFull}
        awayTeam={awayTeamFull}
        tournament={info.match.tournament}
        matchday={info.match.matchday}
        date={info.match.date}
        stadium={info.match.stadium}
      />
      <MatchEventChip
        timeoutActive={state.matchStatus === "timeout"}
        timeoutTeam={
          state.timeoutSide === "home" ? homeTeamFull : state.timeoutSide === "away" ? awayTeamFull : null
        }
        replayActive={state.replayActive}
      />
    </div>
  );
}
