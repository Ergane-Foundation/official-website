'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { Project } from '@/lib/site';
import { Arrow } from './icons';
import { useTyping } from './hooks';
import { ProjectCard, SecHead } from './ui';

type Card = Pick<Project, 'slug' | 'name' | 'domain' | 'tagline' | 'language' | 'stars' | 'forks' | 'license'>;
type Filters = { domain: string; lang: string };

// Filter chips and the project grid. AND across the two groups. A combination with no match shows a small terminal
// instead of an empty page.
export function ProjectsExplorer({ projects }: { projects: Card[] }) {
  const domains = useMemo(() => [...new Set(projects.map((p) => p.domain))], [projects]);
  const langs = useMemo(() => [...new Set(projects.map((p) => p.language).filter((l): l is string => !!l))], [projects]);
  // Plain local state: a click re-renders this component only. (An earlier version also mirrored the filters into the URL
  // with history.replaceState, which makes Next's router re-render the whole tree on every click.)
  const [f, setF] = useState<Filters>({ domain: '', lang: '' });
  const update = (next: Filters) => setF(next);

  const matches = (p: Card) => (!f.domain || p.domain === f.domain) && (!f.lang || p.language === f.lang);
  const shown = projects.filter(matches);
  const none = shown.length === 0;
  const flags = [f.domain && `--domain "${f.domain}"`, f.lang && `--lang "${f.lang}"`].filter(Boolean).join(' ');
  const lines = useMemo(
    () => (none ? [
      `$ ergane projects ${flags}`,
      `[ruleset] ${projects.length} projects scanned · 0 matched`,
      '[verdict] action=drop · nothing in this corner of the ecosystem yet',
      '[hint]    relax a filter, or propose a project that fills the gap',
    ] : null),
    [none, flags, projects.length],
  );
  const log = useTyping(lines, 450);

  const chips = (label: string, key: keyof Filters, values: string[]) => (
    <div className="filter">
      <span className="mono">{label}</span>
      {['', ...values].map((v) => (
        <button key={v || 'all'} className="chip" type="button" aria-pressed={f[key] === v} onClick={() => update({ ...f, [key]: v })}>{v || 'All'}</button>
      ))}
    </div>
  );

  return (
    <>
      <section className="sec page-h">
        <SecHead coord="PROJECTS // ECOSYSTEM" title="Projects" sub="Every repository below lives in the Ergane-Foundation GitHub organisation and has one or more core members assigned to it. Star, fork and license data is read from GitHub and refreshed hourly." />
        <div className="filters">{chips('Domain', 'domain', domains)}{chips('Language', 'lang', langs)}</div>
        <p className="mono" role="status" aria-live="polite">Showing {shown.length} of {projects.length} project{projects.length === 1 ? '' : 's'}</p>
      </section>
      <section className="sec">
        {/* every card stays mounted and is hidden, not removed, so a click changes visibility only */}
        <div className="grid3 has-spot">{projects.map((p) => <ProjectCard key={p.slug} p={p} hidden={!matches(p)} />)}</div>
        <div className="term nomatch" hidden={!none} role="status">
          <div className="term-h mono"><span>ergane · filter</span><i className="dot amber" /></div>
          <pre>{log}</pre>
          <div className="row">
            <button className="btn sm" type="button" onClick={() => update({ domain: '', lang: '' })}>Clear filters</button>
            <Link className="btn sm ghost" href="/propose">Propose a project <Arrow /></Link>
          </div>
        </div>
        <p className="note">Have a project you would like to bring to Ergane? <Link href="/propose">Propose it here <Arrow /></Link></p>
      </section>
    </>
  );
}
