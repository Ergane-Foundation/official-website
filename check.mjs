// Smoke check after `npm run build`: every internal href/src and #anchor in dist/ must resolve.
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const walk = (d) => readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(d, e.name)) : [join(d, e.name)]));
const base = (process.env.BASE || '').replace(/\/$/, '');
let bad = 0;
for (const f of walk('dist').filter((f) => f.endsWith('.html'))) {
  const html = readFileSync(f, 'utf8');
  const ids = new Set([...html.matchAll(/ id="([^"]+)"/g)].map((m) => m[1]));
  for (const [, p] of html.matchAll(/(?:href|src)="(\/[^"#]*)/g)) {
    const rel = p.slice(base.length);
    if (!existsSync(join('dist', rel.endsWith('/') ? `${rel}index.html` : rel))) { bad++; console.error(`missing ${p} (in ${f})`); }
  }
  for (const [, a] of html.matchAll(/href="#([^"]+)"/g)) if (!ids.has(a)) { bad++; console.error(`no anchor #${a} (in ${f})`); }
}
if (bad) process.exit(1);
console.log('links ok');
