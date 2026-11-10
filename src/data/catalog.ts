import type { GameCard, HitterCard, PitcherCard } from '../engine';
import rawCards from './cards.json';
import rawOtherYears from './other-years.json';

/** The 2000 and 2001 cards: the pool for building, random and real teams. */
export const ALL_CARDS = rawCards as unknown as GameCard[];
/** Later cards that only our saved teams play with, charts already cut off at 20. */
export const OTHER_YEAR_CARDS = rawOtherYears as unknown as GameCard[];
export const CARDS_BY_ID: Record<string, GameCard> = Object.fromEntries(
  [...ALL_CARDS, ...OTHER_YEAR_CARDS].map((card) => [card.id, card]),
);

export const HITTERS = ALL_CARDS.filter((card): card is HitterCard => card.kind === 'hitter');
export const PITCHERS = ALL_CARDS.filter((card): card is PitcherCard => card.kind === 'pitcher');

export const YEARS = [2000, 2001];

export interface TeamInfo {
  code: string;
  city: string;
  name: string;
  /** The tint of this team's 2000 card fronts, sampled from scans. */
  color: string;
}

export const TEAMS: TeamInfo[] = [
  { code: 'ANA', city: 'Anaheim', name: 'Angels', color: '#1e2a5a' },
  { code: 'ARI', city: 'Arizona', name: 'Diamondbacks', color: '#2b2190' },
  { code: 'ATL', city: 'Atlanta', name: 'Braves', color: '#b02a2e' },
  { code: 'BAL', city: 'Baltimore', name: 'Orioles', color: '#cc7a45' },
  { code: 'BOS', city: 'Boston', name: 'Red Sox', color: '#cc2a24' },
  { code: 'CHC', city: 'Chicago', name: 'Cubs', color: '#3f6383' },
  { code: 'CHW', city: 'Chicago', name: 'White Sox', color: '#232a33' },
  { code: 'CIN', city: 'Cincinnati', name: 'Reds', color: '#c8463a' },
  { code: 'CLE', city: 'Cleveland', name: 'Indians', color: '#b52a3a' },
  { code: 'COL', city: 'Colorado', name: 'Rockies', color: '#23236f' },
  { code: 'DET', city: 'Detroit', name: 'Tigers', color: '#16224f' },
  { code: 'FLA', city: 'Florida', name: 'Marlins', color: '#24a390' },
  { code: 'HOU', city: 'Houston', name: 'Astros', color: '#18233f' },
  { code: 'KCR', city: 'Kansas City', name: 'Royals', color: '#4f5f92' },
  { code: 'LAD', city: 'Los Angeles', name: 'Dodgers', color: '#215672' },
  { code: 'MIL', city: 'Milwaukee', name: 'Brewers', color: '#223442' },
  { code: 'MIN', city: 'Minnesota', name: 'Twins', color: '#a8302e' },
  { code: 'MON', city: 'Montreal', name: 'Expos', color: '#435665' },
  { code: 'NYM', city: 'New York', name: 'Mets', color: '#333b61' },
  { code: 'NYY', city: 'New York', name: 'Yankees', color: '#6a79a6' },
  { code: 'OAK', city: 'Oakland', name: 'Athletics', color: '#14482a' },
  { code: 'PHI', city: 'Philadelphia', name: 'Phillies', color: '#b01a21' },
  { code: 'PIT', city: 'Pittsburgh', name: 'Pirates', color: '#e7972b' },
  { code: 'SDP', city: 'San Diego', name: 'Padres', color: '#303c6b' },
  { code: 'SEA', city: 'Seattle', name: 'Mariners', color: '#0f1f42' },
  { code: 'SFG', city: 'San Francisco', name: 'Giants', color: '#d4753a' },
  { code: 'STL', city: 'St. Louis', name: 'Cardinals', color: '#ae3637' },
  { code: 'TBD', city: 'Tampa Bay', name: 'Devil Rays', color: '#18566a' },
  { code: 'TEX', city: 'Texas', name: 'Rangers', color: '#94383f' },
  { code: 'TOR', city: 'Toronto', name: 'Blue Jays', color: '#2f3d68' },
];

export const TEAMS_BY_CODE: Record<string, TeamInfo> = Object.fromEntries(TEAMS.map((team) => [team.code, team]));

const DEFAULT_COLOR = '#23214f';

export function teamColor(code?: string): string {
  return (code && TEAMS_BY_CODE[code]?.color) || DEFAULT_COLOR;
}
