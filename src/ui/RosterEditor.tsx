import { useMemo, useState } from 'react';
import { ALL_CARDS, CARDS_BY_ID, TEAMS, YEARS } from '../data/catalog';
import { fieldingAt, speedLabel } from '../engine';
import type { GameCard, HitterCard, PitcherCard } from '../engine';
import {
  autoFill,
  benchCost,
  draftCardIds,
  draftCost,
  draftIssues,
  emptyDraft,
  MAX_ROSTER,
  POINT_CAP,
  sortRotation,
  suggestBattingOrder,
  withFullRotation,
} from '../teams/roster';
import type { TeamDraft } from '../teams/roster';
import { CardView } from './CardView';

type Target =
  | { kind: 'lineup'; index: number }
  | { kind: 'rotation'; index: number }
  | { kind: 'bullpen' }
  | { kind: 'bench' };

const LIST_LIMIT = 150;

function fitsTarget(card: GameCard, target: Target, draft: TeamDraft): boolean {
  switch (target.kind) {
    case 'lineup':
      return card.kind === 'hitter' && fieldingAt(card, draft.lineup[target.index].slot) !== null;
    case 'rotation':
      return card.kind === 'pitcher' && card.role === 'Starter';
    case 'bullpen':
      return card.kind === 'pitcher' && card.role !== 'Starter';
    case 'bench':
      return card.kind === 'hitter';
  }
}

function targetLabel(target: Target, draft: TeamDraft): string {
  switch (target.kind) {
    case 'lineup':
      return `Choosing for ${draft.lineup[target.index].slot}`;
    case 'rotation':
      return 'Choosing a starting pitcher';
    case 'bullpen':
      return 'Adding a reliever';
    case 'bench':
      return 'Adding a bench player (one-fifth cost)';
  }
}

function nextOpenTarget(draft: TeamDraft): Target {
  const lineup = draft.lineup.findIndex((entry) => !entry.cardId);
  if (lineup >= 0) return { kind: 'lineup', index: lineup };
  const rotation = draft.rotation.findIndex((id) => !id);
  if (rotation >= 0) return { kind: 'rotation', index: rotation };
  return { kind: 'bullpen' };
}

function cardSummary(card: GameCard): string {
  if (card.kind === 'hitter') {
    return `OB ${card.onBase} · ${speedLabel(card)} · ${card.positions.map((p) => p.pos).join('/')}`;
  }
  return `C ${card.control} · IP ${card.ip} · ${card.role}`;
}

interface Props {
  draft: TeamDraft;
  sideLabel: string;
  onChange: (draft: TeamDraft) => void;
  onDone: () => void;
}

