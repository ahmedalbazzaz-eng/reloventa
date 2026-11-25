// Boots the real main process (run with: xvfb-run electron --no-sandbox test/electron-smoke.js), drives it through the real preload bridge.
const { app, BrowserWindow } = require('electron');
require('../src/main/main.js');
const wait = ms => new Promise(r => setTimeout(r, ms));
let failed = false; const ok = (c, m) => { console.log(c ? 'pass' : 'FAIL', m); if (!c) failed = true; };
app.whenReady().then(async () => {
  await wait(2500);
  const win = BrowserWindow.getAllWindows()[0], wc = win.webContents; const run = js => wc.executeJavaScript(js);
  ok(await run('typeof window.reloventa === "object" && !!window.reloventa.boot'), 'preload bridge exposed');
  ok(await run('typeof require === "undefined" && typeof process === "undefined"'), 'renderer has no Node access (isolated)');
  ok(await run('document.querySelectorAll(".card").length') === 6, 'dashboard rendered in real window');
  await run('window.__reloventa.open("instagram")'); await wait(1500);
  ok(win.contentView.children.length === 1, 'native view attached for Instagram');
  const v = win.contentView.children[0], b = v.getBounds();
  ok(b.width === 440 && b.height > 300, `phone-column bounds applied (${b.width}x${b.height})`);
  ok(!/Electron\//.test(v.webContents.getUserAgent()), 'UA has no Electron token');
  await run('window.__reloventa.open("youtube")'); await wait(1200);
  ok(win.contentView.children.length === 2 && v !== win.contentView.children[1], 'switching hides previous view, keeps it warm');
  ok(win.contentView.children[1].getBounds().width > 800, 'wide platform is full-bleed');
  const snap = await run('window.reloventa.hideViews().then(s => s === null || s.startsWith("data:image/jpeg"))'); ok(snap, 'overlay snapshot returns JPEG or null');
  await run('window.reloventa.showViews()'); await run('window.__reloventa.goHome()'); await wait(500);
  ok(await run('document.querySelector(".nav-item[aria-current=page]").dataset.id') === 'home', 'returns Home');
  process.exit(failed ? 1 : 0);
});
