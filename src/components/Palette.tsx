'use client';

import type { Route } from 'next';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export type PaletteItem = { t: string; d: string; h: string; g?: string; k: string };

// Command palette (Ctrl/Cmd+K, or the header button via the "ergane:palette" event).
export function Palette({ items }: { items: PaletteItem[] }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const router = useRouter();
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(0);

  const hits = useMemo(() => {
    const words = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
    return items.filter((i) => words.every((w) => `${i.t} ${i.d} ${i.k} ${i.g ? 'github' : ''}`.toLowerCase().includes(w))).slice(0, 12);
  }, [q, items]);
  const active = Math.min(sel, Math.max(0, hits.length - 1));

  const open = useCallback(() => {
    setQ('');
    setSel(0);
    dialog.current?.showModal();
    input.current?.focus();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (dialog.current?.open) dialog.current.close(); else open();
      }
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('ergane:palette', open);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('ergane:palette', open);
    };
  }, [open]);

  useEffect(() => {
    list.current?.querySelector('[aria-selected=true]')?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  const choose = (i: PaletteItem, shift: boolean) => {
    if (shift && i.g) { window.open(i.g, '_blank', 'noopener'); return; }
    dialog.current?.close();
    router.push(i.h as Route);
  };

  return (
    <dialog id="palette" ref={dialog} aria-label="Command palette" onClick={(e) => { if (e.target === dialog.current) dialog.current?.close(); }}>
      <form method="dialog" onSubmit={(e) => e.preventDefault()}>
        <input
          id="pq"
          ref={input}
          type="text"
          value={q}
          placeholder="Jump to a project or page…"
          autoComplete="off"
          spellCheck={false}
          aria-label="Search"
          onChange={(e) => { setQ(e.target.value); setSel(0); }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
              e.preventDefault();
              setSel((active + (e.key === 'ArrowDown' ? 1 : -1) + hits.length) % Math.max(1, hits.length));
            } else if (e.key === 'Enter' && hits[active]) {
              e.preventDefault();
              choose(hits[active], e.shiftKey);
            }
          }}
        />
        <ul id="pr" role="listbox" ref={list}>
          {hits.length ? hits.map((h, n) => (
            <li key={h.h}>
              <a role="option" href={h.h} aria-selected={n === active} onClick={(e) => { e.preventDefault(); choose(h, false); }}>
                <span>{h.t}</span><span className="mono">{h.k}</span>
              </a>
              {h.g ? <a className="gh mono" href={h.g} target="_blank" rel="noopener" aria-label={`${h.t} on GitHub`}>GitHub ↗</a> : null}
            </li>
          )) : <li><a aria-selected="false"><span>No matches</span></a></li>}
        </ul>
        <p className="mono hint">↑↓ navigate · ↵ open · ⇧↵ GitHub · esc close</p>
      </form>
    </dialog>
  );
}
