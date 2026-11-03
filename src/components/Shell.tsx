import Link from 'next/link';
import { links, nav } from '@/lib/site';
import { MobileMenu, Nav, PaletteButton, ThemeToggle } from './Chrome';
import { Mark } from './icons';

export const Header = ({ stars }: { stars: number }) => (
  <header className="top">
    <div className="bar">
      <Link className="brand" href="/" aria-label="Ergane Foundation home"><Mark /><b>Ergane</b><span className="mono">Foundation</span></Link>
      <Nav />
      <div className="tools">
        <PaletteButton />
        <ThemeToggle />
        <a className="btn sm gh-btn" href={links.github} rel="noopener">GitHub <span className="mono">★ {stars}</span></a>
        <MobileMenu extra={[{ label: `GitHub · ★ ${stars}`, href: links.github }, { label: 'Discord', href: links.discord }]} />
      </div>
    </div>
  </header>
);

export const Footer = () => (
  <footer className="sec foot">
    <div className="foot-grid">
      <div>
        <Link className="brand" href="/"><Mark /><b>Ergane</b></Link>
        <p>Open-source software, built and maintained in the open by a community of contributors. Released under the Apache License 2.0 unless a project states otherwise.</p>
      </div>
      <div>
        <h3 className="mono">Explore</h3>
        {nav.map((n) => <Link key={n.href} href={n.href}>{n.label}</Link>)}
      </div>
      <div>
        <h3 className="mono">Community</h3>
        <a href={links.github} rel="noopener">GitHub</a>
        <a href={links.discord} rel="noopener">Discord</a>
        <Link href="/propose">Propose a project</Link>
        <a href={links.goodFirst} rel="noopener">Good first issues</a>
      </div>
    </div>
    <p className="mono legal">© Ergane Foundation · Apache-2.0 · Security issues are reported privately via each project&apos;s SECURITY.md</p>
  </footer>
);
