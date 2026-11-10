import { runs } from '../engine';
import type { GameState, Side } from '../engine';
import { inningLabel } from './describe';

const SIDES: Side[] = ['away', 'home'];

export function Scoreboard({ state }: { state: GameState }) {
  const innings = Math.max(9, state.inning);
  const over = state.phase.kind === 'over';
  return (
    <section className="scoreboard" aria-label="Scoreboard">
      <div className="scoreboard__grid" style={{ '--innings': innings } as React.CSSProperties}>
        <div className="sb-cell sb-cell--team sb-cell--head" />
        {Array.from({ length: innings }, (_, i) => (
          <div key={i} className={`sb-cell sb-cell--head ${!over && i + 1 === state.inning ? 'is-now' : ''}`}>
            {i + 1}
          </div>
        ))}
        <div className="sb-cell sb-cell--total sb-cell--head">R</div>
        <div className="sb-cell sb-cell--total sb-cell--head">H</div>

        {SIDES.map((side) => {
          const team = state.teams[side];
          const batting = !over && (side === 'away') === (state.half === 'top');
          return [
            <div key={`${side}-name`} className={`sb-cell sb-cell--team ${batting ? 'is-batting' : ''}`} title={team.name}>
              <span className="sb-full">{team.name}</span>
              <span className="sb-short">{team.code ?? team.name.slice(0, 3).toUpperCase()}</span>
            </div>,
            ...Array.from({ length: innings }, (_, i) => {
              const played = team.runsByInning[i];
              const skipped = over && side === 'home' && i + 1 === state.inning && played === undefined;
              return (
                <div key={`${side}-${i}`} className="sb-cell sb-cell--inning">
                  {skipped ? 'X' : played ?? ''}
                </div>
              );
            }),
            <div key={`${side}-r`} className="sb-cell sb-cell--total sb-cell--runs">
              {runs(state, side)}
            </div>,
            <div key={`${side}-h`} className="sb-cell sb-cell--total">
              {team.hits}
            </div>,
          ];
        })}
      </div>
      <div className="scoreboard__status">
        <span className="scoreboard__inning">{over ? 'Final' : inningLabel(state)}</span>
        {!over && (
          <span className="outs" aria-label={`${state.outs} out`}>
            <span className="outs__label">Outs</span>
            {[0, 1, 2].map((n) => (
              <span key={n} className={`outs__dot ${n < state.outs ? 'is-on' : ''}`} />
            ))}
          </span>
        )}
      </div>
    </section>
  );
}
