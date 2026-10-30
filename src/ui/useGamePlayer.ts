import { useCallback, useEffect, useRef, useState } from 'react';
import type { GameEvent, GameState, Side, SwingResult } from '../engine';
import type { GameSession } from '../session/session';

const params = new URLSearchParams(window.location.search);
const instant = params.has('fast') || window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const ROLL_MS = instant ? 0 : 800;
const LAND_MS = instant ? 0 : 320;
const BANNER_MS = instant ? 0 : 1500;

function wait(ms: number): Promise<void> {
  return ms > 0 ? new Promise((resolve) => window.setTimeout(resolve, ms)) : Promise.resolve();
}

export interface Banner {
  id: number;
  text: string;
  tone: 'out' | 'walk' | 'single' | 'extra' | 'homer' | 'advantage' | 'safe' | 'run';
}

const RESULT_TONE: Record<SwingResult, Banner['tone']> = {
  PU: 'out',
  SO: 'out',
  GB: 'out',
  FB: 'out',
  BB: 'walk',
  '1B': 'single',
  '1B+': 'single',
  '2B': 'extra',
  '3B': 'extra',
  HR: 'homer',
};

const RESULT_BANNER: Record<SwingResult, string> = {
  PU: 'Pop-up',
  SO: 'Strike three',
  GB: 'Ground ball',
  FB: 'Fly ball',
  BB: 'Ball four',
  '1B': 'Single',
  '1B+': 'Single+',
  '2B': 'Double',
  '3B': 'Triple',
  HR: 'Home run!',
};

function dieEvent(events: GameEvent[]): Extract<GameEvent, { roll: number }> | undefined {
  return events.find((e): e is Extract<GameEvent, { roll: number }> => 'roll' in e);
}

function bannerFor(events: GameEvent[]): Omit<Banner, 'id'> | null {
  for (const e of events) {
    if (e.t === 'pitch') {
      return { text: e.advantage === 'pitcher' ? "Pitcher's advantage" : "Batter's advantage", tone: 'advantage' };
    }
    if (e.t === 'swing') return { text: RESULT_BANNER[e.result], tone: RESULT_TONE[e.result] };
    if (e.t === 'doublePlay') return e.out ? { text: 'Double play', tone: 'out' } : { text: 'Safe at first', tone: 'safe' };
    if (e.t === 'throw') return e.out ? { text: e.play === 'steal' ? 'Caught stealing' : 'Thrown out', tone: 'out' } : { text: e.play === 'steal' ? 'Stolen base' : 'Safe', tone: 'safe' };
  }
  return null;
}

export interface LastSwing {
  on: 'pitcher' | 'batter';
  roll: number;
  batterId: string;
  pitcherId: string;
  side: Side;
}

export interface GamePlayer {
  /** What the screen shows, which trails the real state while dice are in the air. */
  view: GameState;
  die: { value: number | null; rolling: boolean };
  banner: Banner | null;
  busy: boolean;
  lastSwing: LastSwing | null;
  /** The newest plain-English lines, for the "what just happened" text. */
  latest: GameEvent[];
  /** Runners who just scored, drawn heading for home before they vanish. */
  scoring: string[];
  submit: GameSession['submit'];
}

/**
 * Plays session updates back with their animations. Everything that arrives goes
 * through a queue, so moves from another device would animate exactly like local ones.
 */
export function useGamePlayer(session: GameSession): GamePlayer {
  const [view, setView] = useState(() => session.getState());
  const [die, setDie] = useState<{ value: number | null; rolling: boolean }>({ value: null, rolling: false });
  const [banner, setBanner] = useState<Banner | null>(null);
  const [busy, setBusy] = useState(false);
  const [lastSwing, setLastSwing] = useState<LastSwing | null>(null);
  const [latest, setLatest] = useState<GameEvent[]>([]);
  const [scoring, setScoring] = useState<string[]>([]);
  const queue = useRef<Promise<void>>(Promise.resolve());
  const bannerId = useRef(0);

  useEffect(() => {
    return session.subscribe((update) => {
      queue.current = queue.current.then(async () => {
        const rolled = dieEvent(update.events);
        if (rolled) {
          setBusy(true);
          setDie({ value: rolled.roll, rolling: true });
          await wait(ROLL_MS);
          setDie({ value: rolled.roll, rolling: false });
          await wait(LAND_MS);
        }
        const swing = update.events.find((e) => e.t === 'swing');
        if (update.events.some((e) => e.t === 'pitch')) setLastSwing(null);
        if (swing && swing.t === 'swing') {
          const shown: LastSwing = { on: swing.on, roll: swing.roll, batterId: swing.batterId, pitcherId: swing.pitcherId, side: swing.side };
          setLastSwing(shown);
          // Show the chart that was hit for a moment, then bring up the next batter.
          if (update.state.phase.kind !== 'over') {
            window.setTimeout(() => setLastSwing((current) => (current === shown ? null : current)), BANNER_MS);
          }
        }
        const nextBanner = bannerFor(update.events);
        if (nextBanner) {
          bannerId.current += 1;
          const id = bannerId.current;
          setBanner({ id, ...nextBanner });
          window.setTimeout(() => setBanner((current) => (current?.id === id ? null : current)), BANNER_MS);
        }
        const scored = update.events.flatMap((e) => (e.t === 'run' ? [e.runnerId] : []));
        setScoring(scored);
        if (scored.length > 0) window.setTimeout(() => setScoring([]), instant ? 0 : 700);
        setLatest(update.events);
        setView(update.state);
        setBusy(false);
      });
    });
  }, [session]);

  const submit = useCallback<GameSession['submit']>((action) => session.submit(action), [session]);

  return { view, die, banner, busy, lastSwing, latest, scoring, submit };
}
