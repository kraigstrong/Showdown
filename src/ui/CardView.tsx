import { teamColor, TEAMS_BY_CODE } from '../data/catalog';
import { chartOrder, chartRanges, speedLabel } from '../engine';
import type { GameCard, SwingResult } from '../engine';

const RESULT_LABELS: Record<SwingResult, string> = {
  PU: 'Out(PU)',
  SO: 'Out(SO)',
  GB: 'Out(GB)',
  FB: 'Out(FB)',
  BB: 'Walk',
  '1B': 'Single',
  '1B+': 'Single+',
  '2B': 'Double',
  '3B': 'Triple',
  HR: 'Homer',
};

const SET_SIZES: Record<string, number> = { '2000-BS': 462, '2000-PR': 150, '2001-BS': 462, '2001-PR': 175 };

/** Rows in the order the card prints them, with a dash for results it doesn't have. */
function chartRows(card: GameCard) {
  const ranges = chartRanges(card);
  return chartOrder(card.year)
    .filter((result) => (card.kind === 'hitter' ? result !== 'PU' : result !== '1B+' && result !== '3B'))
    .map((result) => ({ result, range: ranges.find((r) => r.result === result) }));
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
}

/** A card laid out like the 2000 set, with a team-color field where the photo would be. */
export function CardView({ card, active, roll, fatigue = 0, caption }: Props) {
  const team = TEAMS_BY_CODE[card.team];
  const setSize = SET_SIZES[`${card.year}-${card.set}`];
  const positions = card.kind === 'hitter' ? card.positions : [];
  return (
    <article className={`card ${active ? 'card--active' : ''}`} style={{ '--team': teamColor(card.team) } as React.CSSProperties}>
      {caption && <div className="card__caption">{caption}</div>}
      <div className="card__face" aria-label={`${card.name}, ${team ? `${team.city} ${team.name}` : card.team}, ${card.year}`}>
        <svg className="card__watermark" viewBox="0 0 100 100" aria-hidden="true">
          <circle cx="50" cy="50" r="46" />
          <path d="M22 13 Q46 50 22 87 M78 13 Q54 50 78 87" />
        </svg>
        <span className="card__ghost" aria-hidden="true">{card.team}</span>
        <div className="card__brand">MLB Showdown</div>
        <div className="card__strip">
          <h3 className="card__name">{card.name}</h3>
        </div>

        <div className="card__plates">
          <div className="plate plate--lead">
            <span className="plate__word">{card.kind === 'hitter' ? 'On-Base' : 'Control'}</span>
            <span className="ball">{card.kind === 'hitter' ? card.onBase : card.control}</span>
          </div>
          {card.kind === 'hitter' ? (
            <>
              <div className="plate">
                Speed {speedLabel(card)} <i>|</i> {card.hand}
              </div>
              {positions.map(({ pos, fielding }) => (
                <div className="plate" key={pos}>
                  {pos === 'DH' ? 'DH' : `${pos} +${fielding}`}
                </div>
              ))}
            </>
          ) : (
            <>
              <div className="plate">{card.role}</div>
              <div className="plate">
                {card.hand}HP <i>|</i> IP {card.ip}
              </div>
            </>
          )}
          <div className="plate plate--points">{card.points} pt.</div>
          {fatigue > 0 && <div className="plate plate--tired">Tired −{fatigue}</div>}
        </div>

        <div className="card__badge" title={team ? `${team.city} ${team.name}` : card.team}>{card.team}</div>

        <dl className="card__chart">
          {chartRows(card).map(({ result, range }) => {
            const hit = range !== undefined && roll !== null && roll !== undefined && roll >= range.from && roll <= range.to;
            return (
              <div key={result} className={`chart__row ${hit ? 'is-hit' : ''}`}>
                <dd>{range ? rangeText(range.from, range.to) : '—'}</dd>
                <dt>{RESULT_LABELS[result]}</dt>
              </div>
            );
          })}
        </dl>

        <div className="card__number">
          {setSize ? `${String(card.number).padStart(3, '0')}/${setSize}` : `${card.year} · ${String(card.number).padStart(3, '0')}`}
        </div>
      </div>
    </article>
  );
}
