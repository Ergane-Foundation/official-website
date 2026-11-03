import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import type { ReactNode } from 'react';
import { Spotlight, ThemeSync } from '@/components/Chrome';
import { Palette, type PaletteItem } from '@/components/Palette';
import { Footer, Header } from '@/components/Shell';
import { getProjects } from '@/lib/data';
import './globals.css';

const geist = localFont({ src: './fonts/geist.woff2', variable: '--font-sans', weight: '100 900', display: 'swap' });
const geistMono = localFont({ src: './fonts/geist-mono.woff2', variable: '--font-mono', weight: '100 900', display: 'swap' });

const description = 'Ergane Foundation builds and maintains open-source security, privacy and infrastructure software, developed by a community of contributors.';

// The tab title is always "Ergane Foundation"; pages only set their own description and social-share title.
export const metadata: Metadata = {
  title: 'Ergane Foundation',
  description,
  openGraph: { title: 'Ergane Foundation', description },
};
export const viewport: Viewport = { themeColor: '#08090C' };
export const revalidate = 3600; // keep equal to REVALIDATE in lib/github.ts (segment config needs a literal)

// Runs before first paint so there is no flash: saved choice, else light on /research, else dark.
const themeScript = `try{var t=localStorage.getItem('ergane-theme')||(location.pathname.indexOf('/research')===0?'light':'dark');document.documentElement.dataset.theme=t}catch(e){}`;

export default async function RootLayout({ children }: { children: ReactNode }) {
  const projects = await getProjects();
  const stars = projects.reduce((n, p) => n + p.stars, 0);
  const items: PaletteItem[] = [
    { t: 'Projects', d: 'Page', h: '/projects', k: 'page' },
    { t: 'Community', d: 'Page', h: '/community', k: 'page' },
    { t: 'Research', d: 'Page', h: '/research', k: 'page' },
    ...projects.map((p) => ({ t: p.name, d: p.tagline, h: `/projects/${p.slug}`, g: p.url, k: 'project' })),
  ];

  return (
    <html lang="en" data-theme="dark" className={`${geist.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <a className="skip" href="#main">Skip to content</a>
        <Header stars={stars} />
        <div className="frame">
          <main id="main">{children}</main>
          <Footer />
        </div>
        <Palette items={items} />
        <ThemeSync />
        <Spotlight />
      </body>
    </html>
  );
}
