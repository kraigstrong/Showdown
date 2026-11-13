// Building a team to take into a game: the point cap, real rosters and random drafts.
import { ALL_CARDS, CARDS_BY_ID, HITTERS, PITCHERS, TEAMS_BY_CODE } from '../data/catalog';
import { fieldingAt, LINEUP_SLOTS } from '../engine';
import type { GameCard, HitterCard, LineupSlot, PitcherCard, TeamSetup } from '../engine';

export const POINT_CAP = 5000;
export const MAX_ROSTER = 25;
export const ROTATION_SIZE = 4;
export const BENCH_COST_DIVISOR = 5;

export interface TeamDraft {
  name: string;
  code?: string;
  /** An untouched real or saved team, played with exactly its own cards. */
  capExempt: boolean;
  /** Set while this is one of our saved teams, untouched. */
  savedTeam?: string;
  lineup: { slot: LineupSlot; cardId: string | null }[];
  rotation: (string | null)[];
  bullpen: string[];
  bench: string[];
}

export function emptyDraft(name: string): TeamDraft {
  return {
    name,
    capExempt: false,
    lineup: LINEUP_SLOTS.map((slot) => ({ slot, cardId: null })),
    rotation: Array<string | null>(ROTATION_SIZE).fill(null),
    bullpen: [],
    bench: [],
  };
}

export function benchCost(card: GameCard): number {
  return Math.round(card.points / BENCH_COST_DIVISOR);
}

function pointsOf(id: string | null): number {
  return id ? CARDS_BY_ID[id].points : 0;
}

export function draftCost(draft: TeamDraft): number {
  return (
    draft.lineup.reduce((sum, entry) => sum + pointsOf(entry.cardId), 0) +
    draft.rotation.reduce((sum, id) => sum + pointsOf(id), 0) +
    draft.bullpen.reduce((sum, id) => sum + pointsOf(id), 0) +
    draft.bench.reduce((sum, id) => sum + benchCost(CARDS_BY_ID[id]), 0)
  );
}

export function draftCardIds(draft: TeamDraft): string[] {
  const ids = [...draft.lineup.map((entry) => entry.cardId), ...draft.rotation, ...draft.bullpen, ...draft.bench];
  return ids.filter((id): id is string => id !== null);
}

/** What still stops this team from taking the field. An empty list means it's ready. */
export function draftIssues(draft: TeamDraft): string[] {
  const issues: string[] = [];
  const emptySlots = draft.lineup.filter((entry) => !entry.cardId).map((entry) => entry.slot);
  if (emptySlots.length > 0) issues.push(`Fill the lineup: ${emptySlots.join(', ')}`);
  const openStarters = draft.rotation.filter((id) => !id).length;
  if (openStarters > 0) issues.push(`Add ${openStarters} more starting pitcher${openStarters > 1 ? 's' : ''}`);
  for (const entry of draft.lineup) {
    if (!entry.cardId) continue;
    const card = CARDS_BY_ID[entry.cardId];
    // A saved team plays people where we always played them, out of position or not.
    if (card.kind !== 'hitter' || (fieldingAt(card, entry.slot) === null && !draft.savedTeam)) {
      issues.push(`${card.name} can't play ${entry.slot}`);
    }
  }
  const ids = draftCardIds(draft);
  if (ids.length > MAX_ROSTER) issues.push(`Roster has ${ids.length} players; the limit is ${MAX_ROSTER}`);
  const players = ids.map((id) => CARDS_BY_ID[id].playerId);
  if (new Set(players).size !== players.length) issues.push('The same player is on the team twice');
  // Going over the point cap is allowed; the team is just marked Over cap.
  return issues;
}

export function toTeamSetup(draft: TeamDraft): TeamSetup {
  return {
    name: draft.name,
    code: draft.code,
    lineup: draft.lineup.map((entry) => ({ cardId: entry.cardId as string, slot: entry.slot })),
    rotation: draft.rotation as string[],
    bullpen: draft.bullpen,
    bench: draft.bench,
  };
}

function homeRunRange(card: HitterCard): number {
  return card.chart.HR ?? 0;
}

