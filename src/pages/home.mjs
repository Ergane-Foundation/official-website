import { links, members, pillars } from '../site.mjs';
import { esc, u, arrow } from '../layout.mjs';
import { secHead, avatar, feed, channels, projectCard, copyCmd } from '../parts.mjs';

const heat = (weeks) => {
  const max = Math.max(1, ...weeks);
  const cells = weeks.length ? weeks : Array(52).fill(0);
  return cells.map((n) => `<i class="h${n === 0 ? 0 : Math.min(4, 1 + Math.floor((n / max) * 3.99))}"></i>`).join('');
};

const deviceViz = `<svg class="viz" viewBox="0 0 200 90" aria-hidden="true">
  <rect x="62" y="6" width="76" height="78" rx="6" class="vb"/><path d="M62 24h76" class="vb"/>
  <circle cx="100" cy="52" r="15" class="vb"/><path d="M92 50h2m12 0h2M94 58q6 5 12 0" class="vb" fill="none"/>
  <rect x="64" y="40" width="72" height="2" class="scan"/>
  <path d="M158 28q8-12 22-6 8-10 16 0 8 4 0 12h-34q-10-2-4-6z" class="vb cloud"/><path d="M152 18l52 36" class="x"/>
</svg>`;

export function home({ gh, projects }) {
  const stars = projects.reduce((n, p) => n + p.stars, 0);
  const forks = projects.reduce((n, p) => n + p.forks, 0);
  const cells = [['Projects', projects.length], ['Stars', stars], ['Forks', forks], ['Open issues', gh.openIssues ?? '—'], ['Open PRs', gh.openPrs ?? '—'], ['Members', members.length]];
  const sync = `${gh.source === 'live' ? 'live from the GitHub API' : 'committed snapshot (API unreachable at build)'} · ${new Date(gh.fetchedAt).toISOString().slice(0, 16).replace('T', ' ')} UTC`;
  const link = (slug) => `<a class="chip" href="${u(`/projects/${slug}/`)}">${slug}</a>`;
  const repoLinks = (p) => (p.repos.length ? `<div class="chips">${p.repos.map(link).join('')}</div>` : '');

  return `
<section class="hero">
  <canvas id="lattice" aria-hidden="true"></canvas>
  <div class="hero-in">
    <a class="pill" href="${u('/community/')}"><i class="dot"></i><span class="mono">[ Ergane Foundation // open-source systems &amp; security ]</span></a>
    <h1>Resilient systems,<br>built in the open.</h1>
    <p class="lede">Ergane Foundation maintains open-source security, privacy and infrastructure software, from inline intrusion prevention to carbon-aware stream processing. Apache-2.0, run by the people who maintain it.</p>
    <div class="row">
      <a class="btn pri" href="${u('/projects/')}">Explore projects ${arrow}</a>
      <a class="btn" href="${links.github}" rel="noopener">View on GitHub <span class="mono">★ ${stars}</span></a>
    </div>
    <div class="row">${copyCmd('gh repo list Ergane-Foundation')}</div>
  </div>
  <span class="coord mono" aria-hidden="true">[00 // ORIGIN]</span>
</section>

<section class="tele" aria-label="Organisation statistics">
  <dl>${cells.map(([k, v]) => `<div><dt class="mono">${k}</dt><dd>${v}</dd></div>`).join('')}</dl>
  <p class="mono tele-src">source: ${sync}</p>
</section>

<section class="sec" id="projects">
  ${secHead('01 // PROJECTS', 'Software we maintain', 'Each project lives in the Ergane-Foundation GitHub organisation and is run by its own maintainers. <a href="' + u('/projects/') + '">See all projects ' + arrow + '</a>')}
  <div class="grid3">${projects.map(projectCard).join('')}</div>
</section>

<section class="sec" id="pillars">
  ${secHead('02 // FOCUS AREAS', 'What we build')}
  <div class="bento">
    <article class="card spot b-a"><span class="mono">[${pillars[0].id} // ${pillars[0].title}]</span><h3>${pillars[0].title}</h3><p>${pillars[0].body}</p>
      <div class="cli" data-cycle='${esc(JSON.stringify(['gh repo list Ergane-Foundation', 'gh search issues --owner Ergane-Foundation --label "good first issue" --state open', 'gh search prs --owner Ergane-Foundation --merged']))}'><span class="mono">$</span> <code></code><i class="caret"></i></div>${repoLinks(pillars[0])}</article>
    <article class="card spot b-b"><span class="mono">[${pillars[1].id} // ${pillars[1].title}]</span>${deviceViz}<h3>${pillars[1].title}</h3><p>${pillars[1].body}</p>${repoLinks(pillars[1])}</article>
    <article class="card spot b-c"><span class="mono">[${pillars[2].id} // ${pillars[2].title}]</span><h3>${pillars[2].title}</h3><p>${pillars[2].body}</p>
      <div class="heat" role="img" aria-label="Weekly commit activity across all repositories over the last 52 weeks">${heat(gh.activity)}</div>
      <p class="mono cap">${gh.activity.length ? 'commits / week, last 52 weeks' : 'weekly activity appears when the build can reach the GitHub API'}</p>${repoLinks(pillars[2])}</article>
    <article class="card spot b-d"><span class="mono">[${pillars[3].id} // ${pillars[3].title}]</span><h3>${pillars[3].title}</h3><p>${pillars[3].body}</p>
      <div class="avs">${members.map(avatar).join('')}</div><div class="chips"><a class="chip" href="${u('/community/')}">how we work</a><span class="chip">Apache-2.0</span><span class="chip">SECURITY.md</span></div></article>
  </div>
</section>

<section class="sec" id="pulse">
  ${secHead('03 // TELEMETRY', 'Open-source pulse', 'Recent work and places to start, pulled from the GitHub organisation at build time.')}
  ${feed(gh)}
</section>

<section class="sec" id="join">
  ${secHead('04 // ONBOARD', 'Pick a door', 'Three ways in, depending on what you want to do.')}
  ${channels()}
</section>`;
}
