'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { propose } from '@/app/propose/actions';
import { discussionsUrl, NOT_OWNER, ownership, steps, stepsFor, words, type Errors, type Field, type State, type Values } from '@/lib/proposal-form';
import { Arrow } from './icons';

type Kind<K extends Field['kind']> = Extract<Field, { kind: K }>;
type Props<F extends Field> = { f: F; v?: string; err?: string };

const ALL = [...steps, ownership];

function Choice({ f, v, err }: Props<Kind<'choice'>>) {
  const id = `p-${f.name}-h`;
  return (
    <fieldset className="field choice" aria-describedby={f.hint || err ? id : undefined}>
      <legend>{f.label}</legend>
      <div className="opts">
        {f.options.map((o) => (
          <label key={o} className="opt"><input type="radio" name={f.name} value={o} defaultChecked={v === o} required={!f.optional} /><span>{o}</span></label>
        ))}
      </div>
      {f.hint || err ? <small id={id} className={err ? 'err' : undefined}>{err ?? f.hint}</small> : null}
    </fieldset>
  );
}

function Long({ f, v, err }: Props<Kind<'long'>>) {
  const id = `p-${f.name}`;
  const [n, setN] = useState(words(v ?? ''));
  return (
    <div className="field">
      <label htmlFor={id}>{f.label}{f.optional ? <span className="mono"> optional</span> : null}</label>
      <textarea id={id} name={f.name} rows={5} defaultValue={v} required={!f.optional} maxLength={1500} aria-invalid={!!err} aria-describedby={`${id}-h`} onChange={(e) => setN(words(e.target.value))} />
      <small id={`${id}-h`} className={err ? 'err' : undefined}>{err ?? f.hint} {f.words ? <span className="mono">{n} / {f.words}</span> : null}</small>
    </div>
  );
}

function Short({ f, v, err }: Props<Kind<'text' | 'url' | 'github'>>) {
  const id = `p-${f.name}`;
  const props: React.InputHTMLAttributes<HTMLInputElement> =
    f.kind === 'url' ? { type: 'url', inputMode: 'url', placeholder: 'https://github.com/you/project', maxLength: 200, autoComplete: 'off' }
    : f.kind === 'github' ? { type: 'text', placeholder: 'https://github.com/yourname', maxLength: 80, autoComplete: 'off', autoCapitalize: 'none', spellCheck: false, pattern: '(https?://(www\\.)?github\\.com/)?@?[A-Za-z0-9\\-]+/?', title: 'Your GitHub profile address' }
    : { type: 'text', maxLength: 120, autoComplete: 'name' };
  return (
    <div className="field">
      <label htmlFor={id}>{f.label}</label>
      <input id={id} name={f.name} defaultValue={v} required={!f.optional} aria-invalid={!!err} aria-describedby={err || f.hint ? `${id}-h` : undefined} {...props} />
      {err || f.hint ? <small id={`${id}-h`} className={err ? 'err' : undefined}>{err ?? f.hint}</small> : null}
    </div>
  );
}

