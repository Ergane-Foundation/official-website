import { ORG, links, vajraCapabilities, vajraQuickstart } from '../site.mjs';
import { esc, u, arrow } from '../layout.mjs';
import { secHead, projectCard, flagshipBlock, day } from '../parts.mjs';

export function projectsIndex({ projects }) {
  const uniq = (k) => [...new Set(projects.map((p) => p[k]).filter(Boolean))];
  const chips = (label, key) => `<div class="filter" data-filter="${key}"><span class="mono">${label}</span><button class="chip" type="button" aria-pressed="true" data-v="">All</button>${uniq(key === 'domain' ? 'domain' : 'language').map((v) => `<button class="chip" type="button" aria-pressed="false" data-v="${esc(v)}">${esc(v)}</button>`).join('')}</div>`;
  return `
<section class="sec page-h">
  ${secHead('PROJECTS // ECOSYSTEM', 'Projects', 'Every repository below lives in the Ergane-Foundation GitHub organisation and has one or more core members assigned to it. Star, fork and license data is read from GitHub when the site is built.')}
  <div class="filters">${chips('Domain', 'domain')}${chips('Language', 'lang')}</div>
  <p class="mono" id="count" role="status" aria-live="polite">Showing ${projects.length} of ${projects.length} projects</p>
</section>
<section class="sec">
  <div class="grid3" id="projects">${projects.map(projectCard).join('')}</div>
  <div class="term nomatch" id="none" hidden role="status">
    <div class="term-h mono"><span>ergane · filter</span><i class="dot amber"></i></div>
    <pre id="none-log"></pre>
    <div class="row"><button class="btn sm" type="button" id="reset">Clear filters</button><a class="btn sm ghost" href="${links.propose}" rel="noopener">Propose a project ${arrow}</a></div>
  </div>
  <p class="note">Have a project you would like to bring to Ergane? <a href="${links.propose}" rel="noopener">Propose it here ${arrow}</a></p>
</section>`;
}

// Only Vajra's extra files have been confirmed; every other link uses a GitHub route that exists on every repo.
const extraDocs = {
  vajra: [['Architecture', 'docs/architecture.md'], ['Contributing', 'CONTRIBUTING.md'], ['Security policy', 'SECURITY.md'], ['Code of conduct', 'CODE_OF_CONDUCT.md']],
};

export function projectPage(p) {
  const isVajra = p.slug === 'vajra';
  const repo = p.url;
  const clone = `git clone ${repo}.git`;
  let n = 0;
  const num = () => String(++n).padStart(2, '0');
  const docs = [
    ['README', `${repo}#readme`, 'Overview and usage'],
    ...(extraDocs[p.slug] ?? []).map(([label, file]) => [label, `${repo}/blob/HEAD/${file}`, file]),
    ['Releases', `${repo}/releases`, 'Tagged versions and changelogs'],
  ];
  return `
<section class="sec page-h">
  <a class="crumb mono" href="${u('/projects/')}">← Projects</a>
  <span class="mono">[PROJECTS // ${esc(p.domain)}]</span>
  <h1>${esc(p.name)}</h1>
  <p class="lede">${esc(p.tagline)}</p>
  <ul class="meta mono"><li><i class="lang" data-l="${esc(p.language)}"></i>${esc(p.language)}</li><li>★ ${p.stars} stars</li><li>⑂ ${p.forks} forks</li><li>${esc(p.license ?? 'No license')}</li>${p.pushed ? `<li>pushed ${day(p.pushed)}</li>` : ''}</ul>
  <div class="row"><a class="btn pri" href="${repo}" rel="noopener">View repository ${arrow}</a><a class="btn" href="${repo}/issues" rel="noopener">Issues</a><a class="btn" href="${repo}#readme" rel="noopener">README</a></div>
  ${isVajra ? `<p class="status mono"><i class="dot amber"></i>Early stage · not yet released · nothing has run in production · ML components are experimental</p>` : ''}
</section>
<section class="sec">
  ${secHead(`${num()} // ABOUT`, 'Overview')}
  <p class="prose-p">${esc(p.description)}</p>
  <div class="chips">${p.topics.map((t) => `<a class="chip" href="https://github.com/topics/${esc(t)}" rel="noopener">${esc(t)}</a>`).join('')}</div>
</section>
<section class="sec">
  ${secHead(`${num()} // START`, 'Quick start', isVajra ? 'Use a disposable Linux VM (Ubuntu or Debian) with Python 3.10+, root access and make. Live mode inserts NFQUEUE rules and enables IPv4 forwarding.' : 'Clone the repository and follow its README for build and run instructions.')}
  <pre class="code" data-copy="${esc(isVajra ? vajraQuickstart : clone)}"><button class="cp mono" type="button">copy</button><code>${esc(isVajra ? vajraQuickstart : clone)}</code></pre>
</section>
${isVajra ? `
<section class="sec">
  ${secHead(`${num()} // ARCHITECTURE`, 'How it works', 'Select a stage to highlight it in the pipeline. The terminal output is simulated.')}
  ${flagshipBlock()}
</section>
<section class="sec">
  ${secHead(`${num()} // STATUS`, 'Capabilities', 'As reported in the project README.')}
  <div class="tbl"><table><thead><tr><th>Capability</th><th>Status</th></tr></thead><tbody>${vajraCapabilities.map(([c, s]) => `<tr><td>${c}</td><td class="mono ${s.startsWith('Implemented') ? 'ok' : ''}">${s}</td></tr>`).join('')}</tbody></table></div>
</section>` : ''}
<section class="sec" id="docs">
  ${secHead(`${num()} // DOCS`, 'Documentation', 'Documentation lives next to the code, in the repository.')}
  <ul class="doc-links">${docs.map(([label, href, detail]) => `<li><a href="${href}" rel="noopener"><b>${label}</b><span class="mono">${esc(detail)}</span>${arrow}</a></li>`).join('')}</ul>
</section>
<section class="sec">
  ${secHead(`${num()} // CONTRIBUTE`, 'Get involved')}
  <div class="chips"><a class="chip" href="${repo}/issues" rel="noopener">Open issues</a><a class="chip" href="${links.goodFirst}" rel="noopener">Good first issues</a><a class="chip" href="${links.discord}" rel="noopener">Discord</a><a class="chip" href="${repo}/security" rel="noopener">Report a vulnerability</a></div>
</section>`;
}
