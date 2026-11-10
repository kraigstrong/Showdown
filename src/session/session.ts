// The seam between the screens and a running game. The screens only know this
// interface, so online play means adding a second implementation that sends
// actions to a server, with no change to the screens or the rules.
import { applyAction, createGame, getPrompt } from '../engine';
import type { Action, GameEvent, GameSetup, GameState, Side } from '../engine';

/** Which manager this screen acts for. Two players on one screen act for both. */
export type Seat = Side | 'both';

export interface GameUpdate {
  state: GameState;
  events: GameEvent[];
}

export interface GameSession {
  readonly seat: Seat;
  getState(): GameState;
  /** Called with every change, whoever caused it. */
  subscribe(listener: (update: GameUpdate) => void): () => void;
  submit(action: Action): void;
}

const SAVE_KEY = 'showdown.game.v1';

function loadSavedGame(): GameState | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const state = JSON.parse(raw) as GameState;
    if (state.version !== 1) return null;
    // Saved before starters were picked on the setup screen and the game hadn't begun.
    if ((state.phase.kind as string) === 'rotation') return null;
    // Saved before stolen bases were kept.
    for (const team of Object.values(state.teams)) {
      for (const line of Object.values(team.batting)) line.sb ??= 0;
    }
    return state;
  } catch {
    return null;
  }
}

function saveGame(state: GameState | null) {
  try {
    if (state) localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    else localStorage.removeItem(SAVE_KEY);
  } catch {
    // A game that can't be saved still plays fine; it just won't survive a reload.
  }
}

/** Both managers share this device and the game runs right here in the page. */
export class LocalGameSession implements GameSession {
  readonly seat: Seat = 'both';
  private state: GameState;
  private listeners = new Set<(update: GameUpdate) => void>();

  constructor(state: GameState) {
    this.state = state;
    saveGame(state);
  }

  static start(setup: GameSetup): LocalGameSession {
    return new LocalGameSession(createGame(setup));
  }

  static resume(): LocalGameSession | null {
    const saved = loadSavedGame();
    return saved ? new LocalGameSession(saved) : null;
  }

  static clearSaved() {
    saveGame(null);
  }

  getState(): GameState {
    return this.state;
  }

  subscribe(listener: (update: GameUpdate) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  submit(action: Action) {
    const prompt = getPrompt(this.state);
    if (!prompt) return;
    const update = applyAction(this.state, prompt.actor, action);
    this.state = update.state;
    saveGame(update.state);
    for (const listener of this.listeners) listener(update);
  }
}
