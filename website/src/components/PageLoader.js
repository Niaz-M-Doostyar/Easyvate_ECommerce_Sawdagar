'use client';

import { useEffect, useState } from 'react';

export default function PageLoader() {
  const [phase, setPhase] = useState('visible');

  useEffect(() => {
    let exitTimer;
    let safetyTimer;
    let frame;
    let dismissed = false;

    const dismiss = () => {
      if (dismissed) return;
      dismissed = true;
      setPhase('leaving');
      exitTimer = window.setTimeout(() => setPhase('hidden'), 180);
    };

    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      frame = window.requestAnimationFrame(dismiss);
    } else {
      window.addEventListener('load', dismiss, { once: true });
    }
    safetyTimer = window.setTimeout(dismiss, 450);

    return () => {
      window.removeEventListener('load', dismiss);
      window.cancelAnimationFrame(frame);
      window.clearTimeout(exitTimer);
      window.clearTimeout(safetyTimer);
    };
  }, []);

  if (phase === 'hidden') return null;

  return (
    <div className={`sd-page-loader${phase === 'leaving' ? ' is-leaving' : ''}`} role="status" aria-live="polite">
      <div className="sd-page-loader__mark" aria-hidden="true">
        <span>S</span>
        <i />
      </div>
      <span className="sd-sr-only">Loading Sawdagar</span>
    </div>
  );
}
