// The rules of the game as pure functions: state and action in, new state out.
// Dice live here too, so a future server can own the rolls and the state, and
// the screens only ever send actions and show results.
import { chanceToBeat, fatigueOf, FIELD_SLOTS, fieldingAt, homeThrowTarget, INFIELD, OUTFIELD, resultForRoll } from './rules';
import type {
  Action,
  Attempt,
  BatterLine,
  FieldSlot,
  GameEvent,
  GameSetup,
  GameState,
  HitterCard,
  LineupEntry,
  LineupSlot,
  OutfieldSlot,
  Phase,
  PitcherCard,
  PitcherLine,
  Prompt,
  Side,
  SwingResult,
  TeamSetup,
  TeamState,
  ThrowPlay,
} from './types';

export const HOME = 3;

/** Innings before which a starter can't be pulled, unless he's given up enough runs. */
export const STARTER_SAFE_THROUGH_INNING = 4;
export const STARTER_RUN_LIMIT = 10;
export const BENCH_ALLOWED_FROM_INNING = 7;

export class IllegalActionError extends Error {}

export function offenseSide(s: GameState): Side {
  return s.half === 'top' ? 'away' : 'home';
}

export function defenseSide(s: GameState): Side {
  return s.half === 'top' ? 'home' : 'away';
}

export function hitterCard(s: GameState, id: string): HitterCard {
  const card = s.cards[id];
  if (card?.kind !== 'hitter') throw new Error(`${id} is not a hitter`);
  return card;
}

export function pitcherCard(s: GameState, id: string): PitcherCard {
  const card = s.cards[id];
  if (card?.kind !== 'pitcher') throw new Error(`${id} is not a pitcher`);
  return card;
}

export function currentBatterId(s: GameState): string {
  const team = s.teams[offenseSide(s)];
  return team.lineup[team.battingIndex].cardId;
}

export function currentPitcherId(s: GameState): string {
  const id = s.teams[defenseSide(s)].pitcherId;
  if (!id) throw new Error('No pitcher on the mound yet');
  return id;
}

export function currentFatigue(s: GameState): number {
  const id = currentPitcherId(s);
  return fatigueOf(pitcherCard(s, id), s.teams[defenseSide(s)].pitching[id]);
}

function fieldingTotal(s: GameState, side: Side, slots: FieldSlot[]): number {
  let total = 0;
  for (const entry of s.teams[side].lineup) {
    if ((slots as LineupSlot[]).includes(entry.slot)) {
      total += fieldingAt(hitterCard(s, entry.cardId), entry.slot) ?? 0;
    }
  }
  return total;
}

export function infieldTotal(s: GameState, side: Side): number {
  return fieldingTotal(s, side, INFIELD);
}

export function outfieldTotal(s: GameState, side: Side): number {
  return fieldingTotal(s, side, OUTFIELD);
}

export function catcherArm(s: GameState, side: Side): number {
  return fieldingTotal(s, side, ['C']);
}

/** A runner heading home on a hit or a fly ball, where one outfielder makes the throw. */
export function isHomeThrow(play: ThrowPlay, attempt: Attempt): boolean {
  return play !== 'steal' && attempt.to === HOME;
}

/**
 * Who can throw home, by which way the batter swings: a lefty pulls to right, a
 * righty to left, and a switch hitter bats opposite the pitcher. The defense rolls:
 * 1-10 the corner outfielder, 11-20 the center fielder.
 */
export function homeThrowFielders(s: GameState): [OutfieldSlot, OutfieldSlot] {
  const batter = hitterCard(s, currentBatterId(s));
  const bats = batter.hand === 'S' ? (pitcherCard(s, currentPitcherId(s)).hand === 'L' ? 'R' : 'L') : batter.hand;
  return [bats === 'L' ? 'RF' : 'LF', 'CF'];
}

export function fielderAt(s: GameState, side: Side, slot: FieldSlot): string {
  return (s.teams[side].lineup.find((entry) => entry.slot === slot) as LineupEntry).cardId;
}

