import { describe, expect, it } from 'vitest';
import { applyAction, createGame, getPrompt, IllegalActionError, infieldTotal, runs, throwNumbers } from './game';
import { cardFieldingAt, chanceToBeat, chartRanges, fatigueOf, fieldingAt, resultForRoll } from './rules';
import type { Action, Chart, GameCard, GameState, HitterCard, LineupSlot, PitcherCard, TeamSetup } from './types';

// ---------------------------------------------------------------- helpers

const ALL_OUTS: Chart = { SO: 20 };
const SLOTS: LineupSlot[] = ['C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH'];

function hitter(id: string, slot: LineupSlot, extra: Partial<HitterCard> = {}): HitterCard {
  return {
    id,
    playerId: id,
    name: id,
    year: 2000,
    set: 'BS',
    number: 1,
    team: 'NYY',
    points: 100,
    hand: 'R',
    foil: false,
    chart: ALL_OUTS,
    kind: 'hitter',
    onBase: 7,
    speed: 15,
    positions: slot === 'DH' ? [{ pos: 'DH', fielding: 0 }] : [{ pos: slot, fielding: 0 }],
    ...extra,
  };
}

function pitcher(id: string, extra: Partial<PitcherCard> = {}): PitcherCard {
  return {
    id,
    playerId: id,
    name: id,
    year: 2000,
    set: 'BS',
    number: 1,
    team: 'NYY',
    points: 100,
    hand: 'R',
    foil: false,
    chart: ALL_OUTS,
    kind: 'pitcher',
    control: 3,
    ip: 6,
    role: 'Starter',
    ...extra,
  };
}

function buildTeam(prefix: string, cards: Record<string, GameCard>, overrides: Record<string, Partial<HitterCard>> = {}): TeamSetup {
  const lineup = SLOTS.map((slot) => {
    const card = hitter(`${prefix}${slot}`, slot, overrides[slot]);
    cards[card.id] = card;
    return { cardId: card.id, slot };
  });
  const rotation = [1, 2, 3, 4].map((n) => {
    const card = pitcher(`${prefix}SP${n}`);
    cards[card.id] = card;
    return card.id;
  });
  const reliever = pitcher(`${prefix}RP`, { role: 'Reliever', ip: 1 });
  cards[reliever.id] = reliever;
  const backup = hitter(`${prefix}BN`, 'SS');
  cards[backup.id] = backup;
  return { name: prefix, lineup, rotation, bullpen: [reliever.id], bench: [backup.id] };
}

function seedForRoll(wanted: number): number {
  for (let seed = 0; seed < 100000; seed++) {
    let t = (seed + 0x6d2b79f5) >>> 0;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    const roll = Math.floor((((t ^ (t >>> 14)) >>> 0) / 4294967296) * 20) + 1;
    if (roll === wanted) return seed;
  }
  throw new Error(`No seed gives ${wanted}`);
}

/** Acts for whichever manager's turn it is, optionally forcing the next die. */
function act(s: GameState, action: Action, roll?: number): GameState {
  const prompt = getPrompt(s);
  if (!prompt) throw new Error('Game over');
  const next = roll === undefined ? s : { ...s, rng: seedForRoll(roll) };
  return applyAction(next, prompt.actor, action).state;
}

const ROLL: Action = { type: 'ROLL' };

function newGame(
  overrides: { away?: Record<string, Partial<HitterCard>>; home?: Record<string, Partial<HitterCard>> } = {},
  starters: { away?: string; home?: string } = {},
) {
  const cards: Record<string, GameCard> = {};
  const away = { ...buildTeam('a', cards, overrides.away), starterId: starters.away };
  const home = { ...buildTeam('h', cards, overrides.home), starterId: starters.home };
  return createGame({ away, home, cards, seed: 1 });
}

function setChart(s: GameState, id: string, chart: Chart): GameState {
  return { ...s, cards: { ...s.cards, [id]: { ...s.cards[id], chart } } };
}

