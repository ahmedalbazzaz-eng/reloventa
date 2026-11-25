const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
const root = path.resolve(__dirname, '..');
(async () => {
  const names = ['concept-a-orbit','concept-b-flow','concept-c-nodes'];
  const svgs = names.map(n => 'data:image/svg+xml;base64,' + fs.readFileSync(`${root}/concepts/${n}.svg`).toString('base64'));
  const sizes = [256,128,64,32,16];
  const row = (bg, fg) => `<div class="row" style="background:${bg};color:${fg}">` + svgs.map((s,i)=>`<div class="c"><b>${names[i]}</b><div class="sz">` + sizes.map(z=>`<img src="${s}" width="${z}" height="${z}">`).join('') + `</div></div>`).join('') + '</div>';
  const html = `<style>body{margin:0;font:12px -apple-system,sans-serif}.row{display:flex;gap:30px;padding:24px}.sz{display:flex;align-items:flex-end;gap:10px;margin-top:8px}</style>` + row('#f2f2f5','#111') + row('#1c1c1f','#eee');
  const b = await chromium.launch(); const p = await b.newPage({viewport:{width:1500,height:700}, deviceScaleFactor:1});
  await p.setContent(html); await p.screenshot({path: `${root}/generated/concept-contact-sheet.png`, fullPage:true}); await b.close();
})();
