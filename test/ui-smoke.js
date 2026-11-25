// Renders the shell in headless Chromium with a stubbed native bridge, takes screenshots and runs assertions.
const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs');
const { PLATFORMS } = require('../src/main/platforms');
const out = path.join(__dirname, 'screens'); fs.mkdirSync(out, { recursive: true });
const stub = `(${function (platforms) {
  window.__calls = []; let settings = { theme: 'system', accent: '#7B61FF', motion: 'system', sidebarCollapsed: false, layouts: {}, lastPlatform: null, hidden: [], recents: {}, usage: {}, breakNudgeMinutes: 0 };
  window.reloventa = { platform: 'linux', boot: async () => ({ platforms, settings, version: '1.0.0' }), setSettings: async p => (settings = { ...settings, ...p }),
    open: async id => window.__calls.push(['open', id]), setBounds: b => (window.__bounds = b), hideViews: async () => null, showViews: async () => {}, nav: a => window.__calls.push(['nav', a]),
    setImmersive: v => window.__calls.push(['immersive', v]), clearData: async id => window.__calls.push(['clear', id]), openExternal() {}, onCommand() {}, onViewState() {}, onFullscreen() {} };
}})(${JSON.stringify(PLATFORMS)})`;
const ok = (c, m) => { if (!c) { console.error('FAIL', m); process.exitCode = 1; } else console.log('pass', m); };
(async () => {
  const b = await chromium.launch(); const errors = [];
  const ctx = await b.newContext({ viewport: { width: 1320, height: 840 }, deviceScaleFactor: 1, colorScheme: 'dark' });
  await ctx.addInitScript(stub); const p = await ctx.newPage(); p.on('pageerror', e => errors.push(e.message)); p.on('console', m => m.type() === 'error' && errors.push(m.text()));
  await p.goto('file://' + path.resolve(__dirname, '../src/renderer/index.html')); await p.waitForSelector('.card');
  await p.waitForTimeout(400); await p.screenshot({ path: `${out}/01-home-dark.png` });
  ok(await p.locator('.card').count() === 6, 'home shows six platform cards');
  await p.click('.nav-item[data-id=tiktok]'); await p.waitForTimeout(500);
  ok(await p.evaluate(() => window.__calls.some(c => c[1] === 'tiktok')), 'opening TikTok calls native open');
  const bd = await p.evaluate(() => window.__bounds); ok(bd.width === 440, `vertical platform gets 440px phone column (got ${bd.width})`);
  await p.screenshot({ path: `${out}/02-phone-layout.png` });
  await p.click('#layoutSeg [data-layout=wide]'); await p.waitForTimeout(100); ok((await p.evaluate(() => window.__bounds)).width > 800, 'Wide override fills the stage');
  await p.click('.nav-item[data-id=youtube]'); await p.waitForTimeout(300); ok((await p.evaluate(() => window.__bounds)).width > 800, 'widescreen platform is full-bleed');
  await p.keyboard.press('Control+k'); await p.waitForSelector('#paletteWrap:not([hidden])'); await p.keyboard.type('net'); await p.waitForTimeout(200);
  ok(await p.locator('#paletteList li[role=option]').count() >= 1, 'palette fuzzy-filters'); await p.screenshot({ path: `${out}/03-palette.png` });
  await p.keyboard.press('Enter'); await p.waitForTimeout(300); ok(await p.evaluate(() => window.__calls.some(c => c[1] === 'netflix')), 'Enter runs selected command');
  await p.click('#btnSettings'); await p.waitForSelector('#settingsWrap:not([hidden])'); await p.screenshot({ path: `${out}/04-settings.png` });
  await p.click('.theme[role=radio]:nth-child(3)'); ok(await p.evaluate(() => document.documentElement.dataset.theme) === 'daylight', 'theme switch applies');
  await p.click('.sw:nth-child(7)'); ok(await p.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()) === '#FF4F9A', 'accent switch applies');
  await p.screenshot({ path: `${out}/05-settings-daylight.png` }); await p.keyboard.press('Escape'); ok(await p.locator('#settingsWrap').isHidden(), 'Escape closes settings');
  await p.click('#btnCollapse'); await p.waitForTimeout(800); const sw = await p.evaluate(() => document.querySelector('.sidebar').offsetWidth); ok(sw === 76, 'sidebar collapses to rail (got ' + sw + ')');
  await p.screenshot({ path: `${out}/06-collapsed-daylight.png` });
  await p.evaluate(() => window.__reloventa.toggleFocus(true)); await p.waitForTimeout(200); ok(await p.locator('.sidebar').isHidden(), 'focus mode hides chrome');
  await p.evaluate(() => window.__reloventa.toggleFocus(false)); await p.click('.nav-item[data-id=home]'); await p.waitForSelector('.card');
  // Reduce motion
  const rm = await b.newContext({ viewport: { width: 900, height: 600 }, reducedMotion: 'reduce', colorScheme: 'light' }); await rm.addInitScript(stub); const q = await rm.newPage(); q.on('pageerror', e => errors.push(e.message));
  await q.goto('file://' + path.resolve(__dirname, '../src/renderer/index.html')); await q.waitForSelector('.card'); await q.waitForTimeout(300);
  ok(await q.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--dur').trim()) === '0', 'prefers-reduced-motion zeroes animation duration');
  ok(await q.evaluate(() => getComputedStyle(document.querySelector('.ambient i')).animationDuration) === '0s', 'ambient drift disabled under Reduce Motion');
  await q.screenshot({ path: `${out}/07-compact-light-reduced-motion.png` });
  // Contrast audit of body text vs surface tokens
  const lum = h => { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255].map(v => (v /= 255) <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4).reduce((a, v, i) => a + v * [.2126, .7152, .0722][i], 0); };
  const cr = (a, c) => { const [x, y] = [lum(a), lum(c)].sort((m, n) => n - m); return (x + .05) / (y + .05); };
  for (const [n, fg, bg] of [['midnight text', '#F5F3FF', '#0B0820'], ['midnight muted', '#B8B2D8', '#0B0820'], ['midnight faint', '#8E88B3', '#0B0820'], ['daylight text', '#1A1440', '#F4F2FF'], ['daylight muted', '#4F4878', '#F4F2FF'], ['daylight faint', '#6E6896', '#F4F2FF'], ['aurora muted', '#A8D6CE', '#04121C']]) { const r = cr(fg, bg); console.log(`${r >= 4.5 ? 'pass' : 'FAIL'} contrast ${n}: ${r.toFixed(2)}:1`); if (r < 4.5) process.exitCode = 1; }
  ok(errors.length === 0, 'no console/page errors ' + errors.join('|')); await b.close();
})();