/** Plays one at-bat to a known result: the batter always wins the pitch. */
function swing(s: GameState, result: keyof Chart, batterId: string): GameState {
  let state = setChart(s, batterId, { [result]: 20 });
  if (state.phase.kind === 'offense') state = act(state, { type: 'PROCEED' });
  state = act(state, ROLL, 1);
  return act(state, ROLL, 10);
}

function place(s: GameState, bases: [string | null, string | null, string | null], outs = 0): GameState {
  const next = { ...s, bases, outs };
  return { ...next, phase: bases[0] && !bases[1] ? { kind: 'offense' } : s.phase };
}

function lastOf<T extends GameState['log'][number]['t']>(s: GameState, t: T) {
  return [...s.log].reverse().find((e) => e.t === t) as Extract<GameState['log'][number], { t: T }>;
}

// ---------------------------------------------------------------- charts

describe('charts', () => {
  const card = { year: 2001, chart: { SO: 2, GB: 3, FB: 2, BB: 4, '1B': 6, '1B+': 1, '2B': 1, HR: 1 } as Chart };

  it('stacks results in card order', () => {
    expect(chartRanges(card)[0]).toEqual({ result: 'SO', from: 1, to: 2 });
    expect(chartRanges(card).at(-1)).toEqual({ result: 'HR', from: 20, to: 20 });
  });

  it('finds the result for every roll', () => {
    expect(resultForRoll(card, 1)).toBe('SO');
    expect(resultForRoll(card, 3)).toBe('GB');
    expect(resultForRoll(card, 18)).toBe('1B+');
    expect(resultForRoll(card, 20)).toBe('HR');
  });

  it('puts strikeouts above pop-ups in 2000 and below them in 2001', () => {
    const chart: Chart = { PU: 2, SO: 4, GB: 14 };
    expect(chartRanges({ year: 2000, chart }).slice(0, 2)).toEqual([
      { result: 'SO', from: 1, to: 4 },
      { result: 'PU', from: 5, to: 6 },
    ]);
    expect(chartRanges({ year: 2001, chart }).slice(0, 2)).toEqual([
      { result: 'PU', from: 1, to: 2 },
      { result: 'SO', from: 3, to: 6 },
    ]);
  });
});

describe('positions', () => {
  it('lets OF cover all three outfield spots and LF/RF only two', () => {
    const of = hitter('x', 'LF', { positions: [{ pos: 'OF', fielding: 2 }] });
    const corner = hitter('y', 'LF', { positions: [{ pos: 'LF/RF', fielding: 1 }] });
    expect(cardFieldingAt(of, 'CF')).toBe(2);
    expect(cardFieldingAt(corner, 'RF')).toBe(1);
    expect(cardFieldingAt(corner, 'CF')).toBeNull();
  });

  it('lets any hitter DH', () => {
    expect(fieldingAt(hitter('x', 'C'), 'DH')).toBe(0);
  });

  it('lets an infielder play anywhere in the infield and a DH play first, at +0 off his card', () => {
    const shortstop = hitter('x', 'SS', { positions: [{ pos: 'SS', fielding: 3 }] });
    expect(fieldingAt(shortstop, 'SS')).toBe(3);
    expect(fieldingAt(shortstop, '3B')).toBe(0);
    expect(fieldingAt(shortstop, 'LF')).toBeNull();
    expect(fieldingAt(shortstop, 'C')).toBeNull();
    const dh = hitter('y', 'DH');
    expect(fieldingAt(dh, '1B')).toBe(0);
    expect(fieldingAt(dh, '2B')).toBeNull();
    expect(fieldingAt(hitter('z', 'CF', { positions: [{ pos: 'CF', fielding: 2 }] }), '1B')).toBeNull();
    expect(fieldingAt(hitter('c', 'C', { positions: [{ pos: 'C', fielding: 5 }] }), '1B')).toBeNull();
  });

  it('lets an outfielder play anywhere in the outfield, at +0 off his card', () => {
    const center = hitter('x', 'CF', { positions: [{ pos: 'CF', fielding: 2 }] });
    expect(fieldingAt(center, 'CF')).toBe(2);
    expect(fieldingAt(center, 'LF')).toBe(0);
    const corner = hitter('y', 'LF', { positions: [{ pos: 'LF/RF', fielding: 1 }] });
    expect(fieldingAt(corner, 'RF')).toBe(1);
    expect(fieldingAt(corner, 'CF')).toBe(0);
    expect(fieldingAt(corner, '2B')).toBeNull();
    expect(fieldingAt(hitter('z', 'SS', { positions: [{ pos: 'SS', fielding: 3 }] }), 'CF')).toBeNull();
    expect(fieldingAt(hitter('d', 'DH'), 'LF')).toBeNull();
  });

  it('counts a DH at first as +0 in the infield total for a double play', () => {
    const s = newGame({ home: { '1B': { positions: [{ pos: 'DH', fielding: 0 }] }, SS: { positions: [{ pos: 'SS', fielding: 3 }] } } });
    expect(infieldTotal(s, 'home')).toBe(3);
  });
});