export function RosterEditor({ draft, sideLabel, onChange, onDone }: Props) {
  const [target, setTarget] = useState<Target>(() => nextOpenTarget(draft));
  const [search, setSearch] = useState('');
  const [year, setYear] = useState('');
  const [team, setTeam] = useState('');
  const [sort, setSort] = useState<'points' | 'name' | 'command'>('points');
  const [preview, setPreview] = useState<GameCard | null>(null);

  const cost = draftCost(draft);
  const issues = draftIssues(draft);
  const usedPlayers = useMemo(() => new Set(draftCardIds(draft).map((id) => CARDS_BY_ID[id].playerId)), [draft]);
  const update = (next: TeamDraft) => {
    // Any hand edit makes this a custom team, so the cap and the four starters apply.
    onChange(withFullRotation({ ...next, capExempt: false, savedTeam: undefined }));
  };

  const matches = useMemo(() => {
    const query = search.trim().toLowerCase();
    const list = ALL_CARDS.filter(
      (card) =>
        fitsTarget(card, target, draft) &&
        !usedPlayers.has(card.playerId) &&
        (!year || String(card.year) === year) &&
        (!team || card.team === team) &&
        (!query || card.name.toLowerCase().includes(query)),
    );
    const command = (c: GameCard) => (c.kind === 'hitter' ? c.onBase : c.control);
    list.sort((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name);
      if (sort === 'command') return command(b) - command(a) || b.points - a.points;
      return b.points - a.points;
    });
    return list;
  }, [search, year, team, sort, target, draft, usedPlayers]);

  const choose = (card: GameCard) => {
    const next = structuredClone(draft);
    if (target.kind === 'lineup') next.lineup[target.index].cardId = card.id;
    else if (target.kind === 'rotation') {
      next.rotation = withFullRotation(next).rotation;
      next.rotation[target.index] = card.id;
    }
    else if (target.kind === 'bullpen') next.bullpen.push(card.id);
    else next.bench.push(card.id);
    next.rotation = sortRotation(next.rotation);
    update(next);
    if (target.kind === 'lineup' || target.kind === 'rotation') setTarget(nextOpenTarget(next));
  };

  const clearLineup = (index: number) => {
    const next = structuredClone(draft);
    next.lineup[index].cardId = null;
    update(next);
    setTarget({ kind: 'lineup', index });
  };

  const moveLineup = (index: number, by: number) => {
    const next = structuredClone(draft);
    const swap = index + by;
    [next.lineup[index], next.lineup[swap]] = [next.lineup[swap], next.lineup[index]];
    update(next);
    if (target.kind === 'lineup' && target.index === index) setTarget({ kind: 'lineup', index: swap });
    else if (target.kind === 'lineup' && target.index === swap) setTarget({ kind: 'lineup', index });
  };

  const clearRotation = (index: number) => {
    const next = structuredClone(draft);
    next.rotation[index] = null;
    next.rotation = sortRotation(next.rotation);
    update(next);
    setTarget(nextOpenTarget(next));
  };

  const isTarget = (t: Target) => JSON.stringify(t) === JSON.stringify(target);

  return (
    <div className="editor">
      <header className="editor__bar">
        <div>
          <span className="team-panel__side">{sideLabel}</span>
          <input className="team-panel__name" value={draft.name} aria-label="Team name" onChange={(e) => onChange({ ...draft, name: e.target.value })} />
        </div>
        <div className={`meter ${cost > POINT_CAP ? 'is-over' : ''}`}>
          <div className="meter__bar">
            <span style={{ width: `${Math.min(100, (cost / POINT_CAP) * 100)}%` }} />
          </div>
          <span className="meter__text">
            {cost.toLocaleString()} / {POINT_CAP.toLocaleString()} points · {draftCardIds(draft).length} of {MAX_ROSTER} players
          </span>
        </div>
        <div className="editor__actions">
          <button
            className="choice"
            onClick={() => {
              const cleared = emptyDraft(draft.name);
              onChange(cleared);
              setTarget(nextOpenTarget(cleared));
            }}
          >
            <span className="choice__label">Clear team</span>
          </button>
          <button className="choice" onClick={() => onChange(autoFill(draft))}>
            <span className="choice__label">Fill the rest</span>
          </button>
          <button className="choice" onClick={() => update({ ...draft, lineup: suggestBattingOrder(draft.lineup) })}>
            <span className="choice__label">Set batting order</span>
          </button>
          <button className="choice choice--primary" onClick={onDone}>
            <span className="choice__label">Done</span>
          </button>
        </div>
      </header>

      {issues.length > 0 && <p className="editor__issues">{issues.join(' · ')}</p>}

      <div className="editor__body">
        <section className="roster">
          <h2>Batting order</h2>
          <ol className="roster__list">
            {draft.lineup.map((entry, i) => {
              const card = entry.cardId ? (CARDS_BY_ID[entry.cardId] as HitterCard) : null;
              const t: Target = { kind: 'lineup', index: i };
              return (
                <li key={`${entry.slot}`} className={`roster__row ${isTarget(t) ? 'is-target' : ''}`} onMouseEnter={() => card && setPreview(card)}>
                  <span className="roster__order">{i + 1}</span>
                  <button className="roster__pick" onClick={() => setTarget(t)}>
                    <span className="roster__slot">{entry.slot}</span>
                    <span className="roster__name">{card?.name ?? 'Choose…'}</span>
                    {card && <span className="roster__points">{card.points}</span>}
                  </button>
                  <span className="roster__tools">
                    <button aria-label={`Move ${entry.slot} up`} disabled={i === 0} onClick={() => moveLineup(i, -1)}>▲</button>
                    <button aria-label={`Move ${entry.slot} down`} disabled={i === draft.lineup.length - 1} onClick={() => moveLineup(i, 1)}>▼</button>
                    {card && <button aria-label={`Remove ${card.name}`} onClick={() => clearLineup(i)}>✕</button>}
                  </span>
                </li>
              );
            })}
          </ol>

          <h2>Rotation</h2>
          <ol className="roster__list">
            {withFullRotation(draft).rotation.map((id, i) => {
              const card = id ? (CARDS_BY_ID[id] as PitcherCard) : null;
              const t: Target = { kind: 'rotation', index: i };
              return (
                <li key={i} className={`roster__row ${isTarget(t) ? 'is-target' : ''}`} onMouseEnter={() => card && setPreview(card)}>
                  <span className="roster__order">{i + 1}</span>
                  <button className="roster__pick" onClick={() => setTarget(t)}>
                    <span className="roster__slot">SP</span>
                    <span className="roster__name">{card?.name ?? 'Choose…'}</span>
                    {card && <span className="roster__points">{card.points}</span>}
                  </button>
                  <span className="roster__tools">{card && <button aria-label={`Remove ${card.name}`} onClick={() => clearRotation(i)}>✕</button>}</span>
                </li>
              );
            })}
          </ol>

          <h2>
            Bullpen
            <button className={`link-button ${target.kind === 'bullpen' ? 'is-active' : ''}`} onClick={() => setTarget({ kind: 'bullpen' })}>Add</button>
          </h2>
          <ul className="roster__list">
            {draft.bullpen.map((id) => {
              const card = CARDS_BY_ID[id];
              return (
                <li key={id} className="roster__row" onMouseEnter={() => setPreview(card)}>
                  <span className="roster__order" />
                  <span className="roster__pick roster__pick--static">
                    <span className="roster__slot">{(card as PitcherCard).role === 'Closer' ? 'CL' : 'RP'}</span>
                    <span className="roster__name">{card.name}</span>
                    <span className="roster__points">{card.points}</span>
                  </span>
                  <span className="roster__tools">
                    <button aria-label={`Remove ${card.name}`} onClick={() => update({ ...draft, bullpen: draft.bullpen.filter((b) => b !== id) })}>✕</button>
                  </span>
                </li>
              );
            })}
          </ul>

          <h2>
            Bench
            <button className={`link-button ${target.kind === 'bench' ? 'is-active' : ''}`} onClick={() => setTarget({ kind: 'bench' })}>Add</button>
          </h2>
          <ul className="roster__list">
            {draft.bench.map((id) => {
              const card = CARDS_BY_ID[id];
              return (
                <li key={id} className="roster__row" onMouseEnter={() => setPreview(card)}>
                  <span className="roster__order" />
                  <span className="roster__pick roster__pick--static">
                    <span className="roster__slot">BN</span>
                    <span className="roster__name">{card.name}</span>
                    <span className="roster__points">{benchCost(card)}</span>
                  </span>
                  <span className="roster__tools">
                    <button aria-label={`Remove ${card.name}`} onClick={() => update({ ...draft, bench: draft.bench.filter((b) => b !== id) })}>✕</button>
                  </span>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="browser">
          <div className="browser__filters">
            <strong className="browser__target">{targetLabel(target, draft)}</strong>
            <input placeholder="Search players" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search players" />
            <select aria-label="Year" value={year} onChange={(e) => setYear(e.target.value)}>
              <option value="">All years</option>
              {YEARS.map((y) => (
                <option key={y}>{y}</option>
              ))}
            </select>
            <select aria-label="Team" value={team} onChange={(e) => setTeam(e.target.value)}>
              <option value="">All teams</option>
              {TEAMS.map((t) => (
                <option key={t.code} value={t.code}>
                  {t.city} {t.name}
                </option>
              ))}
            </select>
            <select aria-label="Sort by" value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}>
              <option value="points">Most points</option>
              <option value="command">Best On-Base / Control</option>
              <option value="name">Name</option>
            </select>
          </div>
          <ul className="browser__list">
            {matches.slice(0, LIST_LIMIT).map((card) => (
              <li key={card.id}>
                <button className="browser__row" onClick={() => choose(card)} onMouseEnter={() => setPreview(card)} onFocus={() => setPreview(card)}>
                  <span className="browser__name">{card.name}</span>
                  <span className="browser__meta">
                    {card.year} {card.team}
                  </span>
                  <span className="browser__summary">{cardSummary(card)}</span>
                  <span className="browser__points">{target.kind === 'bench' ? benchCost(card) : card.points}</span>
                </button>
              </li>
            ))}
            {matches.length === 0 && <li className="browser__empty">No cards match. Players already on the team are hidden.</li>}
            {matches.length > LIST_LIMIT && <li className="browser__empty">Showing the first {LIST_LIMIT} of {matches.length}. Search or filter to narrow it down.</li>}
          </ul>
        </section>

        <aside className="editor__preview">{preview ? <CardView card={preview} /> : <p className="browser__empty">Hover a player to see his card.</p>}</aside>
      </div>
    </div>
  );
}
