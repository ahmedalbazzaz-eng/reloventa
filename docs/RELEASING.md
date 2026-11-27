# Releasing Reloventa

Release flow (no manual uploads): **bump `version` in `package.json` → push to `main` → the *Release* workflow builds arm64 + x64 DMG/ZIP, creates the GitHub Release `vX.Y.Z` and uploads everything.** Installed apps then update themselves from that release.

## One-time setup: choose where macOS builds run
GitHub-hosted macOS runners were rejected for this account (`The configuration 'macos-14-arm64-us-default' is not supported`). Check Settings > Billing and plans, and Actions > General. Then pick one:

### A. GitHub-hosted (nothing stored on your Mac)
Repo > Settings > Secrets and variables > Actions > **Variables** > New: `MAC_RUNNER` = `"macos-14"` (with the quotes).

### B. Self-hosted runner on your Mac (works today)
1. Repo > Settings > Actions > Runners > **New self-hosted runner** > macOS > ARM64, and run the commands shown (download + `./config.sh`).
2. Start it with `./run.sh` (or `sudo ./svc.sh install && sudo ./svc.sh start` to run in the background).
3. Variable `MAC_RUNNER` = `["self-hosted","macOS","ARM64"]`.

The job deletes `dist/`, `node_modules/` and the Electron caches after every build; the only persistent files are the runner itself (~200 MB) and the cloned workspace. Everything released lives on GitHub. Your Mac must be on and online when a release is pushed.

## Signing & notarization
Without an Apple Developer certificate the app is unsigned, and macOS may block automatic updates. Add secrets `CSC_LINK`, `CSC_KEY_PASSWORD`, `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, `APPLE_TEAM_ID`.

## Manual run
Actions > Release > *Run workflow* rebuilds and re-publishes the current version.
