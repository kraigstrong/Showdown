// Teams we play with over and over, kept exactly as built. They can run over the
// point cap and use cards from after 2001; those cards' charts stop at 20.
// A card from another year also needs its id in OTHER_YEAR_CARDS in
// scripts/build-cards.mjs, then `npm run cards`.
import { CARDS_BY_ID } from '../data/catalog';
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
      '2004-PR-31', // 2004 Mark Mulder (Pennant Run, Control 5)
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
  {
    id: 'peacemakers',
    name: 'Peacemakers',
    lineup: [
      { slot: 'LF', cardId: '2005-BS-95' }, // 2005 Coco Crisp, a CF card: outfield, +0 in LF
      { slot: 'RF', cardId: '2000-BS-409' }, // 2000 Ray Lankford
      { slot: 'DH', cardId: '2000-BS-228' }, // 2000 Gary Sheffield
      { slot: 'C', cardId: '2001-BS-283' }, // 2001 Mike Piazza
      { slot: 'SS', cardId: '2001-BS-321' }, // 2001 Miguel Tejada
      { slot: '3B', cardId: '2001-BS-308' }, // 2001 Eric Chavez
      { slot: '1B', cardId: '2001-BS-50' }, // 2001 Jeff Conine, 3B/LF-RF card: infield, +0 at 1B
      { slot: 'CF', cardId: '2004-BS-347' }, // 2004 Vernon Wells
      { slot: '2B', cardId: '2000-BS-221' }, // 2000 Mark Grudzielanek, a SS card: infield, +0 at 2B
    ],
    rotation: [
      '2002-PR-29', // 2002 Vicente Padilla (Pennant Run; there's no base-set card)
      '2000-PR-23', // 2000 Bret Saberhagen
      '2005-TD-30', // 2005 Rich Harden (Trading Deadline)
      '2000-BS-257', // 2000 Eric Milton
      '2002-BS-152', // 2002 Roy Oswalt
    ],
    bullpen: [
      '2004-BS-184', // 2004 Paul Quantrill (base set, LAD)
      '2000-BS-44', // 2000 Mike Remlinger
      '2000-BS-227', // 2000 Jeff Shaw
      '2002-PR-121', // 2002 Trevor Hoffman (Super Season)
      '2000-BS-132', // 2000 Mike Jackson
      '2004-BS-198', // 2004 LaTroy Hawkins (base set, MIN)
    ],
    bench: [
      '2000-BS-446', // 2000 Todd Zeile (base set, TEX)
    ],
  },
  {
    id: 'front-street-bombers',
    name: 'Front Street Bombers',
    lineup: [
      { slot: '2B', cardId: '2000-BS-369' }, // 2000 Quilvio Veras
      { slot: 'SS', cardId: '2001-BS-375' }, // 2001 Jeff Kent, a 2B card: infield, +0 at SS
      { slot: 'LF', cardId: '2000-BS-374' }, // 2000 Barry Bonds
      { slot: '1B', cardId: '2001-BS-409' }, // 2001 Mark McGwire
      { slot: 'RF', cardId: '2001-BS-296' }, // 2001 David Justice
      { slot: '3B', cardId: '2000-BS-16' }, // 2000 Jay Bell, a 2B card: infield, +0 at 3B
      { slot: 'DH', cardId: '2001-BS-233' }, // 2001 Jeromy Burnitz
      { slot: 'C', cardId: '2000-PR-13' }, // 2000 Javy Lopez
      { slot: 'CF', cardId: '2001-PR-118' }, // 2001 Timoniel Perez, a LF/RF card: outfield, +0 in CF
    ],
    rotation: [
      '2000-BS-200', // 2000 Shane Reynolds
      '2000-BS-462', // 2000 David Wells
      '2003-BS-34', // 2003 Kevin Millwood (base set, ATL)
      '2002-BS-151', // 2002 Wade Miller
      '2000-BS-392', // 2000 John Halama
    ],
    bullpen: [
      '2000-BS-10', // 2000 Troy Percival
      '2001-PR-94', // 2001 Mike Fetters
      '2000-PR-93', // 2000 Jason Grimsley
      '2000-BS-321', // 2000 Doug Jones
      '2001-BS-318', // 2001 Jim Mecir
      '2004-BS-97', // 2004 Danys Baez (base set, CLE)
    ],
    bench: [],
  },
  {
    id: 'homestead-grays',
    name: 'Homestead Grays',
    lineup: [
      { slot: 'SS', cardId: '2000-BS-140' }, // 2000 Omar Vizquel
      { slot: 'RF', cardId: '2003-BS-16' }, // 2003 Steve Finley, a CF card: outfield, +0 in RF
      { slot: 'LF', cardId: '2001-PR-158' }, // 2001 Tony Gwynn
      { slot: '1B', cardId: '2000-BS-315' }, // 2000 Jason Giambi
      { slot: '2B', cardId: '2000-BS-278' }, // 2000 Edgardo Alfonzo
      { slot: '3B', cardId: '2001-BS-274' }, // 2001 Jose Vidro, a 2B card: infield, +0 at 3B
      { slot: 'C', cardId: '2004-BS-93' }, // 2004 Jason LaRue
      { slot: 'DH', cardId: '2001-BS-402' }, // 2001 Will Clark
      { slot: 'CF', cardId: '2001-BS-317' }, // 2001 Terrence Long
    ],
    rotation: [
      '2004-BS-226', // 2004 Roger Clemens (base set, NYY)
      '2004-BS-68', // 2004 Mark Prior
      '2004-BS-132', // 2004 Josh Beckett
      '2004-TD-110', // 2004 Tom Glavine (Trading Deadline Super Season)
      '2001-BS-234', // 2001 Jeff D'Amico
    ],
    bullpen: [
      '2000-BS-124', // 2000 Scott Williamson
      '2001-BS-379', // 2001 Robb Nen
      '2001-BS-153', // 2001 Gabe White
      '2001-BS-67', // 2001 Rich Garces
      '2000-BS-63', // 2000 Mike Timlin
      '2000-BS-76', // 2000 Pat Rapp (his only 2000 card is a starter, IP 5: a long man here)
    ],
    bench: [],
  },
  {
    id: 'aviators',
    name: 'Aviators',
    lineup: [
      { slot: 'SS', cardId: '2001-BS-278' }, // 2001 Mike Bordick (base set, NYM)
      { slot: 'LF', cardId: '2000-BS-145' }, // 2000 Dante Bichette (base set, COL)
      { slot: '1B', cardId: '2000-BS-440' }, // 2000 Rafael Palmeiro, a DH card: DH can play 1B at +0
      { slot: 'DH', cardId: '2000-BS-51' }, // 2000 Albert Belle
      { slot: '3B', cardId: '2000-BS-39' }, // 2000 Ryan Klesko (base set, ATL), a LF/RF and 1B card: infield, +0 at 3B
      { slot: 'RF', cardId: '2000-BS-316' }, // 2000 Ben Grieve
      { slot: 'CF', cardId: '2000-BS-238' }, // 2000 Geoff Jenkins, a LF/RF card: outfield, +0 in CF
      { slot: 'C', cardId: '2000-BS-380' }, // 2000 Brent Mayne (base set, SFG)
      { slot: '2B', cardId: '2001-PR-51' }, // 2001 Todd Walker
    ],
    rotation: [
      '2000-PR-37', // 2000 Denny Neagle
      '2005-TD-110', // 2005 Odalis Perez (Trading Deadline)
      '2001-BS-227', // 2001 Chan Ho Park
      '2000-PR-57', // 2000 Alex Fernandez
      '2000-BS-384', // 2000 Kirk Rueter
    ],
    bullpen: [
      '2001-PR-4', // 2001 Aaron Fultz
      '2000-BS-293', // 2000 Turk Wendell
      '2004-PR-39', // 2004 Mike Stanton (Pennant Run)
      '2001-BS-24', // 2001 Matt Mantei
      '2001-BS-78', // 2001 Rick Aguilera
      '2000-PR-14', // 2000 Kevin McGlinchy
    ],
    bench: [],
  },
  {
    id: 'railroaders',
    name: 'Railroaders',
    lineup: [
      { slot: '2B', cardId: '2000-BS-233' }, // 2000 Ron Belliard
      { slot: 'LF', cardId: '2000-BS-244' }, // 2000 Alex Ochoa
      { slot: 'RF', cardId: '2001-BS-193' }, // 2001 Richard Hidalgo
      { slot: 'DH', cardId: '2001-BS-135' }, // 2001 Manny Ramirez (base set, CLE)
      { slot: '3B', cardId: '2000-BS-14' }, // 2000 Mo Vaughn, a 1B card: infield, +0 at 3B
      { slot: '1B', cardId: '2000-BS-288' }, // 2000 John Olerud (base set, NYM)
      { slot: 'C', cardId: '2001-BS-314' }, // 2001 Ramon Hernandez
      { slot: 'SS', cardId: '2000-BS-427' }, // 2000 Kevin Stocker
      { slot: 'CF', cardId: '2000-BS-69' }, // 2000 Darren Lewis
    ],
    rotation: [
      '2001-BS-85', // 2001 Jon Lieber
      '2003-PR-67', // 2003 Livan Hernandez (Pennant Run)
      '2000-BS-115', // 2000 Pete Harnisch
      '2000-BS-353', // 2000 Jason Schmidt
      '2000-BS-286', // 2000 Orel Hershiser
    ],
    bullpen: [
      '2000-BS-445', // 2000 John Wetteland
      '2000-BS-246', // 2000 Bob Wickman
      '2000-BS-346', // 2000 Brad Clontz
      '2001-BS-455', // 2001 Mark Guthrie (base set, TOR)
      '2001-BS-365', // 2001 Kevin Walker
      '2004-BS-256', // 2004 Rheal Cormier
    ],
    bench: [
      '2001-BS-19', // 2001 Greg Colbrunn
      '2002-BS-218', // 2002 Rey Ordonez (base set, NYM)
    ],
  },
  {
    id: 'big-ws',
    name: "Big W's",
    lineup: [
      { slot: 'CF', cardId: '2000-BS-333' }, // 2000 Doug Glanville
      { slot: 'DH', cardId: '2000-BS-356' }, // 2000 Kevin Young, listed in RF, but his card is 1B only: he hits as DH
      { slot: 'RF', cardId: '2000-BS-375' }, // 2000 Ellis Burks, listed at DH, plays RF in Young's place
      { slot: 'LF', cardId: '2001-BS-185' }, // 2001 Moises Alou
      { slot: '3B', cardId: '2001-PR-140' }, // 2001 Ken Caminiti
      { slot: 'C', cardId: '2000-BS-336' }, // 2000 Mike Lieberthal
      { slot: 'SS', cardId: '2001-BS-132' }, // 2001 Travis Fryman, a 3B card: infield, +0 at SS
      { slot: '1B', cardId: '2000-BS-330' }, // 2000 Rico Brogna
      { slot: '2B', cardId: '2000-BS-232' }, // 2000 Eric Young (base set, LAD)
    ],
    rotation: [
      '2004-TD-99', // 2004 Bartolo Colon (Trading Deadline)
      '2000-BS-360', // 2000 Sterling Hitchcock
      '2002-BS-209', // 2002 Javier Vazquez
      '2005-BS-163', // 2005 Wilson Alvarez (base set, LAD)
      '2004-BS-112', // 2004 Shawn Chacon (base set, COL)
    ],
    bullpen: [
      '2002-BS-108', // 2002 Paul Shuey (base set, CLE)
      '2000-BS-279', // 2000 Armando Benitez
      '2000-BS-100', // 2000 Bob Howry
      '2000-BS-168', // 2000 Brian Moehler (a starter card, IP 6: a long man here)
      '2000-BS-260', // 2000 Mike Trombley (base set, MIN)
      '2000-BS-169', // 2000 C.J. Nitkowski
    ],
    bench: [
      '2000-BS-178', // 2000 Alex Gonzalez (base set, FLA; the 2000 Pennant Run Alex Gonzalez is Alex S. Gonzalez of TOR)
    ],
  },
  {
    id: 'ninja-turtles',
    name: 'Ninja Turtles',
    lineup: [
      { slot: 'CF', cardId: '2002-BS-156' }, // 2002 Carlos Beltran (base set, KCR)
      { slot: 'RF', cardId: '2000-PR-117' }, // 2000 Al Martin (Pennant Run)
      { slot: 'LF', cardId: '2000-BS-91' }, // 2000 Henry Rodriguez
      { slot: '1B', cardId: '2000-BS-320' }, // 2000 John Jaha, a DH card: DH can play 1B at +0
      { slot: '3B', cardId: '2000-BS-292' }, // 2000 Robin Ventura
      { slot: 'C', cardId: '2000-BS-119' }, // 2000 Eddie Taubensee
      { slot: 'SS', cardId: '2000-BS-82' }, // 2000 Jeff Blauser
      { slot: '2B', cardId: '2001-BS-160' }, // 2001 Damion Easley
      { slot: 'DH', cardId: '2000-PR-55' }, // 2000 Luis Polonia
    ],
    rotation: [
      '2000-BS-198', // 2000 Jose Lima
      '2003-PR-107', // 2003 Pat Hentgen (Pennant Run Super Season)
      '2004-PR-41', // 2004 Steve Trachsel (Pennant Run)
      '2001-BS-88', // 2001 Kevin Tapani
      '2000-PR-10', // 2000 Todd Stottlemyre
    ],
    bullpen: [
      '2000-PR-43', // 2000 Steve Reed
      '2000-PR-101', // 2000 Mike Magnante
      '2000-BS-27', // 2000 Dan Plesac
      '2000-BS-55', // 2000 Scott Erickson (a starter card, IP 7: a long man here)
      '2002-TD-119', // 2002 Steve Karsay (Trading Deadline)
      '2000-BS-58', // 2000 Jesse Orosco
    ],
    bench: [
      '2000-BS-363', // 2000 Wally Joyner
    ],
  },
  {
    id: 'hot-gloves',
    name: 'Hot Gloves',
    lineup: [
      { slot: '2B', cardId: '2002-BS-260' }, // 2002 Jimmy Rollins (base set, PHI), a SS card: infield, +0 at 2B
      { slot: 'CF', cardId: '2002-BS-278' }, // 2002 Mark Kotsay (base set, SDP)
      { slot: '1B', cardId: '2002-BS-182' }, // 2002 Jose Hernandez (base set, MIL), a SS card: infield, +0 at 1B
      { slot: 'RF', cardId: '2000-BS-367' }, // 2000 Reggie Sanders (base set, SDP)
      { slot: 'DH', cardId: '2000-BS-127' }, // 2000 Harold Baines (base set, CLE)
      { slot: '3B', cardId: '2001-BS-368' }, // 2001 Rich Aurilia, a SS card: infield, +0 at 3B
      { slot: 'C', cardId: '2004-BS-312' }, // 2004 Mike Matheny
      { slot: 'LF', cardId: '2000-BS-428' }, // 2000 Bubba Trammell, listed on the bench, plays LF: Womack's 2002 card is SS only
      { slot: 'SS', cardId: '2002-BS-76' }, // 2002 Royce Clayton
    ],
    rotation: [
      '2002-PR-1', // 2002 J.C. Romero (Pennant Run)
      '2002-BS-129', // 2002 Steve Sparks
      '2003-BS-76', // 2003 Mark Buehrle
      '2005-BS-305', // 2005 Chris Carpenter (base set, STL)
      '2000-PR-8', // 2000 Armando Reynoso
    ],
    bullpen: [
      '2001-BS-165', // 2001 Todd Jones
      '2004-TD-90', // 2004 Francisco Rodriguez (Trading Deadline)
      '2002-BS-63', // 2002 Kyle Farnsworth
      '2002-BS-84', // 2002 Sean Lowe (base set, CHW)
      '2000-BS-123', // 2000 Ron Villone (a starter card, IP 6: a long man here)
      '2000-BS-331', // 2000 Paul Byrd (a starter card, IP 6: a long man here)
    ],
    bench: [
      '2002-BS-26', // 2002 Tony Womack, listed in LF, but his card is SS only
      '2002-BS-37', // 2002 Rey Sanchez (base set, ATL)
    ],
  },
  {
    id: 'swashbucklers',
    name: 'Swashbucklers',
    lineup: [
      { slot: 'SS', cardId: '2000-BS-116' }, // 2000 Barry Larkin
      { slot: 'DH', cardId: '2001-BS-101' }, // 2001 Magglio Ordonez
      { slot: 'LF', cardId: '2001-BS-264' }, // 2001 Vladimir Guerrero
      { slot: '1B', cardId: '2000-BS-451' }, // 2000 Carlos Delgado
      { slot: 'C', cardId: '2001-PR-101' }, // 2001 Charles Johnson (Pennant Run)
      { slot: 'CF', cardId: '2000-BS-276' }, // 2000 Rondell White
      { slot: 'RF', cardId: '2000-BS-225' }, // 2000 Raul Mondesi (base set, LAD)
      { slot: '3B', cardId: '2000-BS-170' }, // 2000 Dean Palmer
      { slot: '2B', cardId: '2000-PR-133' }, // 2000 Fernando Vina
    ],
    rotation: [
      '2003-PR-101', // 2003 Esteban Loaiza (Pennant Run)
      '2003-TD-122', // 2003 Tim Wakefield (Trading Deadline)
      '2003-PR-82', // 2003 Kyle Lohse (Pennant Run)
      '2001-BS-281', // 2001 Al Leiter
      '2004-BS-141', // 2004 Mark Redman
    ],
    bullpen: [
      '2001-BS-148', // 2001 Jose Jimenez
      '2002-BS-312', // 2002 Steve Kline
      '2004-TD-83', // 2004 Chad Cordero (Trading Deadline)
      '2000-BS-11', // 2000 Mark Petkovsek
      '2001-BS-382', // 2001 Felix Rodriguez
      '2000-BS-458', // 2000 Graeme Lloyd
    ],
    bench: [
      '2000-BS-350', // 2000 Warren Morris
    ],
  },
  {
    id: 'los-gatos',
    name: 'Los Gatos',
    lineup: [
      { slot: '2B', cardId: '2000-BS-175' }, // 2000 Luis Castillo
      { slot: '1B', cardId: '2000-BS-187' }, // 2000 Jeff Bagwell
      { slot: 'CF', cardId: '2001-BS-404' }, // 2001 Jim Edmonds
      { slot: 'LF', cardId: '2000-BS-434' }, // 2000 Juan Gonzalez (base set, TEX)
      { slot: '3B', cardId: '2001-BS-414' }, // 2001 Fernando Tatis (base set, STL)
      { slot: 'DH', cardId: '2000-BS-139' }, // 2000 Jim Thome
      { slot: 'RF', cardId: '2001-BS-438' }, // 2001 Rusty Greer
      { slot: 'C', cardId: '2001-BS-232' }, // 2001 Henry Blanco
      { slot: 'SS', cardId: '2000-BS-189' }, // 2000 Craig Biggio, a 2B card: infield, +0 at SS
    ],
    rotation: [
      '2005-BS-196', // 2005 Ben Sheets
      '2002-PR-10', // 2002 Jose Rijo (Pennant Run; there's no base-set card)
      '2003-PR-87', // 2003 Zach Day (Pennant Run)
      '2003-BS-276', // 2003 Matt Morris
      '2000-BS-297', // 2000 David Cone
    ],
    bullpen: [
      '2001-PR-50', // 2001 Ramiro Mendoza
      '2001-BS-289', // 2001 Rick White
      '2000-PR-70', // 2000 Terry Adams
      '2001-PR-31', // 2001 Scott Strickland
      '2001-PR-43', // 2001 Rod Beck
      '2004-BS-165', // 2004 Curtis Leskanic
    ],
    bench: [],
  },
  {
    id: 'pachyderms',
    name: 'Pachyderms',
    lineup: [
      { slot: 'CF', cardId: '2000-BS-134' }, // 2000 Kenny Lofton
      { slot: 'C', cardId: '2000-BS-348' }, // 2000 Jason Kendall
      { slot: 'LF', cardId: '2001-BS-202' }, // 2001 Johnny Damon (base set, KCR)
      { slot: '1B', cardId: '2001-BS-4' }, // 2001 Troy Glaus, a 3B card: infield, +0 at 1B
      { slot: 'RF', cardId: '2001-BS-164' }, // 2001 Bobby Higginson
      { slot: '3B', cardId: '2001-BS-335' }, // 2001 Scott Rolen
      { slot: 'DH', cardId: '2001-BS-11' }, // 2001 Tim Salmon
      { slot: '2B', cardId: '2000-BS-73' }, // 2000 Jose Offerman
      { slot: 'SS', cardId: '2001-BS-393' }, // 2001 Mark McLemore, a 2B card: infield, +0 at SS
    ],
    rotation: [
      '2002-TD-118', // 2002 Roy Halladay (Trading Deadline; no base-set card, and his Pennant Run card is nearly the same)
      '2004-PR-53', // 2004 Kenny Rogers (Pennant Run, All-Star edition)
      '2002-BS-319', // 2002 Bud Smith
      '2003-PR-84', // 2003 Gil Meche (Pennant Run)
      '2002-BS-284', // 2002 Shawn Estes (base set, SFG)
    ],
    bullpen: [
      '2000-BS-262', // 2000 Bob Wells
      '2001-BS-84', // 2001 Felix Heredia
      '2001-BS-109', // 2001 Kelly Wunsch
      '2002-BS-92', // 2002 Danny Graves
      '2002-BS-106', // 2002 Ricardo Rincon
      '2002-PR-92', // 2002 John Franco (Pennant Run Super Season)
    ],
    bench: [],
  },
  {
    id: 'upper-deckers',
    name: 'Upper Deckers',
    lineup: [
      { slot: 'DH', cardId: '2001-BS-253' }, // 2001 Matt Lawton
      { slot: '2B', cardId: '2001-BS-249' }, // 2001 Denny Hocking
      { slot: 'LF', cardId: '2001-BS-350' }, // 2001 John Vander Wal
      { slot: 'RF', cardId: '2001-BS-423' }, // 2001 Jose Guillen
      { slot: '1B', cardId: '2000-PR-7' }, // 2000 Erubiel Durazo
      { slot: '3B', cardId: '2001-BS-213' }, // 2001 Mike Sweeney, a 1B card: infield, +0 at 3B
      { slot: 'CF', cardId: '2001-BS-282' }, // 2001 Jay Payton
      { slot: 'C', cardId: '2001-BS-284' }, // 2001 Todd Pratt
      { slot: 'SS', cardId: '2001-BS-359' }, // 2001 Damian Jackson
    ],
    rotation: [
      '2001-PR-54', // 2001 Tony Armas Jr.
      '2001-BS-439', // 2001 Rick Helling
      '2001-BS-426', // 2001 Albie Lopez
      '2000-BS-18', // 2000 Omar Daal
      '2001-BS-451', // 2001 Kelvim Escobar
    ],
    bullpen: [
      '2004-BS-155', // 2004 Brad Lidge
      '2002-BS-121', // 2002 Matt Anderson
      '2001-PR-90', // 2001 Onan Masaoka
      '2000-PR-79', // 2000 Hector Carrasco (Pennant Run)
      '2001-PR-79', // 2001 Justin Speier (Pennant Run)
      '2002-TD-148', // 2002 Satoru Komiyama (Trading Deadline)
    ],
    bench: [
      '2001-BS-363', // 2001 Desi Relaford
    ],
  },
  {
    id: 'cracker-jax',
    name: 'Cracker Jax',
    lineup: [
      { slot: 'LF', cardId: '2001-BS-403' }, // 2001 J.D. Drew
      { slot: 'CF', cardId: '2001-BS-66' }, // 2001 Carl Everett
      { slot: 'DH', cardId: '2000-PR-66' }, // 2000 Mark Quinn (Pennant Run)
      { slot: '1B', cardId: '2000-BS-425' }, // 2000 Fred McGriff
      { slot: 'RF', cardId: '2001-BS-21' }, // 2001 Luis Gonzalez
      { slot: '3B', cardId: '2000-BS-30' }, // 2000 Matt Williams
      { slot: '2B', cardId: '2000-PR-134' }, // 2000 Vinny Castilla (Pennant Run), a 3B card: infield, +0 at 2B
      { slot: 'C', cardId: '2001-BS-156' }, // 2001 Brad Ausmus (base set, DET)
      { slot: 'SS', cardId: '2000-BS-448' }, // 2000 Tony Batista (base set, TOR)
    ],
    rotation: [
      '2000-BS-357', // 2000 Andy Ashby
      '2003-TD-120', // 2003 Orlando Hernandez (Trading Deadline)
      '2005-TD-141', // 2005 Woody Williams (Trading Deadline)
      '2000-BS-215', // 2000 Jeff Suppan
      '2003-PR-58', // 2003 Ted Lilly (Pennant Run)
    ],
    bullpen: [
      '2001-BS-89', // 2001 Todd Van Poppel
      '2000-BS-433', // 2000 Tim Crabtree
      '2002-BS-180', // 2002 Mike DeJean
      '2001-BS-396', // 2001 Arthur Rhodes
      '2000-BS-351', // 2000 Todd Ritchie (a starter card, IP 7: a long man here)
      '2001-PR-9', // 2001 Eddie Guardado (Pennant Run)
    ],
    bench: [],
  },
  {
    id: 'interstellars',
    name: 'Interstellars',
    lineup: [
      { slot: 'SS', cardId: '2000-BS-302' }, // 2000 Chuck Knoblauch, a 2B card: infield, +0 at SS
      { slot: '2B', cardId: '2000-BS-98' }, // 2000 Ray Durham
      { slot: 'DH', cardId: '2001-BS-87' }, // 2001 Sammy Sosa
      { slot: '3B', cardId: '2001-BS-361' }, // 2001 Phil Nevin
      { slot: 'RF', cardId: '2000-BS-122' }, // 2000 Greg Vaughn (base set, CIN)
      { slot: 'CF', cardId: '2000-BS-373' }, // 2000 Marvin Benard
      { slot: 'C', cardId: '2001-PR-151' }, // 2001 Todd Hundley (Pennant Run)
      { slot: '1B', cardId: '2001-BS-384' }, // 2001 J.T. Snow
      { slot: 'LF', cardId: '2001-BS-48' }, // 2001 Brady Anderson
    ],
    rotation: [
      '2000-BS-318', // 2000 Gil Heredia
      '2005-BS-280', // 2005 Jake Peavy
      '2000-BS-108', // 2000 Mike Sirotka
      '2000-BS-211', // 2000 Jose Rosado
      '2000-BS-128', // 2000 Dave Burba
    ],
    bullpen: [
      '2000-BS-45', // 2000 John Rocker
      '2004-BS-80', // 2004 Damaso Marte
      '2000-BS-352', // 2000 Scott Sauerbeck
      '2001-PR-27', // 2001 Mark Wohlers (Pennant Run)
      '2000-BS-29', // 2000 Greg Swindell
      '2000-BS-337', // 2000 Steve Montgomery
    ],
    bench: [
      '2001-BS-118', // 2001 Pokey Reese
    ],
  },
  {
    id: 'dinos',
    name: 'Dinos',
    lineup: [
      { slot: 'CF', cardId: '2000-BS-385' }, // 2000 F.P. Santangelo
      { slot: '1B', cardId: '2000-BS-85' }, // 2000 Mark Grace
      { slot: '3B', cardId: '2001-BS-216' }, // 2001 Adrian Beltre
      { slot: 'RF', cardId: '2000-BS-324' }, // 2000 Matt Stairs
      { slot: 'DH', cardId: '2001-BS-53' }, // 2001 Trenidad Hubbard
      { slot: '2B', cardId: '2001-BS-176' }, // 2001 Derrek Lee, a 1B card: infield, +0 at 2B
      { slot: 'LF', cardId: '2000-BS-74' }, // 2000 Troy O'Leary
      { slot: 'C', cardId: '2001-BS-452' }, // 2001 Darrin Fletcher
      { slot: 'SS', cardId: '2000-BS-354' }, // 2000 Ed Sprague, a 3B card: infield, +0 at SS
    ],
    rotation: [
      '2002-BS-49', // 2002 Josh Towers
      '2005-TD-134', // 2005 Matt Clement (Trading Deadline)
      '2000-BS-17', // 2000 Andy Benes
      '2001-BS-172', // 2001 Ryan Dempster
      '2000-BS-167', // 2000 Dave Mlicki (listed as Doug; the 2000 card is Dave)
    ],
    bullpen: [
      '2003-TD-108', // 2003 Johan Santana (Trading Deadline)
      '2002-TD-116', // 2002 Victor Zambrano (Trading Deadline)
      '2002-PR-6', // 2002 Shigetoshi Hasegawa (Pennant Run)
      '2000-BS-118', // 2000 Scott Sullivan
      '2002-PR-36', // 2002 Ryan Drese (Pennant Run)
      '2002-BS-256', // 2002 Nelson Figueroa (a starter card, IP 6: a long man here)
    ],
    bench: [
      '2000-BS-461', // 2000 Shannon Stewart
      '2000-BS-295', // 2000 Scott Brosius
      '2000-BS-240', // 2000 Mark Loretta
      '2000-BS-102', // 2000 Carlos Lee
      '2000-BS-22', // 2000 Bernard Gilkey
    ],
  },
  {
    id: 'smoke-jumpers',
    name: 'Smoke Jumpers',
    lineup: [
      { slot: 'DH', cardId: '2001-PR-159' }, // 2001 Roger Cedeno (Pennant Run)
      { slot: 'CF', cardId: '2001-BS-388' }, // 2001 Mike Cameron
      { slot: 'RF', cardId: '2002-ASG-1' }, // 2002 Garret Anderson (All-Star Game)
      { slot: '1B', cardId: '2001-BS-325' }, // 2001 Pat Burrell
      { slot: '3B', cardId: '2001-BS-99' }, // 2001 Paul Konerko, a 1B card: infield, +0 at 3B
      { slot: 'SS', cardId: '2001-BS-207' }, // 2001 Joe Randa, a 3B card: infield, +0 at SS
      { slot: 'C', cardId: '2001-BS-226' }, // 2001 Chad Kreuter
      { slot: '2B', cardId: '2001-BS-196' }, // 2001 Julio Lugo
      { slot: 'LF', cardId: '2001-BS-157' }, // 2001 Rich Becker
    ],
    rotation: [
      '2001-PR-122', // 2001 Frank Castillo (Pennant Run)
      '2001-BS-182', // 2001 Jesus Sanchez
      '2002-BS-10', // 2002 Scott Schoeneweis
      '2001-BS-401', // 2001 Rick Ankiel
      '2001-BS-340', // 2001 Kris Benson
    ],
    bullpen: [
      '2002-TD-117', // 2002 Jose Mesa (Trading Deadline)
      '2003-PR-47', // 2003 D.J. Carrasco (Pennant Run)
      '2003-PR-20', // 2003 Chris Hammond (Pennant Run)
      '2003-PR-40', // 2003 Francisco Cordero (Pennant Run)
      '2003-PR-32', // 2003 Joe Beimel (Pennant Run)
      '2002-BS-331', // 2002 Esteban Yan
    ],
    bench: [
      '2001-BS-434', // 2001 Frank Catalanotto
    ],
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

/**
 * A team as it comes back from the browser, made safe for the cards we have now.
 * A saved team is rebuilt from its current definition, so fixes reach browsers
 * that picked it earlier. Anything else keeps its cards, minus any that no longer
 * exist, which leave an empty spot rather than breaking the page.
 */
export function restoreDraft(draft: TeamDraft): TeamDraft {
  const team = draft.savedTeam ? SAVED_TEAMS_BY_ID[draft.savedTeam] : undefined;
  if (team) return { ...savedTeamDraft(team), name: draft.name };
  const known = (id: string | null): id is string => id !== null && id in CARDS_BY_ID;
  const restored: TeamDraft = {
    ...draft,
    lineup: draft.lineup.map((entry) => (known(entry.cardId) ? entry : { ...entry, cardId: null })),
    rotation: draft.rotation.map((id) => (known(id) ? id : null)),
    bullpen: draft.bullpen.filter(known),
    bench: draft.bench.filter(known),
    platoons: draft.platoons?.filter((pair) => pair.every(known)),
  };
  delete restored.savedTeam;
  return restored;
}
