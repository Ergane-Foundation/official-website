// Refresh src/data/snapshot.json (the fallback used when GitHub is unreachable) from a fully live fetch: `npm run snapshot`.
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { loadGithub } from '../src/lib/github';

async function main() {
  const gh = await loadGithub();
  if (gh.source !== 'live') {
    console.error(`refusing to snapshot ${gh.source} data${gh.stale.length ? ` (stale: ${gh.stale.join(', ')})` : ''}; wait for the rate limit or set GITHUB_TOKEN`);
    process.exit(1);
  }
  const { stale, ...fresh } = gh;
  await writeFile(join(__dirname, '../src/data/snapshot.json'), `${JSON.stringify({ ...fresh, source: 'snapshot' }, null, 2)}\n`);
  console.log(`snapshot written: ${gh.repos.length} repos, ${gh.members.length} members, ${gh.contributors.length} contributors`);
}
main();
