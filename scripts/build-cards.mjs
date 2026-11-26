// Turns the raw card snapshot into the card list the game ships with.
// Scope is the regular 2000 and 2001 sets, plus the later cards our saved
// teams use. Run with: npm run cards
import { readFileSync, writeFileSync } from 'node:fs';

const YEARS = new Set(['2000', '2001']);
const SETS = new Set(['BS', 'PR']);

// Cards from other years that a saved team in src/teams/savedTeams.ts plays with.
// They stay out of the card pool for building and random teams.
const OTHER_YEAR_CARDS = new Set([
  // Kraig's Mariners
  '2002-BS-186', // Richie Sexson
  '2002-BS-301', // Jeff Nelson
  '2003-BS-266', // Jamie Moyer
  '2003-BS-268', // Joel Pineiro
  '2004-TD-63', // Rafael Soriano
  // Timberjacks
  '2002-BS-2', // David Eckstein
  '2002-BS-244', // Jason Isringhausen
  '2002-BS-264', // Josias Manzanillo
  '2003-BS-224', // Barry Zito
  '2004-BS-245', // Tim Hudson
  '2004-PR-31', // Mark Mulder (Pennant Run)
  // Hanging Chads
  '2002-BS-64', // Jeff Fassero
  '2002-BS-181', // Chad Fox
  '2002-BS-228', // Tino Martinez
  '2002-BS-231', // Andy Pettitte
  '2002-BS-233', // Mariano Rivera
  '2002-PR-75', // Kazuhisa Ishii
  // Wiffleballers
  '2002-BS-27', // Marcus Giles
  '2002-BS-91', // Adam Dunn
  '2002-BS-173', // Paul Lo Duca
  '2002-TD-141', // Jorge Julio
  '2002-TD-150', // John Smoltz
  '2003-BS-12', // Jarrod Washburn
  '2004-BS-24', // Rafael Furcal
  '2004-BS-77', // Tom Gordon
  '2005-BS-136', // Tim Spooneybarger
  '2005-BS-184', // Scott Podsednik
  // Peacemakers
  '2002-BS-152', // Roy Oswalt
  '2002-PR-29', // Vicente Padilla
  '2002-PR-121', // Trevor Hoffman (Super Season)
  '2004-BS-184', // Paul Quantrill
  '2004-BS-198', // LaTroy Hawkins
  '2004-BS-347', // Vernon Wells
  '2005-BS-95', // Coco Crisp
  '2005-TD-30', // Rich Harden
  // Front Street Bombers
  '2002-BS-151', // Wade Miller
  '2003-BS-34', // Kevin Millwood
  '2004-BS-97', // Danys Baez
  // Homestead Grays
  '2003-BS-16', // Steve Finley
  '2004-BS-68', // Mark Prior
  '2004-BS-93', // Jason LaRue
  '2004-BS-132', // Josh Beckett
  '2004-BS-226', // Roger Clemens
  '2004-TD-110', // Tom Glavine (Super Season)
  // Aviators
  '2004-PR-39', // Mike Stanton (Pennant Run)
  '2005-TD-110', // Odalis Perez (Trading Deadline)
  // Railroaders
  '2002-BS-218', // Rey Ordonez (base set, NYM)
  '2003-PR-67', // Livan Hernandez (Pennant Run)
  '2004-BS-256', // Rheal Cormier
  // Big W's
  '2002-BS-108', // Paul Shuey (base set, CLE)
  '2002-BS-209', // Javier Vazquez
  '2004-BS-112', // Shawn Chacon (base set, COL)
  '2004-TD-99', // Bartolo Colon (Trading Deadline)
  '2005-BS-163', // Wilson Alvarez (base set, LAD)
  // Ninja Turtles
  '2002-BS-156', // Carlos Beltran (base set, KCR)
  '2002-TD-119', // Steve Karsay (Trading Deadline)
  '2003-PR-107', // Pat Hentgen (Pennant Run Super Season)
  '2004-PR-41', // Steve Trachsel (Pennant Run)
  // Hot Gloves
  '2002-BS-26', // Tony Womack
  '2002-BS-37', // Rey Sanchez (base set, ATL)
  '2002-BS-63', // Kyle Farnsworth
  '2002-BS-76', // Royce Clayton
  '2002-BS-84', // Sean Lowe (base set, CHW)
  '2002-BS-129', // Steve Sparks
  '2002-BS-182', // Jose Hernandez (base set, MIL)
  '2002-BS-260', // Jimmy Rollins (base set, PHI)
  '2002-BS-278', // Mark Kotsay (base set, SDP)
  '2002-PR-1', // J.C. Romero (Pennant Run)
  '2003-BS-76', // Mark Buehrle
  '2004-BS-312', // Mike Matheny
  '2004-TD-90', // Francisco Rodriguez (Trading Deadline)
  '2005-BS-305', // Chris Carpenter (base set, STL)
  // Swashbucklers
  '2002-BS-312', // Steve Kline
  '2003-PR-82', // Kyle Lohse (Pennant Run)
  '2003-PR-101', // Esteban Loaiza (Pennant Run)
  '2003-TD-122', // Tim Wakefield (Trading Deadline)
  '2004-BS-141', // Mark Redman
  '2004-TD-83', // Chad Cordero (Trading Deadline)
  // Los Gatos
  '2002-PR-10', // Jose Rijo (Pennant Run; there's no base-set card)
  '2003-BS-276', // Matt Morris
  '2003-PR-87', // Zach Day (Pennant Run)
  '2004-BS-165', // Curtis Leskanic
  '2005-BS-196', // Ben Sheets
  // Pachyderms
  '2002-BS-92', // Danny Graves
  '2002-BS-106', // Ricardo Rincon
  '2002-BS-284', // Shawn Estes (base set, SFG)
  '2002-BS-319', // Bud Smith
  '2002-PR-92', // John Franco (Pennant Run Super Season)
  '2002-TD-118', // Roy Halladay (Trading Deadline; no base-set card)
  '2003-PR-84', // Gil Meche (Pennant Run)
  '2004-PR-53', // Kenny Rogers (Pennant Run, All-Star edition)
  // Upper Deckers
  '2002-BS-121', // Matt Anderson
  '2002-TD-148', // Satoru Komiyama (Trading Deadline)
  '2004-BS-155', // Brad Lidge
  // Cracker Jax
  '2002-BS-180', // Mike DeJean
  '2003-PR-58', // Ted Lilly (Pennant Run)
  '2003-TD-120', // Orlando Hernandez (Trading Deadline)
  '2005-TD-141', // Woody Williams (Trading Deadline)
  // Interstellars
  '2004-BS-80', // Damaso Marte
  '2005-BS-280', // Jake Peavy
  // Dinos
  '2002-BS-49', // Josh Towers
  '2002-BS-256', // Nelson Figueroa
  '2002-PR-6', // Shigetoshi Hasegawa (Pennant Run)
  '2002-PR-36', // Ryan Drese (Pennant Run)
  '2002-TD-116', // Victor Zambrano (Trading Deadline)
  '2003-TD-108', // Johan Santana (Trading Deadline)
  '2005-TD-134', // Matt Clement (Trading Deadline)
  // Smoke Jumpers
  '2002-ASG-1', // Garret Anderson (All-Star Game)
  '2002-BS-10', // Scott Schoeneweis
  '2002-BS-331', // Esteban Yan
  '2002-TD-117', // Jose Mesa (Trading Deadline)
  '2003-PR-20', // Chris Hammond (Pennant Run)
  '2003-PR-32', // Joe Beimel (Pennant Run)
  '2003-PR-40', // Francisco Cordero (Pennant Run)
  '2003-PR-47', // D.J. Carrasco (Pennant Run)
]);
const CHART_COLUMNS = ['PU', 'SO', 'GB', 'FB', 'BB', '1B', '1B+', '2B', '3B', 'HR'];
const ROLES = { STARTER: 'Starter', RELIEVER: 'Reliever', CLOSER: 'Closer' };
// House rules: On-Base tops out at 10 and Speed at 20. A few 2001 cards print
// On-Base 11 and later ones up to 12; later Speed runs as high as 24.
const MAX_ON_BASE = 10;
const MAX_SPEED = 20;

