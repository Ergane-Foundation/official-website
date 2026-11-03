'use client';

import { useEffect, useState } from 'react';
import { contributionSteps } from '@/lib/site';
import { prefersReducedMotion } from './hooks';

// ── Contribution steps ───────────────────────────────────────────────────────────────────────────────────────────

export function ContributionSteps() {
  const [step, setStep] = useState(1);
  return (
    <div className="steps">
      <div className="step-tabs" role="group" aria-label="Contribution steps">
        {contributionSteps.map(([title], i) => (
          <button key={title} className="stage" type="button" aria-pressed={step === i + 1} onClick={() => setStep(i + 1)}>
            <span className="mono">0{i + 1}</span><b>{title}</b>
          </button>
        ))}
      </div>
      <div className="step-body card">
        {contributionSteps.map(([title, body], i) => (
          <div key={title} className={step === i + 1 ? 'on' : ''}>
            <span className="mono">STEP 0{i + 1}</span><h3>{title}</h3><p>{body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Typing command block used in the bento ───────────────────────────────────────────────────────────────────────

export function CycleCli({ commands }: { commands: string[] }) {
  const [text, setText] = useState('');
  useEffect(() => {
    if (prefersReducedMotion()) { setText(commands[0]); return; }
    let c = 0, i = 0, dir = 1;
    const id = setInterval(() => {
      i += dir;
      setText(commands[c].slice(0, i));
      if (i >= commands[c].length + 14) dir = -1;
      if (i <= 0) { dir = 1; c = (c + 1) % commands.length; }
    }, 55);
    return () => clearInterval(id);
  }, [commands]);
  return (
    <div className="cli"><span className="mono">$</span> <code>{text}</code><i className="caret" /></div>
  );
}
