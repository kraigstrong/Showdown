function Baseball() {
  return (
    <svg className="wordmark__ball" viewBox="0 0 100 100" aria-hidden="true">
      <circle cx="50" cy="50" r="45" fill="#fff" stroke="currentColor" strokeWidth="9" />
      <path d="M26 16 Q48 50 26 84 M74 16 Q52 50 74 84" fill="none" stroke="#b3202a" strokeWidth="7" strokeDasharray="7 5" />
    </svg>
  );
}

/** Modeled on the logo on the 2000 starter set box. */
export function Wordmark({ large }: { large?: boolean }) {
  return (
    <h1 className={`wordmark ${large ? 'wordmark--large' : ''}`} aria-label="MLB Showdown 2000">
      <svg className="wordmark__swoosh" viewBox="0 0 400 70" preserveAspectRatio="none" aria-hidden="true">
        <path d="M10 66 C 110 -8, 300 -14, 392 42 C 300 6, 130 12, 10 66 Z" />
      </svg>
      <span className="wordmark__mlb" aria-hidden="true">MLB</span>
      <span className="wordmark__word" aria-hidden="true">
        SHOWD
        <Baseball />
        WN
      </span>
      <span className="wordmark__foot" aria-hidden="true">
        <span className="wordmark__sub">Card Game</span>
        <span className="wordmark__year">2000</span>
      </span>
    </h1>
  );
}