/** Offers a batting order using the rulebook's advice for a quick lineup. */
export function suggestBattingOrder<T extends { cardId: string | null }>(lineup: T[]): T[] {
  const remaining = [...lineup].filter((entry) => entry.cardId);
  const card = (entry: T) => CARDS_BY_ID[entry.cardId as string] as HitterCard;
  const take = (score: (c: HitterCard) => number) => {
    let best = 0;
    remaining.forEach((entry, i) => {
      if (score(card(entry)) > score(card(remaining[best]))) best = i;
    });
    return remaining.splice(best, 1)[0];
  };
  const order: T[] = [];
  const speedAndOnBase = (c: HitterCard) => c.onBase * 2 + c.speed / 5;
  if (remaining.length > 0) order.push(take(speedAndOnBase));
  if (remaining.length > 0) order.push(take(speedAndOnBase));
  if (remaining.length > 0) order.push(take((c) => c.onBase * 10 + c.points / 100));
  if (remaining.length > 0) order.push(take((c) => homeRunRange(c) * 10 + c.points / 100));
  while (remaining.length > 0) order.push(take((c) => c.points));
  return [...order, ...lineup.filter((entry) => !entry.cardId)];
}

/** The strongest legal lineup from a set of hitters, or null if a position can't be filled. */
function bestLineup(hitters: HitterCard[]): { slot: LineupSlot; cardId: string }[] | null {
  const full = (1 << LINEUP_SLOTS.length) - 1;
  let table = new Map<number, { score: number; picks: [number, string][] }>([[0, { score: 0, picks: [] }]]);
  for (const hitter of hitters) {
    const next = new Map(table);
    for (const [mask, entry] of table) {
      LINEUP_SLOTS.forEach((slot, bit) => {
        if (mask & (1 << bit) || fieldingAt(hitter, slot) === null) return;
        const nextMask = mask | (1 << bit);
        const score = entry.score + hitter.points;
        const existing = next.get(nextMask);
        if (!existing || existing.score < score) {
          next.set(nextMask, { score, picks: [...entry.picks, [bit, hitter.id]] });
        }
      });
    }
    table = next;
  }
  const best = table.get(full);
  if (!best) return null;
  return best.picks.map(([bit, cardId]) => ({ slot: LINEUP_SLOTS[bit], cardId }));
}

export interface RealTeamKey {
  year: number;
  code: string;
}

/** A player can have a base and a Pennant Run card for one team; only his best one plays. */
function bestCardPerPlayer<C extends GameCard>(cards: C[]): C[] {
  const best = new Map<string, C>();
  for (const card of cards) {
    const existing = best.get(card.playerId);
    if (!existing || card.points > existing.points) best.set(card.playerId, card);
  }
  return [...best.values()];
}

/**
 * The team's own cards for a year: the best nine play, the rest fill the bench and
 * bullpen. A few real teams have fewer than four starter cards and rotate what they have.
 */
export function realTeamDraft({ year, code }: RealTeamKey): TeamDraft | null {
  const cards = bestCardPerPlayer(ALL_CARDS.filter((c) => c.year === year && c.team === code));
  const hitters = cards.filter((c): c is HitterCard => c.kind === 'hitter');
  const pitchers = cards.filter((c): c is PitcherCard => c.kind === 'pitcher');
  const starters = pitchers.filter((c) => c.role === 'Starter').sort((a, b) => b.points - a.points);
  if (starters.length === 0) return null;
  const lineup = bestLineup(hitters);
  if (!lineup) return null;
  const inLineup = new Set(lineup.map((entry) => entry.cardId));
  const info = TEAMS_BY_CODE[code];
  return {
    name: `${year} ${info.name}`,
    code,
    capExempt: true,
    lineup: suggestBattingOrder(lineup),
    rotation: starters.slice(0, ROTATION_SIZE).map((c) => c.id),
    bullpen: pitchers.filter((c) => c.role !== 'Starter').map((c) => c.id),
    bench: hitters.filter((c) => !inLineup.has(c.id)).map((c) => c.id),
  };
}

function shuffled<T>(items: T[], random: () => number): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

const DRAFT_BULLPEN = 6;
const DRAFT_BENCH = 4;

/**
 * Fills whatever is still open with random cards that fit under the cap, or the
 * cheapest ones left if the team is already over it. Spends
 * roughly evenly per open spot, so the team comes out balanced, not one superstar
 * surrounded by ten-point players.
 */
