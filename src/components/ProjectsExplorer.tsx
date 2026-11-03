'use client';

import { useEffect, useMemo, useState } from 'react';
import { links } from '@/lib/site';
import type { Project } from '@/lib/site';
import { Arrow } from './icons';
import { useTyping } from './hooks';
import { ProjectCard, SecHead } from './ui';

type Card = Pick<Project, 'slug' | 'name' | 'domain' | 'tagline' | 'language' | 'stars' | 'forks' | 'license'>;
type Filters = { domain: string; lang: string };

// Filter chips and the project grid. AND across the two groups, mirrored in the URL (?domain=…&lang=…) so a filtered
// view can be shared. A combination with no match shows a small terminal instead of an empty page.
export function ProjectsExplorer({ projects }: { projects: Card[] }) {
  const domains = useMemo(() => [...new Set(projects.map((p) => p.domain))], [projects]);
  const langs = useMemo(() => [...new Set(projects.map((p) => p.language).filter((l): l is string => !!l))], [projects]);
  const [f, setF] = useState<Filters>({ domain: '', lang: '' });

  // Restore filters from the URL once, after hydration. Reading never writes, so React StrictMode's double effect is safe.
  useEffect(() => {
    const p = new URLSearchParams(location.search);
    const domain = p.get('domain') ?? '';
    const lang = p.get('lang') ?? '';
    setF({ domain: domains.includes(domain) ? domain : '', lang: langs.includes(lang) ? lang : '' });
  }, [domains, langs]);

  const update = (next: Filters) => {
    setF(next);
    const p = new URLSearchParams(Object.entries(next).filter(([, v]) => v));
    history.replaceState(null, '', p.size ? `?${p}` : location.pathname);
  };

  const shown = projects.filter((p) => (!f.domain || p.domain === f.domain) && (!f.lang || p.language === f.lang));
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
        <div className="grid3 has-spot">{shown.map((p) => <ProjectCard key={p.slug} p={p} />)}</div>
        <div className="term nomatch" hidden={!none} role="status">
          <div className="term-h mono"><span>ergane · filter</span><i className="dot amber" /></div>
          <pre>{log}</pre>
          <div className="row">
            <button className="btn sm" type="button" onClick={() => update({ domain: '', lang: '' })}>Clear filters</button>
            <a className="btn sm ghost" href={links.propose} rel="noopener">Propose a project <Arrow /></a>
          </div>
        </div>
        <p className="note">Have a project you would like to bring to Ergane? <a href={links.propose} rel="noopener">Propose it here <Arrow /></a></p>
      </section>
    </>
  );
}
