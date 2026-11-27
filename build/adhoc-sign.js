'use strict';
// afterPack hook. Only active when RELOVENTA_ADHOC=1 (CI fallback when the login keychain is not accessible).
// Ad-hoc signing needs no certificate or keychain; Apple Silicon requires at least this to launch.
const { execFileSync } = require('child_process'); const path = require('path');
exports.default = async function (ctx) {
  if (process.platform !== 'darwin' || process.env.RELOVENTA_ADHOC !== '1') return;
  const app = path.join(ctx.appOutDir, `${ctx.packager.appInfo.productFilename}.app`);
  console.log('  • ad-hoc signing', app);
  execFileSync('codesign', ['--force', '--deep', '--sign', '-', app], { stdio: 'inherit' });
};
