import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CodeBlock } from '@/components/Copy';
import { Arrow } from '@/components/icons';
import { Pipeline } from '@/components/Pipeline';
import { DataTable, MaintainerCard, SecHead } from '@/components/ui';
import { content } from '@/content/projects';
import { getProjects } from '@/lib/data';
import { pageMeta } from '@/lib/meta';
import { links, projectSlugs, repoGoodFirst } from '@/lib/site';
import { day } from '@/lib/view';

export const revalidate = 3600;
export const dynamicParams = false; // only the curated projects exist
export const generateStaticParams = () => projectSlugs.map((slug) => ({ slug }));

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = (await getProjects()).find((x) => x.slug === slug);
  return p ? pageMeta(p.name, p.tagline) : {};
}

// README → the rendered README, releases → the releases page, a path with an extension → a file, without → a folder.
function docHref(repo: string, target: string) {
  if (target.startsWith('http')) return target;
  if (target === 'README.md') return `${repo}#readme`;
  if (target === 'releases') return `${repo}/releases`;
  return `${repo}/${target.split('/').pop()!.includes('.') ? 'blob' : 'tree'}/HEAD/${target}`;
}

export default async function ProjectPage({ params }: Props) {
  const { slug } = await params;
  const p = (await getProjects()).find((x) => x.slug === slug);
  const c = content[slug];
  if (!p || !c) notFound();

  const repo = p.url;
  let n = 0;
  const num = () => String(++n).padStart(2, '0');
  const inv = c.involved;

  return (
    <>
      <section className="sec page-h">
        <Link className="crumb mono" href="/projects">← Projects</Link>
        <span className="mono">[PROJECTS // {p.domain}]</span>
        <h1>{p.name}</h1>
        <p className="lede">{p.tagline}</p>
        <ul className="meta mono">
          <li><i className="lang" data-l={p.language ?? ''} />{p.language}</li>
          <li>★ {p.stars} stars</li><li>⑂ {p.forks} forks</li><li>{p.license ?? 'No license'}</li>
          {p.pushed ? <li>pushed {day(p.pushed)}</li> : null}
        </ul>
        <div className="row">
          <a className="btn pri" href={repo} rel="noopener">View repository <Arrow /></a>
          <a className="btn" href={`${repo}/issues`} rel="noopener">Issues</a>
          <a className="btn" href={`${repo}#readme`} rel="noopener">README</a>
        </div>
        {c.status ? <p className="status mono"><i className="dot amber" />{c.status}</p> : null}
      </section>

      <section className="sec">
        <SecHead coord={`${num()} // ABOUT`} title="Overview" />
        <div className="stack">
          <div className="blocks">{c.overview.paragraphs.map((t) => <p key={t} className="prose-p">{t}</p>)}</div>
          <div className="grid3 facts">
            {c.overview.highlights.map(([title, body], i) => (
              <article key={title} className="card"><span className="mono">0{i + 1}</span><h3>{title}</h3><p>{body}</p></article>
            ))}
          </div>
          <div className="chips">{p.topics.map((t) => <a key={t} className="chip" href={`https://github.com/topics/${t}`} rel="noopener">{t}</a>)}</div>
        </div>
      </section>

      <section className="sec">
        <SecHead coord={`${num()} // START`} title="Quick start" sub={c.quickstart.intro} />
        <div className="stack">
          <div className="blocks">
            {c.quickstart.blocks.map((b) => (
              <div key={b.code} className="blocks">
                {b.title ? <h3 className="mono">{b.title}</h3> : null}
                <CodeBlock code={b.code} />
              </div>
            ))}
          </div>
          {c.quickstart.notes?.length ? <ul className="bullets">{c.quickstart.notes.map((t) => <li key={t}>{t}</li>)}</ul> : null}
          {c.quickstart.tables?.map((t) => <DataTable key={t.title ?? t.head.join()} t={t} />)}
        </div>
      </section>

      <section className="sec">
        <SecHead coord={`${num()} // ARCHITECTURE`} title="How it works" sub={c.how.intro} />
        <Pipeline name={p.name} stages={c.how.stages} termLabel={c.how.termLabel} experimental={c.how.experimental} diagram={c.how.diagram} />
      </section>

      <section className="sec">
        <SecHead coord={`${num()} // STATUS`} title="Capabilities" sub={c.capabilities.intro} />
        <div className="stack">
          {c.capabilities.tables.map((t) => <DataTable key={t.title ?? t.head.join()} t={t} />)}
          {c.capabilities.limits?.length ? (
            <div className="blocks"><h3 className="mono">Known limits</h3><ul className="bullets">{c.capabilities.limits.map((t) => <li key={t}>{t}</li>)}</ul></div>
          ) : null}
        </div>
      </section>

      <section className="sec" id="docs">
        <SecHead coord={`${num()} // DOCS`} title="Documentation" sub="Documentation lives next to the code, in the repository." />
        <ul className="doc-links">
          {c.docs.map(([label, target, detail]) => (
            <li key={label}><a href={docHref(repo, target)} rel="noopener"><b>{label}</b><span className="mono">{detail}</span><Arrow /></a></li>
          ))}
        </ul>
      </section>

      <section className="sec">
        <SecHead coord={`${num()} // CONTRIBUTE`} title="Get involved" />
        <div className="stack">
          <div className="chips">
            <a className="chip" href={`${repo}/issues`} rel="noopener">Open issues</a>
            <a className="chip" href={repoGoodFirst(p.slug)} rel="noopener">Good first issues</a>
            <a className="chip" href={links.discord} rel="noopener">Discord</a>
            <a className="chip" href={`${repo}/security`} rel="noopener">Report a vulnerability</a>
          </div>
          {inv.maintainers.length ? (
            <div className="blocks">
              <h3 className="mono">Maintainers</h3>
              <div className="mnts">{inv.maintainers.map((m) => <MaintainerCard key={m.login} m={m} />)}</div>
              {inv.decisions ? <p className="fine">{inv.decisions} <a href={docHref(repo, 'MAINTAINERS.md')} rel="noopener">MAINTAINERS.md <Arrow /></a></p> : null}
            </div>
          ) : null}
          {inv.checks ? (
            <div className="blocks"><h3 className="mono">{inv.checks.title}</h3><CodeBlock code={inv.checks.code} /></div>
          ) : null}
          {inv.roadmap?.length ? (
            <div className="blocks"><h3 className="mono">Roadmap</h3><ul className="bullets">{inv.roadmap.map((t) => <li key={t}>{t}</li>)}</ul></div>
          ) : null}
        </div>
      </section>
    </>
  );
}