function armAt(s: GameState, side: Side, slot: OutfieldSlot): number {
  return fieldingAt(hitterCard(s, fielderAt(s, side, slot)), slot) ?? 0;
}

/**
 * The numbers behind a throw: the defense rolls d20 + bonus and must beat the
 * target. House rules: no extra +5 for two outs; on a throw home, one outfielder's
 * arm against 20/17/14 by Speed letter. Before that outfielder is rolled for, the
 * bonus and chance are the average of the two who might throw.
 */
export function throwNumbers(
  s: GameState,
  play: ThrowPlay,
  attempt: Attempt,
  fielder?: OutfieldSlot,
): { bonus: number; target: number; outChance: number } {
  const defense = defenseSide(s);
  const speed = hitterCard(s, attempt.runnerId).speed;
  if (play === 'steal') {
    const bonus = catcherArm(s, defense) + (attempt.to === 2 ? 5 : 0);
    return { bonus, target: speed, outChance: chanceToBeat(bonus, speed) };
  }
  if (isHomeThrow(play, attempt)) {
    const target = homeThrowTarget(speed);
    const slots = fielder ? [fielder] : homeThrowFielders(s);
    const arms = slots.map((slot) => armAt(s, defense, slot));
    const average = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length;
    return { bonus: average(arms), target, outChance: average(arms.map((arm) => chanceToBeat(arm, target))) };
  }
  const bonus = outfieldTotal(s, defense);
  return { bonus, target: speed, outChance: chanceToBeat(bonus, speed) };
}

export function doublePlayNumbers(s: GameState): { bonus: number; target: number; outChance: number } {
  const bonus = infieldTotal(s, defenseSide(s));
  const target = hitterCard(s, currentBatterId(s)).speed;
  return { bonus, target, outChance: chanceToBeat(bonus, target) };
}

// ---------------------------------------------------------------- setup

function emptyBatterLine(): BatterLine {
  return { ab: 0, r: 0, h: 0, hr: 0, rbi: 0, bb: 0, so: 0, sb: 0 };
}

function emptyPitcherLine(): PitcherLine {
  return { outs: 0, h: 0, r: 0, bb: 0, so: 0, hr: 0 };
}

function createTeam(setup: TeamSetup, runsByInning: number[]): TeamState {
  const batting: Record<string, BatterLine> = {};
  for (const entry of setup.lineup) batting[entry.cardId] = emptyBatterLine();
  const starterId = setup.starterId && setup.rotation.includes(setup.starterId) ? setup.starterId : setup.rotation[0];
  if (!starterId) throw new Error(`${setup.name} has no starting pitcher`);
  return {
    name: setup.name,
    code: setup.code,
    lineup: setup.lineup.map((entry) => ({ ...entry, hasBatted: false })),
    battingIndex: 0,
    rotation: [...setup.rotation],
    bullpen: [...setup.bullpen],
    bench: [...setup.bench],
    pitcherId: starterId,
    starterId,
    batting,
    pitching: { [starterId]: emptyPitcherLine() },
    pitchersUsed: [starterId],
    battersUsed: setup.lineup.map((entry) => entry.cardId),
    runsByInning,
    hits: 0,
  };
}

/** A new game, already at the first pitch: each manager picked a starter before the game. */
export function createGame(setup: GameSetup): GameState {
  const s: GameState = {
    version: 1,
    rng: setup.seed >>> 0,
    cards: setup.cards,
    teams: { away: createTeam(setup.away, [0]), home: createTeam(setup.home, []) },
    inning: 1,
    half: 'top',
    outs: 0,
    bases: [null, null, null],
    phase: { kind: 'pitch' },
    atBat: { phUsed: false, pitchingChangeUsed: false },
    singlePlusRunner: null,
    log: [],
    winner: null,
  };
  s.log.push({ t: 'starters', away: s.teams.away.pitcherId as string, home: s.teams.home.pitcherId as string });
  startHalf(s);
  return s;
}

// ---------------------------------------------------------------- dice

