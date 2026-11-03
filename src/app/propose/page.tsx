import Link from 'next/link';
import { ProposalForm } from '@/components/ProposalForm';
import { SecHead } from '@/components/ui';
import { pageMeta } from '@/lib/meta';

export const metadata = pageMeta('Propose a project', 'Bring an open-source project to the Ergane Foundation.');

export default function ProposePage() {
  return (
    <section className="sec page-h">
      <Link className="crumb mono" href="/projects">← Projects</Link>
      <SecHead coord="PROPOSE // PROJECT PROPOSAL" title="Propose a project" sub="Ergane Foundation accepts a limited number of open source projects. Every proposal is reviewed by the maintainers against the criteria in this form. Please answer accurately. Incomplete or inaccurate proposals will not be considered." />
      <ProposalForm />
    </section>
  );
}
