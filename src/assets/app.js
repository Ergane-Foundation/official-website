(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const root = document.documentElement;

  // theme: one-click override, remembered per browser
  $('[data-theme-toggle]').addEventListener('click', () => {
    const next = root.dataset.theme === 'light' ? 'dark' : 'light';
    root.dataset.theme = next;
    try { localStorage.setItem('ergane-theme', next); } catch {}
  });

  const mac = /Mac|iPhone|iPad/.test(navigator.platform);
  $$('[data-kbd]').forEach((k) => (k.textContent = mac ? '⌘K' : 'Ctrl K'));

  // cursor-tracked radial borders: every card in a hovered grid lights up relative to the pointer
  $$('.spot').forEach((c) => c.parentElement.classList.add('has-spot'));
  let raf = 0;
  document.addEventListener('pointermove', (e) => {
    if (raf || !e.target.closest?.('.has-spot')) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      $$('.has-spot > .spot').forEach((c) => {
        const r = c.getBoundingClientRect();
        c.style.setProperty('--mx', `${e.clientX - r.left}px`);
        c.style.setProperty('--my', `${e.clientY - r.top}px`);
      });
    });
  });

  // copy buttons
  document.addEventListener('click', async (e) => {
    const el = e.target.closest('[data-copy]');
    if (!el) return;
    const tag = $('.cp', el);
    try { await navigator.clipboard.writeText(el.dataset.copy); if (tag) { tag.textContent = 'copied'; setTimeout(() => (tag.textContent = 'copy'), 1500); } } catch {}
  });

  // simulated terminal: print lines one by one (all at once under reduced motion)
  const type = (el, lines, ms = 650) => {
    clearTimeout(el._t);
    if (reduced) { el.textContent = lines.join('\n'); return; }
    el.textContent = '';
    let i = 0;
    const next = () => { if (i < lines.length) { el.textContent += (i ? '\n' : '') + lines[i++]; el._t = setTimeout(next, ms); } };
    next();
  };

  // staged panels (flagship pipeline, contribution steps); an optional #term shows that stage's simulated log
  $$('[data-stages]').forEach((box) => {
    const logs = $('[data-logs]', box) && JSON.parse($('[data-logs]', box).textContent);
    const term = $('#term', box);
    const show = (n) => {
      box.dataset.active = n;
      $$('[data-stage]', box).forEach((b) => b.setAttribute('aria-pressed', b.dataset.stage == n));
      $$('[data-s]', box).forEach((g) => g.classList.toggle('on', g.dataset.s == n));
      if (term) type(term, logs[n - 1]);
    };
    box.addEventListener('click', (e) => { const b = e.target.closest('[data-stage]'); if (b) show(+b.dataset.stage); });
    show(1);
  });

  // project filters: AND across the two groups, mirrored in the URL (?domain=…&lang=…) so a filtered view can be shared
  const grid = $('#projects');
  if (grid && $('#none')) { // both exist only on /projects/; an id clash on another page must not stop the script
    const cards = $$('.proj', grid);
    const state = { domain: '', lang: '' };
    const known = (key, v) => $$(`.filter[data-filter=${key}] [data-v]`).some((b) => b.dataset.v === v);
    const params = new URLSearchParams(location.search);
    for (const key of Object.keys(state)) if (known(key, params.get(key) ?? '')) state[key] = params.get(key) ?? '';

    const apply = () => {
      const match = (c) => (!state.domain || c.dataset.domain === state.domain) && (!state.lang || c.dataset.lang === state.lang);
      let n = 0;
      cards.forEach((c) => { c.hidden = !match(c); n += !c.hidden; });
      $$('.filter').forEach((f) => $$('[data-v]', f).forEach((b) => b.setAttribute('aria-pressed', b.dataset.v === state[f.dataset.filter])));
      $('#count').textContent = `Showing ${n} of ${cards.length} project${cards.length === 1 ? '' : 's'}`;
      $('#none').hidden = n > 0;
      if (!n) {
        const flags = [state.domain && `--domain "${state.domain}"`, state.lang && `--lang "${state.lang}"`].filter(Boolean).join(' ');
        type($('#none-log'), [
          `$ ergane projects ${flags}`,
          `[ruleset] ${cards.length} projects scanned · 0 matched`,
          '[verdict] action=drop · nothing in this corner of the ecosystem yet',
          '[hint]    relax a filter, or propose a project that fills the gap',
        ], 450);
      }
      const p = new URLSearchParams(Object.entries(state).filter(([, v]) => v)).toString();
      history.replaceState(null, '', p ? `?${p}` : location.pathname);
    };
    $$('.filter').forEach((f) => f.addEventListener('click', (e) => {
      const b = e.target.closest('[data-v]');
      if (!b) return;
      state[f.dataset.filter] = b.dataset.v;
      apply();
    }));
    $('#reset').addEventListener('click', () => { state.domain = state.lang = ''; apply(); });
    apply();
  }

  // cycling CLI block
  $$('[data-cycle]').forEach((el) => {
    const cmds = JSON.parse(el.dataset.cycle);
    const out = $('code', el);
    if (reduced) { out.textContent = cmds[0]; return; }
    let c = 0, i = 0, dir = 1;
    setInterval(() => {
      i += dir;
      out.textContent = cmds[c].slice(0, i);
      if (i >= cmds[c].length + 14) dir = -1;
      if (i <= 0) { dir = 1; c = (c + 1) % cmds.length; }
    }, 55);
  });

  // command palette (Ctrl/Cmd+K)
  const dlg = $('#palette'), input = $('#pq'), list = $('#pr');
  const idx = JSON.parse($('#idx').textContent);
  let sel = 0, hits = [];
  const draw = () => {
    const q = input.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
    hits = idx.filter((i) => q.every((w) => `${i.t} ${i.d} ${i.k} ${i.g ? 'github' : ''}`.toLowerCase().includes(w))).slice(0, 12);
    sel = Math.min(sel, Math.max(0, hits.length - 1));
    const attr = (s) => s.replace(/"/g, '&quot;');
    list.innerHTML = hits.length
      ? hits.map((h, n) => `<li><a role="option" href="${attr(h.h)}" aria-selected="${n === sel}"${/^https?:/.test(h.h) ? ' rel="noopener"' : ''}><span>${h.t.replace(/</g, '&lt;')}</span><span class="mono">${h.k}</span></a>${h.g ? `<a class="gh mono" href="${attr(h.g)}" target="_blank" rel="noopener" aria-label="${attr(h.t)} on GitHub">GitHub ↗</a>` : ''}</li>`).join('')
      : '<li><a aria-selected="false"><span>No matches</span></a></li>';
  };
  const open = () => { input.value = ''; sel = 0; draw(); dlg.showModal(); input.focus(); };
  $$('[data-open-palette]').forEach((b) => b.addEventListener('click', open));
  document.addEventListener('keydown', (e) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); dlg.open ? dlg.close() : open(); } });
  input.addEventListener('input', () => { sel = 0; draw(); });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); sel = (sel + (e.key === 'ArrowDown' ? 1 : -1) + hits.length) % Math.max(1, hits.length); draw(); $('[aria-selected=true]', list)?.scrollIntoView({ block: 'nearest' }); }
    if (e.key === 'Enter' && hits[sel]) {
      e.preventDefault();
      if (e.shiftKey && hits[sel].g) window.open(hits[sel].g, '_blank', 'noopener');
      else location.href = hits[sel].h;
    }
  });
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
})();
