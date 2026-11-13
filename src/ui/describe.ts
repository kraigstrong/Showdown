// Turns rules-engine data into the words people read. No rules live in here.
import {
  currentBatterId,
  currentFatigue,
  currentPitcherId,
  doublePlayNumbers,
  hitterCard,
  pitcherCard,
  speedLabel,
  throwNumbers,
} from '../engine';
import type { Action, Attempt, GameEvent, GameState, Phase, SwingResult } from '../engine';

const BASE_NAMES = ['first', 'second', 'third', 'home'];

export function lastName(name: string): string {
  const parts = name.split(' ');
  const suffix = /^(Jr\.?|Sr\.?|II|III|IV)$/i;
  if (parts.length > 2 && suffix.test(parts[parts.length - 1])) return parts[parts.length - 2];
  return parts[parts.length - 1];
}

function nameOf(s: GameState, id: string): string {
  return lastName(s.cards[id].name);
}

function percent(chance: number): string {
  return `${Math.round(chance * 100)}%`;
}

export const RESULT_WORDS: Record<SwingResult, string> = {
  PU: 'Pop-up',
  SO: 'Strikeout',
  GB: 'Ground ball',
  FB: 'Fly ball',
  BB: 'Walk',
  '1B': 'Single',
  '1B+': 'Single+',
  '2B': 'Double',
  '3B': 'Triple',
  HR: 'Home run',
};

function ordinal(n: number): string {
  const tens = n % 100;
  if (tens >= 11 && tens <= 13) return `${n}th`;
  return `${n}${['th', 'st', 'nd', 'rd'][n % 10] ?? 'th'}`;
}

export function inningLabel(s: Pick<GameState, 'inning' | 'half'>): string {
  return `${s.half === 'top' ? 'Top' : 'Bottom'} of the ${ordinal(s.inning)}`;
}

export function eventLine(s: GameState, e: GameEvent): string | null {
  switch (e.t) {
    case 'starters':
      return `Starting pitchers: ${nameOf(s, e.away)} for ${s.teams.away.name}, ${nameOf(s, e.home)} for ${s.teams.home.name}.`;
    case 'half':
      return null;
    case 'pitch': {
      const tired = e.fatigue > 0 ? ` − ${e.fatigue} tired` : '';
      const who = e.advantage === 'pitcher' ? nameOf(s, e.pitcherId) : nameOf(s, e.batterId);
      return `Pitch: ${e.roll} + ${e.control}${tired} = ${e.total} vs On-Base ${e.onBase}. ${who} has the advantage.`;
    }
    case 'swing':
      return `${nameOf(s, e.batterId)} swings: ${e.roll} on ${e.on === 'pitcher' ? nameOf(s, e.pitcherId) + '’s' : 'his own'} chart. ${RESULT_WORDS[e.result]}.`;
    case 'run':
      return `${nameOf(s, e.runnerId)} scores!`;
    case 'forceOut':
      return `${nameOf(s, e.runnerId)} is out at second.`;
    case 'doublePlay':
      return `Double-play throw: ${e.roll} + ${e.bonus} = ${e.total} vs Speed ${e.target}. ${
        e.out ? `${nameOf(s, e.batterId)} is out. Double play!` : `${nameOf(s, e.batterId)} beats it out.`
      }`;
    case 'throw':
      return `${nameOf(s, e.runnerId)} ${e.play === 'steal' ? 'runs for' : 'goes for'} ${BASE_NAMES[e.to]}: ${e.roll} + ${e.bonus} = ${e.total} vs ${e.target}. ${
        e.out ? 'Out!' : 'Safe!'
      }`;
    case 'advance':
      return e.reason === 'single+'
        ? `${nameOf(s, e.runnerId)} takes second on the single+.`
        : `${nameOf(s, e.runnerId)} moves up to ${BASE_NAMES[e.to]}.`;
    case 'pinchHit':
      return `${nameOf(s, e.inId)} pinch hits for ${nameOf(s, e.outId)}.`;
    case 'pitchingChange':
      return `${nameOf(s, e.inId)} comes in to pitch for ${nameOf(s, e.outId)}.`;
    case 'over':
      return `${s.teams[e.winner].name} win${e.walkoff ? ' on a walk-off' : ''}!`;
  }
}

/** The short instruction above the choices. */
export function promptTitle(s: GameState): string {
  switch (s.phase.kind) {
    case 'offense':
      return `${nameOf(s, currentBatterId(s))} is up. Any moves first?`;
    case 'pitch':
      return `${nameOf(s, currentPitcherId(s))} pitches to ${nameOf(s, currentBatterId(s))}`;
    case 'swing':
      return `${nameOf(s, currentBatterId(s))} swings`;
    case 'doublePlay':
      return `Turn two? Throw to first on ${nameOf(s, currentBatterId(s))}`;
    case 'send':
      return s.phase.play === 'fly' ? 'Fly ball. Tag up?' : 'Try for an extra base?';
    case 'aim':
      return 'Who do you throw at?';
    case 'throw':
      return throwTitle(s, s.phase);
    case 'over':
      return 'Ball game';
  }
}

