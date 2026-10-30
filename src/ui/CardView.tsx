import { teamColor, TEAMS_BY_CODE } from '../data/catalog';
import { chartRanges, speedLetter } from '../engine';
import type { GameCard, SwingResult } from '../engine';

function resultGroup(result: SwingResult): string {
  switch (result) {
    case 'PU':
    case 'SO':
    case 'GB':
    case 'FB':
      return 'out';
    case 'BB':
      return 'walk';
    case '1B':
    case '1B+':
      return 'single';
    case '2B':
    case '3B':
      return 'extra';
    case 'HR':
      return 'homer';
  }
}

function positionsText(card: GameCard): string {
  if (card.kind === 'pitcher') return card.role;
  return card.positions
    .map(({ pos, fielding }) => (pos === 'DH' ? 'DH' : `${pos} +${fielding}`))
    .join(' · ');
}

function rangeText(from: number, to: number): string {
  return from === to ? `${from}` : `${from}–${to}`;
}

interface Props {
  card: GameCard;
  /** The chart this card is rolling on right now. */
  active?: boolean;
  /** The face that was just rolled on this chart. */
  roll?: number | null;
  /** Penalty on a tired pitcher's pitches. */
  fatigue?: number;
  /** Small words above the card, like "At bat". */
  caption?: string;
  compact?: boolean;
}

export function CardView({ card, active, roll, fatigue = 0, caption, compact }: Props) {
  const ranges = chartRanges(card.chart);
  const team = TEAMS_BY_CODE[card.team];
  const faces = ranges.flatMap((range) =>
    Array.from({ length: range.to - range.from + 1 }, (_, i) => ({ face: range.from + i, result: range.result })),
  );
  return (
    <article
      className={`card ${active ? 'card--active' : ''} ${compact ? 'card--compact' : ''}`}
      style={{ '--team': teamColor(card.team), '--team-accent': team?.accent ?? '#c4ced4' } as React.CSSProperties}
    >
      {caption && <div className="card__caption">{caption}</div>}
      <header className="card__head">
        <span className="card__team">{team ? `${team.city} ${team.name}` : card.team}</span>
        <span className="card__edition">
          {card.year} {card.set === 'PR' ? 'Pennant Run' : 'Base'} · {card.number}
        </span>
        <h3 className="card__name">{card.name}</h3>
      </header>

      <div className="card__stats">
        <div className="stat stat--lead">
          <strong>{card.kind === 'hitter' ? card.onBase : card.control}</strong>
          <span>{card.kind === 'hitter' ? 'On-Base' : 'Control'}</span>
        </div>
        <div className="stat">
          <strong>{card.kind === 'hitter' ? speedLetter(card.speed) : card.ip}</strong>
          <span>{card.kind === 'hitter' ? 'Speed' : 'IP'}</span>
        </div>
        <div className="stat">
          <strong>{card.hand}</strong>
          <span>{card.kind === 'hitter' ? 'Bats' : 'Throws'}</span>
        </div>
        <div className="stat">
          <strong>{card.points}</strong>
          <span>Points</span>
        </div>
      </div>
      <p className="card__positions">
        {positionsText(card)}
        {fatigue > 0 && <span className="tired">Tired −{fatigue}</span>}
      </p>

      <div className="strip" aria-hidden="true">
        {faces.map(({ face, result }) => (
          <span key={face} className={`strip__cell group-${resultGroup(result)} ${roll === face ? 'is-hit' : ''}`} />
        ))}
      </div>
      <dl className="chart">
        {ranges.map((range) => {
          const hit = roll !== null && roll !== undefined && roll >= range.from && roll <= range.to;
          return (
            <div key={range.result} className={`chart__row group-${resultGroup(range.result)} ${hit ? 'is-hit' : ''}`}>
              <dt>{range.result}</dt>
              <dd>{rangeText(range.from, range.to)}</dd>
            </div>
          );
        })}
      </dl>
    </article>
  );
}