export function autoFill(draft: TeamDraft, random: () => number = Math.random): TeamDraft {
  const next = withFullRotation(structuredClone(draft));
  next.capExempt = false;
  delete next.savedTeam;
  const used = new Set(draftCardIds(next).map((id) => CARDS_BY_ID[id].playerId));
  const openLineup = next.lineup.filter((entry) => !entry.cardId);
  const openStarters = next.rotation.filter((id) => !id).length;
  const openBullpen = Math.max(0, DRAFT_BULLPEN - next.bullpen.length);
  const openBench = Math.max(0, DRAFT_BENCH - next.bench.length);

  // Share of the remaining budget each kind of spot is worth.
  const weights = { lineup: 1, starter: 1, bullpen: 0.3 };
  const reservedForBench = 100;
  let budget = POINT_CAP - draftCost(next) - reservedForBench;
  let unitsLeft = openLineup.length * weights.lineup + openStarters * weights.starter + openBullpen * weights.bullpen;

  const pick = <C extends GameCard>(pool: C[], weight: number, slotsAfterThis: number): C | null => {
    const share = unitsLeft > 0 ? (budget / unitsLeft) * weight : budget;
    const target = share * (0.7 + random() * 0.6);
    const reserve = slotsAfterThis * 10;
    const available = shuffled(pool, random).filter((c) => !used.has(c.playerId));
    const affordable = available.filter((c) => c.points <= budget - reserve);
    const cheapest = available.reduce<C[]>((low, c) => (low.length === 0 || c.points < low[0].points ? [c] : low), []);
    const options = affordable.length > 0 ? affordable : cheapest;
    if (options.length === 0) return null;
    const chosen = options.reduce((best, c) => (Math.abs(c.points - target) < Math.abs(best.points - target) ? c : best));
    used.add(chosen.playerId);
    budget -= chosen.points;
    unitsLeft -= weight;
    return chosen;
  };

  let spotsLeft = openLineup.length + openStarters + openBullpen;
  // Hardest positions first, so the catchers and shortstops aren't the leftovers.
  const lineupOrder = [...openLineup].sort(
    (a, b) => HITTERS.filter((c) => fieldingAt(c, a.slot) !== null).length - HITTERS.filter((c) => fieldingAt(c, b.slot) !== null).length,
  );
  for (const entry of lineupOrder) {
    spotsLeft -= 1;
    const chosen = pick(
      HITTERS.filter((c) => fieldingAt(c, entry.slot) !== null),
      weights.lineup,
      spotsLeft,
    );
    entry.cardId = chosen?.id ?? null;
  }
  next.rotation = next.rotation.map((id) => {
    if (id) return id;
    spotsLeft -= 1;
    return pick(PITCHERS.filter((c): c is PitcherCard => c.role === 'Starter'), weights.starter, spotsLeft)?.id ?? null;
  });
  for (let i = 0; i < openBullpen; i++) {
    spotsLeft -= 1;
    const chosen = pick(PITCHERS.filter((c) => c.role !== 'Starter'), weights.bullpen, spotsLeft);
    if (chosen) next.bullpen.push(chosen.id);
  }
  budget += reservedForBench;
  const benchPool = shuffled(HITTERS, random).filter((c) => !used.has(c.playerId));
  for (const card of benchPool) {
    if (next.bench.length >= draft.bench.length + openBench) break;
    if (!used.has(card.playerId) && benchCost(card) <= budget / Math.max(1, openBench)) {
      used.add(card.playerId);
      next.bench.push(card.id);
      budget -= benchCost(card);
    }
  }
  next.lineup = suggestBattingOrder(next.lineup);
  next.rotation = sortRotation(next.rotation);
  return next;
}

/** A built team needs four starters, even if it began as a real team with fewer. */
export function withFullRotation(draft: TeamDraft): TeamDraft {
  const rotation = [...draft.rotation];
  while (rotation.length < ROTATION_SIZE) rotation.push(null);
  return { ...draft, rotation };
}

/** Highest-cost starter first, as tournament rules ask. */
export function sortRotation(rotation: (string | null)[]): (string | null)[] {
  const filled = rotation.filter((id): id is string => id !== null).sort((a, b) => pointsOf(b) - pointsOf(a));
  return [...filled, ...rotation.filter((id) => id === null)];
}

export function draftFromPreset(key: RealTeamKey): TeamDraft {
  const draft = realTeamDraft(key);
  if (!draft) throw new Error(`${key.year} ${key.code} can't field a legal team`);
  return draft;
}