/** One step of mulberry32, keeping the die's position in the saved state. */
function rollD20(s: GameState): number {
  s.rng = (s.rng + 0x6d2b79f5) >>> 0;
  let t = s.rng;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  const value = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  return Math.floor(value * 20) + 1;
}

// ---------------------------------------------------------------- choices

function stealActions(s: GameState): Action[] {
  const [first, second, third] = s.bases;
  const actions: Action[] = [];
  if (first && !second) actions.push({ type: 'STEAL', from: [0] });
  if (second && !third) actions.push({ type: 'STEAL', from: [1] });
  if (first && second && !third) actions.push({ type: 'STEAL', from: [1, 0] });
  return actions;
}

/**
 * Who plays where with one hitter swapped in, keeping the DH out of the field.
 * Returns null if the team couldn't legally take the field.
 */
function fieldWithSubstitute(s: GameState, side: Side, outId: string, inId: string): Map<string, FieldSlot> | null {
  const fielders = s.teams[side].lineup
    .filter((entry) => entry.slot !== 'DH')
    .map((entry) => (entry.cardId === outId ? inId : entry.cardId));
  const current = new Map(s.teams[side].lineup.map((entry) => [entry.cardId, entry.slot]));
  const outSlot = current.get(outId);

  let bestScore = -Infinity;
  let best: Map<string, FieldSlot> | null = null;
  const taken = new Set<FieldSlot>();
  const assignment = new Map<string, FieldSlot>();

  const visit = (index: number, score: number) => {
    if (index === fielders.length) {
      if (score > bestScore) {
        bestScore = score;
        best = new Map(assignment);
      }
      return;
    }
    const id = fielders[index];
    const card = hitterCard(s, id);
    for (const slot of FIELD_SLOTS) {
      if (taken.has(slot)) continue;
      const fielding = fieldingAt(card, slot);
      if (fielding === null) continue;
      // Favor leaving everyone where they are, then the best total Fielding.
      const stays = current.get(id) === slot || (id === inId && outSlot === slot);
      taken.add(slot);
      assignment.set(id, slot);
      visit(index + 1, score + fielding + (stays ? 100 : 0));
      taken.delete(slot);
      assignment.delete(id);
    }
  };
  visit(0, 0);
  return best;
}

function benchIsAvailable(s: GameState, side: Side): boolean {
  if (s.inning >= BENCH_ALLOWED_FROM_INNING) return true;
  return side === 'home' && s.inning === BENCH_ALLOWED_FROM_INNING - 1 && s.half === 'bottom';
}

function pinchHitActions(s: GameState): Action[] {
  const side = offenseSide(s);
  const team = s.teams[side];
  const entry = team.lineup[team.battingIndex];
  if (s.atBat.phUsed || !benchIsAvailable(s, side)) return [];
  if (!entry.hasBatted && !s.atBat.pitchingChangeUsed) return [];
  return team.bench
    .filter((id) => entry.slot === 'DH' || fieldWithSubstitute(s, side, entry.cardId, id) !== null)
    .map((cardId) => ({ type: 'PINCH_HIT', cardId }));
}

function pitchingChangeActions(s: GameState): Action[] {
  const team = s.teams[defenseSide(s)];
  if (s.atBat.pitchingChangeUsed || !team.pitcherId) return [];
  if (team.pitcherId === team.starterId) {
    const runs = team.pitching[team.pitcherId].r;
    if (s.inning <= STARTER_SAFE_THROUGH_INNING && runs < STARTER_RUN_LIMIT) return [];
  }
  return team.bullpen.map((cardId) => ({ type: 'CHANGE_PITCHER', cardId }));
}

function sendActions(s: GameState, eligible: number[]): Action[] {
  const actions: Action[] = [{ type: 'SEND', from: [] }];
  if (eligible.includes(2)) actions.push({ type: 'SEND', from: [2] });
  if (eligible.includes(1)) {
    if (!s.bases[2]) actions.push({ type: 'SEND', from: [1] });
    else if (eligible.includes(2)) actions.push({ type: 'SEND', from: [2, 1] });
  }
  return actions;
}