// ---------------------------------------------------------------- starting pitchers

describe('starting pitchers', () => {
  it('starts with the ace on the mound and the first pitch waiting, no roll needed', () => {
    const s = newGame();
    expect(s.teams.away.pitcherId).toBe('aSP1');
    expect(s.teams.home.pitcherId).toBe('hSP1');
    expect(s.phase).toEqual({ kind: 'pitch' });
    expect(s.log[0]).toEqual({ t: 'starters', away: 'aSP1', home: 'hSP1' });
  });

  it("uses each manager's pick from the rotation", () => {
    const s = newGame({}, { away: 'aSP3', home: 'hSP2' });
    expect(s.teams.away.pitcherId).toBe('aSP3');
    expect(s.teams.away.starterId).toBe('aSP3');
    expect(s.teams.away.pitchersUsed).toEqual(['aSP3']);
    expect(s.teams.home.pitcherId).toBe('hSP2');
    expect(s.teams.home.pitching.hSP2.innings).toBe(1);
  });

  it('falls back to the ace if the pick is not in the rotation', () => {
    expect(newGame({}, { away: 'aRP' }).teams.away.pitcherId).toBe('aSP1');
  });
});

// ---------------------------------------------------------------- the pitch

describe('the pitch', () => {
  it('gives the pitcher the advantage only when his total is higher', () => {
    const s = newGame();
    // Control 3 against On-Base 7.
    expect(act(s, ROLL, 5).phase).toEqual({ kind: 'swing', on: 'pitcher' });
    expect(act(s, ROLL, 4).phase).toEqual({ kind: 'swing', on: 'batter' });
    expect(lastOf(act(s, ROLL, 4), 'pitch').total).toBe(7);
  });

  it('subtracts one per inning past IP, from the rulebook example', () => {
    expect(fatigueOf(pitcher('x', { ip: 6 }), { innings: 9 })).toBe(3);
    expect(fatigueOf(pitcher('x', { ip: 1 }), { innings: 3 })).toBe(2);
    expect(fatigueOf(pitcher('x', { ip: 6 }), { innings: 6 })).toBe(0);
  });

  it('applies fatigue to the total pitch once a pitcher is tired', () => {
    let s = newGame();
    s = { ...s, teams: { ...s.teams, home: { ...s.teams.home, pitching: { ...s.teams.home.pitching, hSP1: { ...s.teams.home.pitching.hSP1, innings: 9 } } } } };
    const after = act(s, ROLL, 5);
    const event = lastOf(after, 'pitch');
    expect(event.fatigue).toBe(3);
    expect(event.total).toBe(5);
    expect(after.phase).toEqual({ kind: 'swing', on: 'batter' });
  });
});

// ---------------------------------------------------------------- results

