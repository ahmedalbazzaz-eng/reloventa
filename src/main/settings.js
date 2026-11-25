'use strict';
// Tiny local JSON store. Nothing leaves the device; no analytics, no telemetry.
const { app } = require('electron'); const fs = require('fs'); const path = require('path');
const DEFAULTS = {
  theme: 'system',            // system | midnight | daylight | aurora
  accent: '#7B61FF',
  motion: 'system',           // system | reduce | full
  sidebarCollapsed: false,
  layouts: {},                // per-platform override: auto | phone | wide
  lastPlatform: null,
  hidden: [],                 // platforms hidden from the sidebar
  recents: {},                // id -> last visited ts
  usage: {},                  // 'YYYY-MM-DD' -> { id: seconds }  (local only)
  breakNudgeMinutes: 0,       // 0 = off
  homeSection: 'for-you',
};
let file, data = null, timer = null;
function load() {
  file = path.join(app.getPath('userData'), 'settings.json');
  try { data = { ...DEFAULTS, ...JSON.parse(fs.readFileSync(file, 'utf8')) }; } catch { data = { ...DEFAULTS }; }
  return data;
}
function get() { return data || load(); }
function patch(p) {
  data = { ...get(), ...p };
  clearTimeout(timer); timer = setTimeout(flush, 300);
  return data;
}
function flush() { try { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, JSON.stringify(data, null, 2)); } catch (e) { console.error('settings save failed', e.message); } }
module.exports = { get, patch, flush, DEFAULTS };
