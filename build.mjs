// Static site build: `node build.mjs` writes dist/, `node build.mjs --serve` also serves it and rebuilds on change.
import { rm, mkdir, writeFile, cp, readFile } from 'node:fs/promises';
import { watch } from 'node:fs';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { join, extname, resolve, sep } from 'node:path';
import { links, nav, catalog } from './src/site.mjs';
import { loadGithub } from './src/github.mjs';
import { shell, u } from './src/layout.mjs';
import { home } from './src/pages/home.mjs';
import { projectsIndex, projectPage } from './src/pages/projects.mjs';
import { community } from './src/pages/community.mjs';
import { researchIndex, notePage, notes } from './src/pages/research.mjs';
import { docs } from './src/pages/docs.mjs';

const DIST = 'dist';

async function build() {
  const gh = await loadGithub();
  if (process.argv.includes('--snapshot')) { // refresh the committed fallback from a fully live fetch
    if (gh.source !== 'live') throw new Error(`refusing to snapshot ${gh.source} data; wait for the rate limit or set GITHUB_TOKEN`);
    const { stale, ...fresh } = gh;
    await writeFile('src/snapshot.json', `${JSON.stringify({ ...fresh, source: 'snapshot' }, null, 2)}\n`);
  }
  const projects = catalog(gh);
  const ctx = { gh, projects };
  const stars = projects.reduce((n, p) => n + p.stars, 0);

  const idx = [
    ...nav.map(([t, h]) => ({ t, d: 'Page', h: u(h), k: 'page' })),
    ...projects.map((p) => ({ t: p.name, d: p.tagline, h: u(`/projects/${p.slug}/`), g: p.url, k: 'project' })),
    ...projects.map((p) => ({ t: `${p.name} docs`, d: 'Documentation', h: u(`/docs/#${p.slug}`), k: 'docs' })),
    ...notes.map((n) => ({ t: n.title, d: n.kind, h: u(`/research/${n.slug}/`), k: 'research' })),
    { t: 'Ergane-Foundation on GitHub', d: links.github, h: links.github, k: 'link' },
    { t: 'Join the Discord', d: 'Community discussion and onboarding', h: links.discord, k: 'link' },
    { t: 'Good first issues', d: 'Open issues across all repositories', h: links.goodFirst, k: 'link' },
    { t: 'Propose a project', d: 'Bring a project to Ergane', h: links.propose, k: 'link' },
  ];

  const pages = [
    ['index.html', { title: 'Ergane Foundation', desc: 'Ergane Foundation builds and maintains open-source security, privacy and infrastructure software, developed by a community of contributors.', path: '/', home: true, body: home(ctx) }],
    ['projects/index.html', { title: 'Projects', desc: 'Open-source projects maintained under the Ergane Foundation.', path: '/projects/', body: projectsIndex(ctx) }],
    ...projects.map((p) => [`projects/${p.slug}/index.html`, { title: p.name, desc: p.tagline, path: '/projects/', body: projectPage(p) }]),
    ['community/index.html', { title: 'Community', desc: 'How the Ergane Foundation works and how to contribute.', path: '/community/', body: community(ctx) }],
    ['research/index.html', { title: 'Research', desc: 'Engineering notes and proposals from Ergane Foundation projects.', path: '/research/', theme: 'light', body: researchIndex() }],
    ...notes.map((n) => [`research/${n.slug}/index.html`, { title: n.title, desc: n.summary, path: '/research/', theme: 'light', body: notePage(n) }]),
    ['docs/index.html', { title: 'Docs', desc: 'Where to find documentation for each Ergane Foundation project.', path: '/docs/', theme: 'light', body: docs(ctx) }],
    ['404.html', { title: 'Not found', desc: 'Page not found.', path: '/404', body: `<section class="sec page-h"><span class="mono">[404]</span><h1>Nothing at this address.</h1><p class="lede"><a href="${u('/')}">Back to the home page</a></p></section>` }],
  ];

  await rm(DIST, { recursive: true, force: true });
  await cp('src/assets', join(DIST, 'assets'), { recursive: true });
  await Promise.all(pages.map(async ([file, p]) => {
    await mkdir(join(DIST, file, '..'), { recursive: true });
    await writeFile(join(DIST, file), shell({ ...p, idx, stars }));
  }));
  console.log(`built ${pages.length} pages · github: ${gh.source}`);
}

const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.json': 'application/json' };

function serve() {
  const root = resolve(DIST);
  createServer(async (req, res) => {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (p.endsWith('/')) p += 'index.html';
    const file = resolve(join(root, p));
    try {
      if (file !== root && !file.startsWith(root + sep)) throw 0;
      const body = await readFile(file); // read before writing headers so a miss can still 404
      res.writeHead(200, { 'Content-Type': types[extname(file)] ?? 'application/octet-stream' }).end(body);
    } catch {
      const body = await readFile(join(root, '404.html')).catch(() => 'Not found');
      res.writeHead(404, { 'Content-Type': 'text/html' }).end(body);
    }
  }).listen(process.env.PORT || 4321, function () { console.log(`http://localhost:${this.address().port}`); });
  let t;
  watch('src', { recursive: true }, () => {
    clearTimeout(t);
    t = setTimeout(() => spawn(process.execPath, [process.argv[1]], { stdio: 'inherit' }), 150);
  });
}

await build();
if (process.argv.includes('--serve')) serve();
