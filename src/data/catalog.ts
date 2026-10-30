import type { GameCard, HitterCard, PitcherCard } from '../engine';
import rawCards from './cards.json';

export const ALL_CARDS = rawCards as unknown as GameCard[];
export const CARDS_BY_ID: Record<string, GameCard> = Object.fromEntries(ALL_CARDS.map((card) => [card.id, card]));

export const HITTERS = ALL_CARDS.filter((card): card is HitterCard => card.kind === 'hitter');
export const PITCHERS = ALL_CARDS.filter((card): card is PitcherCard => card.kind === 'pitcher');

export const YEARS = [2000, 2001];

export interface TeamInfo {
  code: string;
  city: string;
  name: string;
  color: string;
  accent: string;
}

// Colors only, no logos.
export const TEAMS: TeamInfo[] = [
  { code: 'ANA', city: 'Anaheim', name: 'Angels', color: '#862633', accent: '#c4ced4' },
  { code: 'ARI', city: 'Arizona', name: 'Diamondbacks', color: '#5f259f', accent: '#00a7b5' },
  { code: 'ATL', city: 'Atlanta', name: 'Braves', color: '#13274f', accent: '#ce1141' },
  { code: 'BAL', city: 'Baltimore', name: 'Orioles', color: '#df4601', accent: '#000000' },
  { code: 'BOS', city: 'Boston', name: 'Red Sox', color: '#bd3039', accent: '#0c2340' },
  { code: 'CHC', city: 'Chicago', name: 'Cubs', color: '#0e3386', accent: '#cc3433' },
  { code: 'CHW', city: 'Chicago', name: 'White Sox', color: '#27251f', accent: '#c4ced4' },
  { code: 'CIN', city: 'Cincinnati', name: 'Reds', color: '#c6011f', accent: '#000000' },
  { code: 'CLE', city: 'Cleveland', name: 'Indians', color: '#0c2340', accent: '#e31937' },
  { code: 'COL', city: 'Colorado', name: 'Rockies', color: '#33006f', accent: '#c4ced4' },
  { code: 'DET', city: 'Detroit', name: 'Tigers', color: '#0c2340', accent: '#fa4616' },
  { code: 'FLA', city: 'Florida', name: 'Marlins', color: '#00778b', accent: '#000000' },
  { code: 'HOU', city: 'Houston', name: 'Astros', color: '#5c2b1b', accent: '#c9a227' },
  { code: 'KCR', city: 'Kansas City', name: 'Royals', color: '#004687', accent: '#bd9b60' },
  { code: 'LAD', city: 'Los Angeles', name: 'Dodgers', color: '#005a9c', accent: '#ef3e42' },
  { code: 'MIL', city: 'Milwaukee', name: 'Brewers', color: '#12284b', accent: '#b6922e' },
  { code: 'MIN', city: 'Minnesota', name: 'Twins', color: '#002b5c', accent: '#d31145' },
  { code: 'MON', city: 'Montreal', name: 'Expos', color: '#003087', accent: '#e4002b' },
  { code: 'NYM', city: 'New York', name: 'Mets', color: '#002d72', accent: '#ff5910' },
  { code: 'NYY', city: 'New York', name: 'Yankees', color: '#0c2340', accent: '#c4ced3' },
  { code: 'OAK', city: 'Oakland', name: 'Athletics', color: '#003831', accent: '#efb21e' },
  { code: 'PHI', city: 'Philadelphia', name: 'Phillies', color: '#b5121b', accent: '#002d72' },
  { code: 'PIT', city: 'Pittsburgh', name: 'Pirates', color: '#27251f', accent: '#fdb827' },
  { code: 'SDP', city: 'San Diego', name: 'Padres', color: '#002d62', accent: '#a2aaad' },
  { code: 'SEA', city: 'Seattle', name: 'Mariners', color: '#0c2c56', accent: '#00a7a7' },
  { code: 'SFG', city: 'San Francisco', name: 'Giants', color: '#27251f', accent: '#fd5a1e' },
  { code: 'STL', city: 'St. Louis', name: 'Cardinals', color: '#c41e3a', accent: '#0c2340' },
  { code: 'TBD', city: 'Tampa Bay', name: 'Devil Rays', color: '#00285d', accent: '#3eb489' },
  { code: 'TEX', city: 'Texas', name: 'Rangers', color: '#003278', accent: '#c0111f' },
  { code: 'TOR', city: 'Toronto', name: 'Blue Jays', color: '#134a8e', accent: '#e8291c' },
];

export const TEAMS_BY_CODE: Record<string, TeamInfo> = Object.fromEntries(TEAMS.map((team) => [team.code, team]));

const DEFAULT_COLOR = '#1f5c46';

export function teamColor(code?: string): string {
  return (code && TEAMS_BY_CODE[code]?.color) || DEFAULT_COLOR;
}
