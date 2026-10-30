import type { ReactNode } from 'react';
import { teamColor } from '../data/catalog';
import { currentBatterId, offenseSide } from '../engine';
import type { GameState } from '../engine';
import { lastName } from './describe';
import type { Banner } from './useGamePlayer';

const BASE_SPOTS = ['first', 'second', 'third'] as const;

function Runner({ state, id, spot, leaving }: { state: GameState; id: string; spot: string; leaving?: boolean }) {
  const name = lastName(state.cards[id].name);
  return (
    <div className={`runner runner--${spot} ${leaving ? 'runner--scoring' : ''}`}>
      <span className="runner__dot">{name.slice(0, 2)}</span>
      <span className="runner__name">{name}</span>
    </div>
  );
}

interface Props {
  state: GameState;
  scoring: string[];
  banner: Banner | null;
  /** The die, which sits on the mound. */
  children: ReactNode;
}

export function Field({ state, scoring, banner, children }: Props) {
  const inPlay = state.phase.kind !== 'rotation' && state.phase.kind !== 'over';
  const side = offenseSide(state);
  const phase = state.phase;
  // While runners are being sent, the batter's turn at the plate is already over.
  const playContinuing =
    phase.kind === 'send' || ((phase.kind === 'aim' || phase.kind === 'throw') && phase.play !== 'steal');
  const upNext = inPlay ? currentBatterId(state) : null;
  const batterId = upNext && !playContinuing && !state.bases.includes(upNext) ? upNext : null;
  const onBase =state.bases.map((id, i) => (id ? { id, spot: BASE_SPOTS[i] } : null)).filter((r): r is { id: string; spot: (typeof BASE_SPOTS)[number] } => r !== null);
  const runners = [...onBase].sort((a, b) => a.id.localeCompare(b.id));

  return (
    <div className="field" style={{ '--offense': teamColor(state.teams[side].code) } as React.CSSProperties}>
      <svg className="field__art" viewBox="0 0 400 340" aria-hidden="true">
        <defs>
          <pattern id="mow" width="40" height="40" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="40" height="40" fill="#2c7a4d" />
            <rect width="20" height="40" fill="#2f8354" />
          </pattern>
        </defs>
        <rect width="400" height="340" fill="url(#mow)" />
        <path d="M 200 22 L 366 170 L 200 318 L 34 170 Z" fill="#b98a58" />
        <path d="M 200 86 L 298 172 L 200 258 L 102 172 Z" fill="#2f8354" />
        <path d="M 200 22 L 366 170 M 366 170 L 200 318 M 200 318 L 34 170 M 34 170 L 200 22" stroke="#f4efe0" strokeOpacity=".55" strokeWidth="2" />
        <circle cx="200" cy="172" r="46" fill="#b98a58" />
        <rect x="192" y="42" width="16" height="16" transform="rotate(45 200 50)" fill="#f7f1e1" />
        <rect x="334" y="162" width="16" height="16" transform="rotate(45 342 170)" fill="#f7f1e1" />
        <rect x="50" y="162" width="16" height="16" transform="rotate(45 58 170)" fill="#f7f1e1" />
        <path d="M 192 292 L 208 292 L 208 300 L 200 308 L 192 300 Z" fill="#f7f1e1" />
      </svg>

      {runners.map(({ id, spot }) => (
        <Runner key={id} state={state} id={id} spot={spot} />
      ))}
      {scoring.map((id) => (
        <Runner key={`scoring-${id}`} state={state} id={id} spot="home" leaving />
      ))}
      {batterId && (
        <div className="runner runner--home runner--batter">
          <span className="runner__dot">{lastName(state.cards[batterId].name).slice(0, 2)}</span>
          <span className="runner__name">{lastName(state.cards[batterId].name)}</span>
        </div>
      )}

      <div className="field__die">{children}</div>
      {banner && (
        <div key={banner.id} className={`banner banner--${banner.tone}`}>
          {banner.text}
        </div>
      )}
    </div>
  );
}
