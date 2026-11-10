import { useEffect, useState } from 'react';

interface Props {
  /** The face to show. Null shows a blank die before the first roll. */
  value: number | null;
  rolling: boolean;
}

/** A twenty-sided die. While rolling it tumbles through faces, then lands on the value. */
export function Die({ value, rolling }: Props) {
  const [face, setFace] = useState<number | null>(value);

  useEffect(() => {
    if (!rolling) {
      setFace(value);
      return;
    }
    const timer = window.setInterval(() => setFace(Math.floor(Math.random() * 20) + 1), 70);
    return () => window.clearInterval(timer);
  }, [rolling, value]);

  return (
    <div className={`die ${rolling ? 'is-rolling' : value !== null ? 'is-landed' : ''}`} key={rolling ? 'rolling' : `landed-${value}`}>
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <polygon className="die__body" points="50,3 91,26.5 91,73.5 50,97 9,73.5 9,26.5" />
        <polygon className="die__face" points="50,24 74,66 26,66" />
        <g className="die__edges">
          <polyline points="50,3 50,24 26,66 9,73.5" />
          <polyline points="50,24 74,66 91,73.5" />
          <polyline points="9,26.5 50,24 91,26.5" />
          <polyline points="9,26.5 26,66 50,97 74,66 91,26.5" />
        </g>
      </svg>
      <span className="die__value">{face ?? 'd20'}</span>
    </div>
  );
}
