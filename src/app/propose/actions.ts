'use server';

import { headers } from 'next/headers';
import { parseProposal, submitProposal, tooMany } from '@/lib/proposal';
import { discussionsUrl, NOT_OWNER, type State } from '@/lib/proposal-form';

export async function propose(_prev: State, form: FormData): Promise<State> {
  // Honeypot: people never see this field. Answer as if it worked so a bot learns nothing, and post nothing.
  if (form.get('website')) return { status: 'ok', url: discussionsUrl };

  const parsed = parseProposal(form);
  if (!parsed.ok) return { status: 'error', errors: parsed.errors, values: parsed.values };
  const values = parsed.value;

  const ip = (await headers()).get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
  if (tooMany(ip)) return { status: 'error', message: 'Too many proposals from your network just now. Please try again in a few minutes.', values };

  try {
    return { status: 'ok', url: await submitProposal(values), onHold: values.rights === NOT_OWNER };
  } catch (e) {
    console.error(`[proposal] ${(e as Error).message}`);
    return { status: 'error', message: 'We could not post your proposal just now. Your answers are kept, so you can try again in a moment.', values };
  }
}
