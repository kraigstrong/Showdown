// Turns the raw card snapshot into the card list the game ships with.
// Scope is the regular 2000 and 2001 sets. Run with: npm run cards
import { readFileSync, writeFileSync } from 'node:fs';

const YEARS = new Set(['2000', '2001']);
const SETS = new Set(['BS', 'PR']);
const CHART_COLUMNS = ['PU', 'SO', 'GB', 'FB', 'BB', '1B', '1B+', '2B', '3B', 'HR'];
const ROLES = { STARTER: 'Starter', RELIEVER: 'Reliever', CLOSER: 'Closer' };

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
    if (!Number.isInteger(value) || value < 0 || value > 20) {
      throw new Error(`${id}: ${column} is ${row[column]}, expected a count from 0 to 20`);
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

const rows = parseCsv(readFileSync('raw_data/wotc_cards.csv', 'utf8'));
const cards = rows
  .filter((row) => YEARS.has(row.Set) && SETS.has(row.Expansion))
  .map((row) => {
    const id = `${row.Set}-${row.Expansion}-${row['Set Number']}`;
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
      onBase: Number(row.Command),
      speed: Number(row.Speed),
      positions: readPositions(row),
    };
  });

for (const card of cards) {
  FIXES[card.id]?.(card);
  // The sheet misspells him and drops the apostrophe.
  if (card.id === '2001-PR-99') card.name = "D'Angelo Jimenez";
}

cards.sort((a, b) => a.year - b.year || a.set.localeCompare(b.set) || a.number - b.number);
writeFileSync('src/data/cards.json', `[\n${cards.map((c) => JSON.stringify(c)).join(',\n')}\n]\n`);
console.log(`Wrote ${cards.length} cards to src/data/cards.json`);
