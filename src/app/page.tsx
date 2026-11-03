import Link from 'next/link';
import { CopyCmd } from '@/components/Copy';
import { HeroLattice } from '@/components/HeroLattice';
import { Arrow } from '@/components/icons';
import { CycleCli } from '@/components/Interactive';
import { Avatar, Channels, Feed, ProjectCard, SecHead } from '@/components/ui';
import { getGithub, getProjects } from '@/lib/data';
import { links, pillars } from '@/lib/site';
import { heatLevels, people } from '@/lib/view';

export const revalidate = 3600;

const cliCommands = [
  'gh repo list Ergane-Foundation',
  'gh search issues --owner Ergane-Foundation --label "good first issue" --state open',
  'gh search prs --owner Ergane-Foundation --merged',
];

const DeviceViz = () => (
  <svg className="viz" viewBox="0 0 200 90" aria-hidden="true">
    <rect x="62" y="6" width="76" height="78" rx="6" className="vb" /><path d="M62 24h76" className="vb" />
    <circle cx="100" cy="52" r="15" className="vb" /><path d="M92 50h2m12 0h2M94 58q6 5 12 0" className="vb" fill="none" />
    <rect x="64" y="40" width="72" height="2" className="scan" />
    <path d="M158 28q8-12 22-6 8-10 16 0 8 4 0 12h-34q-10-2-4-6z" className="vb cloud" /><path d="M152 18l52 36" className="x" />
  </svg>
);

const sourceNote = (gh: Awaited<ReturnType<typeof getGithub>>) => {
  const when = `${new Date(gh.fetchedAt).toISOString().slice(0, 16).replace('T', ' ')} UTC`;
  return {
    live: `live from the GitHub API · ${when}`,
    partial: `live from the GitHub API · ${when} · ${gh.stale.join(', ')} from the committed snapshot`,
    snapshot: `committed snapshot · ${when} · API unreachable`,
  }[gh.source];
};

export default async function Home() {
  const [gh, projects] = await Promise.all([getGithub(), getProjects()]);
  const stars = projects.reduce((n, p) => n + p.stars, 0);
  const forks = projects.reduce((n, p) => n + p.forks, 0);
  const { core, contributors } = people(gh);
  const cells: [string, string | number][] = [
    ['Projects', projects.length], ['Stars', stars], ['Forks', forks],
    ['Open issues', gh.openIssues ?? '—'], ['Open PRs', gh.openPrs ?? '—'], ['Contributors', core.length + contributors.length],
  ];
  const chips = (repos: string[]) => (repos.length ? <div className="chips">{repos.map((r) => <Link key={r} className="chip" href={`/projects/${r}`}>{r}</Link>)}</div> : null);
  const [p1, p2, p3, p4] = pillars;
  const pillarTag = (p: (typeof pillars)[number]) => <span className="mono">[{p.id} // {p.title}]</span>;

  return (
    <>
      <section className="hero">
        <HeroLattice />
        <div className="hero-in">
          <Link className="pill" href="/community"><i className="dot" /><span className="mono">[ Ergane Foundation // open-source systems &amp; security ]</span></Link>
          <h1>Resilient systems,<br />built in the open.</h1>
          <p className="lede">Ergane Foundation maintains open-source security, privacy and infrastructure software, from inline intrusion prevention to carbon-aware stream processing. Apache-2.0, stewarded by a core team.</p>
          <div className="row">
            <Link className="btn pri" href="/projects">Explore projects <Arrow /></Link>
            <a className="btn" href={links.github} rel="noopener">View on GitHub <span className="mono">★ {stars}</span></a>
          </div>
          <div className="row"><CopyCmd cmd="gh repo list Ergane-Foundation" /></div>
        </div>
        <span className="coord mono" aria-hidden="true">[00 // ORIGIN]</span>
      </section>

      <section className="tele" aria-label="Organisation statistics">
        <dl>{cells.map(([k, v]) => <div key={k}><dt className="mono">{k}</dt><dd>{v}</dd></div>)}</dl>
        <p className="mono tele-src">source: {sourceNote(gh)}</p>
      </section>

      <section className="sec" id="software">
        <SecHead coord="01 // PROJECTS" title="Software we maintain" sub={<>Each project lives in the Ergane-Foundation GitHub organisation, with one or more core members assigned to it. <Link href="/projects">See all projects <Arrow /></Link></>} />
        <div className="grid3 has-spot">{projects.map((p) => <ProjectCard key={p.slug} p={p} />)}</div>
      </section>

      <section className="sec" id="pillars">
        <SecHead coord="02 // FOCUS AREAS" title="What we build" />
        <div className="bento has-spot">
          <article className="card spot b-a">{pillarTag(p1)}<h3>{p1.title}</h3><p>{p1.body}</p><CycleCli commands={cliCommands} />{chips(p1.repos)}</article>
          <article className="card spot b-b">{pillarTag(p2)}<DeviceViz /><h3>{p2.title}</h3><p>{p2.body}</p>{chips(p2.repos)}</article>
          <article className="card spot b-c">
            {pillarTag(p3)}<h3>{p3.title}</h3><p>{p3.body}</p>
            <div className="heat" role="img" aria-label="Weekly commit activity across all repositories over the last 52 weeks">
              {heatLevels(gh.activity).map((l, i) => <i key={i} className={`h${l}`} />)}
            </div>
            <p className="mono cap">{gh.activity.length ? 'commits / week, last 52 weeks' : 'weekly activity appears when the GitHub API is reachable'}</p>
            {chips(p3.repos)}
          </article>
          <article className="card spot b-d">
            {pillarTag(p4)}<h3>{p4.title}</h3><p>{p4.body}</p>
            <div className="avs">{core.map((l) => <Avatar key={l} login={l} core />)}</div>
            <p className="mono cap">{core.length} core members · every repository has one or more assigned</p>
            <div className="chips"><Link className="chip" href="/community">how we work</Link><span className="chip">Apache-2.0</span><span className="chip">SECURITY.md</span></div>
          </article>
        </div>
      </section>

      <section className="sec" id="pulse">
        <SecHead coord="03 // TELEMETRY" title="Open-source pulse" sub="Recent work and places to start, pulled from the GitHub organisation and refreshed hourly." />
        <Feed gh={gh} />
      </section>

      <section className="sec" id="join">
        <SecHead coord="04 // ONBOARD" title="Pick a door" sub="Three ways in, depending on what you want to do." />
        <Channels />
      </section>
    </>
  );
}
