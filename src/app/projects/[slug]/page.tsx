import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CodeBlock } from '@/components/Copy';
import { Arrow } from '@/components/icons';
import { Flagship } from '@/components/Interactive';
import { SecHead } from '@/components/ui';
import { getProjects } from '@/lib/data';
import { pageMeta } from '@/lib/meta';
import { extraDocs, links, projectSlugs, vajraCapabilities, vajraQuickstart } from '@/lib/site';
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

export default async function ProjectPage({ params }: Props) {
  const { slug } = await params;
  const p = (await getProjects()).find((x) => x.slug === slug);
  if (!p) notFound();

  const isVajra = p.slug === 'vajra';
  const repo = p.url;
  let n = 0;
  const num = () => String(++n).padStart(2, '0');
  const docs: [string, string, string][] = [
    ['README', `${repo}#readme`, 'Overview and usage'],
    ...(extraDocs[p.slug] ?? []).map(([label, file]): [string, string, string] => [label, `${repo}/blob/HEAD/${file}`, file]),
    ['Releases', `${repo}/releases`, 'Tagged versions and changelogs'],
  ];

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
        {isVajra ? <p className="status mono"><i className="dot amber" />Early stage · not yet released · nothing has run in production · ML components are experimental</p> : null}
      </section>

      <section className="sec">
        <SecHead coord={`${num()} // ABOUT`} title="Overview" />
        <p className="prose-p">{p.description}</p>
        <div className="chips">{p.topics.map((t) => <a key={t} className="chip" href={`https://github.com/topics/${t}`} rel="noopener">{t}</a>)}</div>
      </section>

      <section className="sec">
        <SecHead
          coord={`${num()} // START`}
          title="Quick start"
          sub={isVajra ? 'Use a disposable Linux VM (Ubuntu or Debian) with Python 3.10+, root access and make. Live mode inserts NFQUEUE rules and enables IPv4 forwarding.' : 'Clone the repository and follow its README for build and run instructions.'}
        />
        <CodeBlock code={isVajra ? vajraQuickstart : `git clone ${repo}.git`} />
      </section>

      {isVajra ? (
        <>
          <section className="sec">
            <SecHead coord={`${num()} // ARCHITECTURE`} title="How it works" sub="Select a stage to highlight it in the pipeline. The terminal output is simulated." />
            <Flagship />
          </section>
          <section className="sec">
            <SecHead coord={`${num()} // STATUS`} title="Capabilities" sub="As reported in the project README." />
            <div className="tbl">
              <table>
                <thead><tr><th>Capability</th><th>Status</th></tr></thead>
                <tbody>
                  {vajraCapabilities.map(([c, s]) => <tr key={c}><td>{c}</td><td className={`mono${s.startsWith('Implemented') ? ' ok' : ''}`}>{s}</td></tr>)}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : null}

      <section className="sec" id="docs">
        <SecHead coord={`${num()} // DOCS`} title="Documentation" sub="Documentation lives next to the code, in the repository." />
        <ul className="doc-links">
          {docs.map(([label, href, detail]) => <li key={label}><a href={href} rel="noopener"><b>{label}</b><span className="mono">{detail}</span><Arrow /></a></li>)}
        </ul>
      </section>

      <section className="sec">
        <SecHead coord={`${num()} // CONTRIBUTE`} title="Get involved" />
        <div className="chips">
          <a className="chip" href={`${repo}/issues`} rel="noopener">Open issues</a>
          <a className="chip" href={links.goodFirst} rel="noopener">Good first issues</a>
          <a className="chip" href={links.discord} rel="noopener">Discord</a>
          <a className="chip" href={`${repo}/security`} rel="noopener">Report a vulnerability</a>
        </div>
      </section>
    </>
  );
}