export function getPrompt(s: GameState): Prompt | null {
  const offense = offenseSide(s);
  const defense = defenseSide(s);
  const phase = s.phase;
  switch (phase.kind) {
    case 'offense':
      return {
        actor: offense,
        phase: phase.kind,
        actions: [{ type: 'PROCEED' }, ...stealActions(s), ...pinchHitActions(s)],
      };
    case 'pitch':
      return { actor: defense, phase: phase.kind, actions: [{ type: 'ROLL' }, ...pitchingChangeActions(s)] };
    case 'swing':
      return { actor: offense, phase: phase.kind, actions: [{ type: 'ROLL' }] };
    case 'doublePlay':
    case 'throw':
      return { actor: defense, phase: phase.kind, actions: [{ type: 'ROLL' }] };
    case 'send':
      return { actor: offense, phase: phase.kind, actions: sendActions(s, phase.eligible) };
    case 'aim':
      return {
        actor: defense,
        phase: phase.kind,
        actions: phase.attempts.map((attempt) => ({ type: 'AIM', from: attempt.from })),
      };
    case 'over':
      return null;
  }
}

// ---------------------------------------------------------------- flow

function checkWalkoff(s: GameState) {
  if (s.half !== 'bottom' || s.inning < 9) return;
  if (runs(s, 'home') > runs(s, 'away')) endGame(s, 'home', true);
}

export function runs(s: GameState, side: Side): number {
  return s.teams[side].runsByInning.reduce((sum, n) => sum + n, 0);
}

function endGame(s: GameState, winner: Side, walkoff: boolean) {
  s.winner = winner;
  s.phase = { kind: 'over' };
  s.log.push({ t: 'over', winner, walkoff });
}

function isOver(s: GameState): boolean {
  return s.phase.kind === 'over';
}

function scoreRun(s: GameState, runnerId: string, creditBatter: boolean) {
  if (isOver(s)) return;
  const side = offenseSide(s);
  const team = s.teams[side];
  team.runsByInning[s.inning - 1] += 1;
  team.batting[runnerId].r += 1;
  if (creditBatter) team.batting[currentBatterId(s)].rbi += 1;
  s.teams[defenseSide(s)].pitching[currentPitcherId(s)].r += 1;
  s.log.push({ t: 'run', runnerId, side });
  checkWalkoff(s);
}

function recordOut(s: GameState) {
  s.outs += 1;
  s.teams[defenseSide(s)].pitching[currentPitcherId(s)].outs += 1;
}

function beginOffenseOrPitch(s: GameState) {
  const hasChoice = stealActions(s).length > 0 || pinchHitActions(s).length > 0;
  s.phase = hasChoice ? { kind: 'offense' } : { kind: 'pitch' };
}

function startAtBat(s: GameState) {
  s.atBat = { phUsed: false, pitchingChangeUsed: false };
  const runner = s.singlePlusRunner;
  s.singlePlusRunner = null;
  if (runner && s.bases[0] === runner && !s.bases[1]) {
    s.bases[0] = null;
    s.bases[1] = runner;
    s.log.push({ t: 'advance', runnerId: runner, to: 1, reason: 'single+' });
  }
  beginOffenseOrPitch(s);
}

function startHalf(s: GameState) {
  s.log.push({ t: 'half', inning: s.inning, half: s.half });
  startAtBat(s);
}

function endHalf(s: GameState) {
  s.outs = 0;
  s.bases = [null, null, null];
  s.singlePlusRunner = null;
  const away = runs(s, 'away');
  const home = runs(s, 'home');
  if (s.half === 'top') {
    if (s.inning >= 9 && home > away) return endGame(s, 'home', false);
    s.half = 'bottom';
    s.teams.home.runsByInning[s.inning - 1] = 0;
  } else {
    if (s.inning >= 9 && home !== away) return endGame(s, home > away ? 'home' : 'away', false);
    s.half = 'top';
    s.inning += 1;
    s.teams.away.runsByInning[s.inning - 1] = 0;
  }
  startHalf(s);
}

