import { describe, expect, it } from 'vitest';
import { ALL_CARDS, CARDS_BY_ID, TEAMS, YEARS } from '../data/catalog';
import { applyAction, chartRanges, createGame, getPrompt, runs } from '../engine';
import type { GameState, HitterCard } from '../engine';
import { autoFill, draftCost, draftFromPreset, draftIssues, emptyDraft, POINT_CAP, realTeamDraft, toTeamSetup } from './roster';

function seededRandom(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe('the card list', () => {
  it('has the 1,249 regular cards from 2000 and 2001', () => {
    expect(ALL_CARDS).toHaveLength(1249);
    expect(new Set(ALL_CARDS.map((c) => c.id)).size).toBe(1249);
  });

  it('has a chart covering exactly 1 to 20 on every card', () => {
    for (const card of ALL_CARDS) {
      const ranges = chartRanges(card.chart);
      expect(ranges[0].from, card.id).toBe(1);
      expect(ranges.at(-1)?.to, card.id).toBe(20);
    }
  });

  it('has Matt Walbeck at C+7', () => {
    const card = CARDS_BY_ID['2000-BS-15'] as HitterCard;
    expect(card.name).toBe('Matt Walbeck');
    expect(card.positions[0]).toEqual({ pos: 'C', fielding: 7 });
  });
});

describe('real teams', () => {
  const keys = YEARS.flatMap((year) => TEAMS.map((team) => ({ year, code: team.code })));

  it('can field every team, or tells us which it cannot', () => {
    const cannot = keys.filter((key) => realTeamDraft(key) === null);
    expect(cannot).toEqual([]);
  });

  it('builds a legal team for every franchise and year', () => {
    for (const key of keys) {
      const draft = realTeamDraft(key);
      if (!draft) continue;
      expect(draftIssues(draft), `${key.year} ${key.code}`).toEqual([]);
    }
  });
});

describe('random drafts', () => {
  it('always fits the cap and is ready to play', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const draft = autoFill(emptyDraft('Test'), seededRandom(seed));
      expect(draftIssues(draft), `seed ${seed}`).toEqual([]);
      expect(draftCost(draft)).toBeLessThanOrEqual(POINT_CAP);
    }
  });

  it('keeps cards already chosen', () => {
    const start = emptyDraft('Test');
    start.lineup[0].cardId = '2000-BS-15';
    const draft = autoFill(start, seededRandom(7));
    expect(draft.lineup.some((entry) => entry.cardId === '2000-BS-15')).toBe(true);
  });
});

/** Plays a whole game making random legal choices. */
function playGame(away: ReturnType<typeof toTeamSetup>, home: ReturnType<typeof toTeamSetup>, seed: number) {
  const random = seededRandom(seed);
  const cards = Object.fromEntries(
    [away, home].flatMap((team) =>
      [...team.lineup.map((e) => e.cardId), ...team.rotation, ...team.bullpen, ...team.bench].map((id) => [id, CARDS_BY_ID[id]]),
    ),
  );
  let s: GameState = createGame({ away, home, cards, seed });
  let steps = 0;
  for (let prompt = getPrompt(s); prompt; prompt = getPrompt(s)) {
    const action = prompt.actions[Math.floor(random() * prompt.actions.length)];
    s = applyAction(s, prompt.actor, action).state;
    // The rules that must hold after every single move.
    const onBase = s.bases.filter(Boolean);
    expect(new Set(onBase).size).toBe(onBase.length);
    expect(s.outs).toBeLessThan(3);
    for (const side of ['away', 'home'] as const) {
      const team = s.teams[side];
      expect(new Set(team.lineup.map((e) => e.cardId)).size).toBe(9);
      expect(new Set(team.lineup.map((e) => e.slot)).size).toBe(9);
      for (const entry of team.lineup) {
        if (entry.slot === 'DH') continue;
        const card = s.cards[entry.cardId] as HitterCard;
        expect(card.positions.length).toBeGreaterThan(0);
      }
    }
    if (++steps > 20000) throw new Error('Game never ended');
  }
  return s;
}

describe('whole games', () => {
  it('always finish with a winner and consistent stats', () => {
    let games = 0;
    let totalRuns = 0;
    let plateAppearances = 0;
    let timesOnBase = 0;
    for (let seed = 1; seed <= 60; seed++) {
      const random = seededRandom(seed * 31);
      const away = toTeamSetup(autoFill(emptyDraft('A'), random));
      const home = toTeamSetup(autoFill(emptyDraft('H'), random));
      const s = playGame(away, home, seed);
      expect(s.winner).not.toBeNull();
      const a = runs(s, 'away');
      const h = runs(s, 'home');
      expect(a).not.toBe(h);
      expect(s.winner).toBe(h > a ? 'home' : 'away');

      for (const side of ['away', 'home'] as const) {
        const lines = Object.values(s.teams[side].batting);
        expect(lines.reduce((sum, l) => sum + l.r, 0)).toBe(runs(s, side));
        expect(lines.reduce((sum, l) => sum + l.h, 0)).toBe(s.teams[side].hits);
        plateAppearances += lines.reduce((sum, l) => sum + l.ab + l.bb, 0);
        timesOnBase += lines.reduce((sum, l) => sum + l.h + l.bb, 0);
      }
      games += 1;
      totalRuns += a + h;
    }
    const perTeam = totalRuns / games / 2;
    const onBasePct = timesOnBase / plateAppearances;
    // Random managing isn't good managing, but the game should still look like baseball.
    expect(perTeam).toBeGreaterThan(2);
    expect(perTeam).toBeLessThan(9);
    expect(onBasePct).toBeGreaterThan(0.28);
    expect(onBasePct).toBeLessThan(0.42);
  }, 120000);

  it('is repeatable from the same seed and choices', () => {
    const away = toTeamSetup(draftFromPreset({ year: 2001, code: 'NYY' }));
    const home = toTeamSetup(draftFromPreset({ year: 2001, code: 'SEA' }));
    expect(playGame(away, home, 42)).toEqual(playGame(away, home, 42));
  });
});
