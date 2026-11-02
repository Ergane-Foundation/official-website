import { links, members } from '../site.mjs';
import { u, arrow } from '../layout.mjs';
import { secHead, avatar, feed, channels } from '../parts.mjs';

const steps = [
  ['Pick or open an issue', 'Start with any issue labelled “good first issue”, or open one describing what you want to change. Small, focused changes land fastest.'],
  ['Talk it through', 'Say hello in Discord. The maintainers of the project can tell you whether the idea fits and where to start in the code.'],
  ['Open a pull request', 'Fork the repository, make the change, and open a pull request. Maintainers review it; projects with automated checks run them on every PR.'],
  ['Merge and ship', 'Once reviewed and passing, a maintainer merges it. Your commit is credited to you and released under the project license.'],
];

export function community({ gh }) {
  const wall = [...new Set([...members, ...gh.contributors])];
  return `
<section class="sec page-h">
  ${secHead('COMMUNITY // GOVERNANCE', 'How Ergane works', 'Ergane (er-GAH-neh) was the ancient Greek title for the patron of makers. The foundation is a home for open-source projects, each run by its own maintainers.')}
  <div class="grid3 facts">
    <article class="card"><span class="mono">01</span><h3>Projects run by maintainers</h3><p>Each repository is owned by the people who build it. The foundation provides the organisation, the home on GitHub, and the community around it.</p></article>
    <article class="card"><span class="mono">02</span><h3>Apache-2.0 by default</h3><p>Software here is released under the Apache License 2.0 unless a project states otherwise.</p></article>
    <article class="card"><span class="mono">03</span><h3>Security reported privately</h3><p>Vulnerabilities go to the maintainers privately, as described in each project's SECURITY.md, never in a public issue.</p></article>
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
  ${secHead('02 // PEOPLE', 'Maintainers and contributors', 'Org members carry an amber ring. Contributors are read from GitHub when the site is built.')}
  <div class="avs wall">${wall.map(avatar).join('')}</div>
</section>

<section class="sec">
  ${secHead('03 // START HERE', 'Open work')}
  ${feed(gh)}
</section>

<section class="sec">
  ${secHead('04 // CHANNELS', 'Where we talk')}
  ${channels()}
  <p class="note">Want to bring a project to Ergane? <a href="${links.propose}" rel="noopener">Propose it here ${arrow}</a></p>
</section>`;
}
