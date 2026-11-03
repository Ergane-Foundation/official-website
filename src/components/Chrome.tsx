'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { nav } from '@/lib/site';
import { ThemeIcon } from './icons';

const THEME_KEY = 'ergane-theme';

// Dark is the default; /research reads better as "technical paper". A saved choice always wins.
// Mirrors the inline script in layout.tsx, which sets the same value before first paint.
export function ThemeSync() {
  const pathname = usePathname();
  useEffect(() => {
    let saved: string | null = null;
    try { saved = localStorage.getItem(THEME_KEY); } catch {}
    document.documentElement.dataset.theme = saved ?? (pathname.startsWith('/research') ? 'light' : 'dark');
  }, [pathname]);
  return null;
}

export function ThemeToggle() {
  return (
    <button
      className="btn sm ghost icon"
      type="button"
      aria-label="Toggle light and dark theme"
      onClick={() => {
        const next = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
        document.documentElement.dataset.theme = next;
        try { localStorage.setItem(THEME_KEY, next); } catch {}
      }}
    >
      <ThemeIcon />
    </button>
  );
}

export function Nav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Primary">
      {nav.map((n) => (
        <Link key={n.href} href={n.href} aria-current={pathname.startsWith(n.href) ? 'page' : undefined}>{n.label}</Link>
      ))}
    </nav>
  );
}

export function PaletteButton() {
  const [mac, setMac] = useState(false);
  useEffect(() => setMac(/Mac|iPhone|iPad/.test(navigator.platform)), []);
  return (
    <button className="btn sm ghost" type="button" aria-label="Search the site" onClick={() => window.dispatchEvent(new Event('ergane:palette'))}>
      Search <kbd>{mac ? '⌘K' : 'Ctrl K'}</kbd>
    </button>
  );
}

// Cursor-tracked radial borders: every card in a hovered `.has-spot` grid lights up relative to the pointer.
export function Spotlight() {
  useEffect(() => {
    let raf = 0;
    const onMove = (e: PointerEvent) => {
      if (raf || !(e.target as Element).closest?.('.has-spot')) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        document.querySelectorAll<HTMLElement>('.has-spot .spot').forEach((c) => {
          const r = c.getBoundingClientRect();
          c.style.setProperty('--mx', `${e.clientX - r.left}px`);
          c.style.setProperty('--my', `${e.clientY - r.top}px`);
        });
      });
    };
    document.addEventListener('pointermove', onMove);
    return () => document.removeEventListener('pointermove', onMove);
  }, []);
  return null;
}