describe('swing results', () => {
  it('moves runners one base on a single', () => {
    let s = place(newGame(), [null, 'a1B', 'a2B']);
    s = swing(s, '1B', 'aC');
    expect(s.bases[0]).toBe('aC');
    expect(s.bases[2]).toBe('a1B');
    expect(runs(s, 'away')).toBe(1);
  });

  it('moves runners two bases on a double', () => {
    let s = place(newGame(), ['a1B', 'a2B', null]);
    s = swing(s, '2B', 'aC');
    expect(s.bases).toEqual([null, 'aC', 'a1B']);
    expect(runs(s, 'away')).toBe(1);
  });

  it('scores everyone on a triple and a homer', () => {
    let s = place(newGame(), ['a1B', 'a2B', 'a3B']);
    s = swing(s, '3B', 'aC');
    expect(s.bases).toEqual([null, null, 'aC']);
    expect(runs(s, 'away')).toBe(3);
    s = swing(s, 'HR', 'a1B');
    expect(s.bases).toEqual([null, null, null]);
    expect(runs(s, 'away')).toBe(5);
  });

  it('only forces runners on a walk', () => {
    let s = place(newGame(), [null, 'a2B', null]);
    s = swing(s, 'BB', 'aC');
    expect(s.bases).toEqual(['aC', 'a2B', null]);

    s = place(newGame(), ['a1B', 'a2B', 'a3B']);
    s = swing(s, 'BB', 'aC');
    expect(s.bases).toEqual(['aC', 'a1B', 'a2B']);
    expect(runs(s, 'away')).toBe(1);
  });

  it('leaves runners alone on strikeouts and pop-ups', () => {
    for (const result of ['SO', 'PU'] as const) {
      let s = place(newGame(), [null, 'a2B', 'a3B']);
      s = swing(s, result, 'aC');
      expect(s.outs).toBe(1);
      expect(s.bases).toEqual([null, 'a2B', 'a3B']);
      expect(runs(s, 'away')).toBe(0);
    }
  });

  it('takes second before the next pitch on a 1B+ if it is open', () => {
    let s = newGame();
    s = swing(s, '1B+', 'aC');
    expect(s.bases).toEqual([null, 'aC', null]);
    expect(lastOf(s, 'advance').reason).toBe('single+');
  });

  it('stays on first after a 1B+ if second is taken', () => {
    let s = place(newGame(), ['a1B', null, null]);
    s = swing(s, '1B+', 'aC');
    expect(s.phase.kind).toBe('send');
    s = act(s, { type: 'SEND', from: [] });
    expect(s.bases).toEqual(['aC', 'a1B', null]);
  });
});

// ---------------------------------------------------------------- ground balls

describe('ground balls', () => {
  it('just retires the batter and moves runners up with first base empty', () => {
    let s = place(newGame(), [null, 'a2B', 'a3B']);
    s = swing(s, 'GB', 'aC');
    expect(s.outs).toBe(1);
    expect(s.bases).toEqual([null, null, 'a2B']);
    expect(runs(s, 'away')).toBe(1);
  });

  it('never scores a run on the third out', () => {
    let s = place(newGame(), [null, 'a2B', 'a3B'], 2);
    s = swing(s, 'GB', 'aC');
    expect(runs(s, 'away')).toBe(0);
    expect(s.half).toBe('bottom');
  });

  it('always gets the runner from first, then rolls for the batter', () => {
    let s = place(newGame(), ['a1B', null, null]);
    s = swing(s, 'GB', 'aC');
    expect(s.outs).toBe(1);
    expect(s.phase).toEqual({ kind: 'doublePlay' });

    // Infield Fielding is 0 and batter Speed is 15, so a 16 turns two and a 15 doesn't.
    const turned = act(s, ROLL, 16);
    expect(turned.outs).toBe(2);
    expect(turned.bases).toEqual([null, null, null]);

    const safe = act(s, ROLL, 15);
    expect(safe.outs).toBe(1);
    expect(safe.bases).toEqual(['aC', null, null]);
  });

  it('adds the infielders’ total Fielding to the double-play roll', () => {
    let s = newGame({ home: { '2B': { positions: [{ pos: '2B', fielding: 3 }] }, SS: { positions: [{ pos: 'SS', fielding: 4 }] } } });
    s = place(s, ['a1B', null, null]);
    s = swing(s, 'GB', 'aC');
    const after = act(s, ROLL, 9);
    expect(lastOf(after, 'doublePlay')).toMatchObject({ bonus: 7, total: 16, target: 15, out: true });
  });

  it('skips the roll when the force is the third out', () => {
    let s = place(newGame(), ['a1B', null, 'a3B'], 2);
    s = swing(s, 'GB', 'aC');
    expect(s.half).toBe('bottom');
    expect(runs(s, 'away')).toBe(0);
  });

  it('scores from third on a failed double play but not a completed one for out three', () => {
    let s = place(newGame(), ['a1B', null, 'a3B'], 1);
    s = swing(s, 'GB', 'aC');
    expect(s.phase).toEqual({ kind: 'doublePlay' });
    expect(runs(act(s, ROLL, 15), 'away')).toBe(1);
    const completed = act(s, ROLL, 16);
    expect(runs(completed, 'away')).toBe(0);
    expect(completed.half).toBe('bottom');
  });
});

