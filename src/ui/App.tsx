import { useState } from 'react';
import { CARDS_BY_ID } from '../data/catalog';
import type { GameCard } from '../engine';
import { LocalGameSession } from '../session/session';
import type { GameSession } from '../session/session';
import { draftCardIds, toTeamSetup } from '../teams/roster';
import type { TeamDraft } from '../teams/roster';
import { GameScreen } from './GameScreen';
import { SetupScreen } from './SetupScreen';

function freshSeed(): number {
  return Math.floor(Math.random() * 0xffffffff);
}

export function App() {
  const [session, setSession] = useState<GameSession | null>(() => LocalGameSession.resume());
  const [gameNumber, setGameNumber] = useState(0);
  const [lastTeams, setLastTeams] = useState<{ away: TeamDraft; home: TeamDraft } | null>(null);

  const start = (away: TeamDraft, home: TeamDraft) => {
    const cards: Record<string, GameCard> = {};
    for (const id of [...draftCardIds(away), ...draftCardIds(home)]) cards[id] = CARDS_BY_ID[id];
    setLastTeams({ away, home });
    setGameNumber((n) => n + 1);
    setSession(LocalGameSession.start({ away: toTeamSetup(away), home: toTeamSetup(home), cards, seed: freshSeed() }));
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
      onRematch={lastTeams ? () => start(lastTeams.away, lastTeams.home) : undefined}
    />
  );
}
