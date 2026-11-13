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
  /**
   * In batting order. A spot can be platooned: whoever of cardId and platoonWith
   * bats from the other side of the opposing starter plays, the other sits.
   */
  lineup: { slot: LineupSlot; cardId: string; platoonWith?: string }[];
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
      { slot: 'DH', cardId: '2000-BS-396' }, // 2000 Edgar Martinez
      { slot: 'CF', cardId: '2000-BS-391' }, // 2000 Ken Griffey Jr. (SEA)
      { slot: 'LF', cardId: '2000-BS-156' }, // 2000 Larry Walker
      { slot: 'SS', cardId: '2001-BS-397' }, // 2001 Alex Rodriguez (SEA)
      { slot: '1B', cardId: '2002-BS-186' }, // 2002 Richie Sexson
      { slot: '2B', cardId: '2001-BS-125' }, // 2001 Roberto Alomar
      { slot: 'C', cardId: '2000-BS-395' }, // 2000 Tom Lampkin
      { slot: '3B', cardId: '2000-BS-236' }, // 2000 Jeff Cirillo (base set, MIL)
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
      { slot: '3B', cardId: '2001-BS-68' }, // 2001 Nomar Garciaparra, a SS card: infield, so +0 at 3B
      { slot: 'C', cardId: '2000-BS-441' }, // 2000 Ivan Rodriguez
      { slot: 'RF', cardId: '2001-BS-2' }, // 2001 Darin Erstad
      { slot: '1B', cardId: '2001-BS-107' }, // 2001 Frank Thomas, a DH card: DH can play 1B at +0
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
  {
    id: 'hanging-chads',
    name: 'Hanging Chads',
    lineup: [
      { slot: '2B', cardId: '2000-BS-326' }, // 2000 Randy Velarde
      { slot: 'SS', cardId: '2000-BS-301' }, // 2000 Derek Jeter
      { slot: 'RF', cardId: '2000-BS-455' }, // 2000 Shawn Green (base set, TOR)
      { slot: 'DH', cardId: '2000-BS-347' }, // 2000 Brian Giles
      { slot: '1B', cardId: '2001-BS-145' }, // 2001 Todd Helton
      { slot: '3B', cardId: '2002-BS-228' }, // 2002 Tino Martinez (base set, NYY), a 1B card: infield, +0 at 3B
      { slot: 'CF', cardId: '2001-BS-306' }, // 2001 Bernie Williams
      { slot: 'C', cardId: '2001-BS-303' }, // 2001 Jorge Posada
      // 2000 Paul O'Neill (L) against right-handers, 2000 Chad Curtis (R) against lefties
      { slot: 'LF', cardId: '2000-BS-306', platoonWith: '2000-BS-298' },
    ],
    rotation: [
      '2000-BS-220', // 2000 Kevin Brown
      '2002-BS-231', // 2002 Andy Pettitte
      '2001-BS-57', // 2001 Mike Mussina (base set, BAL)
      '2002-PR-75', // 2002 Kazuhisa Ishii (Pennant Run; there's no base-set card)
      '2000-BS-5', // 2000 Chuck Finley (base set, ANA)
    ],
    bullpen: [
      '2000-BS-376', // 2000 Alan Embree
      '2002-BS-64', // 2002 Jeff Fassero
      '2002-BS-181', // 2002 Chad Fox
      '2002-BS-233', // 2002 Mariano Rivera
      '2001-PR-45', // 2001 Dan Miceli
      '2001-PR-69', // 2001 Lance Painter
    ],
    bench: [],
  },
  {
    id: 'wiffleballers',
    name: 'Wiffleballers',
    lineup: [
      { slot: 'LF', cardId: '2005-BS-184' }, // 2005 Scott Podsednik (base set, MIL), a CF card: outfield, +0 in LF
      { slot: 'RF', cardId: '2000-BS-327' }, // 2000 Bobby Abreu
      { slot: '3B', cardId: '2000-BS-37' }, // 2000 Chipper Jones
      { slot: '1B', cardId: '2000-PR-12' }, // 2000 Andres Galarraga
      { slot: 'CF', cardId: '2001-BS-36' }, // 2001 Andruw Jones
      { slot: 'DH', cardId: '2002-BS-91' }, // 2002 Adam Dunn (base set)
      { slot: 'C', cardId: '2002-BS-173' }, // 2002 Paul Lo Duca
      { slot: '2B', cardId: '2002-BS-27' }, // 2002 Marcus Giles (base set)
      { slot: 'SS', cardId: '2004-BS-24' }, // 2004 Rafael Furcal
    ],
    rotation: [
      '2000-BS-71', // 2000 Pedro Martinez
      '2003-BS-12', // 2003 Jarrod Washburn
      '2001-BS-42', // 2001 Greg Maddux
      '2000-PR-29', // 2000 Kerry Wood
      '2000-BS-258', // 2000 Brad Radke
    ],
    bullpen: [
      '2005-BS-136', // 2005 Tim Spooneybarger
      '2000-BS-273', // 2000 Ugueth Urbina
      '2002-TD-150', // 2002 John Smoltz (Trading Deadline reliever card; no base-set card)
      '2004-BS-77', // 2004 Tom Gordon (base set, CHW)
      '2000-BS-457', // 2000 Billy Koch
      '2002-TD-141', // 2002 Jorge Julio
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
    lineup: team.lineup.map(({ slot, cardId }) => ({ slot, cardId })),
    rotation: [...team.rotation],
    bullpen: [...team.bullpen],
    bench: [...team.bench, ...team.lineup.flatMap((entry) => (entry.platoonWith ? [entry.platoonWith] : []))],
    platoons: team.lineup.flatMap((entry) => (entry.platoonWith ? [[entry.cardId, entry.platoonWith] as [string, string]] : [])),
  };
}
