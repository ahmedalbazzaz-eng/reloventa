'use strict';
const { contextBridge, ipcRenderer } = require('electron');
const on = (ch, cb) => { const h = (_e, ...a) => cb(...a); ipcRenderer.on(ch, h); return () => ipcRenderer.removeListener(ch, h); };
contextBridge.exposeInMainWorld('reloventa', {
  boot: () => ipcRenderer.invoke('boot'),
  setSettings: p => ipcRenderer.invoke('settings:set', p),
  open: id => ipcRenderer.invoke('view:open', id),
  setBounds: b => ipcRenderer.send('view:bounds', b),
  hideViews: () => ipcRenderer.invoke('view:hide'),         // returns a snapshot data-URL for glass backdrops
  showViews: () => ipcRenderer.invoke('view:show'),
  nav: a => ipcRenderer.send('view:nav', a),                // back | forward | reload | stop
  setImmersive: v => ipcRenderer.send('window:immersive', !!v),
  clearData: id => ipcRenderer.invoke('privacy:clear', id), // id or 'all'
  openExternal: u => ipcRenderer.send('external:open', u),
  onCommand: cb => on('command', cb),
  onNotice: cb => on('notice', cb),
  onViewState: cb => on('view:state', cb),
  onFullscreen: cb => on('fullscreen', cb),
  platform: process.platform,
});
