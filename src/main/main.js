'use strict';
const { app, BrowserWindow, WebContentsView, ipcMain, shell, session, Menu, nativeTheme } = require('electron');
const path = require('path');
const { PLATFORMS, byId, hostAllowed } = require('./platforms');
const settings = require('./settings');
const { setupUpdates, checkNow } = require('./updater');

app.setName('Reloventa');
if (!process.env.RELOVENTA_TEST) app.enableSandbox();   // every renderer sandboxed (test harness runs as root in CI)
let win = null;
const views = new Map();                   // id -> WebContentsView
let activeId = null, lastBounds = { x: 0, y: 0, width: 0, height: 0 }, htmlFullscreen = false, hiddenByOverlay = false;

const SAFE_PERMS = new Set(['fullscreen', 'pointerLock', 'clipboard-sanitized-write']);

function cleanUA(wc) { return wc.getUserAgent().replace(/\sElectron\/[\d.]+/, '').replace(/\sreloventa\/[\d.]+/i, '').replace(/\sReloventa\/[\d.]+/, ''); }

function safeExternal(u) { try { const p = new URL(u); if (['https:', 'http:', 'mailto:'].includes(p.protocol)) shell.openExternal(u); } catch {} }

function makeView(id) {
  const p = byId[id];
  const ses = session.fromPartition(`persist:${id}`);      // isolated cookies/storage per platform = privacy
  ses.setPermissionRequestHandler((_wc, perm, cb) => cb(SAFE_PERMS.has(perm)));
  ses.setPermissionCheckHandler((_wc, perm) => SAFE_PERMS.has(perm));
  const v = new WebContentsView({ webPreferences: { session: ses, sandbox: true, contextIsolation: true, nodeIntegration: false, webSecurity: true, spellcheck: false, backgroundThrottling: true } });
  try { v.setBorderRadius(18); } catch {}
  try { v.setBackgroundColor('#0B0820'); } catch {}
  const wc = v.webContents;
  wc.setUserAgent(cleanUA(wc));
  wc.setWindowOpenHandler(({ url }) => {
    if (hostAllowed(p, url)) { wc.loadURL(url); return { action: 'deny' }; }   // same-platform popups load in place
    safeExternal(url); return { action: 'deny' };                              // everything else -> default browser
  });
  wc.on('will-navigate', (e, url) => { if (!hostAllowed(p, url)) { e.preventDefault(); safeExternal(url); } });
  const push = () => { if (activeId === id && win && !win.isDestroyed()) win.webContents.send('view:state', { id, canGoBack: wc.navigationHistory.canGoBack(), canGoForward: wc.navigationHistory.canGoForward(), loading: wc.isLoading(), url: wc.getURL() }); };
  wc.on('did-navigate', (_e, url) => {   // Google deliberately blocks sign-in inside embedded apps; tell the user instead of leaving them guessing
    try { if (new URL(url).hostname === 'accounts.google.com' && win) win.webContents.send('notice', 'Google may refuse sign-in inside apps. YouTube still works signed out.'); } catch {}
  });
  ['did-start-loading', 'did-stop-loading', 'did-navigate', 'did-navigate-in-page'].forEach(e => wc.on(e, push));
  // HTML5 video fullscreen: the page covers the whole window; restore the layout rectangle afterwards.
  wc.on('enter-html-full-screen', () => { htmlFullscreen = true; win.setFullScreen(true); const [w, h] = win.getContentSize(); v.setBounds({ x: 0, y: 0, width: w, height: h }); win.webContents.send('fullscreen', true); });
  wc.on('leave-html-full-screen', () => { htmlFullscreen = false; win.setFullScreen(false); v.setBounds(lastBounds); win.webContents.send('fullscreen', false); });
  wc.loadURL(p.url);
  views.set(id, v);
  return v;
}

function showView(id) {
  if (!byId[id]) return;
  if (activeId && views.has(activeId)) views.get(activeId).setVisible(false);
  const v = views.get(id) || makeView(id);
  if (!win.contentView.children.includes(v)) win.contentView.addChildView(v);
  v.setBounds(lastBounds); v.setVisible(!hiddenByOverlay);
  activeId = id;
  settings.patch({ lastPlatform: id, recents: { ...settings.get().recents, [id]: Date.now() } });
  win.webContents.send('view:state', { id, canGoBack: v.webContents.navigationHistory.canGoBack(), canGoForward: v.webContents.navigationHistory.canGoForward(), loading: v.webContents.isLoading(), url: v.webContents.getURL() });
}
function hideAll() { if (activeId && views.has(activeId)) views.get(activeId).setVisible(false); activeId = null; }

function createWindow() {
  win = new BrowserWindow({
    width: 1320, height: 840, minWidth: 880, minHeight: 600, show: false,
    title: 'Reloventa', backgroundColor: '#00000000', transparent: false,
    titleBarStyle: 'hiddenInset', trafficLightPosition: { x: 20, y: 22 },
    vibrancy: 'under-window', visualEffectState: 'active',
    webPreferences: { preload: path.join(__dirname, '../preload/preload.js'), sandbox: true, contextIsolation: true, nodeIntegration: false },
  });
  win.loadFile(path.join(__dirname, '../renderer/index.html'));
  win.once('ready-to-show', () => win.show());
  win.webContents.setWindowOpenHandler(({ url }) => { safeExternal(url); return { action: 'deny' }; });
  win.webContents.on('will-navigate', e => e.preventDefault());
  win.on('swipe', (_e, dir) => win.webContents.send('command', { type: 'cycle', dir: dir === 'left' ? 1 : -1 }));   // 3-finger swipe
  const resync = () => { if (win && !win.isDestroyed()) win.webContents.send('command', { type: 'sync' }); };
  ['resize', 'maximize', 'unmaximize', 'enter-full-screen', 'leave-full-screen', 'restore'].forEach(e => win.on(e, resync));
  win.on('closed', () => { win = null; views.clear(); });
}

