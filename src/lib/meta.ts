import type { Metadata } from 'next';

// The tab title stays "Ergane Foundation" (set once in the root layout); this only sets what link previews show.
export const pageMeta = (title: string, description: string): Metadata => ({
  description,
  openGraph: { title: `${title} — Ergane Foundation`, description },
});
