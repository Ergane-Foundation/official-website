import { links, flagship, members } from './site.mjs';
import { esc, u, json, arrow } from './layout.mjs';

export const secHead = (coord, title, sub = '') =>
  `<div class="sec-h"><span class="mono">[${coord}]</span><h2>${title}</h2>${sub ? `<p>${sub}</p>` : ''}</div>`;

export const day = (iso) => (iso ? new Date(iso).toISOString().slice(0, 10) : '');

export const avatar = (login) =>
  `<a class="av${members.includes(login) ? ' m' : ''}" href="https://github.com/${esc(login)}" rel="noopener" title="${esc(login)}${members.includes(login) ? ' · member' : ''}"><img src="https://github.com/${esc(login)}.png?size=96" alt="${esc(login)}" width="48" height="48" loading="lazy"></a>`;

export function projectCard(p) {
  return `<article class="card spot proj" data-domain="${esc(p.domain)}" data-lang="${esc(p.language)}">
  <span class="mono">${esc(p.domain)}</span>
  <h3><a class="stretch" href="${u(`/projects/${p.slug}/`)}">${esc(p.name)}</a></h3>
  <p>${esc(p.tagline)}</p>
  <ul class="meta mono"><li><i class="lang" data-l="${esc(p.language)}"></i>${esc(p.language)}</li><li>★ ${p.stars}</li><li>⑂ ${p.forks}</li><li>${esc(p.license ?? 'No license')}</li></ul>
</article>`;
}

export function feed(gh) {
  const list = (items, empty, href) =>
    items.length
      ? `<ul class="feed">${items.map((i) => `<li><a href="${esc(i.url)}" rel="noopener"><span class="mono">${esc(i.repo)}#${i.number}</span><span>${esc(i.title)}</span><time class="mono">${day(i.at)}</time></a></li>`).join('')}</ul>`
      : `<p class="empty">${empty} <a href="${href}" rel="noopener">Search on GitHub ${arrow}</a></p>`;
  return `<div class="feeds">
  <div class="card"><h3 class="mono">Recently merged PRs</h3>${list(gh.mergedPrs, 'Merged pull requests are fetched when the site is built.', links.mergedPrs)}</div>
  <div class="card"><h3 class="mono">Good first issues</h3>${list(gh.goodFirst, 'No open issues labelled “good first issue” were found at build time.', links.goodFirst)}</div>
</div>`;
}

export function channels() {
  const slack = links.slack;
  return `<div class="channels">
  <a class="card spot ch" href="${links.github}" rel="noopener"><span class="mono">01 // GitHub</span><h3>Read the source</h3><p>Browse repositories, open pull requests, pick up a good first issue.</p><span class="go">github.com/Ergane-Foundation ${arrow}</span></a>
  <a class="card spot ch" href="${links.discord}" rel="noopener"><span class="mono">02 // Discord</span><h3>Talk to maintainers</h3><p>Community discussion and contributor onboarding. Start here if you are new.</p><span class="go">Join the Discord ${arrow}</span></a>
  <a class="card spot ch" href="${slack ?? links.discord}" rel="noopener"><span class="mono">03 // Slack</span><h3>Working groups</h3><p>${slack ? 'Working groups and maintainer coordination.' : 'Working-group and maintainer coordination is by invitation. Ask in Discord to be added.'}</p><span class="go">${slack ? 'Open Slack' : 'Ask in Discord'} ${arrow}</span></a>
</div>`;
}

// One node box: label + optional sub-label, in SVG user units.
const node = (x, y, w, h, label, sub = '', dashed = false) =>
  `<g class="n${dashed ? ' dash' : ''}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4"/><text x="${x + w / 2}" y="${y + (sub ? h / 2 - 3 : h / 2 + 4)}" class="t">${label}</text>${sub ? `<text x="${x + w / 2}" y="${y + h / 2 + 12}" class="s">${sub}</text>` : ''}</g>`;
const edge = (d) => `<path class="e" d="${d}" marker-end="url(#ah)"/>`;

const schematic = `<svg viewBox="0 0 720 320" role="img" aria-label="Vajra pipeline: traffic through NFQUEUE into Suricata, alerts in eve.json, the SOAR response engine, then iptables or nftables, the unified log, the WebSocket stream and optional Kafka.">
<defs><marker id="ah" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L8 4L0 8z" fill="context-stroke"/></marker></defs>
<g data-s="1">${edge('M120 55H160')}${edge('M270 55H310')}${edge('M460 55H510')}${node(20, 30, 100, 50, 'TRAFFIC')}${node(160, 30, 110, 50, 'NFQUEUE')}${node(310, 30, 150, 50, 'SURICATA', 'inline · local.rules')}${node(510, 30, 190, 50, 'logs/eve.json')}</g>
<g data-s="2">${edge('M605 80V160H460')}${edge('M250 160H310')}${node(100, 135, 150, 50, 'ALLOWLIST', 'loopback·host·gw·dns')}${node(310, 135, 150, 50, 'SOAR ENGINE', 'block · allow · log')}</g>
<g data-s="3"><path class="e" d="M385 185V225M605 160V225M95 225H630"/>${edge('M95 225V250')}${edge('M275 225V250')}${edge('M455 225V250')}${edge('M630 225V250')}${node(20, 250, 150, 50, 'IPTABLES / NFT', 'enforce block')}${node(200, 250, 150, 50, 'UNIFIED LOG', 'unified_events.json')}${node(380, 250, 150, 50, 'EVENT STREAM', 'ws /ws/logs')}${node(560, 250, 140, 50, 'KAFKA', 'optional', true)}</g>
</svg>`;

export function flagshipBlock() {
  const { stages, experimental } = flagship;
  return `<div class="flag" data-stages data-active="1">
  <div class="flag-l" role="group" aria-label="Pipeline stages">
    ${stages.map((s) => `<button class="stage" type="button" data-stage="${s.n}" aria-pressed="${s.n === 1}"><span class="mono">0${s.n}</span><b>${s.title}</b><em class="mono">${s.tag}</em><p>${s.body}</p></button>`).join('')}
    <div class="exp"><span class="mono">Experimental · not wired in</span><ul>${experimental.map((e) => `<li class="mono">${e}</li>`).join('')}</ul></div>
  </div>
  <div class="flag-r">
    <div class="diagram">${schematic}</div>
    <div class="term"><div class="term-h mono"><span>simulated output · documentation addresses</span><i class="dot"></i></div><pre id="term" aria-live="off"></pre></div>
  </div>
  <script type="application/json" data-logs>${json(stages.map((s) => s.log))}</script>
</div>`;
}

export const copyCmd = (cmd, label = cmd) => `<button class="cmd" type="button" data-copy="${esc(cmd)}" aria-label="Copy command: ${esc(cmd)}"><span class="mono">$</span> <code>${esc(label)}</code><span class="mono cp">copy</span></button>`;