// ---------------------------------------------------------------- tagging up and extra bases

describe('tagging up', () => {
  it('offers the runners on second and third, not first', () => {
    let s = place(newGame(), ['a1B', 'a2B', 'a3B']);
    s = swing(s, 'FB', 'aC');
    expect(s.phase.kind).toBe('send');
    expect(getPrompt(s)?.actions).toEqual([
      { type: 'SEND', from: [] },
      { type: 'SEND', from: [2] },
      { type: 'SEND', from: [2, 1] },
    ]);
  });

  it('skips the offer on the third out', () => {
    let s = place(newGame(), [null, null, 'a3B'], 2);
    s = swing(s, 'FB', 'aC');
    expect(s.half).toBe('bottom');
    expect(runs(s, 'away')).toBe(0);
  });

  it('holds with no offer when only first is occupied', () => {
    let s = place(newGame(), ['a1B', null, null]);
    s = swing(s, 'FB', 'aC');
    expect(s.phase.kind).not.toBe('send');
    expect(s.bases).toEqual(['a1B', null, null]);
  });

  it('gives a runner going home +5 on the target and ties to the runner', () => {
    let s = place(newGame(), [null, null, 'a3B']);
    s = swing(s, 'FB', 'aC');
    s = act(s, { type: 'SEND', from: [2] });
    expect(s.phase.kind).toBe('throw');
    // Speed 15 + 5 going home = 20, and outfield Fielding is 0.
    const safe = act(s, ROLL, 20);
    expect(lastOf(safe, 'throw')).toMatchObject({ target: 20, total: 20, out: false });
    expect(runs(safe, 'away')).toBe(1);
  });

  it('can throw a tagging runner out for an out', () => {
    let s = newGame({ home: { LF: { positions: [{ pos: 'LF/RF', fielding: 2 }] }, CF: { positions: [{ pos: 'CF', fielding: 3 }] } } });
    s = place(s, [null, 'a2B', null]);
    s = swing(s, 'FB', 'aC');
    s = act(s, { type: 'SEND', from: [1] });
    const after = act(s, ROLL, 11);
    expect(lastOf(after, 'throw')).toMatchObject({ bonus: 5, total: 16, target: 15, out: true });
    expect(after.outs).toBe(2);
    expect(after.bases).toEqual([null, null, null]);
  });
});

