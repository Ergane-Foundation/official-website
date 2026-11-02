import { esc, u, arrow } from '../layout.mjs';
import { secHead } from '../parts.mjs';

// Per-project doc links. Only Vajra's file list has been confirmed; the rest use GitHub routes that exist on every repo.
const extra = {
  vajra: [['Architecture', 'docs/architecture.md'], ['Contributing', 'CONTRIBUTING.md'], ['Security policy', 'SECURITY.md'], ['Code of conduct', 'CODE_OF_CONDUCT.md']],
};

export function docs({ projects }) {
  const panel = (p) => {
    const rows = [
      ['README', `${p.url}#readme`, 'Overview, status and quick start'],
      ...(extra[p.slug] ?? []).map(([l, f]) => [l, `${p.url}/blob/HEAD/${f}`, f]),
      ['Releases', `${p.url}/releases`, 'Tagged versions and changelogs'],
      ['Issues', `${p.url}/issues`, 'Open bugs and requests'],
      ['Security advisories', `${p.url}/security`, 'Report a vulnerability privately'],
    ];
    return `<section class="doc-panel" id="${p.slug}"><span class="mono">[DOCS // ${esc(p.name)}]</span><h2>${esc(p.name)}</h2><p>${esc(p.tagline)}</p>
<ul class="doc-links">${rows.map(([l, h, d]) => `<li><a href="${h}" rel="noopener"><b>${l}</b><span class="mono">${esc(d)}</span>${arrow}</a></li>`).join('')}</ul>
<p><a href="${u(`/projects/${p.slug}/`)}">${esc(p.name)} project page ${arrow}</a></p></section>`;
  };
  return `
<section class="sec page-h">
  ${secHead('DOCS // HUB', 'Documentation', 'Manuals live next to the code, in each project’s repository. Pick a project to see where its documentation is.')}
</section>
<section class="sec docs">
  <nav class="doc-nav" aria-label="Projects">${projects.map((p) => `<a href="#${p.slug}">${esc(p.name)}</a>`).join('')}</nav>
  <div class="doc-main">${projects.map(panel).join('')}</div>
</section>`;
}
