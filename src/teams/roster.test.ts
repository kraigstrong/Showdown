import { describe, expect, it } from 'vitest';
import { ALL_CARDS, CARDS_BY_ID, OTHER_YEAR_CARDS, TEAMS, YEARS } from '../data/catalog';
import { applyAction, cardFieldingAt, chartRanges, createGame, fieldingAt, getPrompt, runs } from '../engine';
import type { GameState, HitterCard } from '../engine';
import { applyPlatoons, autoFill, draftCardIds, draftCost, draftFromPreset, draftIssues, emptyDraft, platoonText, POINT_CAP, realTeamDraft, toTeamSetup } from './roster';
import { restoreDraft, SAVED_TEAMS, SAVED_TEAMS_BY_ID, savedTeamDraft } from './savedTeams';

function seededRandom(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe('the card list', () => {
  it('has the 1,249 regular cards from 2000 and 2001', () => {
    expect(ALL_CARDS).toHaveLength(1249);
    expect(new Set(ALL_CARDS.map((c) => c.id)).size).toBe(1249);
  });

  it('has a chart covering exactly 1 to 20 on every card', () => {
    for (const card of ALL_CARDS) {
      const ranges = chartRanges(card);
      expect(ranges[0].from, card.id).toBe(1);
      expect(ranges.at(-1)?.to, card.id).toBe(20);
    }
  });

  it('caps On-Base at 10 on every card, including the few printed higher', () => {
    const hitters = [...ALL_CARDS, ...OTHER_YEAR_CARDS].filter((c): c is HitterCard => c.kind === 'hitter');
    expect(Math.max(...hitters.map((c) => c.onBase))).toBe(10);
    // Printed 11, 11 and 12.
    for (const id of ['2001-BS-310', '2001-BS-450', '2002-BS-173']) expect((CARDS_BY_ID[id] as HitterCard).onBase, id).toBe(10);
  });

  it('caps Speed at 20 on every card', () => {
    const hitters = [...ALL_CARDS, ...OTHER_YEAR_CARDS].filter((c): c is HitterCard => c.kind === 'hitter');
    expect(Math.max(...hitters.map((c) => c.speed))).toBe(20);
    // Scott Podsednik 2005 prints 24.
    expect((CARDS_BY_ID['2005-BS-184'] as HitterCard).speed).toBe(20);
  });

  it('has Matt Walbeck at C+7', () => {
    const card = CARDS_BY_ID['2000-BS-15'] as HitterCard;
    expect(card.name).toBe('Matt Walbeck');
    expect(card.positions[0]).toEqual({ pos: 'C', fielding: 7 });
  });
});

describe('charts read from real card scans', () => {
  const printed = (id: string) => chartRanges(CARDS_BY_ID[id]).map((r) => `${r.from}-${r.to} ${r.result}`);

  it('matches Mike Timlin, 2000 base 63', () => {
    expect(CARDS_BY_ID['2000-BS-63'].name).toBe('Mike Timlin');
    expect(printed('2000-BS-63')).toEqual(['1-4 SO', '5-6 PU', '7-12 GB', '13-15 FB', '16-17 BB', '18-19 1B', '20-20 2B']);
  });

  it('matches Derek Jeter, 2000 base 301', () => {
    expect(CARDS_BY_ID['2000-BS-301'].name).toBe('Derek Jeter');
    expect(printed('2000-BS-301')).toEqual(['1-1 SO', '2-3 GB', '4-8 BB', '9-15 1B', '16-16 1B+', '17-17 2B', '18-18 3B', '19-20 HR']);
  });

  it('matches Kenny Rogers, 2001 base 445', () => {
    expect(CARDS_BY_ID['2001-BS-445'].name).toBe('Kenny Rogers');
    expect(printed('2001-BS-445')).toEqual(['1-2 PU', '3-5 SO', '6-12 GB', '13-15 FB', '16-16 BB', '17-19 1B', '20-20 2B']);
  });
});

describe('real teams', () => {
  const keys = YEARS.flatMap((year) => TEAMS.map((team) => ({ year, code: team.code })));

  it('can field every team, or tells us which it cannot', () => {
    const cannot = keys.filter((key) => realTeamDraft(key) === null);
    expect(cannot).toEqual([]);
  });

  it('builds a legal team for every franchise and year', () => {
    for (const key of keys) {
      const draft = realTeamDraft(key);
      if (!draft) continue;
      expect(draftIssues(draft), `${key.year} ${key.code}`).toEqual([]);
    }
  });
});

describe('random drafts', () => {
  it('always fits the cap and is ready to play', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const draft = autoFill(emptyDraft('Test'), seededRandom(seed));
      expect(draftIssues(draft), `seed ${seed}`).toEqual([]);
      expect(draftCost(draft)).toBeLessThanOrEqual(POINT_CAP);
    }
  });

  it('keeps cards already chosen', () => {
    const start = emptyDraft('Test');
    start.lineup[0].cardId = '2000-BS-15';
    const draft = autoFill(start, seededRandom(7));
    expect(draft.lineup.some((entry) => entry.cardId === '2000-BS-15')).toBe(true);
  });
});

