import Link from 'next/link';
import { Arrow } from '@/components/icons';
import { SecHead } from '@/components/ui';
import { notes } from '@/content/research';
import { pageMeta } from '@/lib/meta';
import { projectName } from '@/lib/site';

export const metadata = pageMeta('Research', 'Engineering notes and proposals from Ergane Foundation projects.');

export default function ResearchPage() {
  return (
    <>
      <section className="sec page-h">
        <SecHead coord="RESEARCH // ENGINEERING" title="Engineering notes & RFCs" sub="Technical write-ups, design decisions and proposals from the foundation’s projects." />
      </section>
      <section className="sec">
        <SecHead coord="01 // NOTES" title="Latest" />
        <ul className="posts">
          {notes.map((n) => (
            <li key={n.slug} className="has-spot">
              <Link className="card spot" href={`/research/${n.slug}`}>
                <span className="mono">{projectName(n.project)} · {n.kind} · {n.date}</span><h3>{n.title}</h3><p>{n.summary}</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>
      <section className="sec">
        <SecHead coord="02 // RFCS" title="Proposals" />
        <p className="empty">No RFCs have been published yet. To bring a project to Ergane, <Link href="/propose">propose it here <Arrow /></Link>.</p>
      </section>
    </>
  );
}