// Corrections to the snapshot, confirmed against a second source.
const FIXES = {
  '2000-BS-15': (card) => {
    // Matt Walbeck is C+7 on the card; the sheet has +6.
    card.positions = card.positions.map((p) => (p.pos === 'C' ? { ...p, fielding: 7 } : p));
  },
};

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') {
        quoted = false;
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === ',') {
      row.push(field);
      field = '';
    } else if (ch === '\n') {
      row.push(field.replace(/\r$/, ''));
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += ch;
    }
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  const [header, ...body] = rows;
  return body.map((cells) => Object.fromEntries(header.map((name, i) => [name, cells[i] ?? ''])));
}

function readChart(row, id) {
  const chart = {};
  let total = 0;
  for (const column of CHART_COLUMNS) {
    const value = Number(row[column]);
    if (!Number.isInteger(value) || value < 0) {
      throw new Error(`${id}: ${column} is ${row[column]}, expected a count from 0 to 20`);
    }
    if (value > 20) {
      // From 2002 a number past 20 is the roll where that result starts. We play
      // without anything that adds to the swing, so the chart stops at 20 and
      // those results are dropped.
      if (Number(row.Set) < 2002) throw new Error(`${id}: ${column} is ${row[column]}, expected a count from 0 to 20`);
      continue;
    }
    if (value > 0) chart[column] = value;
    total += value;
  }
  if (total !== 20) throw new Error(`${id}: chart totals ${total}, expected 20`);
  return chart;
}

