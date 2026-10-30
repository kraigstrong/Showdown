import { useEffect, useState } from 'react';
import { CARDS_BY_ID, teamColor, TEAMS, YEARS } from '../data/catalog';
import { speedLetter } from '../engine';
import type { HitterCard, PitcherCard, Side } from '../engine';
import { autoFill, draftCost, draftFromPreset, draftIssues, emptyDraft, POINT_CAP } from '../teams/roster';
import type { TeamDraft } from '../teams/roster';
import { RosterEditor } from './RosterEditor';

const DRAFT_KEY = 'showdown.teams.v1';

function loadDrafts(): { away: TeamDraft; home: TeamDraft } | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveDrafts(drafts: { away: TeamDraft; home: TeamDraft }) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(drafts));
  } catch {
    // Losing the saved teams only means picking them again next time.
  }
}

function defaultDrafts() {
  return {
    away: draftFromPreset({ year: 2001, code: 'SEA' }),
    home: draftFromPreset({ year: 2001, code: 'NYY' }),
  };
}

function TeamPanel({ side, draft, onChange, onEdit }: { side: Side; draft: TeamDraft; onChange: (d: TeamDraft) => void; onEdit: () => void }) {
  const [year, setYear] = useState(draft.name.startsWith('2000') ? 2000 : 2001);
  const cost = draftCost(draft);
  const issues = draftIssues(draft);
  const starter = draft.rotation[0] ? (CARDS_BY_ID[draft.rotation[0]] as PitcherCard) : null;
  const overCap = cost > POINT_CAP;

  return (
    <section className="team-panel" style={{ '--team': teamColor(draft.code) } as React.CSSProperties}>
      <header className="team-panel__head">
        <span className="team-panel__side">{side === 'away' ? 'Visitors' : 'Home'}</span>
        <input
          className="team-panel__name"
          value={draft.name}
          aria-label={`${side === 'away' ? 'Visiting' : 'Home'} team name`}
          onChange={(e) => onChange({ ...draft, name: e.target.value })}
        />
      </header>

      <div className="team-panel__pick">
        <label>
          <span>Real team</span>
          <select aria-label="Year" value={year} onChange={(e) => setYear(Number(e.target.value))}>
            {YEARS.map((y) => (
              <option key={y}>{y}</option>
            ))}
          </select>
        </label>
        <select
          aria-label="Real team"
          value={draft.capExempt && draft.code && draft.name.startsWith(String(year)) ? draft.code : ''}
          onChange={(e) => e.target.value && onChange(draftFromPreset({ year, code: e.target.value }))}
        >
          <option value="">Choose a team…</option>
          {TEAMS.map((team) => (
            <option key={team.code} value={team.code}>
              {team.city} {team.name}
            </option>
          ))}
        </select>
      </div>
      <div className="team-panel__actions">
        <button className="choice" onClick={() => onChange({ ...autoFill(emptyDraft(side === 'away' ? 'Visitors' : 'Home')) })}>
          <span className="choice__label">Random team</span>
        </button>
        <button className="choice" onClick={onEdit}>
          <span className="choice__label">Build your own</span>
        </button>
      </div>

      <ol className="mini-lineup">
        {draft.lineup.map((entry, i) => {
          const card = entry.cardId ? (CARDS_BY_ID[entry.cardId] as HitterCard) : null;
          return (
            <li key={`${entry.slot}-${i}`}>
              <span className="mini-lineup__slot">{entry.slot}</span>
              <span className="mini-lineup__name">{card?.name ?? '—'}</span>
              {card && (
                <span className="mini-lineup__stat">
                  {card.onBase} / {speedLetter(card.speed)}
                </span>
              )}
            </li>
          );
        })}
      </ol>
      <p className="team-panel__line">
        <strong>Rotation:</strong>{' '}
        {draft.rotation.map((id) => (id ? CARDS_BY_ID[id].name : '—')).join(', ')}
      </p>
      <p className="team-panel__line">
        <strong>Bullpen {draft.bullpen.length}</strong> · <strong>Bench {draft.bench.length}</strong>
        {starter && ` · Ace: ${starter.name}`}
      </p>
      <div className={`meter ${overCap && !draft.capExempt ? 'is-over' : ''}`}>
        <div className="meter__bar">
          <span style={{ width: `${Math.min(100, (cost / POINT_CAP) * 100)}%` }} />
        </div>
        <span className="meter__text">
          {cost.toLocaleString()} / {POINT_CAP.toLocaleString()} points
          {draft.capExempt && overCap ? ' · real roster, cap waived' : ''}
        </span>
      </div>
      {issues.length > 0 && (
        <ul className="issues">
          {issues.map((issue) => (
            <li key={issue}>{issue}</li>
          ))}
        </ul>
      )}
    </section>
  );
}

interface Props {
  onStart: (away: TeamDraft, home: TeamDraft) => void;
  initial: { away: TeamDraft; home: TeamDraft } | null;
}

export function SetupScreen({ onStart, initial }: Props) {
  const [drafts, setDrafts] = useState(() => initial ?? loadDrafts() ?? defaultDrafts());
  const [editing, setEditing] = useState<Side | null>(null);

  useEffect(() => saveDrafts(drafts), [drafts]);

  if (editing) {
    return (
      <RosterEditor
        draft={drafts[editing]}
        sideLabel={editing === 'away' ? 'Visitors' : 'Home'}
        onChange={(draft) => setDrafts({ ...drafts, [editing]: draft })}
        onDone={() => setEditing(null)}
      />
    );
  }

  const ready = draftIssues(drafts.away).length === 0 && draftIssues(drafts.home).length === 0;

  return (
    <div className="setup">
      <header className="setup__head">
        <h1 className="wordmark wordmark--large">Showdown</h1>
        <p>Two managers. One die. The 2000 and 2001 cards.</p>
      </header>
      <div className="setup__teams">
        <TeamPanel side="away" draft={drafts.away} onChange={(d) => setDrafts({ ...drafts, away: d })} onEdit={() => setEditing('away')} />
        <div className="setup__middle">
          <span className="setup__at">at</span>
          <button className="link-button" onClick={() => setDrafts({ away: drafts.home, home: drafts.away })}>
            Swap home and away
          </button>
        </div>
        <TeamPanel side="home" draft={drafts.home} onChange={(d) => setDrafts({ ...drafts, home: d })} onEdit={() => setEditing('home')} />
      </div>
      <div className="setup__start">
        <button className="choice choice--primary choice--big" disabled={!ready} onClick={() => onStart(drafts.away, drafts.home)}>
          <span className="choice__label">Play ball</span>
        </button>
      </div>
    </div>
  );
}