describe('extra bases on hits', () => {
  it('matches the rulebook example: run counts even on the third out', () => {
    // 2 outs, Soriano on third, Jeter on second, Giambi on first. Single, send both,
    // outfield throws at Giambi. Speed 12 + 5 for two outs = 17. Roll 13 + 5 = 18: out.
    const speeds = { a1B: 12 };
    let s = newGame({
      away: { '1B': { speed: speeds.a1B } },
      home: { LF: { positions: [{ pos: 'LF/RF', fielding: 2 }] }, CF: { positions: [{ pos: 'CF', fielding: 3 }] } },
    });
    s = place(s, ['a1B', 'a2B', 'a3B'], 2);
    s = swing(s, '1B', 'aC');
    expect(runs(s, 'away')).toBe(1);
    expect(s.bases).toEqual(['aC', 'a1B', 'a2B']);
    s = act(s, { type: 'SEND', from: [2, 1] });
    expect(s.phase.kind).toBe('aim');
    s = act(s, { type: 'AIM', from: 1 });
    const numbers = throwNumbers(s, 'hit', { runnerId: 'a1B', from: 1, to: 2 }, true);
    expect(numbers).toMatchObject({ bonus: 5, target: 17 });
    const after = act(s, ROLL, 13);
    expect(lastOf(after, 'throw')).toMatchObject({ total: 18, target: 17, out: true });
    expect(runs(after, 'away')).toBe(2);
    expect(after.half).toBe('bottom');
  });

  it('adds both +5s when going home with two outs', () => {
    let s = place(newGame(), [null, 'a2B', null], 2);
    s = swing(s, '1B', 'aC');
    s = act(s, { type: 'SEND', from: [2] });
    if (s.phase.kind !== 'throw') throw new Error('expected a throw');
    expect(throwNumbers(s, 'hit', s.phase.attempts[0], s.phase.twoOutsBefore).target).toBe(25);
  });

  it('never lets the batter try for an extra base', () => {
    let s = newGame();
    s = swing(s, '2B', 'aC');
    expect(s.phase.kind).not.toBe('send');
    expect(s.bases).toEqual([null, 'aC', null]);
  });

  it('lets a runner from first try for home on a double', () => {
    let s = place(newGame(), ['a1B', null, null]);
    s = swing(s, '2B', 'aC');
    expect(s.phase.kind).toBe('send');
    expect(getPrompt(s)?.actions).toEqual([
      { type: 'SEND', from: [] },
      { type: 'SEND', from: [2] },
    ]);
  });
});

// ---------------------------------------------------------------- stealing

describe('stealing', () => {
  it('offers a steal only when the next base is open, and never home', () => {
    const s = place(newGame(), ['a1B', null, 'a3B']);
    expect(getPrompt(s)?.actions).toEqual([{ type: 'PROCEED' }, { type: 'STEAL', from: [0] }]);
  });

  it('adds the catcher Arm and calls the runner out only if the total beats his Speed', () => {
    let s = newGame({ home: { C: { positions: [{ pos: 'C', fielding: 5 }] } } });
    s = place(s, ['a1B', null, null]);
    s = act(s, { type: 'STEAL', from: [0] });
    const tie = act(s, ROLL, 10);
    expect(lastOf(tie, 'throw')).toMatchObject({ bonus: 5, total: 15, target: 15, out: false });
    expect(tie.bases).toEqual([null, 'a1B', null]);
    const caught = act(s, ROLL, 11);
    expect(lastOf(caught, 'throw').out).toBe(true);
    expect(caught.outs).toBe(1);
    expect(caught.bases).toEqual([null, null, null]);
  });

  it('credits a stolen base in the box score only when the runner is safe', () => {
    let s = place(newGame(), ['a1B', null, null]);
    s = act(s, { type: 'STEAL', from: [0] });
    expect(act(s, ROLL, 1).teams.away.batting.a1B.sb).toBe(1);
    expect(act(s, ROLL, 20).teams.away.batting.a1B.sb).toBe(0);
  });

  it('credits both runners on a successful double steal, and only the safe one otherwise', () => {
    let s = place(newGame(), ['a1B', 'a2B', null]);
    s = { ...s, phase: { kind: 'offense' } };
    s = act(s, { type: 'STEAL', from: [1, 0] });
    s = act(s, { type: 'AIM', from: 1 });
    const safe = act(s, ROLL, 1);
    expect([safe.teams.away.batting.a2B.sb, safe.teams.away.batting.a1B.sb]).toEqual([1, 1]);
    const caught = act(s, ROLL, 20);
    expect([caught.teams.away.batting.a2B.sb, caught.teams.away.batting.a1B.sb]).toEqual([0, 1]);
  });

  it('adds +5 to the throw when stealing third', () => {
    let s = place(newGame(), [null, 'a2B', null]);
    s = { ...s, phase: { kind: 'offense' } };
    s = act(s, { type: 'STEAL', from: [1] });
    if (s.phase.kind !== 'throw') throw new Error('expected a throw');
    expect(throwNumbers(s, 'steal', s.phase.attempts[0], false).bonus).toBe(5);
  });

  it('lets the defense pick a runner on a double steal, and the other one advances', () => {
    let s = place(newGame(), ['a1B', 'a2B', null]);
    s = { ...s, phase: { kind: 'offense' } };
    s = act(s, { type: 'STEAL', from: [1, 0] });
    expect(s.phase.kind).toBe('aim');
    s = act(s, { type: 'AIM', from: 1 });
    const after = act(s, ROLL, 20);
    expect(after.outs).toBe(1);
    expect(after.bases).toEqual([null, 'a1B', null]);
  });

  it('brings the same batter back if a caught stealing ends the inning', () => {
    let s = place(newGame(), ['a1B', null, null], 2);
    const before = s.teams.away.battingIndex;
    s = act(s, { type: 'STEAL', from: [0] });
    s = act(s, ROLL, 20);
    expect(s.half).toBe('bottom');
    expect(s.teams.away.battingIndex).toBe(before);
  });

  it('computes the odds shown for a steal', () => {
    expect(chanceToBeat(5, 20)).toBe(0.25);
    expect(chanceToBeat(5, 15)).toBe(0.5);
    expect(chanceToBeat(5, 10)).toBe(0.75);
    expect(chanceToBeat(10, 10)).toBe(1);
  });
});

