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
  {
    id: 'timberjacks',
    name: 'Timberjacks',
    lineup: [
      { slot: 'SS', cardId: '2002-BS-2' }, // 2002 David Eckstein
      { slot: 'LF', cardId: '2000-BS-285' }, // 2000 Rickey Henderson
      { slot: '3B', cardId: '2001-BS-68' }, // 2001 Nomar Garciaparra, a SS card: out of position, -1
      { slot: 'C', cardId: '2000-BS-441' }, // 2000 Ivan Rodriguez
      { slot: 'RF', cardId: '2001-BS-2' }, // 2001 Darin Erstad
      { slot: '1B', cardId: '2001-BS-107' }, // 2001 Frank Thomas, a DH card: out of position, -2
      { slot: 'DH', cardId: '2000-BS-237' }, // 2000 Marquis Grissom
      { slot: '2B', cardId: '2001-BS-143' }, // 2001 Jeff Frye
      { slot: 'CF', cardId: '2001-PR-17' }, // 2001 Juan Pierre
    ],
    rotation: [
      '2004-BS-247', // 2004 Mark Mulder (base set)
      '2003-BS-224', // 2003 Barry Zito
      '2004-BS-245', // 2004 Tim Hudson
      '2000-BS-195', // 2000 Mike Hampton (base set, HOU)
      '2000-PR-15', // 2000 Terry Mulholland
    ],
    bullpen: [
      '2000-PR-31', // 2000 Keith Foulke
      '2002-BS-244', // 2002 Jason Isringhausen (base set, OAK)
      '2000-BS-447', // 2000 Jeff Zimmerman
      '2002-BS-264', // 2002 Josias Manzanillo
      '2000-PR-106', // 2000 Jason Christiansen
      '2000-BS-219', // 2000 Pedro Borbon
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
