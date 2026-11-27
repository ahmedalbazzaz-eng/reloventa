'use strict';
(() => {
  const api = window.reloventa;
  const $ = (s, r = document) => r.querySelector(s);
  const el = (tag, attrs = {}, ...kids) => { const n = document.createElement(tag); for (const [k, v] of Object.entries(attrs)) { if (k === 'class') n.className = v; else if (k === 'text') n.textContent = v; else if (k.startsWith('on')) n.addEventListener(k.slice(2), v); else if (v !== false && v != null) n.setAttribute(k, v === true ? '' : v); } kids.flat().forEach(c => n.append(c)); return n; };
  const svg = (id, cls = 'g') => { const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); s.setAttribute('class', cls); s.setAttribute('aria-hidden', 'true'); const u = document.createElementNS('http://www.w3.org/2000/svg', 'use'); u.setAttribute('href', '#i-' + id); s.append(u); return s; };

  const ACCENTS = ['#7B61FF', '#2E8BFF', '#00B8D9', '#1FBF8F', '#FFB020', '#FF6A3D', '#FF4F9A', '#B04CFF'];
  const THEMES = [['system', 'Auto', 'linear-gradient(135deg,#0B0820 50%,#F4F2FF 50%)'], ['midnight', 'Midnight', 'linear-gradient(135deg,#2B1A7A,#0B0724)'], ['daylight', 'Daylight', 'linear-gradient(135deg,#FFFFFF,#DCD5FF)'], ['aurora', 'Aurora', 'linear-gradient(135deg,#0E7C7B,#04121C)']];
  const LAYOUT_ORDER = ['auto', 'phone', 'wide'];
  const PHONE_W = 440;

  let S, P = [], byId = {};
  let current = null;             // platform id or null (home)
  let focus = false, viewState = {}, snapshotOn = false;
  let usageTick = 0, nudgeAcc = 0;

  const today = () => new Date().toISOString().slice(0, 10);
  const mins = s => Math.round(s / 60);
  const save = patch => { S = { ...S, ...patch }; return api.setSettings(patch); };

  /* ---------- Theme / accent / motion ---------- */
  function readableOn(hex) { const n = parseInt(hex.slice(1), 16), [r, g, b] = [n >> 16, (n >> 8) & 255, n & 255].map(v => { v /= 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }); const L = .2126 * r + .7152 * g + .0722 * b; return (1.05 / (L + .05)) >= ((L + .05) / .05) ? '#fff' : '#0B0820'; }
  function applyLook() {
    const r = document.documentElement;
    r.dataset.theme = S.theme; r.dataset.motion = S.motion;
    r.style.setProperty('--accent', S.accent); r.style.setProperty('--accent-fg', readableOn(S.accent));
    $('#app').classList.toggle('collapsed', !!S.sidebarCollapsed);
    $('#btnCollapse').setAttribute('aria-expanded', String(!S.sidebarCollapsed));
  }
  function tint(p) {
    const r = document.documentElement.style;
    if (p) { r.setProperty('--a1', p.c1); r.setProperty('--a2', p.c2); r.setProperty('--a3', S.accent); }
    else { r.removeProperty('--a1'); r.removeProperty('--a2'); r.removeProperty('--a3'); }
  }

  /* ---------- Layout adaptation ---------- */
  function effectiveLayout(p) {
    const ov = S.layouts[p.id] || 'auto', w = $('#stage').clientWidth;
    if (ov === 'phone') return 'phone';
    if (ov === 'wide') return 'wide';
    return p.layout === 'vertical' && w > 720 ? 'phone' : 'wide';       // short-form feeds get a phone column when there is room
  }
  function syncBounds() {
    if (!current) return;
    const p = byId[current], r = $('#slot').getBoundingClientRect(), phone = effectiveLayout(p) === 'phone';
    const w = phone ? Math.min(PHONE_W, r.width) : r.width, x = r.x + (r.width - w) / 2;
    api.setBounds({ x, y: r.y, width: w, height: r.height });
  }

  /* ---------- Sidebar ---------- */
  function buildNav() {
    const list = $('#navList'); list.textContent = '';
    const item = (id, name, glyphId, key, p) => {
      const b = el('button', { class: 'nav-item', 'data-id': id, 'data-name': name, 'aria-label': name, onclick: () => (id === 'home' ? goHome() : open(id)) });
      const tile = el('span', { class: 'tile' + (p ? '' : ' plain') }, svg(glyphId)); if (p) { tile.style.setProperty('--c1', p.c1); tile.style.setProperty('--c2', p.c2); }
      b.append(tile, el('span', { class: 'lbl', text: name }), el('span', { class: 'key', text: key }));
      return b;
    };
    list.append(item('home', 'Home', 'home', '⌘0'));
    [['social', 'Social'], ['stream', 'Stream']].forEach(([kind, label]) => {
      const group = P.filter(p => p.kind === kind && !S.hidden.includes(p.id)); if (!group.length) return;
      list.append(el('div', { class: 'nav-label', text: label }));
      group.forEach(p => list.append(item(p.id, p.name, p.glyph, '⌘' + (P.indexOf(p) + 1), p)));
    });
    markActive();
  }
  function markActive() {
    document.querySelectorAll('.nav-item[data-id]').forEach(b => { const on = b.dataset.id === (current || 'home'); if (on) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
  }

  /* ---------- Navigation ---------- */
  async function open(id) {
    const p = byId[id]; if (!p) return;
    closeOverlays(true);
    const first = current === null;
    current = id; tint(p); markActive();
    $('#tbTitle').textContent = p.name;
    $('#stage').classList.add('has-view');
    if (first) { const h = $('#home'); h.classList.add('leaving'); setTimeout(() => { h.hidden = true; h.classList.remove('leaving'); }, 260 * motionScale()); }
    updateToolbar();
    await api.open(id); syncBounds();
    save({ lastPlatform: id, recents: { ...S.recents, [id]: Date.now() } });
  }
  async function goHome() {
    closeOverlays(true);
    current = null; tint(null); markActive();
    $('#tbTitle').textContent = 'Home'; $('#stage').classList.remove('has-view');
    await api.open(null); renderHome(); const h = $('#home'); h.hidden = false; h.focus({ preventScroll: true });
    updateToolbar();
  }
  const motionScale = () => (document.documentElement.dataset.motion === 'reduce' || (document.documentElement.dataset.motion === 'system' && matchMedia('(prefers-reduced-motion: reduce)').matches)) ? 0 : 1;
  function cycle(dir) {
    const list = P.filter(p => !S.hidden.includes(p.id)); if (!list.length) return;
    const i = list.findIndex(p => p.id === current); open(list[(i + dir + list.length) % list.length].id);
  }
  function updateToolbar() {
    const p = current && byId[current];
    $('#tbBack').disabled = !p || !viewState.canGoBack; $('#tbFwd').disabled = !p || !viewState.canGoForward; $('#tbReload').disabled = !p;
    $('#layoutSeg').hidden = !p;
    const ov = p ? (S.layouts[p.id] || 'auto') : 'auto';
    document.querySelectorAll('#layoutSeg button').forEach(b => b.setAttribute('aria-checked', String(b.dataset.layout === ov)));
    $('#progress').classList.toggle('on', !!(p && viewState.loading));
  }
  function setLayout(v) { if (!current) return; save({ layouts: { ...S.layouts, [current]: v } }); updateToolbar(); syncBounds(); }
  function toggleFocus(v) {
    focus = v ?? !focus; document.body.classList.toggle('focus', focus);
    api.setImmersive(focus); $('#tbFocus').setAttribute('aria-pressed', String(focus));
    requestAnimationFrame(() => requestAnimationFrame(syncBounds));
    if (focus) toast('Focus mode — press ⇧⌘F to exit');
  }
  function toggleSidebar() { save({ sidebarCollapsed: !S.sidebarCollapsed }); applyLook(); const t = $('.sidebar'); const done = () => syncBounds(); t.addEventListener('transitionend', done, { once: true }); setTimeout(done, 400); }

  /* ---------- Home dashboard ---------- */
  function greeting() { const h = new Date().getHours(); return h < 5 ? 'Still up' : h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'; }
  function renderHome() {
    const h = $('#home'); h.textContent = '';
    const last = byId[S.lastPlatform] || P[0];
    const dateStr = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
    const head = el('div', { class: 'home-head' },
      el('div', {}, el('h1', {}, document.createTextNode(greeting() + ', '), el('em', { text: 'explorer' })), el('div', { class: 'sub', text: dateStr + ' — what are we exploring?' })));
    const resume = el('button', { class: 'panel resume', onclick: () => open(last.id), 'aria-label': 'Continue with ' + last.name });
    resume.style.setProperty('--c1', last.c1); resume.style.setProperty('--c2', last.c2);
    const glyph = svg(last.glyph, 'g big-glyph');
    resume.append(el('i', { class: 'blob' }), glyph, el('small', { text: S.recents[last.id] ? 'Continue' : 'Start here' }), el('strong', { text: last.name }), el('span', { class: 'd', text: last.blurb }));
    const usage = el('div', { class: 'panel usage' }, el('h3', { text: 'Today, on this Mac' }));
    const u = S.usage[today()] || {}, entries = P.filter(p => u[p.id]).sort((a, b) => u[b.id] - u[a.id]), max = Math.max(60, ...entries.map(p => u[p.id]));
    if (!entries.length) usage.append(el('div', { class: 'none', text: 'Nothing yet. Time is tracked locally and never leaves your Mac.' }));
    entries.forEach(p => { const bar = el('div', { class: 'bar' }, el('i')); bar.firstChild.style.cssText = `width:${Math.max(4, u[p.id] / max * 100)}%;--c1:${p.c1};--c2:${p.c2}`; usage.append(el('div', { class: 'row' }, el('span', { text: p.name }), bar, el('span', { text: mins(u[p.id]) + 'm' }))); });
    h.append(head, el('div', { class: 'hero' }, resume, usage));
    const section = (kind, title, desc, cls) => {
      const list = P.filter(p => p.kind === kind && !S.hidden.includes(p.id)); if (!list.length) return;
      const g = el('div', { class: 'grid ' + cls });
      list.forEach(p => { const c = el('button', { class: 'card', onclick: () => open(p.id), 'aria-label': `Open ${p.name}` }, el('i', { class: 'blob' }), svg(p.glyph, 'g glyph'), el('span', { class: 'k', text: '⌘' + (P.indexOf(p) + 1) }), el('b', { text: p.name }), el('span', { text: p.blurb })); c.style.setProperty('--c1', p.c1); c.style.setProperty('--c2', p.c2); g.append(c); });
      h.append(el('section', { class: 'sec' }, el('h2', { text: title }), el('p', { text: desc }), g));
    };
    section('social', 'Social', 'Vertical, feed-first — shown in a phone-width column.', 'vertical');
    section('stream', 'Stream', 'Widescreen, full-bleed — made for the big picture.', 'wide');
    h.append(el('div', { class: 'tips' }, ...[['⌘K', 'jump anywhere'], ['⌘1–7', 'switch platform'], ['⌘L', 'cycle layout'], ['⇧⌘F', 'focus mode'], ['⌥⌘S', 'sidebar']].map(([k, t]) => el('span', {}, el('kbd', { text: k }), document.createTextNode(t)))));
  }

  /* ---------- Overlays: native views are hidden & replaced by a blurred snapshot ---------- */
  async function lift() { if (!current) return; const img = await api.hideViews(); const b = $('#backdrop'); if (img) b.style.backgroundImage = `url(${img})`; b.classList.add('on'); snapshotOn = true; }
  async function drop() { if (!snapshotOn) return; snapshotOn = false; $('#backdrop').classList.remove('on'); await api.showViews(); syncBounds(); }
  const overlayOpen = () => !$('#paletteWrap').hidden || !$('#settingsWrap').hidden;
  function closeOverlays(skipRestore) { ['#paletteWrap', '#settingsWrap'].forEach(s => $(s).hidden = true); if (!skipRestore) drop(); else { snapshotOn = false; $('#backdrop').classList.remove('on'); } }

  /* Palette */
  let palItems = [], palSel = 0;
  function commands() {
    const c = [{ id: 'home', name: 'Home', hint: '⌘0', glyph: 'home', run: goHome }];
    P.forEach((p, i) => c.push({ id: p.id, name: p.name, hint: '⌘' + (i + 1), glyph: p.glyph, p, run: () => open(p.id) }));
    c.push({ id: 'focus', name: 'Toggle Focus Mode', hint: '⇧⌘F', glyph: 'focus', run: () => toggleFocus() }, { id: 'sidebar', name: 'Toggle Sidebar', hint: '⌥⌘S', glyph: 'sidebar', run: toggleSidebar }, { id: 'settings', name: 'Settings', hint: '⌘,', glyph: 'sliders', run: openSettings });
    if (current) LAYOUT_ORDER.forEach(l => c.push({ id: 'l-' + l, name: 'Layout: ' + l[0].toUpperCase() + l.slice(1), glyph: 'frame', run: () => setLayout(l) }));
    THEMES.forEach(([k, n]) => c.push({ id: 't-' + k, name: 'Theme: ' + n, glyph: 'sliders', run: () => { save({ theme: k }); applyLook(); } }));
    return c;
  }
  const fuzzy = (q, s) => { q = q.toLowerCase(); s = s.toLowerCase(); let i = 0; for (const ch of s) if (ch === q[i]) i++; return i === q.length; };
  function renderPalette() {
    const q = $('#paletteInput').value.trim(), ul = $('#paletteList'); ul.textContent = '';
    palItems = commands().filter(c => !q || fuzzy(q, c.name)); palSel = Math.min(palSel, Math.max(0, palItems.length - 1));
    if (!palItems.length) ul.append(el('li', { class: 'empty', text: 'No matches' }));
    palItems.forEach((c, i) => {
      const t = el('span', { class: 'tile' + (c.p ? '' : ' plain') }, svg(c.glyph)); if (c.p) { t.style.setProperty('--c1', c.p.c1); t.style.setProperty('--c2', c.p.c2); }
      ul.append(el('li', { role: 'option', id: 'pal-' + i, 'aria-selected': String(i === palSel), onclick: () => runPal(i), onmousemove: () => { if (palSel !== i) { palSel = i; markPal(); } } }, t, el('span', { text: c.name }), el('span', { class: 'hint', text: c.hint || '' })));
    });
    $('#paletteInput').setAttribute('aria-activedescendant', 'pal-' + palSel);
  }
  function markPal() { document.querySelectorAll('#paletteList li[role=option]').forEach((li, i) => li.setAttribute('aria-selected', String(i === palSel))); $('#paletteInput').setAttribute('aria-activedescendant', 'pal-' + palSel); document.getElementById('pal-' + palSel)?.scrollIntoView({ block: 'nearest' }); }
  function runPal(i) { const c = palItems[i]; if (!c) return; closeOverlays(true); c.run(); }
  async function openPalette() { if (!$('#settingsWrap').hidden) $('#settingsWrap').hidden = true; await lift(); $('#paletteWrap').hidden = false; $('#paletteInput').value = ''; palSel = 0; renderPalette(); $('#paletteInput').focus(); }

  /* Settings */
  function openSettings() { $('#paletteWrap').hidden = true; lift().then(() => { renderSettings(); $('#settingsWrap').hidden = false; $('#setClose').focus(); }); }
  function row(title, sub, ctl) { return el('div', { class: 'row2' }, el('div', {}, el('b', { text: title }), sub ? el('small', { text: sub }) : false), ctl); }
  function renderSettings() {
    const b = $('#setBody'); b.textContent = '';
    const themes = el('div', { class: 'themes', role: 'radiogroup', 'aria-label': 'Theme' });
    THEMES.forEach(([k, n, g]) => { const t = el('button', { class: 'theme', role: 'radio', 'aria-checked': String(S.theme === k), onclick: () => { save({ theme: k }); applyLook(); renderSettings(); } }, el('i'), document.createTextNode(n)); t.firstChild.style.background = g; themes.append(t); });
    const sw = el('div', { class: 'swatches', role: 'radiogroup', 'aria-label': 'Accent colour' });
    ACCENTS.forEach(a => { const s = el('button', { class: 'sw', role: 'radio', 'aria-label': a, 'aria-checked': String(S.accent.toLowerCase() === a.toLowerCase()), onclick: () => { save({ accent: a }); applyLook(); renderSettings(); } }); s.style.background = a; sw.append(s); });
    const motion = el('select', { 'aria-label': 'Motion', onchange: e => { save({ motion: e.target.value }); applyLook(); } }, ...[['system', 'Follow macOS'], ['reduce', 'Reduce motion'], ['full', 'Full motion']].map(([v, n]) => el('option', { value: v, text: n, selected: S.motion === v })));
    const nudge = el('select', { 'aria-label': 'Break reminder', onchange: e => save({ breakNudgeMinutes: +e.target.value }) }, ...[[0, 'Off'], [20, 'Every 20 min'], [45, 'Every 45 min'], [60, 'Every hour']].map(([v, n]) => el('option', { value: v, text: n, selected: S.breakNudgeMinutes === v })));
    b.append(el('h4', { text: 'Appearance' }), themes, el('div', { style: 'height:14px' }), row('Accent colour', 'Used for highlights and controls', sw), row('Motion', 'Animations are GPU-light and respect macOS Reduce Motion', motion));
    b.append(el('h4', { text: 'Platforms' }));
    P.forEach(p => { const sw2 = el('button', { class: 'switch', role: 'switch', 'aria-label': 'Show ' + p.name, 'aria-checked': String(!S.hidden.includes(p.id)), onclick: e => { const on = e.currentTarget.getAttribute('aria-checked') !== 'true'; save({ hidden: on ? S.hidden.filter(x => x !== p.id) : [...S.hidden, p.id] }); buildNav(); renderSettings(); } }); b.append(row(p.name, p.blurb, sw2)); });
    b.append(el('h4', { text: 'Wellbeing' }), row('Break reminder', 'A gentle nudge — computed locally, never uploaded', nudge));
    b.append(el('h4', { text: 'Privacy' }), row('Isolated sessions', 'Every platform has its own sandboxed storage. No analytics, no telemetry, camera & mic blocked.', el('span')),
      row('Clear all site data', 'Signs you out of every platform', el('button', { class: 'btn danger', onclick: async e => { await api.clearData('all'); e.currentTarget.textContent = 'Cleared ✓'; } }, document.createTextNode('Clear…'))));
    P.forEach(p => b.append(row('Clear ' + p.name, null, el('button', { class: 'btn', 'aria-label': 'Clear data for ' + p.name, onclick: async e => { await api.clearData(p.id); e.currentTarget.textContent = 'Cleared ✓'; } }, document.createTextNode('Clear')))));
    b.append(el('h4', { text: 'About' }), el('div', { class: 'about' }, el('img', { src: 'assets/reloventa-icon.svg', width: 64, height: 64, alt: '' }), el('div', {}, el('b', { text: 'Reloventa' }), el('div', { class: 'sub', text: 'Social. Stream. Explore.' }), el('small', { text: 'Version ' + (window.__version || '1.0.0') }))));
  }

  /* ---------- Toasts, usage, nudges ---------- */
  function toast(msg) { const t = el('div', { class: 'toast', text: msg }); $('#toasts').append(t); setTimeout(() => t.remove(), 3600); }
  function tickUsage() {
    if (!current || document.hidden) { nudgeAcc = 0; return; }
    const d = today(), u = { ...(S.usage[d] || {}) }; u[current] = (u[current] || 0) + 5;
    const usage = { ...S.usage, [d]: u }; // keep 14 days only
    Object.keys(usage).sort().slice(0, -14).forEach(k => delete usage[k]);
    save({ usage }); nudgeAcc += 5;
    if (S.breakNudgeMinutes && nudgeAcc >= S.breakNudgeMinutes * 60) { nudgeAcc = 0; toast(`You've been on ${byId[current].name} a while — time to stretch?`); }
  }

  /* ---------- Wiring ---------- */
  function wire() {
    $('#btnSettings').onclick = openSettings; $('#btnCollapse').onclick = toggleSidebar;
    $('#tbBack').onclick = () => api.nav('back'); $('#tbFwd').onclick = () => api.nav('forward'); $('#tbReload').onclick = () => api.nav('reload');
    $('#tbFocus').onclick = () => toggleFocus(); $('#tbPalette').onclick = openPalette; $('#setClose').onclick = () => closeOverlays();
    document.querySelectorAll('#layoutSeg button').forEach(b => b.onclick = () => setLayout(b.dataset.layout));
    document.querySelectorAll('.overlay').forEach(o => o.addEventListener('mousedown', e => { if (e.target === o) closeOverlays(); }));
    $('#paletteInput').addEventListener('input', () => { palSel = 0; renderPalette(); });
    $('#paletteInput').addEventListener('keydown', e => {
      if (e.key === 'ArrowDown') { e.preventDefault(); palSel = (palSel + 1) % Math.max(1, palItems.length); markPal(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); palSel = (palSel - 1 + palItems.length) % Math.max(1, palItems.length); markPal(); }
      else if (e.key === 'Enter') { e.preventDefault(); runPal(palSel); }
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && overlayOpen()) { e.preventDefault(); closeOverlays(); }
      if (e.key === 'Tab' && !$('#settingsWrap').hidden) { const f = [...$('#settingsWrap').querySelectorAll('button,select')].filter(n => n.offsetParent); if (!f.length) return; const i = f.indexOf(document.activeElement); if (e.shiftKey && i <= 0) { e.preventDefault(); f.at(-1).focus(); } else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); } }
      if (e.key === 'Tab' && !$('#paletteWrap').hidden) e.preventDefault();
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openPalette(); }
    });
    new ResizeObserver(() => { syncBounds(); }).observe($('#slot'));
    addEventListener('resize', () => requestAnimationFrame(syncBounds));
    document.addEventListener('visibilitychange', () => document.body.classList.toggle('paused', document.hidden));
    api.onCommand(c => ({ open: () => open(c.id), home: goHome, cycle: () => cycle(c.dir), palette: openPalette, settings: openSettings, sidebar: toggleSidebar, focus: () => toggleFocus(), sync: () => requestAnimationFrame(syncBounds), layout: () => current && setLayout(LAYOUT_ORDER[(LAYOUT_ORDER.indexOf(S.layouts[current] || 'auto') + 1) % 3]) })[c.type]?.());
    api.onNotice(m => toast(m));
    api.onViewState(s => { if (s.id !== current) return; viewState = s; updateToolbar(); });
    api.onFullscreen(on => { document.body.classList.toggle('focus', on || focus); });
    setInterval(tickUsage, 5000);
  }

  async function init() {
    const boot = await api.boot(); S = boot.settings; P = boot.platforms; byId = Object.fromEntries(P.map(p => [p.id, p])); window.__version = boot.version;
    if (api.platform === 'darwin') document.documentElement.classList.add('vibrant');
    applyLook(); buildNav(); wire(); renderHome(); updateToolbar();
  }
  init();
  window.__reloventa = { open, goHome, openPalette, openSettings, toggleFocus, toggleSidebar };   // for tests only
})();
