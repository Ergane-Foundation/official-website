// Guards for the per-project page content: `npm test`. Catches a project without content, a table whose rows do not
// match its header, and diagram labels too long for their boxes.
import assert from 'node:assert/strict';
import { content } from '../src/content/projects';
import { notes } from '../src/content/research';
import { layoutStages } from '../src/lib/diagram';
import { projectSlugs } from '../src/lib/site';

assert.deepEqual(Object.keys(content).sort(), [...projectSlugs].sort(), 'every curated project needs content, and only those');

for (const [slug, c] of Object.entries(content)) {
  const at = (what: string) => `${slug}: ${what}`;
  assert.ok(c.overview.paragraphs.length > 0, at('overview paragraphs'));
  assert.equal(c.overview.highlights.length, 3, at('three highlights'));
  assert.ok(c.quickstart.blocks.length > 0 && c.quickstart.blocks.every((b) => b.code.trim()), at('quickstart blocks'));
  assert.ok(c.how.stages.length >= 3 && c.how.termLabel, at('stages'));
  assert.ok(c.docs.length >= 5 && new Set(c.docs.map((d) => d[0])).size === c.docs.length, at('docs (unique labels)'));

  for (const t of [...(c.quickstart.tables ?? []), ...c.capabilities.tables]) {
    assert.ok(t.rows.length > 0, at(`empty table ${t.title}`));
    for (const r of t.rows) assert.equal(r.length, t.head.length, at(`row width in "${t.title}": ${r[0]}`));
    if (t.statusCol !== undefined) assert.ok(t.statusCol < t.head.length, at(`statusCol in "${t.title}"`));
  }

  // The auto diagram draws a box about 143-170 units wide: ~20 mono characters for the label, ~26 for the sub-label.
  if (!c.how.diagram) {
    for (const s of c.how.stages) {
      assert.ok(s.nodes && s.nodes.length >= 3 && s.nodes.length <= 4, at(`stage "${s.title}" needs 3-4 nodes`));
      for (const nd of s.nodes) {
        assert.ok(nd.label.length <= 20, at(`label too long: ${nd.label}`));
        assert.ok((nd.sub ?? '').length <= 26, at(`sub-label too long: ${nd.sub}`));
      }
    }
    const { rows } = layoutStages(c.how.stages);
    for (const row of rows) for (let i = 1; i < row.length; i++) assert.ok(row[i].x > row[i - 1].x + row[i - 1].w, at('nodes overlap'));
  }
}

// Research: every project has at least one note, slugs are unique, and each note points at a real project.
const slugs = notes.map((n) => n.slug);
assert.equal(new Set(slugs).size, slugs.length, 'duplicate research slugs');
for (const n of notes) assert.ok(projectSlugs.includes(n.project), `note ${n.slug}: unknown project ${n.project}`);
for (const p of projectSlugs) assert.ok(notes.some((n) => n.project === p), `no research note for ${p}`);

console.log('project content ok');
