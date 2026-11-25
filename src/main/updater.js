'use strict';
// Over-the-air updates via GitHub Releases (electron-updater). Privacy: the only request is to github.com for latest-mac.yml; nothing about the user is sent.
const { app, dialog } = require('electron');
function setupUpdates(getWin) {
  if (!app.isPackaged || process.env.RELOVENTA_TEST) return;           // dev builds never self-update
  let autoUpdater;
  try { ({ autoUpdater } = require('electron-updater')); } catch { return; }
  autoUpdater.autoDownload = true; autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.on('error', e => console.error('update check failed:', e && e.message));
  autoUpdater.on('update-downloaded', info => {
    const w = getWin();
    dialog.showMessageBox(w || undefined, { type: 'info', buttons: ['Restart now', 'Later'], defaultId: 0, cancelId: 1, message: `Reloventa ${info.version} is ready`, detail: 'Restart to finish updating. It will also install automatically when you quit.' })
      .then(r => { if (r.response === 0) autoUpdater.quitAndInstall(); });
  });
  const check = () => autoUpdater.checkForUpdates().catch(() => {});
  setTimeout(check, 8000); setInterval(check, 6 * 60 * 60 * 1000);       // at launch, then every 6 h
  return check;
}
module.exports = { setupUpdates };