function buildMenu() {
  const send = c => () => win && win.webContents.send('command', c);
  const nav = a => () => { const v = views.get(activeId); if (!v) return; const wc = v.webContents; ({ back: () => wc.navigationHistory.goBack(), forward: () => wc.navigationHistory.goForward(), reload: () => wc.reload() })[a](); };
  const tpl = [
    { label: 'Reloventa', submenu: [{ role: 'about' }, { label: 'Check for Updates…', click: () => checkNow() }, { type: 'separator' }, { label: 'Settings…', accelerator: 'Cmd+,', click: send({ type: 'settings' }) }, { type: 'separator' }, { role: 'hide' }, { role: 'hideOthers' }, { role: 'unhide' }, { type: 'separator' }, { role: 'quit' }] },
    { label: 'Edit', submenu: [{ role: 'undo' }, { role: 'redo' }, { type: 'separator' }, { role: 'cut' }, { role: 'copy' }, { role: 'paste' }, { role: 'selectAll' }] },
    { label: 'Navigate', submenu: [
      { label: 'Home', accelerator: 'Cmd+0', click: send({ type: 'home' }) },
      ...PLATFORMS.map((p, i) => ({ label: p.name, accelerator: `Cmd+${i + 1}`, click: send({ type: 'open', id: p.id }) })),
      { type: 'separator' },
      { label: 'Next Platform', accelerator: 'Ctrl+Tab', click: send({ type: 'cycle', dir: 1 }) },
      { label: 'Previous Platform', accelerator: 'Ctrl+Shift+Tab', click: send({ type: 'cycle', dir: -1 }) },
      { type: 'separator' },
      { label: 'Back', accelerator: 'Cmd+[', click: nav('back') }, { label: 'Forward', accelerator: 'Cmd+]', click: nav('forward') }, { label: 'Reload', accelerator: 'Cmd+R', click: nav('reload') },
      { type: 'separator' },
      { label: 'Command Palette…', accelerator: 'Cmd+K', click: send({ type: 'palette' }) },
    ] },
    { label: 'View', submenu: [
      { label: 'Toggle Sidebar', accelerator: 'Cmd+Alt+S', click: send({ type: 'sidebar' }) },
      { label: 'Focus Mode', accelerator: 'Cmd+Shift+F', click: send({ type: 'focus' }) },
      { label: 'Cycle Layout (Auto / Phone / Wide)', accelerator: 'Cmd+L', click: send({ type: 'layout' }) },
      { type: 'separator' }, { role: 'togglefullscreen' },
    ] },
    { role: 'windowMenu' },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(tpl));
}

ipcMain.handle('boot', () => ({ platforms: PLATFORMS, settings: settings.get(), version: app.getVersion() }));
ipcMain.handle('settings:set', (_e, p) => settings.patch(p && typeof p === 'object' ? p : {}));
ipcMain.handle('view:open', (_e, id) => { if (id === null) { hideAll(); return; } showView(id); });
ipcMain.on('view:bounds', (_e, b) => {
  if (!b || ![b.x, b.y, b.width, b.height].every(Number.isFinite)) return;
  lastBounds = { x: Math.round(b.x), y: Math.round(b.y), width: Math.max(1, Math.round(b.width)), height: Math.max(1, Math.round(b.height)) };
  const v = views.get(activeId); if (v && !htmlFullscreen) v.setBounds(lastBounds);   // OS fullscreen / zoom must still re-layout
});
ipcMain.handle('view:hide', async () => {
  hiddenByOverlay = true; const v = views.get(activeId); if (!v) return null;
  try { const img = await v.webContents.capturePage(); const s = img.resize({ width: 640 }); v.setVisible(false); return 'data:image/jpeg;base64,' + s.toJPEG(55).toString('base64'); } catch { v.setVisible(false); return null; }
});
ipcMain.handle('view:show', () => { hiddenByOverlay = false; const v = views.get(activeId); if (v) v.setVisible(true); });
ipcMain.on('view:nav', (_e, a) => { const v = views.get(activeId); if (!v) return; const wc = v.webContents; if (a === 'back') wc.navigationHistory.goBack(); else if (a === 'forward') wc.navigationHistory.goForward(); else if (a === 'reload') wc.reload(); else if (a === 'stop') wc.stop(); });
ipcMain.on('window:immersive', (_e, on) => { try { win.setWindowButtonVisibility(!on); } catch {} });
ipcMain.on('external:open', (_e, u) => safeExternal(u));
ipcMain.handle('privacy:clear', async (_e, id) => {
  const ids = id === 'all' ? PLATFORMS.map(p => p.id) : byId[id] ? [id] : [];
  for (const i of ids) { const s = session.fromPartition(`persist:${i}`); await s.clearStorageData(); await s.clearCache(); const v = views.get(i); if (v) v.webContents.loadURL(byId[i].url); }
  return true;
});

app.whenReady().then(() => {
  nativeTheme.themeSource = 'system';
  buildMenu(); createWindow(); setupUpdates(() => win);
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on('before-quit', settings.flush);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
