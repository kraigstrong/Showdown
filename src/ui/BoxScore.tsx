import { currentBatterId, offenseSide, speedLabel } from '../engine';
import type { GameState, HitterCard, PitcherCard, Side } from '../engine';
import { inningsPitched } from './describe';

const SIDES: Side[] = ['away', 'home'];

export function BoxScore({ state }: { state: GameState }) {
  return (
    <div className="box">
      {SIDES.map((side) => {
        const team = state.teams[side];
        return (
          <div key={side} className="box__team">
            <h3>{team.name}</h3>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Batting</th>
                    <th>AB</th>
                    <th>R</th>
                    <th>H</th>
                    <th>HR</th>
                    <th>RBI</th>
                    <th>BB</th>
                    <th>SO</th>
                    <th>SB</th>
                  </tr>
                </thead>
                <tbody>
                  {team.battersUsed.map((id) => {
                    const line = team.batting[id];
                    return (
                      <tr key={id}>
                        <td>{state.cards[id].name}</td>
                        <td>{line.ab}</td>
                        <td>{line.r}</td>
                        <td>{line.h}</td>
                        <td>{line.hr}</td>
                        <td>{line.rbi}</td>
                        <td>{line.bb}</td>
                        <td>{line.so}</td>
                        <td>{line.sb}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {team.pitchersUsed.length > 0 && (
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Pitching</th>
                      <th>IP</th>
                      <th>H</th>
                      <th>R</th>
                      <th>BB</th>
                      <th>SO</th>
                      <th>HR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {team.pitchersUsed.map((id) => {
                      const line = team.pitching[id];
                      return (
                        <tr key={id}>
                          <td>{state.cards[id].name}</td>
                          <td>{inningsPitched(line.outs)}</td>
                          <td>{line.h}</td>
                          <td>{line.r}</td>
                          <td>{line.bb}</td>
                          <td>{line.so}</td>
                          <td>{line.hr}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function LineupsPanel({ state }: { state: GameState }) {
  const inPlay = state.phase.kind !== 'over';
  const batterId = inPlay ? currentBatterId(state) : null;
  const batting = offenseSide(state);
  return (
    <div className="box">
      {SIDES.map((side) => {
        const team = state.teams[side];
        return (
          <div key={side} className="box__team">
            <h3>{team.name}</h3>
            <ol className="lineup">
              {team.lineup.map((entry, i) => {
                const card = state.cards[entry.cardId] as HitterCard;
                const up = side === batting && entry.cardId === batterId;
                return (
                  <li key={entry.cardId} className={up ? 'is-up' : undefined}>
                    <span className="lineup__order">{i + 1}</span>
                    <span className="lineup__slot">{entry.slot}</span>
                    <span className="lineup__name">{card.name}</span>
                    <span className="lineup__stats">
                      OB {card.onBase} · {speedLabel(card)}
                    </span>
                  </li>
                );
              })}
            </ol>
            <p className="lineup__group">
              <strong>Bench:</strong>{' '}
              {team.bench.length > 0 ? team.bench.map((id) => state.cards[id].name).join(', ') : 'none left'}
            </p>
            <p className="lineup__group">
              <strong>Bullpen:</strong>{' '}
              {team.bullpen.length > 0
                ? team.bullpen
                    .map((id) => {
                      const card = state.cards[id] as PitcherCard;
                      return `${card.name} (C${card.control}, IP ${card.ip})`;
                    })
                    .join(', ')
                : 'none left'}
            </p>
          </div>
        );
      })}
    </div>
  );
}
