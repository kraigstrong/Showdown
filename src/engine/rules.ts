// Small, pure rule lookups shared by the engine and the screens.
import type { CardPosition, Chart, FieldSlot, HitterCard, LineupSlot, PitcherCard, PitcherLine, SwingResult } from './types';

export const CHART_ORDER: SwingResult[] = ['PU', 'SO', 'GB', 'FB', 'BB', '1B', '1B+', '2B', '3B', 'HR'];
export const FIELD_SLOTS: FieldSlot[] = ['C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF'];
export const LINEUP_SLOTS: LineupSlot[] = [...FIELD_SLOTS, 'DH'];
export const INFIELD: FieldSlot[] = ['1B', '2B', '3B', 'SS'];
export const OUTFIELD: FieldSlot[] = ['LF', 'CF', 'RF'];

export interface ChartRange {
  result: SwingResult;
  from: number;
  to: number;
}

export function chartRanges(chart: Chart): ChartRange[] {
  const ranges: ChartRange[] = [];
  let next = 1;
  for (const result of CHART_ORDER) {
    const count = chart[result] ?? 0;
    if (count > 0) {
      ranges.push({ result, from: next, to: next + count - 1 });
      next += count;
    }
  }
  return ranges;
}

export function resultForRoll(chart: Chart, roll: number): SwingResult {
  const range = chartRanges(chart).find((r) => roll >= r.from && roll <= r.to);
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
export function fieldingAt(card: HitterCard, slot: LineupSlot): number | null {
  if (slot === 'DH') return 0;
  let best: number | null = null;
  for (const { pos, fielding } of card.positions) {
    if (positionCovers(pos, slot) && (best === null || fielding > best)) best = fielding;
  }
  return best;
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
