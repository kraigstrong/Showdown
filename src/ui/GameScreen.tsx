import { useEffect, useRef, useState } from 'react';
import { teamColor } from '../data/catalog';
import {
  currentBatterId,
  currentFatigue,
  currentPitcherId,
  defenseSide,
  getPrompt,
  offenseSide,
  runs,
} from '../engine';
import type { Action, GameEvent, GameState, Side } from '../engine';
import type { GameSession } from '../session/session';
import { BoxScore, LineupsPanel } from './BoxScore';
import { CardView } from './CardView';
import { choiceText, eventLine, inningLabel, promptDetail, promptTitle } from './describe';
import { Die } from './Die';
import { Field } from './Field';
import { Scoreboard } from './Scoreboard';
import { useGamePlayer } from './useGamePlayer';

interface Props {
  session: GameSession;
  onExit: () => void;
  onRematch?: () => void;
}

type Tab = 'log' | 'lineups' | 'box';

function Choices({ state, disabled, onChoose, seat }: { state: GameState; disabled: boolean; onChoose: (a: Action) => void; seat: GameSession['seat'] }) {
  const prompt = getPrompt(state);
  const [open, setOpen] = useState<null | 'bench' | 'bullpen'>(null);
  const primaryRef = useRef<HTMLButtonElement>(null);

  // Keep the keyboard on the main button, so Space or Enter plays the next step.
  useEffect(() => {
    if (!disabled) primaryRef.current?.focus({ preventScroll: true });
    setOpen(null);
  }, [disabled, state.log.length, state.phase.kind]);

  if (!prompt) return null;
  const canAct = seat === 'both' || seat === prompt.actor;
  const main = prompt.actions.filter((a) => a.type !== 'PINCH_HIT' && a.type !== 'CHANGE_PITCHER');
  const bench = prompt.actions.filter((a) => a.type === 'PINCH_HIT');
  const bullpen = prompt.actions.filter((a) => a.type === 'CHANGE_PITCHER');

  const button = (action: Action, index: number, list: 'main' | 'sub') => {
    const text = choiceText(state, action);
    const primary = list === 'main' && index === 0;
    return (
      <button
        key={JSON.stringify(action)}
        ref={primary ? primaryRef : undefined}
        className={`choice ${primary ? 'choice--primary' : ''} ${list === 'sub' ? 'choice--sub' : ''}`}
        disabled={disabled || !canAct}
        data-action={action.type}
        onClick={() => onChoose(action)}
      >
        <span className="choice__label">{text.label}</span>
        {text.detail && <span className="choice__detail">{text.detail}</span>}
      </button>
    );
  };

  return (
    <div className="choices">
      <div className="choices__main">{main.map((action, i) => button(action, i, 'main'))}</div>
      {(bench.length > 0 || bullpen.length > 0) && (
        <div className="choices__more">
          {bench.length > 0 && (
            <button className="link-button" disabled={disabled} onClick={() => setOpen(open === 'bench' ? null : 'bench')} aria-expanded={open === 'bench'}>
              Pinch hit ({bench.length})
            </button>
          )}
          {bullpen.length > 0 && (
            <button className="link-button" disabled={disabled} onClick={() => setOpen(open === 'bullpen' ? null : 'bullpen')} aria-expanded={open === 'bullpen'}>
              Change pitcher ({bullpen.length})
            </button>
          )}
        </div>
      )}
      {open === 'bench' && <div className="choices__list">{bench.map((action, i) => button(action, i, 'sub'))}</div>}
      {open === 'bullpen' && <div className="choices__list">{bullpen.map((action, i) => button(action, i, 'sub'))}</div>}
    </div>
  );
}

function PlayLog({ state }: { state: GameState }) {
  const lines: { key: number; text: string; header?: boolean }[] = [];
  state.log.forEach((event, i) => {
    if (event.t === 'half') {
      lines.push({ key: i, text: inningLabel(event), header: true });
      return;
    }
    if (event.t === 'pitch') return;
    const text = eventLine(state, event);
    if (text) lines.push({ key: i, text });
  });
  return (
    <ol className="log">
      {lines.reverse().map((line) => (
        <li key={line.key} className={line.header ? 'log__header' : undefined}>
          {line.text}
        </li>
      ))}
    </ol>
  );
}

function latestText(state: GameState, events: GameEvent[]): string {
  return events
    .filter((e) => e.t !== 'half')
    .map((e) => eventLine(state, e))
    .filter(Boolean)
    .join(' ');
}