/** Plays a whole game making random legal choices. */
function playGame(away: ReturnType<typeof toTeamSetup>, home: ReturnType<typeof toTeamSetup>, seed: number) {
  const random = seededRandom(seed);
  const cards = Object.fromEntries(
    [away, home].flatMap((team) =>
      [...team.lineup.map((e) => e.cardId), ...team.rotation, ...team.bullpen, ...team.bench].map((id) => [id, CARDS_BY_ID[id]]),
    ),
  );
  let s: GameState = createGame({ away, home, cards, seed });
  let steps = 0;
  for (let prompt = getPrompt(s); prompt; prompt = getPrompt(s)) {
    const action = prompt.actions[Math.floor(random() * prompt.actions.length)];
    s = applyAction(s, prompt.actor, action).state;
    // The rules that must hold after every single move.
    const onBase = s.bases.filter(Boolean);
    expect(new Set(onBase).size).toBe(onBase.length);
    expect(s.outs).toBeLessThan(3);
    for (const side of ['away', 'home'] as const) {
      const team = s.teams[side];
      expect(new Set(team.lineup.map((e) => e.cardId)).size).toBe(9);
      expect(new Set(team.lineup.map((e) => e.slot)).size).toBe(9);
      for (const entry of team.lineup) {
        if (entry.slot === 'DH') continue;
        const card = s.cards[entry.cardId] as HitterCard;
        expect(card.positions.length).toBeGreaterThan(0);
      }
    }
    if (++steps > 20000) throw new Error('Game never ended');
  }
  return s;
}

describe('whole games', () => {
  it('always finish with a winner and consistent stats', () => {
    let games = 0;
    let totalRuns = 0;
    let plateAppearances = 0;
    let timesOnBase = 0;
    for (let seed = 1; seed <= 60; seed++) {
      const random = seededRandom(seed * 31);
      const away = toTeamSetup(autoFill(emptyDraft('A'), random));
      const home = toTeamSetup(autoFill(emptyDraft('H'), random));
      const s = playGame(away, home, seed);
      expect(s.winner).not.toBeNull();
      const a = runs(s, 'away');
      const h = runs(s, 'home');
      expect(a).not.toBe(h);
      expect(s.winner).toBe(h > a ? 'home' : 'away');

      for (const side of ['away', 'home'] as const) {
        const lines = Object.values(s.teams[side].batting);
        expect(lines.reduce((sum, l) => sum + l.r, 0)).toBe(runs(s, side));
        expect(lines.reduce((sum, l) => sum + l.h, 0)).toBe(s.teams[side].hits);
        plateAppearances += lines.reduce((sum, l) => sum + l.ab + l.bb, 0);
        timesOnBase += lines.reduce((sum, l) => sum + l.h + l.bb, 0);
      }
      games += 1;
      totalRuns += a + h;
    }
    const perTeam = totalRuns / games / 2;
    const onBasePct = timesOnBase / plateAppearances;
    // Random managing isn't good managing, but the game should still look like baseball.
    expect(perTeam).toBeGreaterThan(2);
    expect(perTeam).toBeLessThan(9);
    expect(onBasePct).toBeGreaterThan(0.28);
    expect(onBasePct).toBeLessThan(0.42);
  }, 120000);

  it('is repeatable from the same seed and choices', () => {
    const away = toTeamSetup(draftFromPreset({ year: 2001, code: 'NYY' }));
    const home = toTeamSetup(draftFromPreset({ year: 2001, code: 'SEA' }));
    expect(playGame(away, home, 42)).toEqual(playGame(away, home, 42));
  });
});

