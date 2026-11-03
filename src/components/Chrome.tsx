'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
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
    const theme = saved ?? (pathname.startsWith('/research') ? 'light' : 'dark');
    if (document.documentElement.dataset.theme !== theme) document.documentElement.dataset.theme = theme;
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

// Icon only on phones, with the label and shortcut from 640px up.
export function PaletteButton() {
  const [mac, setMac] = useState(false);
  useEffect(() => setMac(/Mac|iPhone|iPad/.test(navigator.platform)), []);
  return (
    <button className="btn sm ghost srch" type="button" aria-label="Search the site" onClick={() => window.dispatchEvent(new Event('ergane:palette'))}>
      <svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true"><circle cx="7" cy="7" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.5" /><path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
      <span className="lbl">Search</span> <kbd>{mac ? '⌘K' : 'Ctrl K'}</kbd>
    </button>
  );
}

// Hamburger menu for screens narrower than 760px. Closes on navigation, Escape and an outside tap.
export function MobileMenu({ extra }: { extra: { label: string; href: string }[] }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const box = useRef<HTMLDivElement>(null);
  const btn = useRef<HTMLButtonElement>(null);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    const outside = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!box.current?.contains(t) && !btn.current?.contains(t)) setOpen(false);
    };
    window.addEventListener('keydown', key);
    window.addEventListener('pointerdown', outside);
    return () => { window.removeEventListener('keydown', key); window.removeEventListener('pointerdown', outside); };
  }, [open]);

  return (
    <>
      <button ref={btn} className="btn sm ghost icon menu-btn" type="button" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} aria-controls="mobile-menu" onClick={() => setOpen(!open)}>
        <span className="burger" data-open={open}><i /><i /><i /></span>
      </button>
      <div id="mobile-menu" ref={box} className="menu" data-open={open} inert={!open}>
        <nav aria-label="Menu">
          {nav.map((n) => <Link key={n.href} href={n.href} aria-current={pathname.startsWith(n.href) ? 'page' : undefined}>{n.label}</Link>)}
          {extra.map((l) => <a key={l.href} className="ext" href={l.href} rel="noopener">{l.label} <span aria-hidden="true">↗</span></a>)}
        </nav>
      </div>
    </>
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