function throwTitle(s: GameState, phase: Extract<Phase, { kind: 'throw' }>): string {
  const attempt = phase.attempts.find((a) => a.from === phase.targetFrom) as Attempt;
  const who = nameOf(s, attempt.runnerId);
  if (phase.play === 'steal') return `Catcher throws. ${who} is going to ${BASE_NAMES[attempt.to]}`;
  return `Outfield throws. ${who} is going to ${BASE_NAMES[attempt.to]}`;
}

/** The math behind the roll that's coming up. */
export function promptDetail(s: GameState): string | null {
  const phase = s.phase;
  switch (phase.kind) {
    case 'pitch': {
      const pitcher = pitcherCard(s, currentPitcherId(s));
      const batter = hitterCard(s, currentBatterId(s));
      const fatigue = currentFatigue(s);
      const tired = fatigue > 0 ? ` − ${fatigue} tired` : '';
      return `Roll + Control ${pitcher.control}${tired}. Beat On-Base ${batter.onBase} to use the pitcher's chart.`;
    }
    case 'swing':
      return `Rolling on ${phase.on === 'pitcher' ? `${nameOf(s, currentPitcherId(s))}'s` : `${nameOf(s, currentBatterId(s))}'s`} chart.`;
    case 'doublePlay': {
      const { bonus, target, outChance } = doublePlayNumbers(s);
      return `Roll + infield ${bonus}. Beat Speed ${target} to turn two (${percent(outChance)}).`;
    }
    case 'throw': {
      const attempt = phase.attempts.find((a) => a.from === phase.targetFrom) as Attempt;
      const { bonus, target, outChance } = throwNumbers(s, phase.play, attempt);
      const label = phase.play === 'steal' ? 'catcher' : 'outfield';
      return `Roll + ${label} ${bonus}. Beat ${target} to get him (${percent(outChance)}).`;
    }
    default:
      return null;
  }
}

function attemptOdds(s: GameState, attempt: Attempt, play: 'hit' | 'fly' | 'steal'): string {
  return `${percent(throwNumbers(s, play, attempt).outChance)} out`;
}

function attemptsFrom(s: GameState, from: number[]): Attempt[] {
  return from.map((base) => ({ runnerId: s.bases[base] as string, from: base, to: base + 1 }));
}

export interface ChoiceText {
  label: string;
  detail?: string;
}

export function choiceText(s: GameState, action: Action): ChoiceText {
  const phase = s.phase;
  switch (action.type) {
    case 'ROLL': {
      const labels: Partial<Record<Phase['kind'], string>> = {
        pitch: 'Roll the pitch',
        swing: 'Roll the swing',
        doublePlay: 'Roll the throw',
        throw: 'Roll the throw',
      };
      return { label: labels[phase.kind] ?? 'Roll' };
    }
    case 'PROCEED':
      return { label: 'Batter up' };
    case 'STEAL': {
      const attempts = attemptsFrom(s, action.from);
      if (attempts.length > 1) {
        return {
          label: 'Double steal',
          detail: attempts.map((a) => `${nameOf(s, a.runnerId)} ${attemptOdds(s, a, 'steal')}`).join(', '),
        };
      }
      const [attempt] = attempts;
      return {
        label: `${nameOf(s, attempt.runnerId)} steals ${BASE_NAMES[attempt.to]}`,
        detail: attemptOdds(s, attempt, 'steal'),
      };
    }
    case 'SEND': {
      if (phase.kind !== 'send') return { label: 'Send' };
      if (action.from.length === 0) return { label: 'Hold the runners' };
      const attempts = attemptsFrom(s, action.from);
      if (attempts.length > 1) {
        return {
          label: 'Send both',
          detail: attempts
            .map((a) => `${nameOf(s, a.runnerId)} ${attemptOdds(s, a, phase.play)}`)
            .join(', '),
        };
      }
      const [attempt] = attempts;
      return {
        label: `Send ${nameOf(s, attempt.runnerId)} ${attempt.to === 3 ? 'home' : `to ${BASE_NAMES[attempt.to]}`}`,
        detail: attemptOdds(s, attempt, phase.play),
      };
    }
    case 'AIM': {
      if (phase.kind !== 'aim') return { label: 'Throw' };
      const attempt = phase.attempts.find((a) => a.from === action.from) as Attempt;
      return {
        label: `Throw at ${nameOf(s, attempt.runnerId)}`,
        detail: `Going ${attempt.to === 3 ? 'home' : `to ${BASE_NAMES[attempt.to]}`}, ${attemptOdds(s, attempt, phase.play)}`,
      };
    }
    case 'PINCH_HIT': {
      const card = hitterCard(s, action.cardId);
      return { label: card.name, detail: `On-Base ${card.onBase}, Speed ${speedLabel(card)}` };
    }
    case 'CHANGE_PITCHER': {
      const card = pitcherCard(s, action.cardId);
      return { label: card.name, detail: `Control ${card.control}, IP ${card.ip}, ${card.role}` };
    }
  }
}

/** Innings pitched the usual way: 6.2 means six innings and two outs. */
export function inningsPitched(outs: number): string {
  return `${Math.floor(outs / 3)}.${outs % 3}`;
}