function readPositions(row) {
  const positions = [];
  for (const i of [1, 2, 3]) {
    const pos = row[`Position${i}`].trim();
    if (pos) positions.push({ pos: pos === 'CA' ? 'C' : pos, fielding: Number(row[`Fielding${i}`]) });
  }
  return positions;
}

const cardId = (row) => `${row.Set}-${row.Expansion}-${row['Set Number']}`;

function toCard(row) {
  const id = cardId(row);
  const base = {
    id,
    playerId: row['BRef Id'],
    name: row.Name,
    year: Number(row.Set),
    set: row.Expansion,
    number: Number(row['Set Number']),
    team: row.Team,
    points: Number(row.Points),
    hand: row.Hand,
    foil: row['Is Foil'] === 'Y',
    chart: readChart(row, id),
  };
  if (row['Player Type'] === 'Pitcher') {
    return {
      ...base,
      kind: 'pitcher',
      control: Number(row.Command),
      ip: Number(row.IP),
      role: ROLES[row.Position1],
    };
  }
  return {
    ...base,
    kind: 'hitter',
    onBase: Math.min(Number(row.Command), MAX_ON_BASE),
    speed: Math.min(Number(row.Speed), MAX_SPEED),
    positions: readPositions(row),
  };
}

const rows = parseCsv(readFileSync('raw_data/wotc_cards.csv', 'utf8'));
const cards = rows.filter((row) => YEARS.has(row.Set) && SETS.has(row.Expansion)).map(toCard);
const otherYears = rows.filter((row) => OTHER_YEAR_CARDS.has(cardId(row))).map(toCard);
const missing = [...OTHER_YEAR_CARDS].filter((id) => !otherYears.some((card) => card.id === id));
if (missing.length > 0) throw new Error(`Not in the snapshot: ${missing.join(', ')}`);

for (const card of cards) {
  FIXES[card.id]?.(card);
  // The sheet misspells him and drops the apostrophe.
  if (card.id === '2001-PR-99') card.name = "D'Angelo Jimenez";
}

const byNumber = (a, b) => a.year - b.year || a.set.localeCompare(b.set) || a.number - b.number;
const asJson = (list) => `[\n${list.map((c) => JSON.stringify(c)).join(',\n')}\n]\n`;
writeFileSync('src/data/cards.json', asJson(cards.sort(byNumber)));
writeFileSync('src/data/other-years.json', asJson(otherYears.sort(byNumber)));
console.log(`Wrote ${cards.length} cards to src/data/cards.json and ${otherYears.length} to src/data/other-years.json`);