// The proposal form, one step at a time. Every step stays mounted and is hidden, not removed, so nothing typed is lost
// moving back and forth. "No / not sure" on the rights question skips Commitment and ends on the ownership notice.
// React resets uncontrolled inputs after every submit, so the values the server sends back are used as their defaults.
export function ProposalForm() {
  const [state, action, pending] = useActionState<State, FormData>(propose, { status: 'idle' });
  const form = useRef<HTMLFormElement>(null);
  const [rights, setRights] = useState('');
  const [at, setAt] = useState(0);
  const shown = useRef(0);

  const flow = stepsFor(rights);
  const step = Math.min(at, flow.length - 1);
  const last = step === flow.length - 1;
  const v: Values = state.status === 'error' ? state.values : {};
  const errors: Errors = state.status === 'error' ? state.errors ?? {} : {};

  // After a failed submit, go to the first step that has a problem.
  useEffect(() => {
    if (state.status !== 'error' || !state.errors) return;
    const bad = flow.findIndex((s) => s.fields.some((f) => state.errors?.[f.name]));
    if (bad >= 0) setAt(bad);
  }, [state]); // eslint-disable-line react-hooks/exhaustive-deps

  // Moving between steps: bring the form into view and put focus on the step's heading.
  useEffect(() => {
    if (shown.current === step) return;
    shown.current = step;
    form.current?.querySelector<HTMLElement>('fieldset[data-step]:not([hidden]) > legend')?.focus({ preventScroll: true });
    form.current?.scrollIntoView({ block: 'start', behavior: 'instant' }); // a new step is a new page: jump, don't glide
  }, [step]);

  const next = () => {
    const fs = form.current?.querySelector<HTMLFieldSetElement>(`fieldset[data-step="${flow[step].id}"]`);
    for (const el of fs?.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input, textarea') ?? []) {
      if (!el.checkValidity()) { el.reportValidity(); return; }
    }
    setAt(step + 1);
  };

  if (state.status === 'ok') {
    return (
      <div className="term done" role="status">
        <div className="term-h mono"><span>ergane · propose</span><i className="dot" /></div>
        <pre>{`$ ergane propose --submit\n[ok]   ${state.onHold ? 'details kept on record' : 'proposal received'}\n[ok]   discussion opened on GitHub`}</pre>
        <div className="done-b">
          <p>
            {state.onHold
              ? 'Thank you. Your details are on record. A project can only be considered once ownership of the code is clear, so reapply when that is resolved.'
              : 'Thank you. Your proposal is now a public discussion, and a core member will reply there.'}{' '}
            Open it and choose <b>Subscribe</b> to get notified of replies.
          </p>
          <div className="row">
            <a className="btn pri" href={state.url} rel="noopener">View your proposal <Arrow /></a>
            <a className="btn ghost" href={discussionsUrl} rel="noopener">All proposals</a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form
      ref={form}
      className="pform"
      action={action}
      onChange={(e) => { const t = e.target as unknown as HTMLInputElement; if (t.name === 'rights') setRights(t.value); }}
      onKeyDown={(e) => {
        // Enter walks forward instead of submitting a half-finished form
        if (e.key === 'Enter' && (e.target as HTMLElement).tagName === 'INPUT') { e.preventDefault(); if (last) form.current?.requestSubmit(); else next(); }
      }}
    >
      <div className="pf-prog" role="progressbar" aria-label="Form progress" aria-valuemin={1} aria-valuemax={flow.length} aria-valuenow={step + 1}>
        <span className="mono">Step {step + 1} of {flow.length} · {flow[step].title}</span>
        <div className="pf-bar"><i style={{ width: `${((step + 1) / flow.length) * 100}%` }} /></div>
      </div>

      {state.status === 'error' && state.message ? <p className="pform-msg" role="alert">{state.message} <a href={`${discussionsUrl}/new/choose`} rel="noopener">Or post it on GitHub directly <Arrow /></a></p> : null}
      {state.status === 'error' && state.errors ? <p className="pform-msg" role="alert">Some answers need another look. They are marked below.</p> : null}

      {ALL.map((s) => (
        <fieldset key={s.id} className="pf-step" data-step={s.id} hidden={flow[step].id !== s.id} disabled={!flow.includes(s)}>
          <legend className="pf-title" tabIndex={-1}>{s.title}</legend>
          {s.intro ? <p className="fine">{s.intro}</p> : null}
          {s.fields.map((f) =>
            f.kind === 'choice' ? <Choice key={f.name} f={f} v={v[f.name]} err={errors[f.name]} />
            : f.kind === 'long' ? <Long key={f.name} f={f} v={v[f.name]} err={errors[f.name]} />
            : <Short key={f.name} f={f} v={v[f.name]} err={errors[f.name]} />,
          )}
        </fieldset>
      ))}

      {/* honeypot: hidden from people and from assistive tech, filled in by bots */}
      <div className="hp" aria-hidden="true"><label>Leave this empty<input name="website" tabIndex={-1} autoComplete="off" /></label></div>

      <div className="pf-nav">
        {step > 0 ? <button className="btn ghost" type="button" onClick={() => setAt(step - 1)}>Back</button> : null}
        {last
          ? <button className="btn pri" type="submit" disabled={pending}>{pending ? 'Posting…' : rights === NOT_OWNER ? 'Submit and keep my details on record' : 'Submit proposal'}</button>
          : <button className="btn pri" type="button" onClick={next}>Next</button>}
      </div>
      <p className="fine">Everything you enter, including your name, is posted publicly as a discussion in the foundation’s GitHub repository. We do not ask for an email address; replies happen in the discussion. Please leave out anything private.</p>
    </form>
  );
}
