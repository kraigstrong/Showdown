import { useState } from 'react';
import { CARDS_BY_ID } from '../data/catalog';
import type { GameCard, Side } from '../engine';
import { LocalGameSession } from '../session/session';
import type { GameSession } from '../session/session';
import { applyPlatoons, draftCardIds, toTeamSetup } from '../teams/roster';
import type { TeamDraft } from '../teams/roster';
import { GameScreen } from './GameScreen';
import { SetupScreen } from './SetupScreen';

/** Each manager's pick to start the game. */
export type Starters = Record<Side, string>;

function freshSeed(): number {
  return Math.floor(Math.random() * 0xffffffff);
}

export function App() {
  const [session, setSession] = useState<GameSession | null>(() => LocalGameSession.resume());
  const [gameNumber, setGameNumber] = useState(0);
  const [lastTeams, setLastTeams] = useState<{ away: TeamDraft; home: TeamDraft; starters: Starters } | null>(null);

  const start = (away: TeamDraft, home: TeamDraft, starters: Starters) => {
    const cards: Record<string, GameCard> = {};
    for (const id of [...draftCardIds(away), ...draftCardIds(home)]) cards[id] = CARDS_BY_ID[id];
    setLastTeams({ away, home, starters });
    setGameNumber((n) => n + 1);
    // Each side's platoons depend on which hand the other side's starter throws with.
    const awayPlays = applyPlatoons(away, CARDS_BY_ID[starters.home]?.hand);
    const homePlays = applyPlatoons(home, CARDS_BY_ID[starters.away]?.hand);
    setSession(
      LocalGameSession.start({
        away: { ...toTeamSetup(awayPlays), starterId: starters.away },
        home: { ...toTeamSetup(homePlays), starterId: starters.home },
        cards,
        seed: freshSeed(),
      }),
    );
  };

  if (!session) return <SetupScreen onStart={start} initial={lastTeams} />;

  return (
    <GameScreen
      key={gameNumber}
      session={session}
      onExit={() => {
        LocalGameSession.clearSaved();
        setSession(null);
      }}
      onRematch={lastTeams ? () => start(lastTeams.away, lastTeams.home, lastTeams.starters) : undefined}
    />
  );
}
