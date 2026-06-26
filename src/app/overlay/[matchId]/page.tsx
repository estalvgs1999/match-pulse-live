"use client";

import { use } from "react";
import { useMatchInfo } from "@/hooks/useMatchInfo";
import { useMatchState } from "@/hooks/useMatchState";
import { useServerOffset } from "@/hooks/useServerOffset";
import { useMatchClock } from "@/hooks/useMatchClock";
import { usePlayerEventChip } from "@/hooks/usePlayerEventChip";
import { useObsHeartbeat } from "@/hooks/useObsHeartbeat";
import { DEFAULT_CLOCK } from "@/models/MatchState";

// Redesigned template
import { MainBug } from "@/components/overlay/MainBug";
import { HTFTScreen } from "@/components/overlay/HTFTScreen";
import { LineupsScreen } from "@/components/overlay/LineupsScreen";
import { StandingsScreen } from "@/components/overlay/StandingsScreen";
import { StatsScreen } from "@/components/overlay/StatsScreen";
import { MatchEventChip } from "@/components/overlay/MatchEventChip";
import { PreMatchScreen } from "@/components/overlay/PreMatchScreen";

// Classic template
import { MainBug as ClassicMainBug } from "@/components/overlay/classic/MainBug";
import { HTFTScreen as ClassicHTFTScreen } from "@/components/overlay/classic/HTFTScreen";
import { LineupsScreen as ClassicLineupsScreen } from "@/components/overlay/classic/LineupsScreen";
import { StandingsScreen as ClassicStandingsScreen } from "@/components/overlay/classic/StandingsScreen";
import { StatsScreen as ClassicStatsScreen } from "@/components/overlay/classic/StatsScreen";
import { MatchEventChip as ClassicMatchEventChip } from "@/components/overlay/classic/MatchEventChip";
import { PreMatchScreen as ClassicPreMatchScreen } from "@/components/overlay/classic/PreMatchScreen";

// Champions template
import { MainBug as ChampionsMainBug } from "@/components/overlay/champions/MainBug";
import { HTFTScreen as ChampionsHTFTScreen } from "@/components/overlay/champions/HTFTScreen";
import { LineupsScreen as ChampionsLineupsScreen } from "@/components/overlay/champions/LineupsScreen";
import { StandingsScreen as ChampionsStandingsScreen } from "@/components/overlay/champions/StandingsScreen";
import { StatsScreen as ChampionsStatsScreen } from "@/components/overlay/champions/StatsScreen";
import { MatchEventChip as ChampionsMatchEventChip } from "@/components/overlay/champions/MatchEventChip";
import { PreMatchScreen as ChampionsPreMatchScreen } from "@/components/overlay/champions/PreMatchScreen";

const REDESIGNED = {
  MainBug,
  HTFTScreen,
  LineupsScreen,
  StandingsScreen,
  StatsScreen,
  MatchEventChip,
  PreMatchScreen,
};

const CLASSIC = {
  MainBug: ClassicMainBug,
  HTFTScreen: ClassicHTFTScreen,
  LineupsScreen: ClassicLineupsScreen,
  StandingsScreen: ClassicStandingsScreen,
  StatsScreen: ClassicStatsScreen,
  MatchEventChip: ClassicMatchEventChip,
  PreMatchScreen: ClassicPreMatchScreen,
};

const CHAMPIONS = {
  MainBug: ChampionsMainBug,
  HTFTScreen: ChampionsHTFTScreen,
  LineupsScreen: ChampionsLineupsScreen,
  StandingsScreen: ChampionsStandingsScreen,
  StatsScreen: ChampionsStatsScreen,
  MatchEventChip: ChampionsMatchEventChip,
  PreMatchScreen: ChampionsPreMatchScreen,
};

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
  useObsHeartbeat(matchId);

  // Stay blank (transparent) until both hydrate — avoids flashing default
  // values over the broadcast feed. Same path runs on a fresh OBS source
  // load and on a crash-recovery reload: there's no special case for either.
  if (!info || !state) {
    return null;
  }

  const tmpl = info.match.overlayTemplate ?? "redesigned";
  const C = tmpl === "classic" ? CLASSIC : tmpl === "champions" ? CHAMPIONS : REDESIGNED;

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
      <C.MainBug
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
      <C.HTFTScreen
        visible={state.activeGraphic === "htft"}
        title={state.htftTitle}
        homeTeam={homeTeamFull}
        awayTeam={awayTeamFull}
        homeScore={state.homeScore}
        awayScore={state.awayScore}
        homeScorers={state.scorers.home}
        awayScorers={state.scorers.away}
      />
      <C.LineupsScreen
        visible={state.activeGraphic === "lineups"}
        team={state.lineupSide === "home" ? info.homeTeam : info.awayTeam}
        startingNumbers={state.lineupSide === "home" ? state.homeLineupStarting : state.awayLineupStarting}
        captainNumber={state.lineupSide === "home" ? state.homeLineupCaptain : state.awayLineupCaptain}
        currentPlayerNumber={
          state.lineupSide === "home" ? state.homeLineupCurrentPlayer : state.awayLineupCurrentPlayer
        }
      />
      <C.StandingsScreen
        visible={state.activeGraphic === "standings"}
        tournamentName={info.match.tournament}
        format={state.standingsFormat}
        rows={state.standingsRows}
        rounds={state.bracketRounds}
      />
      <C.StatsScreen
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
      <C.PreMatchScreen
        visible={state.activeGraphic === "prematch"}
        homeTeam={homeTeamFull}
        awayTeam={awayTeamFull}
        tournament={info.match.tournament}
        matchday={info.match.matchday}
        date={info.match.date}
        stadium={info.match.stadium}
      />
      <C.MatchEventChip
        timeoutActive={state.matchStatus === "timeout"}
        timeoutTeam={
          state.timeoutSide === "home" ? homeTeamFull : state.timeoutSide === "away" ? awayTeamFull : null
        }
        replayActive={state.replayActive}
      />
    </div>
  );
}
