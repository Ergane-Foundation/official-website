import { u } from '../layout.mjs';
import { secHead, avatar, who, people, feed, channels } from '../parts.mjs';

const steps = [
  ['Pick or open an issue', 'Start with any issue labelled “good first issue”, or open one describing what you want to change. Small, focused changes land fastest.'],
  ['Talk it through', 'Say hello in Discord. The core members assigned to the project can tell you whether the idea fits and where to start in the code.'],
  ['Open a pull request', 'Fork the repository, make the change, and open a pull request. The core members assigned to that repository review it; projects with automated checks run them on every PR.'],
  ['Merge and ship', 'Once reviewed and passing, a core member merges it. Your commit is credited to you and released under the project license.'],
];

export function community({ gh }) {
  const { core, contributors } = people(gh);
  return `
<section class="sec page-h">
  ${secHead('COMMUNITY // HOW WE WORK', 'How Ergane works', 'Ergane (er-GAH-neh) was the ancient Greek title for the patron of makers. The foundation is a home for open-source projects, stewarded by a core team and open to contributors.')}
  <div class="grid3 facts">
    <article class="card"><span class="mono">01</span><h3>Core members decide</h3><p>Core decisions, such as what the foundation takes on and where it goes next, are made by the core members.</p></article>
    <article class="card"><span class="mono">02</span><h3>Every repository has an owner</h3><p>Each repository has one or more core members assigned to it, who look after that project.</p></article>
    <article class="card"><span class="mono">03</span><h3>Open to contributors</h3><p>Anyone can contribute. Software is released under Apache-2.0 unless a project says otherwise, and security issues are reported privately as each project's SECURITY.md describes.</p></article>
  </div>
</section>

<section class="sec">
  ${secHead('01 // PIPELINE', 'How a contribution lands', 'Select a step.')}
  <div class="steps" data-stages data-active="1">
    <div class="step-tabs" role="group" aria-label="Contribution steps">${steps.map(([t], i) => `<button class="stage" type="button" data-stage="${i + 1}" aria-pressed="${i === 0}"><span class="mono">0${i + 1}</span><b>${t}</b></button>`).join('')}</div>
    <div class="step-body card">${steps.map(([t, b], i) => `<div data-s="${i + 1}"><span class="mono">STEP 0${i + 1}</span><h3>${t}</h3><p>${b}</p></div>`).join('')}</div>
  </div>
</section>

<section class="sec">
  ${secHead('02 // PEOPLE', 'Core members and contributors', 'Core members decide, and each is assigned to one or more repositories. Contributors are everyone else with a commit or pull request in any Ergane repository.')}
  <div class="group"><h3 class="mono">Core members · ${core.length}</h3><div class="avs">${core.map(who).join('')}</div></div>
  ${contributors.length ? `<div class="group"><h3 class="mono">Contributors · ${contributors.length}</h3><div class="avs wall">${contributors.map((l) => avatar(l)).join('')}</div></div>` : ''}
</section>

<section class="sec">
  ${secHead('03 // START HERE', 'Open work')}
  ${feed(gh)}
</section>

<section class="sec">
  ${secHead('04 // CHANNELS', 'Where we talk')}
  ${channels()}
</section>`;
}
