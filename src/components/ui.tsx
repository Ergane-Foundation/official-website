import Link from 'next/link';
import type { ReactNode } from 'react';
import { links } from '@/lib/site';
import type { Project } from '@/lib/site';
import type { GH } from '@/lib/github';
import { day, feedView } from '@/lib/view';
import { Arrow } from './icons';

export const SecHead = ({ coord, title, sub }: { coord: string; title: string; sub?: ReactNode }) => (
  <div className="sec-h">
    <span className="mono">[{coord}]</span>
    <h2>{title}</h2>
    {sub ? <p>{sub}</p> : null}
  </div>
);

const Img = ({ login }: { login: string }) => (
  // plain <img>: 48px public avatars, the image optimizer would only add cost
  <img src={`https://github.com/${login}.png?size=96`} alt={login} width={48} height={48} loading="lazy" />
);

export const Avatar = ({ login, core = false }: { login: string; core?: boolean }) => (
  <a className={`av${core ? ' m' : ''}`} href={`https://github.com/${login}`} rel="noopener" title={`${login}${core ? ' · core member' : ''}`}>
    <Img login={login} />
  </a>
);

// Core member with a name caption.
export const Who = ({ login }: { login: string }) => (
  <a className="who" href={`https://github.com/${login}`} rel="noopener">
    <span className="av m"><Img login={login} /></span>
    <span className="mono">{login}</span>
  </a>
);

export const ProjectCard = ({ p }: { p: Pick<Project, 'slug' | 'name' | 'domain' | 'tagline' | 'language' | 'stars' | 'forks' | 'license'> }) => (
  <article className="card spot proj" data-domain={p.domain} data-lang={p.language ?? ''}>
    <span className="mono">{p.domain}</span>
    <h3><Link className="stretch" href={`/projects/${p.slug}`}>{p.name}</Link></h3>
    <p>{p.tagline}</p>
    <ul className="meta mono">
      <li><i className="lang" data-l={p.language ?? ''} />{p.language}</li>
      <li>★ {p.stars}</li>
      <li>⑂ {p.forks}</li>
      <li>{p.license ?? 'No license'}</li>
    </ul>
  </article>
);

export function Feed({ gh }: { gh: Pick<GH, 'mergedPrs' | 'goodFirst'> }) {
  const { merged, good, heading, tagGfi } = feedView(gh);
  const list = (items: typeof merged, empty: string, href: string, tag = false) =>
    items.length ? (
      <ul className="feed">
        {items.map((i) => (
          <li key={i.url}>
            <a href={i.url} rel="noopener">
              <span className="mono">{i.repo}#{i.number}</span>
              <span>{i.title}{tag && i.gfi !== false ? <> <b className="tag mono">good first</b></> : null}</span>
              <time className="mono">{day(i.at)}</time>
            </a>
          </li>
        ))}
      </ul>
    ) : (
      <p className="empty">{empty} <a href={href} rel="noopener">Search on GitHub <Arrow /></a></p>
    );
  return (
    <div className="feeds">
      <div className="card"><h3 className="mono">Recently merged PRs</h3>{list(merged, 'No merged pull requests to show right now.', links.mergedPrs)}</div>
      <div className="card"><h3 className="mono">{heading}</h3>{list(good, 'No open issues to show right now.', links.goodFirst, tagGfi)}</div>
    </div>
  );
}

export const Channels = () => (
  <div className="channels has-spot">
    <a className="card spot ch" href={links.github} rel="noopener">
      <span className="mono">01 // GitHub</span><h3>Read the source</h3>
      <p>Browse repositories, open pull requests, pick up a good first issue.</p>
      <span className="go">github.com/Ergane-Foundation <Arrow /></span>
    </a>
    <a className="card spot ch" href={links.discord} rel="noopener">
      <span className="mono">02 // Discord</span><h3>Talk to the core team</h3>
      <p>Community discussion and contributor onboarding. Start here if you are new.</p>
      <span className="go">Join the Discord <Arrow /></span>
    </a>
    <a className="card spot ch" href={links.propose} rel="noopener">
      <span className="mono">03 // Propose</span><h3>Bring a project</h3>
      <p>Maintain something open source? Propose it to the foundation and we will talk it through.</p>
      <span className="go">Propose a project <Arrow /></span>
    </a>
  </div>
);
