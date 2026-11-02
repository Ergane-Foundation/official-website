import { links, nav } from './site.mjs';

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
// BASE lets the site live under a sub-path (e.g. BASE=/official-website for GitHub project pages).
export const BASE = (process.env.BASE || '').replace(/\/$/, '');
export const u = (p) => BASE + p;
// JSON inside <script type="application/json">: only "<" can break out.
export const json = (v) => JSON.stringify(v).replace(/</g, '\\u003c');

const mark = `<svg class="mark" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h14v3.2H8.2v3.2H16v3.2H8.2v3.2H19V20H5z" fill="currentColor"/></svg>`;
export const arrow = `<svg class="arr" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M3 8h9m-3.5-4L12.5 8 8.5 12" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>`;

export function shell({ title, desc, path, theme = 'dark', body, home = false, idx = [], stars = 0 }) {
  const full = home ? title : `${title} — Ergane Foundation`;
  const navHtml = nav.map(([l, h]) => `<a href="${u(h)}"${path.startsWith(h) ? ' aria-current="page"' : ''}>${l}</a>`).join('');
  return `<!doctype html>
<html lang="en" data-theme="${theme}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(full)}</title>
<meta name="description" content="${esc(desc)}">
<meta property="og:title" content="${esc(full)}">
<meta property="og:description" content="${esc(desc)}">
<meta name="theme-color" content="#08090C">
<link rel="icon" href="${u('/assets/favicon.svg')}" type="image/svg+xml">
<link rel="preload" href="${u('/assets/fonts/geist.woff2')}" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="${u('/assets/fonts/geist-mono.woff2')}" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="${u('/assets/style.css')}">
<script>try{var t=localStorage.getItem('ergane-theme');if(t)document.documentElement.dataset.theme=t}catch(e){}</script>
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<header class="top"><div class="bar">
  <a class="brand" href="${u('/')}" aria-label="Ergane Foundation home">${mark}<b>Ergane</b><span class="mono">Foundation</span></a>
  <nav aria-label="Primary">${navHtml}</nav>
  <div class="tools">
    <button class="btn sm ghost" type="button" data-open-palette aria-label="Search the site">Search <kbd data-kbd>Ctrl K</kbd></button>
    <button class="btn sm ghost icon" type="button" data-theme-toggle aria-label="Toggle light and dark theme"><svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true"><circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M8 2a6 6 0 0 0 0 12z" fill="currentColor"/></svg></button>
    <a class="btn sm" href="${links.github}" rel="noopener">GitHub <span class="mono">★ ${stars}</span></a>
  </div>
</div></header>
<div class="frame">
<main id="main">
${body}
</main>
<footer class="sec foot">
  <div class="foot-grid">
    <div><a class="brand" href="${u('/')}">${mark}<b>Ergane</b></a><p>Open-source software, built and maintained in the open by a community of contributors. Released under the Apache License 2.0 unless a project states otherwise.</p></div>
    <div><h3 class="mono">Explore</h3>${nav.map(([l, h]) => `<a href="${u(h)}">${l}</a>`).join('')}</div>
    <div><h3 class="mono">Community</h3><a href="${links.github}" rel="noopener">GitHub</a><a href="${links.discord}" rel="noopener">Discord</a><a href="${links.propose}" rel="noopener">Propose a project</a><a href="${links.goodFirst}" rel="noopener">Good first issues</a></div>
  </div>
  <p class="mono legal">© Ergane Foundation · Apache-2.0 · Security issues are reported privately via each project's SECURITY.md</p>
</footer>
</div>
<dialog id="palette" aria-label="Command palette">
  <form method="dialog"><input id="pq" type="text" placeholder="Jump to a project, page, doc or channel…" autocomplete="off" spellcheck="false" aria-label="Search"><ul id="pr" role="listbox"></ul><p class="mono hint">↑↓ navigate · ↵ open · ⇧↵ GitHub · esc close</p></form>
</dialog>
<script id="idx" type="application/json">${json(idx)}</script>
<script src="${u('/assets/app.js')}" defer></script>
${home ? `<script src="${u('/assets/lattice.js')}" defer></script>` : ''}
</body>
</html>
`;
}