function finishAtBat(s: GameState) {
  if (isOver(s)) return;
  const team = s.teams[offenseSide(s)];
  team.lineup[team.battingIndex].hasBatted = true;
  team.battingIndex = (team.battingIndex + 1) % team.lineup.length;
  if (s.outs >= 3) endHalf(s);
  else startAtBat(s);
}

// ---------------------------------------------------------------- results

function moveRunners(s: GameState, batterId: string, bases: number) {
  const [first, second, third] = s.bases;
  const runners: [string | null, number][] = [
    [third, 2],
    [second, 1],
    [first, 0],
  ];
  s.bases = [null, null, null];
  for (const [runner, from] of runners) {
    if (!runner) continue;
    const to = from + bases;
    if (to >= HOME) scoreRun(s, runner, true);
    else s.bases[to] = runner;
  }
  if (bases === 4) scoreRun(s, batterId, true);
  else s.bases[bases - 1] = batterId;
}

/** Runners on second and third move up on a ground ball, unless it was the third out. */
function groundBallAdvance(s: GameState, creditBatter: boolean) {
  if (s.outs >= 3) return;
  const [, second, third] = s.bases;
  s.bases[2] = null;
  s.bases[1] = null;
  if (third) scoreRun(s, third, creditBatter);
  if (second) s.bases[2] = second;
}

function offerExtraBases(s: GameState, play: 'hit' | 'fly', batterId: string) {
  if (isOver(s)) return;
  const eligible = [1, 2].filter((base) => s.bases[base] && s.bases[base] !== batterId);
  const canGo = sendActions(s, eligible).length > 1;
  if (canGo) s.phase = { kind: 'send', play, eligible };
  else finishAtBat(s);
}

function applySwing(s: GameState, result: SwingResult) {
  const offense = s.teams[offenseSide(s)];
  const defense = s.teams[defenseSide(s)];
  const batterId = currentBatterId(s);
  const batter = offense.batting[batterId];
  const pitcher = defense.pitching[currentPitcherId(s)];

  if (result !== 'BB') batter.ab += 1;

  switch (result) {
    case 'SO':
      batter.so += 1;
      pitcher.so += 1;
      recordOut(s);
      return finishAtBat(s);
    case 'PU':
      recordOut(s);
      return finishAtBat(s);
    case 'GB': {
      if (!s.bases[0]) {
        recordOut(s);
        groundBallAdvance(s, true);
        return finishAtBat(s);
      }
      const forced = s.bases[0];
      s.bases[0] = null;
      recordOut(s);
      s.log.push({ t: 'forceOut', runnerId: forced });
      if (s.outs >= 3) return finishAtBat(s);
      s.phase = { kind: 'doublePlay' };
      return;
    }
    case 'FB':
      recordOut(s);
      if (s.outs >= 3) return finishAtBat(s);
      return offerExtraBases(s, 'fly', batterId);
    case 'BB': {
      batter.bb += 1;
      pitcher.bb += 1;
      const [first, second, third] = s.bases;
      if (first) {
        if (second) {
          if (third) scoreRun(s, third, true);
          s.bases[2] = second;
        }
        s.bases[1] = first;
      }
      s.bases[0] = batterId;
      return finishAtBat(s);
    }
    case '1B':
    case '1B+':
    case '2B':
    case '3B':
    case 'HR': {
      batter.h += 1;
      pitcher.h += 1;
      offense.hits += 1;
      if (result === 'HR') {
        batter.hr += 1;
        pitcher.hr += 1;
      }
      const bases = { '1B': 1, '1B+': 1, '2B': 2, '3B': 3, HR: 4 }[result];
      moveRunners(s, batterId, bases);
      if (result === '1B+') s.singlePlusRunner = batterId;
      if (result === '1B' || result === '1B+' || result === '2B') {
        return offerExtraBases(s, 'hit', batterId);
      }
      return finishAtBat(s);
    }
  }
}

function attemptsFor(s: GameState, from: number[]): Attempt[] {
  return [...from]
    .sort((a, b) => b - a)
    .map((base) => ({ runnerId: s.bases[base] as string, from: base, to: base + 1 }));
}