// ---------------------------------------------------------------- substitutions

describe('substitutions', () => {
  function atInning(s: GameState, inning: number, half: 'top' | 'bottom', battedAll = true): GameState {
    const next = structuredClone(s);
    next.inning = inning;
    next.half = half;
    for (const side of ['away', 'home'] as const) {
      next.teams[side].runsByInning = Array<number>(inning).fill(0);
      if (battedAll) next.teams[side].lineup.forEach((entry) => (entry.hasBatted = true));
      if (!next.teams[side].pitcherId) throw new Error('no pitcher');
    }
    next.phase = { kind: 'offense' };
    return next;
  }

  it('protects the starter through the 4th unless he gives up 10 runs', () => {
    const s = newGame();
    const noChange = { ...atInning(s, 4, 'top'), phase: { kind: 'pitch' as const } };
    expect(getPrompt(noChange)?.actions).toEqual([ROLL]);

    const fifth = { ...atInning(s, 5, 'top'), phase: { kind: 'pitch' as const } };
    expect(getPrompt(fifth)?.actions).toContainEqual({ type: 'CHANGE_PITCHER', cardId: 'hRP' });

    const shelled = structuredClone(noChange);
    shelled.teams.home.pitching.hSP1.r = 10;
    expect(getPrompt(shelled)?.actions).toContainEqual({ type: 'CHANGE_PITCHER', cardId: 'hRP' });
  });

  it('charges a reliever a full inning when he enters mid-inning', () => {
    const s = { ...atInning(newGame(), 5, 'top'), phase: { kind: 'pitch' as const } };
    const after = act(s, { type: 'CHANGE_PITCHER', cardId: 'hRP' });
    expect(after.teams.home.pitching.hRP.innings).toBe(1);
    expect(after.teams.home.pitcherId).toBe('hRP');
    expect(after.teams.home.bullpen).toEqual([]);
  });

  it('keeps the bench out until the 7th, or the bottom of the 6th for the home team', () => {
    const s = newGame();
    const canPinchHit = (state: GameState) => getPrompt(state)?.actions.some((a) => a.type === 'PINCH_HIT') ?? false;
    const shortstopUp = (state: GameState) => {
      state.teams.away.battingIndex = 4; // The backup can play short.
      return state;
    };
    expect(canPinchHit(shortstopUp(atInning(s, 6, 'top')))).toBe(false);
    expect(canPinchHit(shortstopUp(atInning(s, 7, 'top')))).toBe(true);
    const bottomSixth = atInning(s, 6, 'bottom');
    bottomSixth.teams.home.battingIndex = 4; // The shortstop is up, and the backup can play short.
    expect(canPinchHit(bottomSixth)).toBe(true);
  });

  it('only allows a pinch hitter the team could still field', () => {
    const s = atInning(newGame(), 7, 'top');
    // The backup only plays short, so he can't replace the catcher who bats first.
    expect(getPrompt(s)?.actions.some((a) => a.type === 'PINCH_HIT')).toBe(false);
    const shortstopUp = structuredClone(s);
    shortstopUp.teams.away.battingIndex = 4;
    expect(getPrompt(shortstopUp)?.actions).toContainEqual({ type: 'PINCH_HIT', cardId: 'aBN' });
  });

  it('puts the pinch hitter in the same batting spot, and the old player is gone', () => {
    const s = atInning(newGame(), 7, 'top');
    s.teams.away.battingIndex = 4;
    const after = act(s, { type: 'PINCH_HIT', cardId: 'aBN' });
    expect(after.teams.away.lineup[4]).toMatchObject({ cardId: 'aBN', slot: 'SS' });
    expect(after.teams.away.bench).toEqual([]);
    expect(lastOf(after, 'pinchHit')).toMatchObject({ inId: 'aBN', outId: 'aSS' });
  });

  it('lets anyone pinch hit for the DH', () => {
    const s = atInning(newGame(), 7, 'top');
    s.teams.away.battingIndex = 8;
    expect(getPrompt(s)?.actions).toContainEqual({ type: 'PINCH_HIT', cardId: 'aBN' });
  });
});