export function GameScreen({ session, onExit, onRematch }: Props) {
  const player = useGamePlayer(session);
  const { view, die, banner, busy, lastSwing, latest, scoring, submit } = player;
  const [tab, setTab] = useState<Tab>('log');
  const [confirmExit, setConfirmExit] = useState(false);

  const prompt = getPrompt(view);
  const started = view.phase.kind !== 'rotation';
  const over = view.phase.kind === 'over';

  const offense = offenseSide(view);
  const defense = defenseSide(view);
  const batterId = started && !over ? currentBatterId(view) : null;
  const pitcherId = started && !over ? currentPitcherId(view) : null;

  // After a swing, keep the highlighted card up until the next pitch comes in.
  const shownBatterId = lastSwing?.batterId ?? batterId;
  const shownPitcherId = lastSwing?.pitcherId ?? pitcherId;
  const swingOn = view.phase.kind === 'swing' ? view.phase.on : lastSwing?.on ?? null;

  const actorSide: Side | null = prompt?.actor ?? null;
  const fatigue = started && !over && !lastSwing ? currentFatigue(view) : 0;

  return (
    <div className="game">
      <header className="game__bar">
        <h1 className="wordmark">Showdown</h1>
        <div className="game__tools">
          {confirmExit ? (
            <>
              <span className="game__confirm">End this game?</span>
              <button className="link-button" onClick={onExit}>Yes, end it</button>
              <button className="link-button" onClick={() => setConfirmExit(false)}>Keep playing</button>
            </>
          ) : (
            <button className="link-button" onClick={() => setConfirmExit(true)}>New game</button>
          )}
        </div>
      </header>

      <Scoreboard state={view} />

      <main className="game__table">
        <div className="game__card game__card--pitcher">
          {shownPitcherId ? (
            <CardView
              card={view.cards[shownPitcherId]}
              caption={`On the mound · ${view.teams[lastSwing ? (lastSwing.side === 'away' ? 'home' : 'away') : defense].name}`}
              active={swingOn === 'pitcher'}
              roll={lastSwing?.on === 'pitcher' ? lastSwing.roll : null}
              fatigue={fatigue}
            />
          ) : (
            <div className="card card--placeholder">{over ? 'Ball game.' : 'Starting pitchers are set by the first roll.'}</div>
          )}
        </div>

        <section className="game__center" style={{ '--actor': teamColor(actorSide ? view.teams[actorSide].code : undefined) } as React.CSSProperties}>
          <Field state={view} scoring={scoring} banner={banner}>
            <Die value={die.value} rolling={die.rolling} />
          </Field>

          <div className="panel" aria-live="polite">
            {over ? (
              <GameOver state={view} onExit={onExit} onRematch={onRematch} onShowBox={() => setTab('box')} />
            ) : (
              <>
                {actorSide && (
                  <div className="panel__who">
                    <span className="panel__dot" />
                    {view.teams[actorSide].name} manager
                  </div>
                )}
                <h2 className="panel__title">{promptTitle(view)}</h2>
                {promptDetail(view) && <p className="panel__detail">{promptDetail(view)}</p>}
                <Choices key={view.log.length} state={view} disabled={busy} onChoose={submit} seat={session.seat} />
                {latest.length > 0 && <p className="panel__latest">{latestText(view, latest)}</p>}
              </>
            )}
          </div>
        </section>

        <div className="game__card game__card--batter">
          {shownBatterId ? (
            <CardView
              card={view.cards[shownBatterId]}
              caption={`At bat · ${view.teams[lastSwing ? lastSwing.side : offense].name}`}
              active={swingOn === 'batter'}
              roll={lastSwing?.on === 'batter' ? lastSwing.roll : null}
            />
          ) : (
            <div className="card card--placeholder">{over ? 'Ball game.' : 'Visitors bat first.'}</div>
          )}
        </div>
      </main>

      <section className="game__extras">
        <div className="tabs" role="tablist">
          {(['log', 'lineups', 'box'] as Tab[]).map((name) => (
            <button key={name} role="tab" aria-selected={tab === name} className={`tab ${tab === name ? 'is-active' : ''}`} onClick={() => setTab(name)}>
              {{ log: 'Play by play', lineups: 'Lineups', box: 'Box score' }[name]}
            </button>
          ))}
        </div>
        {tab === 'log' && <PlayLog state={view} />}
        {tab === 'lineups' && <LineupsPanel state={view} />}
        {tab === 'box' && <BoxScore state={view} />}
      </section>
    </div>
  );
}

function GameOver({ state, onExit, onRematch, onShowBox }: { state: GameState; onExit: () => void; onRematch?: () => void; onShowBox: () => void }) {
  const winner = state.winner as Side;
  const loser: Side = winner === 'home' ? 'away' : 'home';
  return (
    <div className="gameover">
      <div className="panel__who">Final{state.inning !== 9 ? ` · ${state.inning} innings` : ''}</div>
      <h2 className="panel__title">
        {state.teams[winner].name} win {runs(state, winner)}–{runs(state, loser)}
      </h2>
      <div className="choices__main">
        {onRematch && (
          <button className="choice choice--primary" onClick={onRematch}>
            <span className="choice__label">Rematch</span>
          </button>
        )}
        <button className="choice" onClick={onShowBox}>
          <span className="choice__label">Box score</span>
        </button>
        <button className="choice" onClick={onExit}>
          <span className="choice__label">New teams</span>
        </button>
      </div>
    </div>
  );
}