/** First of the two rolls on a throw home: which outfielder makes it. */
function pickFielder(s: GameState, phase: Extract<Phase, { kind: 'throw' }>) {
  const roll = rollD20(s);
  const [corner, center] = homeThrowFielders(s);
  const slot = roll <= 10 ? corner : center;
  s.log.push({ t: 'fielder', roll, slot, fielderId: fielderAt(s, defenseSide(s), slot) });
  s.phase = { ...phase, fielder: slot };
}

function resolveThrow(s: GameState, phase: Extract<Phase, { kind: 'throw' }>) {
  const targetAttempt = phase.attempts.find((attempt) => attempt.from === phase.targetFrom) as Attempt;
  const { bonus, target } = throwNumbers(s, phase.play, targetAttempt, phase.fielder);
  const roll = rollD20(s);
  const total = roll + bonus;
  const out = total > target;
  s.log.push({
    t: 'throw',
    play: phase.play,
    roll,
    bonus,
    total,
    target,
    out,
    runnerId: targetAttempt.runnerId,
    from: targetAttempt.from,
    to: targetAttempt.to,
    ...(phase.fielder ? { fielderId: fielderAt(s, defenseSide(s), phase.fielder) } : {}),
  });

  // Lead runner first, so a run on the same play still counts if the trail runner is thrown out.
  for (const attempt of phase.attempts) {
    s.bases[attempt.from] = null;
    if (attempt === targetAttempt && out) {
      recordOut(s);
      continue;
    }
    // Every runner who makes it on a steal, including the trail runner on a double steal, gets one.
    if (phase.play === 'steal') s.teams[offenseSide(s)].batting[attempt.runnerId].sb += 1;
    if (attempt.to === HOME) scoreRun(s, attempt.runnerId, phase.play !== 'steal');
    else s.bases[attempt.to] = attempt.runnerId;
    if (attempt !== targetAttempt) {
      s.log.push({ t: 'advance', runnerId: attempt.runnerId, to: attempt.to, reason: 'trail' });
    }
  }
  if (isOver(s)) return;
  if (phase.play === 'steal') {
    // A caught stealing for the third out brings the same batter back next inning.
    if (s.outs >= 3) endHalf(s);
    else beginOffenseOrPitch(s);
  } else {
    finishAtBat(s);
  }
}

// ---------------------------------------------------------------- actions

function startThrow(s: GameState, play: ThrowPlay, attempts: Attempt[]) {
  if (attempts.length === 1) {
    s.phase = { kind: 'throw', play, attempts, targetFrom: attempts[0].from };
  } else {
    s.phase = { kind: 'aim', play, attempts };
  }
}

function applyRoll(s: GameState) {
  const phase = s.phase;
  switch (phase.kind) {
    case 'pitch': {
      const pitcherId = currentPitcherId(s);
      const batterId = currentBatterId(s);
      const pitcher = pitcherCard(s, pitcherId);
      const onBase = hitterCard(s, batterId).onBase;
      const fatigue = currentFatigue(s);
      const roll = rollD20(s);
      const total = roll + pitcher.control - fatigue;
      const advantage = total > onBase ? 'pitcher' : 'batter';
      s.log.push({ t: 'pitch', roll, control: pitcher.control, fatigue, total, onBase, advantage, pitcherId, batterId });
      s.phase = { kind: 'swing', on: advantage };
      return;
    }
    case 'swing': {
      const pitcherId = currentPitcherId(s);
      const batterId = currentBatterId(s);
      const roll = rollD20(s);
      const result = resultForRoll(phase.on === 'pitcher' ? s.cards[pitcherId] : s.cards[batterId], roll);
      s.log.push({ t: 'swing', roll, on: phase.on, result, batterId, pitcherId, side: offenseSide(s) });
      return applySwing(s, result);
    }
    case 'doublePlay': {
      const batterId = currentBatterId(s);
      const { bonus, target } = doublePlayNumbers(s);
      const roll = rollD20(s);
      const total = roll + bonus;
      const out = total > target;
      s.log.push({ t: 'doublePlay', roll, bonus, total, target, out, batterId });
      if (out) {
        recordOut(s);
        groundBallAdvance(s, false);
      } else {
        groundBallAdvance(s, false);
        s.bases[0] = batterId;
      }
      return finishAtBat(s);
    }
    case 'throw': {
      const targetAttempt = phase.attempts.find((attempt) => attempt.from === phase.targetFrom) as Attempt;
      if (isHomeThrow(phase.play, targetAttempt) && !phase.fielder) return pickFielder(s, phase);
      return resolveThrow(s, phase);
    }
    default:
      throw new IllegalActionError(`Nothing to roll during ${phase.kind}`);
  }
}

