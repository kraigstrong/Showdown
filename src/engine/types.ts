// Everything in here is plain, serializable data, so a game can be saved to
// disk or sent over a network without any conversion.

export type Side = 'away' | 'home';
export type Half = 'top' | 'bottom';

export type FieldSlot = 'C' | '1B' | '2B' | '3B' | 'SS' | 'LF' | 'CF' | 'RF';
export type LineupSlot = FieldSlot | 'DH';
export type OutfieldSlot = 'LF' | 'CF' | 'RF';
export type CardPosition = FieldSlot | 'LF/RF' | 'OF' | 'IF' | 'DH';

export type SwingResult = 'PU' | 'SO' | 'GB' | 'FB' | 'BB' | '1B' | '1B+' | '2B' | '3B' | 'HR';

/** How many of the 20 die faces land on each result. */
export type Chart = Partial<Record<SwingResult, number>>;

interface CardBase {
  id: string;
  /** The same person across years, used to stop a team carrying him twice. */
  playerId: string;
  name: string;
  year: number;
  set: string;
  number: number;
  team: string;
  points: number;
  hand: 'L' | 'R' | 'S';
  foil: boolean;
  chart: Chart;
}

export interface HitterCard extends CardBase {
  kind: 'hitter';
  onBase: number;
  speed: number;
  positions: { pos: CardPosition; fielding: number }[];
}

export interface PitcherCard extends CardBase {
  kind: 'pitcher';
  control: number;
  ip: number;
  role: 'Starter' | 'Reliever' | 'Closer';
}

export type GameCard = HitterCard | PitcherCard;

export interface TeamSetup {
  name: string;
  /** Real-team code used for colors, if the team has one. */
  code?: string;
  /** Nine entries in batting order. */
  lineup: { cardId: string; slot: LineupSlot }[];
  /** Starters in rotation order. Four for a built team; a real team may have fewer. */
  rotation: string[];
  /** The manager's pick to start this game, from the rotation. Defaults to the first starter. */
  starterId?: string;
  bullpen: string[];
  bench: string[];
}

export interface GameSetup {
  away: TeamSetup;
  home: TeamSetup;
  cards: Record<string, GameCard>;
  seed: number;
}

export interface LineupEntry {
  cardId: string;
  slot: LineupSlot;
  hasBatted: boolean;
}

export interface BatterLine {
  ab: number;
  r: number;
  h: number;
  hr: number;
  rbi: number;
  bb: number;
  so: number;
  sb: number;
}

export interface PitcherLine {
  /** Outs he's recorded, which is also what his IP is counted in. */
  outs: number;
  h: number;
  r: number;
  bb: number;
  so: number;
  hr: number;
}

export interface TeamState {
  name: string;
  code?: string;
  lineup: LineupEntry[];
  battingIndex: number;
  rotation: string[];
  bullpen: string[];
  bench: string[];
  pitcherId: string | null;
  starterId: string | null;
  batting: Record<string, BatterLine>;
  pitching: Record<string, PitcherLine>;
  /** Order pitchers appeared in, for the box score. */
  pitchersUsed: string[];
  /** Hitters who have appeared, in order, for the box score. */
  battersUsed: string[];
  runsByInning: number[];
  hits: number;
}

/** A base as an index: 0 is first, 1 is second, 2 is third, 3 is home. */
export interface Attempt {
  runnerId: string;
  from: number;
  to: number;
}

export type ThrowPlay = 'hit' | 'fly' | 'steal';

export type Phase =
  | { kind: 'offense' }
  | { kind: 'pitch' }
  | { kind: 'swing'; on: 'pitcher' | 'batter' }
  | { kind: 'doublePlay' }
  | { kind: 'send'; play: 'hit' | 'fly'; eligible: number[] }
  | { kind: 'aim'; play: ThrowPlay; attempts: Attempt[] }
  /** On a throw home the outfielder who throws is rolled for first; fielder is set once he is. */
  | { kind: 'throw'; play: ThrowPlay; attempts: Attempt[]; targetFrom: number; fielder?: OutfieldSlot }
  | { kind: 'over' };

export type GameEvent =
  | { t: 'starters'; away: string; home: string }
  | { t: 'half'; inning: number; half: Half }
  | {
      t: 'pitch';
      roll: number;
      control: number;
      fatigue: number;
      total: number;
      onBase: number;
      advantage: 'pitcher' | 'batter';
      pitcherId: string;
      batterId: string;
    }
  | { t: 'swing'; roll: number; on: 'pitcher' | 'batter'; result: SwingResult; batterId: string; pitcherId: string; side: Side }
  | { t: 'run'; runnerId: string; side: Side }
  | { t: 'forceOut'; runnerId: string }
  | { t: 'doublePlay'; roll: number; bonus: number; total: number; target: number; out: boolean; batterId: string }
  | {
      t: 'throw';
      play: ThrowPlay;
      roll: number;
      bonus: number;
      total: number;
      target: number;
      out: boolean;
      runnerId: string;
      from: number;
      to: number;
      /** The outfielder who threw, on a throw home. */
      fielderId?: string;
    }
  | { t: 'fielder'; roll: number; slot: OutfieldSlot; fielderId: string }
  | { t: 'advance'; runnerId: string; to: number; reason: 'trail' | 'single+' }
  | { t: 'pinchHit'; inId: string; outId: string; side: Side }
  | { t: 'pitchingChange'; inId: string; outId: string; side: Side }
  | { t: 'over'; winner: Side; walkoff: boolean };

export interface GameState {
  version: 1;
  rng: number;
  cards: Record<string, GameCard>;
  teams: Record<Side, TeamState>;
  inning: number;
  half: Half;
  outs: number;
  /** Card ids of the runners on first, second and third. */
  bases: [string | null, string | null, string | null];
  phase: Phase;
  atBat: { phUsed: boolean; pitchingChangeUsed: boolean };
  /** The batter who reached on a 1B+ and takes second before the next pitch. */
  singlePlusRunner: string | null;
  log: GameEvent[];
  winner: Side | null;
}

export type Action =
  | { type: 'ROLL' }
  | { type: 'PROCEED' }
  | { type: 'PINCH_HIT'; cardId: string }
  | { type: 'CHANGE_PITCHER'; cardId: string }
  | { type: 'STEAL'; from: number[] }
  | { type: 'SEND'; from: number[] }
  | { type: 'AIM'; from: number };

export interface Prompt {
  /** The manager who has to act. */
  actor: Side;
  phase: Phase['kind'];
  actions: Action[];
}
