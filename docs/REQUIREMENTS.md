# Reloventa — Requirements

> The original project brief was not available when development began, so the functional baseline below is inferred from the product description (a macOS hub for Facebook, Instagram, TikTok, YouTube, Netflix and Prime Video). The design & brand requirements are taken verbatim from the owner's brief. Please correct anything that differs from the original.

## 1. Product
- **Name:** Reloventa — **Tagline:** Social. Stream. Explore.
- Standalone macOS app (Apple Silicon + Intel), premium and commercially distributable.

## 2. Functional
| ID | Requirement | Status |
|----|-------------|--------|
| F1 | Six platforms in one window: Facebook, Instagram, TikTok, YouTube, Netflix, Prime Video | Done |
| F2 | Isolated, persistent session per platform (separate cookies/storage) | Done |
| F3 | Back / forward / reload, per-platform | Done |
| F4 | Home dashboard: continue where you left off, today's local usage, quick launch | Done |
| F5 | Command palette (⌘K) and keyboard shortcuts (⌘0–6, ⌘L, ⇧⌘F, ⌥⌘S, ⌃Tab) | Done |
| F6 | Per-platform layout override: Auto / Phone / Wide | Done |
| F7 | Focus mode; native HTML5 fullscreen for video | Done |
| F8 | Settings: theme, accent, motion, visible platforms, break reminder, clear data | Done |
| F9 | Over-the-air updates through GitHub Releases | Implemented, untested on a signed build |
| F10 | Netflix / Prime Video DRM playback | **Blocked** — needs Widevine (castlabs Electron build) |

## 3. Design & UX (from the brief)
- Unique, modern, minimalist-but-rich, intuitive; not a browser layout → floating glass sidebar, dashboard, adaptive stage.
- Adaptive layouts per content type (vertical vs widescreen) and window size → `effectiveLayout()` in `app.js`.
- Smooth animation, glass/depth, platform transitions (ambient light shifts to the platform's colours), distraction-free viewing, themes & accents, home dashboard.
- Automatic adaptation to window size and resolution (min window 880×600; layouts reflow).

## 4. Brand (from the brief)
- Original logo, icon, palette, typography, custom UI elements → see `branding/BRANDING.md` and `docs/DESIGN.md`.
- ≥3 icon concepts evaluated, strongest selected; editable vector, PNGs and all macOS icon assets incl. 1024×1024 master.
- Branding applied consistently to app, settings, DMG installer and docs.

## 5. Quality
- **Performance:** transform/opacity-only animation; no web fonts; background views throttled; animations paused when the window is hidden.
- **Accessibility:** keyboard navigation, visible focus ring, ARIA roles (dialog, combobox/listbox, radiogroup, switch), WCAG AA contrast (audited in tests), honours Reduce Motion, Reduce Transparency and Increase Contrast.
- **Privacy:** no analytics or telemetry; camera/mic/notifications denied; sandboxed renderers, context isolation, CSP; off-platform links open in the default browser; usage stats stored locally for 14 days.

## 6. Verification
- `node test/ui-smoke.js` — 22 checks (layouts, palette, themes, collapse, focus, Reduce Motion, contrast).
- `electron test/electron-smoke.js` — 10 checks against the real main process (IPC bridge, isolation, native view bounds, UA).
- **Not yet verified:** real macOS rendering (vibrancy, traffic lights, 3-finger swipe), signed builds, auto-update, DRM streaming.