function applyPinchHit(s: GameState, inId: string) {
  const side = offenseSide(s);
  const team = s.teams[side];
  const entry = team.lineup[team.battingIndex];
  const outId = entry.cardId;
  if (entry.slot !== 'DH') {
    const field = fieldWithSubstitute(s, side, outId, inId) as Map<string, FieldSlot>;
    for (const other of team.lineup) {
      if (other.slot !== 'DH' && other.cardId !== outId) other.slot = field.get(other.cardId) as FieldSlot;
    }
    entry.slot = field.get(inId) as FieldSlot;
  }
  entry.cardId = inId;
  entry.hasBatted = false;
  team.bench = team.bench.filter((id) => id !== inId);
  team.batting[inId] = emptyBatterLine();
  team.battersUsed.push(inId);
  s.atBat.phUsed = true;
  s.log.push({ t: 'pinchHit', inId, outId, side });
  beginOffenseOrPitch(s);
}

function applyPitchingChange(s: GameState, inId: string) {
  const side = defenseSide(s);
  const team = s.teams[side];
  const outId = team.pitcherId as string;
  team.pitcherId = inId;
  team.bullpen = team.bullpen.filter((id) => id !== inId);
  team.pitching[inId] = emptyPitcherLine();
  team.pitchersUsed.push(inId);
  s.atBat.pitchingChangeUsed = true;
  s.atBat.phUsed = false;
  s.log.push({ t: 'pitchingChange', inId, outId, side });
  s.phase = pinchHitActions(s).length > 0 ? { kind: 'offense' } : { kind: 'pitch' };
}

/**
 * The only way a game changes. Returns the new state and what just happened;
 * the state passed in is left untouched.
 */
export function applyAction(state: GameState, actor: Side, action: Action): { state: GameState; events: GameEvent[] } {
  const prompt = getPrompt(state);
  if (!prompt) throw new IllegalActionError('The game is over');
  if (prompt.actor !== actor) throw new IllegalActionError(`It is the ${prompt.actor} manager's turn`);
  const wanted = JSON.stringify(action);
  if (!prompt.actions.some((legal) => JSON.stringify(legal) === wanted)) {
    throw new IllegalActionError(`${wanted} isn't allowed right now`);
  }

  const s = structuredClone(state);
  const logStart = s.log.length;
  switch (action.type) {
    case 'ROLL':
      applyRoll(s);
      break;
    case 'PROCEED':
      s.phase = { kind: 'pitch' };
      break;
    case 'PINCH_HIT':
      applyPinchHit(s, action.cardId);
      break;
    case 'CHANGE_PITCHER':
      applyPitchingChange(s, action.cardId);
      break;
    case 'STEAL':
      startThrow(s, 'steal', attemptsFor(s, action.from));
      break;
    case 'SEND': {
      const phase = s.phase as Extract<Phase, { kind: 'send' }>;
      if (action.from.length === 0) finishAtBat(s);
      else startThrow(s, phase.play, attemptsFor(s, action.from));
      break;
    }
    case 'AIM': {
      const phase = s.phase as Extract<Phase, { kind: 'aim' }>;
      s.phase = { kind: 'throw', play: phase.play, attempts: phase.attempts, targetFrom: action.from };
      break;
    }
  }
  return { state: s, events: s.log.slice(logStart) };
}
