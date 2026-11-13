// Small, pure rule lookups shared by the engine and the screens.
import type { CardPosition, FieldSlot, GameCard, HitterCard, LineupSlot, PitcherCard, PitcherLine, SwingResult } from './types';

const CHART_ORDER: SwingResult[] = ['PU', 'SO', 'GB', 'FB', 'BB', '1B', '1B+', '2B', '3B', 'HR'];
// The 2000 cards print strikeouts above pop-ups; from 2001 on it's the other way around.
const CHART_ORDER_2000: SwingResult[] = ['SO', 'PU', 'GB', 'FB', 'BB', '1B', '1B+', '2B', '3B', 'HR'];

export function chartOrder(year: number): SwingResult[] {
  return year === 2000 ? CHART_ORDER_2000 : CHART_ORDER;
}

type ChartedCard = Pick<GameCard, 'chart' | 'year'>;

export const FIELD_SLOTS: FieldSlot[] = ['C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF'];
export const LINEUP_SLOTS: LineupSlot[] = [...FIELD_SLOTS, 'DH'];
export const INFIELD: FieldSlot[] = ['1B', '2B', '3B', 'SS'];
export const OUTFIELD: FieldSlot[] = ['LF', 'CF', 'RF'];

export interface ChartRange {
  result: SwingResult;
  from: number;
  to: number;
}

export function chartRanges(card: ChartedCard): ChartRange[] {
  const ranges: ChartRange[] = [];
  let next = 1;
  for (const result of chartOrder(card.year)) {
    const count = card.chart[result] ?? 0;
    if (count > 0) {
      ranges.push({ result, from: next, to: next + count - 1 });
      next += count;
    }
  }
  return ranges;
}

export function resultForRoll(card: ChartedCard, roll: number): SwingResult {
  const range = chartRanges(card).find((r) => roll >= r.from && roll <= r.to);
  if (!range) throw new Error(`No chart result for a roll of ${roll}`);
  return range.result;
}

function positionCovers(pos: CardPosition, slot: LineupSlot): boolean {
  if (pos === slot) return true;
  if (pos === 'LF/RF') return slot === 'LF' || slot === 'RF';
  if (pos === 'OF') return slot === 'LF' || slot === 'CF' || slot === 'RF';
  if (pos === 'IF') return slot === '1B' || slot === '2B' || slot === '3B' || slot === 'SS';
  return false;
}

/** The hitter's Fielding at a slot, or null if he doesn't qualify there. Anyone can DH. */
const INFIELD_POSITIONS: CardPosition[] = ['1B', '2B', '3B', 'SS', 'IF'];
const OUTFIELD_POSITIONS: CardPosition[] = ['LF', 'CF', 'RF', 'LF/RF', 'OF'];

/** His Fielding at a spot his card lists, or null if it doesn't list it. Anyone can DH. */
export function cardFieldingAt(card: HitterCard, slot: LineupSlot): number | null {
  if (slot === 'DH') return 0;
  let best: number | null = null;
  for (const { pos, fielding } of card.positions) {
    if (positionCovers(pos, slot) && (best === null || fielding > best)) best = fielding;
  }
  return best;
}

/**
 * His Fielding at a spot, or null if he can't play there. Our house rules: any
 * infielder can play anywhere in the infield, any outfielder anywhere in the
 * outfield, and a DH can play first base, at +0 when the spot isn't on his card.
 */
export function fieldingAt(card: HitterCard, slot: LineupSlot): number | null {
  const listed = cardFieldingAt(card, slot);
  if (listed !== null) return listed;
  const isInfielder = card.positions.some((p) => INFIELD_POSITIONS.includes(p.pos));
  if (isInfielder && (INFIELD as LineupSlot[]).includes(slot)) return 0;
  const isOutfielder = card.positions.some((p) => OUTFIELD_POSITIONS.includes(p.pos));
  if (isOutfielder && (OUTFIELD as LineupSlot[]).includes(slot)) return 0;
  if (slot === '1B' && card.positions.some((p) => p.pos === 'DH')) return 0;
  return null;
}

/** The penalty on every pitch: 1 for each inning past the pitcher's IP. */
export function fatigueOf(card: PitcherCard, line: Pick<PitcherLine, 'innings'>): number {
  return Math.max(0, line.innings - card.ip);
}

/** The chance a d20 plus the bonus beats the target. Ties go to the runner. */
export function chanceToBeat(bonus: number, target: number): number {
  let wins = 0;
  for (let roll = 1; roll <= 20; roll++) if (roll + bonus > target) wins++;
  return wins / 20;
}

export function speedLetter(speed: number): string {
  if (speed >= 18) return 'A';
  if (speed >= 13) return 'B';
  return 'C';
}

/** Speed as the card prints it: a letter through 2001, the number from 2002 on. */
export function speedLabel(card: Pick<HitterCard, 'speed' | 'year'>): string {
  return card.year >= 2002 ? String(card.speed) : speedLetter(card.speed);
}