// ---------------------------------------------------------------- ending a game

describe('ending the game', () => {
  function inning(s: GameState, n: number, half: 'top' | 'bottom', away: number, home: number): GameState {
    const next = structuredClone(s);
    next.inning = n;
    next.half = half;
    next.teams.away.runsByInning = [...Array<number>(n - 1).fill(0), away];
    next.teams.home.runsByInning = [...Array<number>(n - 1).fill(0), home];
    return next;
  }

  it('skips the bottom of the 9th when the home team leads', () => {
    let s = inning(newGame(), 9, 'top', 0, 1);
    s = { ...s, outs: 2 };
    s = swing(s, 'SO', 'aC');
    expect(s.phase).toEqual({ kind: 'over' });
    expect(s.winner).toBe('home');
  });

  it('ends on the spot on a walk-off', () => {
    let s = inning(newGame(), 9, 'bottom', 1, 1);
    s = { ...s, bases: [null, null, 'h3B'] };
    s = swing(s, '1B', 'hC');
    expect(s.phase).toEqual({ kind: 'over' });
    expect(s.winner).toBe('home');
    expect(lastOf(s, 'over').walkoff).toBe(true);
  });

  it('goes to extra innings on a tie', () => {
    let s = inning(newGame(), 9, 'bottom', 0, 0);
    s = { ...s, outs: 2 };
    s = swing(s, 'SO', 'hC');
    expect(s.phase.kind).not.toBe('over');
    expect(s.inning).toBe(10);
    expect(s.half).toBe('top');
  });

  it('ends after the bottom of an extra inning with the visitors ahead', () => {
    let s = inning(newGame(), 10, 'bottom', 1, 0);
    s = { ...s, outs: 2 };
    s = swing(s, 'SO', 'hC');
    expect(s.winner).toBe('away');
  });
});

// ---------------------------------------------------------------- engine guarantees

describe('engine guarantees', () => {
  it('rejects the wrong manager and moves that are not on offer', () => {
    const s = newGame();
    expect(() => applyAction(s, 'away', ROLL)).toThrow(IllegalActionError);
    expect(() => applyAction(s, 'home', { type: 'STEAL', from: [0] })).toThrow(IllegalActionError);
  });

  it('never changes the state it was given', () => {
    const s = newGame();
    const snapshot = JSON.stringify(s);
    applyAction(s, 'home', ROLL);
    expect(JSON.stringify(s)).toBe(snapshot);
  });

  it('survives being saved and reloaded', () => {
    const s = newGame();
    const reloaded = JSON.parse(JSON.stringify(s)) as GameState;
    expect(applyAction(reloaded, 'home', ROLL).state).toEqual(applyAction(s, 'home', ROLL).state);
  });
});
