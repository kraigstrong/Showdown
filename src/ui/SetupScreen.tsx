import { useEffect, useState } from 'react';
import { CARDS_BY_ID, teamColor, TEAMS, YEARS } from '../data/catalog';
import { speedLabel } from '../engine';
import type { HitterCard, PitcherCard, Side } from '../engine';
import { autoFill, draftCost, draftFromPreset, draftIssues, emptyDraft, POINT_CAP } from '../teams/roster';
import type { TeamDraft } from '../teams/roster';
import { SAVED_TEAMS, SAVED_TEAMS_BY_ID, savedTeamDraft } from '../teams/savedTeams';
import { RosterEditor } from './RosterEditor';
import type { Starters } from './App';
import { Wordmark } from './Wordmark';

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

/** The pick if it's still in the rotation, otherwise the ace. */
export function starterFor(draft: TeamDraft, pick: string | null | undefined): string | null {
  const rotation = draft.rotation.filter((id): id is string => id !== null);
  return pick && rotation.includes(pick) ? pick : rotation[0] ?? null;
}

interface PanelProps {
  side: Side;
  draft: TeamDraft;
  starterId: string | null;
  onChange: (d: TeamDraft) => void;
  onStarter: (id: string) => void;
  onEdit: () => void;
}

function TeamPanel({ side, draft, starterId, onChange, onStarter, onEdit }: PanelProps) {
  const [year, setYear] = useState(draft.name.startsWith('2000') ? 2000 : 2001);
  const cost = draftCost(draft);
  const issues = draftIssues(draft);
  const overCap = cost > POINT_CAP;
  const rotation = draft.rotation.filter((id): id is string => id !== null);

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
          value={draft.capExempt && !draft.savedTeam && draft.code && draft.name.startsWith(String(year)) ? draft.code : ''}
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
      {SAVED_TEAMS.length > 0 && (
        <label className="team-panel__field">
          <span>Saved team</span>
          <select
            aria-label={`${side === 'away' ? 'Visitors' : 'Home'} saved team`}
            value={draft.savedTeam && SAVED_TEAMS_BY_ID[draft.savedTeam] ? draft.savedTeam : ''}
            onChange={(e) => e.target.value && onChange(savedTeamDraft(SAVED_TEAMS_BY_ID[e.target.value]))}
          >
            <option value="">Choose a saved team…</option>
            {SAVED_TEAMS.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
        </label>
      )}
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
                  {card.onBase} / {speedLabel(card)}
                </span>
              )}
            </li>
          );
        })}
      </ol>
      <label className="team-panel__field">
        <span>Starting pitcher</span>
        <select
          aria-label={`${side === 'away' ? 'Visitors' : 'Home'} starting pitcher`}
          value={starterId ?? ''}
          disabled={rotation.length === 0}
          onChange={(e) => onStarter(e.target.value)}
        >
          {rotation.length === 0 && <option value="">Add starters first</option>}
          {rotation.map((id, i) => {
            const card = CARDS_BY_ID[id] as PitcherCard;
            return (
              <option key={id} value={id}>
                {i + 1}. {card.name} · Control {card.control}, IP {card.ip}
              </option>
            );
          })}
        </select>
      </label>
      <p className="team-panel__line">
        <strong>Bullpen {draft.bullpen.length}</strong> · <strong>Bench {draft.bench.length}</strong>
      </p>
      <div className={`meter ${overCap && (!draft.capExempt || draft.savedTeam) ? 'is-over' : ''}`}>
        <div className="meter__bar">
          <span style={{ width: `${Math.min(100, (cost / POINT_CAP) * 100)}%` }} />
        </div>
        <span className="meter__text">
          {cost.toLocaleString()} / {POINT_CAP.toLocaleString()} points
          {draft.capExempt && overCap ? (draft.savedTeam ? ' · Over cap' : ' · real roster, cap waived') : ''}
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
  onStart: (away: TeamDraft, home: TeamDraft, starters: Starters) => void;
  initial: { away: TeamDraft; home: TeamDraft; starters: Starters } | null;
}

export function SetupScreen({ onStart, initial }: Props) {
  const [drafts, setDrafts] = useState(() => (initial ? { away: initial.away, home: initial.home } : loadDrafts() ?? defaultDrafts()));
  const [picks, setPicks] = useState<Partial<Starters>>(() => initial?.starters ?? {});
  const [editing, setEditing] = useState<Side | null>(null);
  const starters = { away: starterFor(drafts.away, picks.away), home: starterFor(drafts.home, picks.home) };

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
  const panel = (side: Side) => (
    <TeamPanel
      side={side}
      draft={drafts[side]}
      starterId={starters[side]}
      onChange={(d) => setDrafts({ ...drafts, [side]: d })}
      onStarter={(id) => setPicks({ ...picks, [side]: id })}
      onEdit={() => setEditing(side)}
    />
  );

  return (
    <div className="setup">
      <header className="setup__head">
        <Wordmark large />
        <p className="setup__band">Two-Player Game</p>
        <p className="setup__line">Two managers. One die. The 2000 and 2001 cards.</p>
      </header>
      <div className="setup__teams">
        {panel('away')}
        <div className="setup__middle">
          <span className="setup__at">at</span>
          <button
            className="link-button"
            onClick={() => {
              setDrafts({ away: drafts.home, home: drafts.away });
              setPicks({ away: picks.home, home: picks.away });
            }}
          >
            Swap home and away
          </button>
        </div>
        {panel('home')}
      </div>
      <div className="setup__start">
        <button
          className="choice choice--primary choice--big"
          disabled={!ready}
          onClick={() => onStart(drafts.away, drafts.home, starters as Starters)}
        >
          <span className="choice__label">Play ball</span>
        </button>
      </div>
    </div>
  );
}
