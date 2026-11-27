'use strict';
// Over-the-air updates via GitHub Releases (electron-updater). Privacy: the only request is to github.com for latest-mac.yml; nothing about the user is sent.
const { app, dialog } = require('electron');
let check = null, manual = false;
function setupUpdates(getWin) {
  if (!app.isPackaged || process.env.RELOVENTA_TEST) return;           // dev builds never self-update
  let autoUpdater;
  try { ({ autoUpdater } = require('electron-updater')); } catch { return; }
  autoUpdater.autoDownload = true; autoUpdater.autoInstallOnAppQuit = true;
  const notify = m => { const w = getWin(); if (w && !w.isDestroyed()) w.webContents.send('notice', m); };
  autoUpdater.on('error', e => { console.error('update check failed:', e && e.message); if (manual) { manual = false; dialog.showMessageBox({ type: 'warning', message: 'Could not check for updates', detail: String(e && e.message || e).slice(0, 300) }); } });
  autoUpdater.on('update-available', i => notify(`Downloading Reloventa ${i.version}…`));
  autoUpdater.on('update-not-available', () => { if (manual) { manual = false; dialog.showMessageBox({ type: 'info', message: "You're up to date", detail: `Reloventa ${app.getVersion()} is the latest version.` }); } });
  autoUpdater.on('update-downloaded', info => {
    manual = false;
    dialog.showMessageBox(getWin() || undefined, { type: 'info', buttons: ['Restart now', 'Later'], defaultId: 0, cancelId: 1, message: `Reloventa ${info.version} is ready`, detail: 'Restart to finish updating. It will also install automatically when you quit.' })
      .then(r => { if (r.response === 0) autoUpdater.quitAndInstall(); });
  });
  check = () => autoUpdater.checkForUpdates().catch(() => {});
  setTimeout(check, 8000); setInterval(check, 6 * 60 * 60 * 1000);       // at launch, then every 6 h
}
function checkNow() { if (!check) { dialog.showMessageBox({ type: 'info', message: 'Updates are only available in the installed app' }); return; } manual = true; check(); }
module.exports = { setupUpdates, checkNow };
