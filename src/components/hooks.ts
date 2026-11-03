'use client';

import { useEffect, useState } from 'react';

export const prefersReducedMotion = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

// Simulated terminal: print `lines` one by one (all at once under reduced motion). `null` clears it.
// `lines` must be referentially stable between renders, otherwise the animation restarts.
export function useTyping(lines: string[] | null, ms = 650) {
  const [text, setText] = useState('');
  useEffect(() => {
    if (!lines) { setText(''); return; }
    if (prefersReducedMotion()) { setText(lines.join('\n')); return; }
    setText('');
    let i = 0;
    let timer: ReturnType<typeof setTimeout>;
    const next = () => {
      if (i < lines.length) {
        const line = lines[i++];
        setText((prev) => (prev ? `${prev}\n` : '') + line);
        timer = setTimeout(next, ms);
      }
    };
    next();
    return () => clearTimeout(timer);
  }, [lines, ms]);
  return text;
}
