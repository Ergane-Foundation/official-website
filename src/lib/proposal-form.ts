import { ORG } from './site';

// The proposal questions. The form, the validation and the discussion that gets posted are all driven from this list,
// so a question is added or reworded here and nowhere else. Safe to import from the browser: nothing server-only in here.
export const REPO = 'official-website';
export const discussionsUrl = `https://github.com/${ORG}/${REPO}/discussions`;

type Base = { name: string; label: string; hint?: string; optional?: boolean };
export type Field = Base & (
  | { kind: 'text' }
  | { kind: 'url' }
  | { kind: 'github' }
  | { kind: 'long'; words?: number }
  | { kind: 'choice'; options: readonly string[] }
);
export type Step = { id: string; title: string; intro?: string; fields: Field[] };

export type Values = Record<string, string>;
export type Errors = Record<string, string>;
export type State =
  | { status: 'idle' }
  | { status: 'ok'; url: string; onHold?: boolean }
  | { status: 'error'; message?: string; errors?: Errors; values: Values };

const yesNo = ['Yes', 'No'] as const;

// Answering this with NOT_OWNER skips "Commitment" and ends on the ownership notice: the details are kept on record and
// the project can be proposed again once ownership is clear.
export const NOT_OWNER = 'No / not sure';

export const steps: Step[] = [
  {
    id: 'you', title: 'About you', intro: 'All questions are required unless marked optional.',
    fields: [
      { name: 'fullName', label: 'Full name', kind: 'text' },
      { name: 'role', label: 'Current designation', kind: 'choice', options: ['Student', 'Software engineer / developer', 'Researcher', 'Independent developer', 'Other'] },
      { name: 'github', label: 'GitHub profile URL', kind: 'github' },
    ],
  },
  {
    id: 'experience', title: 'Open source experience',
    fields: [
      { name: 'contributed', label: 'Have you contributed to open source projects other than your own?', kind: 'choice', options: ['Yes, regularly', 'Yes, a few times', 'No'] },
      { name: 'merged', label: 'How many of your pull requests have been merged into projects you do not own?', kind: 'choice', options: ['None', '1 to 5', '6 to 20', 'More than 20'] },
      { name: 'maintained', label: 'Have you maintained an open source project used by others?', kind: 'choice', options: yesNo },
      { name: 'programme', label: 'Have you taken part in a structured open source programme (GSoC, LFX, Outreachy or similar)?', kind: 'choice', options: ['Yes, selected', 'Applied, not selected', 'No'] },
    ],
  },
  {
    id: 'project', title: 'The project',
    fields: [
      { name: 'repo', label: 'Repository link', kind: 'url' },
      { name: 'about', label: 'What does the project do, and who is it for?', hint: '100 words or fewer.', kind: 'long', words: 100 },
      { name: 'area', label: 'Which area does it belong to?', kind: 'choice', options: ['Infrastructure / DevOps', 'Backend / systems', 'Security', 'Developer tools', 'Mobile / web application', 'AI / ML', 'Other'] },
      { name: 'stage', label: 'Current stage of the project', kind: 'choice', options: ['Idea or early prototype', 'Working prototype', 'Feature-complete, not yet released', 'Released and in use'] },
      { name: 'shippable', label: 'Is the project shippable today?', hint: 'Shippable means someone else can install and use it by following the README alone.', kind: 'choice', options: ['Yes, without help', 'Yes, with some help', 'Not yet'] },
      { name: 'spent', label: 'How much time have you spent building it?', kind: 'choice', options: ['Less than 2 weeks', '2 weeks to 2 months', '2 to 6 months', 'More than 6 months'] },
      { name: 'built', label: 'How was the project primarily built?', kind: 'choice', options: ['Over a sustained period, out of personal interest', 'For coursework or a capstone', 'At a hackathon, and developed further since', 'At a hackathon, not developed further'] },
    ],
  },
  {
    id: 'quality', title: 'Engineering quality',
    fields: [
      { name: 'history', label: 'Does the project have a clean commit history?', hint: 'Meaningful commit messages, logical commits, and no secrets or credentials ever committed.', kind: 'choice', options: ['Yes', 'Mostly, with minor clean-up needed', 'No'] },
      { name: 'tests', label: 'Does it have automated tests?', kind: 'choice', options: ['Yes, run in CI', 'Yes, but not in CI', 'No'] },
      { name: 'docs', label: 'Is the documentation sufficient for a new contributor to set it up?', kind: 'choice', options: ['Yes', 'Partially', 'No'] },
      { name: 'licence', label: 'Does it have an OSI-approved open source licence?', kind: 'choice', options: ['Yes', 'Not yet, but willing to add one', 'No'] },
      { name: 'rights', label: 'Do you own the rights to all the code, or have consent from every co-author to open source it under Ergane Foundation?', kind: 'choice', options: ['Yes', NOT_OWNER] },
    ],
  },
  {
    id: 'commitment', title: 'Commitment',
    fields: [
      { name: 'time', label: 'How much time can you commit to maintaining the project each week?', kind: 'choice', options: ['Less than 2 hours', '2 to 5 hours', 'More than 5 hours'] },
      { name: 'review', label: 'Will you review contributor pull requests within an agreed timeframe and follow Ergane Foundation contribution and review guidelines?', kind: 'choice', options: yesNo },
      { name: 'why', label: 'Why should this project be part of Ergane Foundation?', kind: 'long', optional: true },
    ],
  },
];

export const ownership: Step = {
  id: 'ownership', title: 'Ownership must be clear', fields: [],
  intro: 'A project can only be considered once ownership of the code is clear and every co-author has agreed. You can submit this form to keep your details on record, and reapply once this is resolved.',
};

// The steps a given answer to the rights question leads through.
export const stepsFor = (rights: string): Step[] =>
  rights === NOT_OWNER ? [...steps.filter((s) => s.id !== 'commitment'), ownership] : steps;

export const words = (s: string) => (s.trim() ? s.trim().split(/\s+/).length : 0);