describe('saved teams', () => {
  it('are playable as-is, over the cap', () => {
    for (const team of SAVED_TEAMS) {
      const draft = savedTeamDraft(team);
      expect(draftIssues(draft), team.name).toEqual([]);
      for (const id of draftCardIds(draft)) expect(CARDS_BY_ID[id], `${team.name}: ${id}`).toBeDefined();
    }
    const mariners = savedTeamDraft(SAVED_TEAMS_BY_ID['kraigs-mariners']);
    expect(draftCost(mariners)).toBeGreaterThan(POINT_CAP);
  });

  it("has Kraig's Mariners with the cards as listed", () => {
    const draft = savedTeamDraft(SAVED_TEAMS_BY_ID['kraigs-mariners']);
    const label = (id: string) => `${CARDS_BY_ID[id].year} ${CARDS_BY_ID[id].name}`;
    expect(Object.fromEntries(draft.lineup.map((e) => [e.slot, label(e.cardId as string)]))).toEqual({
      C: '2000 Tom Lampkin',
      '1B': '2002 Richie Sexson',
      '2B': '2001 Roberto Alomar',
      SS: '2001 Alex Rodriguez',
      '3B': '2000 Jeff Cirillo',
      LF: '2000 Larry Walker',
      CF: '2000 Ken Griffey Jr.',
      RF: '2001 Ichiro Suzuki',
      DH: '2000 Edgar Martinez',
    });
    expect(draft.lineup.map((e) => CARDS_BY_ID[e.cardId as string].name)).toEqual([
      'Ichiro Suzuki',
      'Edgar Martinez',
      'Ken Griffey Jr.',
      'Larry Walker',
      'Alex Rodriguez',
      'Richie Sexson',
      'Roberto Alomar',
      'Tom Lampkin',
      'Jeff Cirillo',
    ]);
    expect(draft.rotation.map((id) => label(id as string))).toEqual([
      '2000 Randy Johnson',
      '2000 Curt Schilling',
      '2003 Jamie Moyer',
      '2000 Ramon Martinez',
      '2003 Joel Pineiro',
    ]);
    expect(draft.bullpen.map(label)).toEqual([
      '2001 Kazuhiro Sasaki',
      '2004 Rafael Soriano',
      '2000 Billy Wagner',
      '2002 Jeff Nelson',
      '2000 Mike Venafro',
      '2001 Dave Weathers',
    ]);
  });

  it('has the Timberjacks with the cards as listed, Thomas at 1B and Nomar at 3B', () => {
    const draft = savedTeamDraft(SAVED_TEAMS_BY_ID.timberjacks);
    const label = (id: string) => `${CARDS_BY_ID[id].year} ${CARDS_BY_ID[id].name}`;
    expect(Object.fromEntries(draft.lineup.map((e) => [e.slot, label(e.cardId as string)]))).toEqual({
      C: '2000 Ivan Rodriguez',
      '1B': '2001 Frank Thomas',
      '2B': '2001 Jeff Frye',
      SS: '2002 David Eckstein',
      '3B': '2001 Nomar Garciaparra',
      LF: '2000 Rickey Henderson',
      CF: '2001 Juan Pierre',
      RF: '2001 Darin Erstad',
      DH: '2000 Marquis Grissom',
    });
    expect(draft.rotation.map((id) => label(id as string))).toEqual([
      '2004 Mark Mulder',
      '2003 Barry Zito',
      '2004 Tim Hudson',
      '2000 Mike Hampton',
      '2000 Terry Mulholland',
    ]);
    // Mulder is his 2004 Pennant Run card, Control 5, not the base-set Control 4.
    expect(draft.rotation[0]).toBe('2004-PR-31');
    expect((CARDS_BY_ID['2004-PR-31'] as { control: number }).control).toBe(5);
    expect(draft.bullpen.map(label)).toEqual([
      '2000 Keith Foulke',
      '2002 Jason Isringhausen',
      '2000 Jeff Zimmerman',
      '2002 Josias Manzanillo',
      '2000 Jason Christiansen',
      '2000 Pedro Borbon',
    ]);
    const thomas = CARDS_BY_ID['2001-BS-107'] as HitterCard;
    const nomar = CARDS_BY_ID['2001-BS-68'] as HitterCard;
    // A DH plays first and an infielder plays anywhere in the infield, at +0 off their cards.
    expect(fieldingAt(thomas, '1B')).toBe(0);
    expect(fieldingAt(nomar, '3B')).toBe(0);
    // That holds for every team, so the lineup stays legal after an edit too.
    expect(draftIssues({ ...draft, capExempt: false, savedTeam: undefined })).toEqual([]);
  });

  it('has the Hanging Chads in the batting order as given', () => {
    const draft = savedTeamDraft(SAVED_TEAMS_BY_ID['hanging-chads']);
    const label = (id: string) => `${CARDS_BY_ID[id].year} ${CARDS_BY_ID[id].name}`;
    expect(draft.lineup.map((e) => `${e.slot} ${label(e.cardId as string)}`)).toEqual([
      '2B 2000 Randy Velarde',
      'SS 2000 Derek Jeter',
      'RF 2000 Shawn Green',
      'DH 2000 Brian Giles',
      '1B 2001 Todd Helton',
      '3B 2002 Tino Martinez',
      'CF 2001 Bernie Williams',
      'C 2001 Jorge Posada',
      "LF 2000 Paul O'Neill",
    ]);
    expect(draft.rotation.map((id) => label(id as string))).toEqual([
      '2000 Kevin Brown',
      '2002 Andy Pettitte',
      '2001 Mike Mussina',
      '2002 Kazuhisa Ishii',
      '2000 Chuck Finley',
    ]);
    expect(draft.bullpen.map(label)).toEqual([
      '2000 Alan Embree',
      '2002 Jeff Fassero',
      '2002 Chad Fox',
      '2002 Mariano Rivera',
      '2001 Dan Miceli',
      '2001 Lance Painter',
    ]);
    expect(draft.bench.map(label)).toEqual(['2000 Chad Curtis']);
  });

  it("platoons O'Neill against right-handers and Curtis against lefties", () => {
    const draft = savedTeamDraft(SAVED_TEAMS_BY_ID['hanging-chads']);
    const leftField = (d: typeof draft) => CARDS_BY_ID[d.lineup.find((e) => e.slot === 'LF')?.cardId as string].name;
    const benchNames = (d: typeof draft) => d.bench.map((id) => CARDS_BY_ID[id].name);
    const vsRighty = applyPlatoons(draft, 'R');
    const vsLefty = applyPlatoons(draft, 'L');
    expect([leftField(vsRighty), benchNames(vsRighty)]).toEqual(["Paul O'Neill", ['Chad Curtis']]);
    expect([leftField(vsLefty), benchNames(vsLefty)]).toEqual(['Chad Curtis', ["Paul O'Neill"]]);
    expect(leftField(applyPlatoons(vsLefty, 'R'))).toBe("Paul O'Neill");
    expect(draftIssues(vsRighty)).toEqual([]);
    expect(draftIssues(vsLefty)).toEqual([]);
    expect(platoonText(draft)).toEqual(["Paul O'Neill vs righties, Chad Curtis vs lefties"]);
    // Teams without a platoon are left alone.
    const mariners = savedTeamDraft(SAVED_TEAMS_BY_ID['kraigs-mariners']);
    expect(applyPlatoons(mariners, 'L')).toBe(mariners);
  });

  it('has the Wiffleballers in the batting order as given', () => {
    const draft = savedTeamDraft(SAVED_TEAMS_BY_ID.wiffleballers);
    const label = (id: string) => `${CARDS_BY_ID[id].year} ${CARDS_BY_ID[id].name}`;
    expect(draft.lineup.map((e) => `${e.slot} ${label(e.cardId as string)}`)).toEqual([
      'LF 2005 Scott Podsednik',
      'RF 2000 Bobby Abreu',
      '3B 2000 Chipper Jones',
      '1B 2000 Andres Galarraga',
      'CF 2001 Andruw Jones',
      'DH 2002 Adam Dunn',
      'C 2002 Paul Lo Duca',
      '2B 2002 Marcus Giles',
      'SS 2004 Rafael Furcal',
    ]);
    expect(draft.rotation.map((id) => label(id as string))).toEqual([
      '2000 Pedro Martinez',
      '2003 Jarrod Washburn',
      '2001 Greg Maddux',
      '2000 Kerry Wood',
      '2000 Brad Radke',
    ]);
    expect(draft.bullpen.map(label)).toEqual([
      '2005 Tim Spooneybarger',
      '2000 Ugueth Urbina',
      '2002 John Smoltz',
      '2004 Tom Gordon',
      '2000 Billy Koch',
      '2002 Jorge Julio',
    ]);
    // Smoltz comes out of the bullpen, so it's his reliever card.
    expect((CARDS_BY_ID['2002-TD-150'] as { role: string }).role).toBe('Reliever');
  });

  it('cuts later charts off at 20 and keeps those cards out of the building pool', () => {
    const pool = new Set(ALL_CARDS.map((c) => c.id));
    const used = new Set(SAVED_TEAMS.flatMap((team) => draftCardIds(savedTeamDraft(team))));
    for (const card of OTHER_YEAR_CARDS) {
      expect(card.year).toBeGreaterThan(2001);
      expect(pool.has(card.id)).toBe(false);
      expect(used.has(card.id), `${card.id} isn't on any saved team`).toBe(true);
      const ranges = chartRanges(card);
      expect(ranges[0].from, card.id).toBe(1);
      expect(ranges.at(-1)?.to, card.id).toBe(20);
    }
    // Jamie Moyer 2003 homers on 22+, which a d20 never reaches.
    expect(CARDS_BY_ID['2003-BS-266'].chart.HR).toBeUndefined();
  });

  it('play full games against each other', () => {
    const away = toTeamSetup(savedTeamDraft(SAVED_TEAMS_BY_ID['kraigs-mariners']));
    const home = toTeamSetup(savedTeamDraft(SAVED_TEAMS_BY_ID.timberjacks));
    expect(playGame(away, home, 7).winner).not.toBeNull();
    expect(playGame(home, away, 8).winner).not.toBeNull();
    // Timberjacks open with Mulder, a lefty, so Curtis plays left for the Chads.
    const chads = toTeamSetup(applyPlatoons(savedTeamDraft(SAVED_TEAMS_BY_ID['hanging-chads']), 'L'));
    expect(chads.lineup.at(-1)?.cardId).toBe('2000-BS-298');
    expect(playGame(chads, home, 9).winner).not.toBeNull();
    const wiffle = toTeamSetup(savedTeamDraft(SAVED_TEAMS_BY_ID.wiffleballers));
    expect(playGame(wiffle, chads, 10).winner).not.toBeNull();
  });
});

