# Reloventa — Social. Stream. Explore.

A premium macOS hub for social feeds and streaming. Each platform runs in its own sandboxed, isolated session inside one fluid, glass-style interface.

## Highlights
- **Adaptive layouts** — short-form feeds (Instagram, TikTok) in a phone-width column; streaming (YouTube, Netflix, Prime Video) full-bleed. Override per platform: Auto / Phone / Wide.
- Floating glass sidebar (collapsible), home dashboard, command palette (⌘K), distraction-free Focus mode (⇧⌘F), 3-finger swipe between platforms.
- Themes (Auto, Midnight, Daylight, Aurora) + accent colours.
- Accessibility: keyboard navigation, visible focus, WCAG AA contrast, macOS Reduce Motion / Reduce Transparency / Increase Contrast.
- Privacy: per-platform isolated storage, no telemetry, camera/mic blocked, usage stats stay local.
- **Auto-update** over the internet via GitHub Releases.

## Develop
```bash
npm install
npm start            # run the app
node test/ui-smoke.js   # UI tests (Playwright)
npm run icons        # regenerate brand assets
```

## Release & auto-update
1. Bump `version` in `package.json`, commit.
2. `git tag v1.0.1 && git push --tags` — the **Release** workflow builds arm64 + x64 DMG/ZIP on macOS and publishes them to GitHub Releases.
3. Installed apps check for updates at launch and every 6 h, download silently, and offer a restart.

> **Code signing:** macOS auto-update requires a signed & notarized build. Add repo secrets `CSC_LINK`, `CSC_KEY_PASSWORD`, `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, `APPLE_TEAM_ID` (Apple Developer account). Without them the build works but updates will be blocked by macOS.

## Known limitations
- Netflix and Prime Video need the Widevine DRM module, which stock Electron lacks. Use [castlabs electron-releases](https://github.com/castlabs/electron-releases) (EVS-signed) to enable playback.
- Platform sites are third-party; their terms apply. Platform glyphs in the UI are original, not the companies' logos.

## Brand
See [`branding/`](branding/): 3 icon concepts (`concepts/`), final editable SVGs (`final/`), generated PNG / `.icns` / `AppIcon.appiconset` (`generated/`). Selected: **Orbit** — a reloading ring (refresh), a counter-rotating core (movement) and a satellite node (connectivity). Rejected: *Flow* (generic wave glyph), *Nodes* (illegible at 16–32 px).
