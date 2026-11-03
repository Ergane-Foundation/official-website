import { ContributionSteps } from '@/components/Interactive';
import { Avatar, Channels, Feed, More, SecHead, Who } from '@/components/ui';
import { getGithub } from '@/lib/data';
import { pageMeta } from '@/lib/meta';
import { people } from '@/lib/view';

export const metadata = pageMeta('Community', 'How the Ergane Foundation works and how to contribute.');
export const revalidate = 3600;

const WALL = 12; // contributor avatars shown before "Show N more"

export default async function CommunityPage() {
  const gh = await getGithub();
  const { core, contributors } = people(gh);
  return (
    <>
      <section className="sec page-h">
        <SecHead coord="COMMUNITY // HOW WE WORK" title="How Ergane works" sub="Ergane (er-GAH-neh) was the ancient Greek title for the patron of makers. The foundation is a home for open-source projects, stewarded by a core team and open to contributors." />
        <div className="grid3 facts">
          <article className="card"><span className="mono">01</span><h3>Core members decide</h3><p>Core decisions, such as what the foundation takes on and where it goes next, are made by the core members.</p></article>
          <article className="card"><span className="mono">02</span><h3>Every repository has an owner</h3><p>Each repository has one or more core members assigned to it, who look after that project.</p></article>
          <article className="card"><span className="mono">03</span><h3>Open to contributors</h3><p>Anyone can contribute. Software is released under Apache-2.0 unless a project says otherwise, and security issues are reported privately as each project&apos;s SECURITY.md describes.</p></article>
        </div>
      </section>

      <section className="sec">
        <SecHead coord="01 // PIPELINE" title="How a contribution lands" sub="Select a step." />
        <ContributionSteps />
      </section>

      <section className="sec">
        <SecHead coord="02 // PEOPLE" title="Core members and contributors" sub="Core members decide, and each is assigned to one or more repositories. Contributors are everyone else with a commit or pull request in any Ergane repository." />
        <div className="group">
          <h3 className="mono">Core members · {core.length}</h3>
          <div className="avs">{core.map((l) => <Who key={l} login={l} />)}</div>
        </div>
        {contributors.length ? (
          <div className="group">
            <h3 className="mono">Contributors · {contributors.length}</h3>
            <div className="avs wall">{contributors.slice(0, WALL).map((l) => <Avatar key={l} login={l} />)}</div>
            {contributors.length > WALL ? (
              <More label={`Show ${contributors.length - WALL} more`}>
                <div className="avs wall">{contributors.slice(WALL).map((l) => <Avatar key={l} login={l} />)}</div>
              </More>
            ) : null}
          </div>
        ) : null}
      </section>

      <section className="sec">
        <SecHead coord="03 // START HERE" title="Open work" />
        <Feed gh={gh} />
      </section>

      <section className="sec">
        <SecHead coord="04 // CHANNELS" title="Where we talk" />
        <Channels />
      </section>
    </>
  );
}