describe('positions', () => {
  it('puts real and random teams at the positions on their cards, even with the infield rule', () => {
    const onCard = (draft: ReturnType<typeof emptyDraft> | null, label: string) => {
      for (const entry of draft?.lineup ?? []) {
        expect(cardFieldingAt(CARDS_BY_ID[entry.cardId as string] as HitterCard, entry.slot), `${label} ${entry.slot}`).not.toBeNull();
      }
    };
    for (const year of YEARS) for (const team of TEAMS) onCard(realTeamDraft({ year, code: team.code }), `${year} ${team.code}`);
    for (let seed = 1; seed <= 20; seed++) onCard(autoFill(emptyDraft('Random'), seededRandom(seed)), `random ${seed}`);
    const yankees = realTeamDraft({ year: 2001, code: 'NYY' });
    const slotOf = (name: string) => yankees?.lineup.find((e) => CARDS_BY_ID[e.cardId as string].name === name)?.slot;
    expect([slotOf('Derek Jeter'), slotOf('Tino Martinez')]).toEqual(['SS', '1B']);
  });
});

describe('teams saved in the browser', () => {
  it('rebuilds a saved team from its current version, keeping its name', () => {
    // Saved before Mulder's card changed, then renamed.
    const old = savedTeamDraft(SAVED_TEAMS_BY_ID.timberjacks);
    old.name = 'Lumberjacks';
    old.rotation[0] = '2004-BS-247';
    const restored = restoreDraft(old);
    expect(restored.rotation[0]).toBe('2004-PR-31');
    expect(restored.name).toBe('Lumberjacks');
    expect(draftIssues(restored)).toEqual([]);
  });

  it('leaves an empty spot for a card that no longer exists instead of breaking', () => {
    const built = { ...draftFromPreset({ year: 2001, code: 'NYY' }), capExempt: false };
    built.lineup[0] = { ...built.lineup[0], cardId: 'gone' };
    built.rotation[1] = 'gone';
    built.bullpen = ['gone', ...built.bullpen];
    built.bench = ['gone', ...built.bench];
    const restored = restoreDraft(built);
    expect(restored.lineup[0].cardId).toBeNull();
    expect(restored.rotation[1]).toBeNull();
    expect(restored.bullpen).not.toContain('gone');
    expect(restored.bench).not.toContain('gone');
    expect(() => draftCost(restored)).not.toThrow();
    expect(draftIssues(restored).length).toBeGreaterThan(0);
  });
});

describe('the point cap', () => {
  it('lets a team you built go over it', () => {
    const built = { ...draftFromPreset({ year: 2001, code: 'NYY' }), capExempt: false };
    expect(draftCost(built)).toBeGreaterThan(POINT_CAP);
    expect(draftIssues(built)).toEqual([]);
  });

  it('still fills every open spot when the team is already over it', () => {
    const built = { ...draftFromPreset({ year: 2001, code: 'NYY' }), capExempt: false };
    built.lineup = built.lineup.map((entry, i) => (i < 2 ? { ...entry, cardId: null } : entry));
    const filled = autoFill(built, seededRandom(3));
    expect(filled.lineup.every((entry) => entry.cardId)).toBe(true);
    expect(draftIssues(filled)).toEqual([]);
  });
});
