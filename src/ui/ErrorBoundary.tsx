import { Component } from 'react';
import type { ReactNode } from 'react';
import { Wordmark } from './Wordmark';

/** Clears what this game keeps in the browser: saved teams and any game in progress. */
function clearSavedGame() {
  try {
    for (const key of Object.keys(localStorage)) if (key.startsWith('showdown.')) localStorage.removeItem(key);
  } catch {
    // Nothing more we can do; the reload below still tries again.
  }
}

/** If anything breaks while drawing the page, offer a way back instead of a blank screen. */
export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="setup">
        <header className="setup__head">
          <Wordmark large />
          <p className="setup__line">Something went wrong loading the game.</p>
        </header>
        <div className="setup__start">
          <button
            className="choice choice--primary choice--big"
            onClick={() => {
              clearSavedGame();
              window.location.reload();
            }}
          >
            <span className="choice__label">Start fresh</span>
          </button>
        </div>
      </div>
    );
  }
}
