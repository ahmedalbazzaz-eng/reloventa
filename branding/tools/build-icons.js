// Renders final SVG -> PNGs, .iconset, .icns, Xcode AppIcon.appiconset, tray/favicon, DMG background.
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
const root = path.resolve(__dirname, '..'); const proj = path.resolve(root, '..');
const gen = `${root}/generated`, set = `${gen}/Reloventa.iconset`, xc = `${gen}/AppIcon.appiconset`, png = `${gen}/png`;
for (const d of [gen, set, xc, png]) fs.mkdirSync(d, { recursive: true });
const svg = f => fs.readFileSync(`${root}/final/${f}`, 'utf8');

async function render(page, svgText, size, out, omitBg = true) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<style>html,body{margin:0;background:transparent}svg{display:block;width:${size}px;height:${size}px}</style>${svgText}`);
  await page.screenshot({ path: out, omitBackground: omitBg, clip: { x: 0, y: 0, width: size, height: size } });
}
(async () => {
  const b = await chromium.launch(); const page = await b.newPage({ deviceScaleFactor: 1 });
  const master = svg('reloventa-icon.svg');
  for (const s of [16, 32, 48, 64, 128, 180, 256, 512, 1024]) await render(page, master, s, `${png}/reloventa-icon-${s}.png`);
  for (const v of ['dark', 'light', 'tinted']) await render(page, svg(`reloventa-icon-${v}.svg`), 1024, `${png}/reloventa-icon-1024-${v}.png`);
  // iconset (Apple naming)
  const sets = [[16,1],[16,2],[32,1],[32,2],[128,1],[128,2],[256,1],[256,2],[512,1],[512,2]];
  for (const [pt, sc] of sets) await render(page, master, pt * sc, `${set}/icon_${pt}x${pt}${sc === 2 ? '@2x' : ''}.png`);
  // Xcode asset catalog
  const images = sets.map(([pt, sc]) => ({ idiom: 'mac', size: `${pt}x${pt}`, scale: `${sc}x`, filename: `icon_${pt}x${pt}${sc === 2 ? '@2x' : ''}.png` }));
  for (const [pt, sc] of sets) fs.copyFileSync(`${set}/icon_${pt}x${pt}${sc === 2 ? '@2x' : ''}.png`, `${xc}/icon_${pt}x${pt}${sc === 2 ? '@2x' : ''}.png`);
  fs.writeFileSync(`${xc}/Contents.json`, JSON.stringify({ images, info: { version: 1, author: 'reloventa' } }, null, 2));
  // .icns (PNG payloads; modern macOS supports these types)
  const types = [['icp4',16],['icp5',32],['icp6',64],['ic07',128],['ic08',256],['ic09',512],['ic10',1024],['ic11',32],['ic12',64],['ic13',256],['ic14',512]];
  const file = { icp4:'icon_16x16', icp5:'icon_32x32', icp6:null, ic07:'icon_128x128', ic08:'icon_256x256', ic09:'icon_512x512', ic10:'icon_512x512@2x', ic11:'icon_16x16@2x', ic12:'icon_32x32@2x', ic13:'icon_128x128@2x', ic14:'icon_256x256@2x' };
  const chunks = [];
  for (const [t] of types) { const f = file[t]; if (!f) continue; const d = fs.readFileSync(`${set}/${f}.png`); const h = Buffer.alloc(8); h.write(t, 0, 'ascii'); h.writeUInt32BE(d.length + 8, 4); chunks.push(h, d); }
  const body = Buffer.concat(chunks); const hd = Buffer.alloc(8); hd.write('icns', 0, 'ascii'); hd.writeUInt32BE(body.length + 8, 4);
  fs.writeFileSync(`${gen}/Reloventa.icns`, Buffer.concat([hd, body]));
  // Project resources
  fs.copyFileSync(`${gen}/Reloventa.icns`, `${proj}/build/icon.icns`);
  fs.copyFileSync(`${png}/reloventa-icon-1024.png`, `${proj}/build/icon.png`);
  fs.copyFileSync(`${root}/final/reloventa-icon.svg`, `${proj}/src/renderer/assets/reloventa-icon.svg`);

  // DMG background (660x400 @2x) — branded installation window
  const markSvg = fs.readFileSync(`${root}/final/reloventa-icon.svg`, 'utf8');
  const dmg = `<style>*{box-sizing:border-box}body{margin:0;width:660px;height:400px;font-family:-apple-system,'SF Pro Display',Helvetica,sans-serif;color:#fff;overflow:hidden;background:radial-gradient(600px 300px at 15% 110%,#ff4f9a55,transparent),radial-gradient(500px 300px at 95% -10%,#2ee6ff33,transparent),linear-gradient(135deg,#1b1050,#07041a)}
  h1{position:absolute;left:0;right:0;top:34px;margin:0;text-align:center;font-size:26px;font-weight:700;letter-spacing:-.02em}
  p{position:absolute;left:0;right:0;top:70px;margin:0;text-align:center;font-size:13px;opacity:.7;letter-spacing:.18em;text-transform:uppercase}
  .arrow{position:absolute;left:282px;top:178px;width:96px;height:44px;opacity:.85}
  .hint{position:absolute;left:0;right:0;bottom:26px;text-align:center;font-size:12px;opacity:.55}</style>
  <h1>Reloventa</h1><p>Social. Stream. Explore.</p>
  <svg class="arrow" viewBox="0 0 96 44" fill="none" stroke="url(#g)" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"><defs><linearGradient id="g"><stop offset="0" stop-color="#2EE6FF"/><stop offset="1" stop-color="#FF5FA2"/></linearGradient></defs><path d="M6 22h80M66 6l20 16-20 16"/></svg>
  <div class="hint">Drag Reloventa to Applications to install</div>`;
  const p2 = await b.newPage({ viewport: { width: 660, height: 400 }, deviceScaleFactor: 2 });
  await p2.setContent(dmg); await p2.screenshot({ path: `${proj}/build/dmg-background@2x.png` });
  const p1 = await b.newPage({ viewport: { width: 660, height: 400 }, deviceScaleFactor: 1 });
  await p1.setContent(dmg); await p1.screenshot({ path: `${proj}/build/dmg-background.png` });
  await b.close(); console.log('icons built');
})();
