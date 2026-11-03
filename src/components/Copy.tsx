'use client';

import { useState } from 'react';

function useCopy(text: string) {
  const [done, setDone] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setDone(true);
      setTimeout(() => setDone(false), 1500);
    } catch {}
  };
  return [done, copy] as const;
}

// Terminal-style command chip.
export function CopyCmd({ cmd, label = cmd }: { cmd: string; label?: string }) {
  const [done, copy] = useCopy(cmd);
  return (
    <button className="cmd" type="button" onClick={copy} aria-label={`Copy command: ${cmd}`}>
      <span className="mono">$</span> <code>{label}</code><span className="mono cp">{done ? 'copied' : 'copy'}</span>
    </button>
  );
}

export function CodeBlock({ code }: { code: string }) {
  const [done, copy] = useCopy(code);
  return (
    <pre className="code">
      <button className="cp mono" type="button" onClick={copy}>{done ? 'copied' : 'copy'}</button>
      <code>{code}</code>
    </pre>
  );
}
