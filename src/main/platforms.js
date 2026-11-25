'use strict';
// Platform registry. Layout: 'vertical' = phone-width column (short-form feeds),
// 'wide' = full-bleed cinema, 'flex' = fluid. Glyphs are original abstract marks, not third-party logos.
const PLATFORMS = [
  { id: 'facebook',  name: 'Facebook',    kind: 'social', blurb: 'Friends, groups & Marketplace', url: 'https://www.facebook.com/',     hosts: ['facebook.com', 'fbcdn.net', 'fb.com', 'messenger.com', 'fbsbx.com'], layout: 'flex',     c1: '#4D7CFF', c2: '#1B3FCB', glyph: 'feed' },
  { id: 'instagram', name: 'Instagram',   kind: 'social', blurb: 'Photos, stories & reels',       url: 'https://www.instagram.com/',    hosts: ['instagram.com', 'cdninstagram.com', 'fbcdn.net', 'facebook.com'],     layout: 'vertical', c1: '#FF5FA2', c2: '#FF9A4D', glyph: 'frame' },
  { id: 'tiktok',    name: 'TikTok',      kind: 'social', blurb: 'Short videos, endless discovery', url: 'https://www.tiktok.com/',     hosts: ['tiktok.com', 'tiktokcdn.com', 'tiktokv.com', 'byteoversea.com', 'ibytedtos.com'], layout: 'vertical', c1: '#2EE6FF', c2: '#FF3D77', glyph: 'reel' },
  { id: 'youtube',   name: 'YouTube',     kind: 'stream', blurb: 'Videos, music & live',          url: 'https://www.youtube.com/',      hosts: ['youtube.com', 'youtu.be', 'ytimg.com', 'googlevideo.com', 'google.com', 'gstatic.com', 'googleusercontent.com', 'accounts.google.com'], layout: 'wide', c1: '#FF5A4D', c2: '#C21B3C', glyph: 'wave' },
  { id: 'netflix',   name: 'Netflix',     kind: 'stream', blurb: 'Series & films',                url: 'https://www.netflix.com/',      hosts: ['netflix.com', 'nflxvideo.net', 'nflximg.net', 'nflxext.com', 'nflxso.net'], layout: 'wide', c1: '#E50914', c2: '#7A0610', glyph: 'spot' },
  { id: 'prime',     name: 'Prime Video', kind: 'stream', blurb: 'Originals, movies & more',      url: 'https://www.primevideo.com/',   hosts: ['primevideo.com', 'amazon.com', 'media-amazon.com', 'amazonvideo.com', 'aiv-cdn.net', 'pv-cdn.net', 'ssl-images-amazon.com'], layout: 'wide', c1: '#35B6FF', c2: '#1255D6', glyph: 'crate' },
];
const byId = Object.fromEntries(PLATFORMS.map(p => [p.id, p]));

function hostAllowed(platform, urlStr) {
  try {
    const u = new URL(urlStr);
    if (u.protocol !== 'https:' && u.protocol !== 'about:' ) return false;
    return platform.hosts.some(h => u.hostname === h || u.hostname.endsWith('.' + h));
  } catch { return false; }
}
module.exports = { PLATFORMS, byId, hostAllowed };
