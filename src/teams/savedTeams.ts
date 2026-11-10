// Teams we play with over and over, kept exactly as built. They can run over the
// point cap and use cards from after 2001; those cards' charts stop at 20.
// A card from another year also needs its id in OTHER_YEAR_CARDS in
// scripts/build-cards.mjs, then `npm run cards`.
import type { LineupSlot } from '../engine';
import type { TeamDraft } from './roster';

export interface SavedTeam {
  id: string;
  name: string;
  /** Real-team code for colors. */
  code?: string;
  /** In batting order. */
  lineup: { slot: LineupSlot; cardId: string }[];
  /** Starters in rotation order; the first one is the default pick to start. */
  rotation: string[];
  bullpen: string[];
  bench: string[];
}

export const SAVED_TEAMS: SavedTeam[] = [
  {
    id: 'kraigs-mariners',
    name: "Kraig's Mariners",
    code: 'SEA',
    lineup: [
      { slot: 'RF', cardId: '2001-PR-169' }, // 2001 Ichiro Suzuki
      { slot: 'SS', cardId: '2001-BS-397' }, // 2001 Alex Rodriguez (SEA)
      { slot: 'LF', cardId: '2000-BS-156' }, // 2000 Larry Walker
      { slot: 'CF', cardId: '2000-BS-391' }, // 2000 Ken Griffey Jr. (SEA)
      { slot: 'DH', cardId: '2000-BS-396' }, // 2000 Edgar Martinez
      { slot: '2B', cardId: '2001-BS-125' }, // 2001 Roberto Alomar
      { slot: '3B', cardId: '2000-BS-236' }, // 2000 Jeff Cirillo (base set, MIL)
      { slot: 'C', cardId: '2000-BS-395' }, // 2000 Tom Lampkin
      { slot: '1B', cardId: '2002-BS-186' }, // 2002 Richie Sexson
    ],
    rotation: [
      '2000-BS-24', // 2000 Randy Johnson
      '2000-BS-340', // 2000 Curt Schilling
      '2003-BS-266', // 2003 Jamie Moyer
      '2000-PR-22', // 2000 Ramon Martinez
      '2003-BS-268', // 2003 Joel Pineiro
    ],
    bullpen: [
      '2001-BS-398', // 2001 Kazuhiro Sasaki
      '2004-TD-63', // 2004 Rafael Soriano
      '2000-BS-202', // 2000 Billy Wagner
      '2002-BS-301', // 2002 Jeff Nelson
      '2000-BS-444', // 2000 Mike Venafro
      '2001-BS-244', // 2001 Dave Weathers
    ],
    bench: [],
  },
];

export const SAVED_TEAMS_BY_ID: Record<string, SavedTeam> = Object.fromEntries(SAVED_TEAMS.map((team) => [team.id, team]));

/** A saved team ready to play, waved past the cap. */
export function savedTeamDraft(team: SavedTeam): TeamDraft {
  return {
    name: team.name,
    code: team.code,
    capExempt: true,
    savedTeam: team.id,
    lineup: team.lineup.map((entry) => ({ ...entry })),
    rotation: [...team.rotation],
    bullpen: [...team.bullpen],
    bench: [...team.bench],
  };
}
