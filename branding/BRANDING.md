# Reloventa Brand

**Name:** Reloventa · **Tagline:** Social. Stream. Explore. · **Personality:** entertainment, discovery, connectivity, movement, simplicity.

## Icon concepts (see `concepts/`, contact sheet in `generated/concept-contact-sheet.png`)
| Concept | Idea | Small-size legibility | Ownability | Verdict |
|---------|------|----------------------|------------|---------|
| **A · Orbit** | Reloading ring + counter-rotating warm core + satellite node | Good down to 32 px; ring reads at 16 px | High — abstract, no media symbol | **Selected** |
| B · Flow | Three flowing ribbons | Very good | Low — reads as a generic water/wave glyph | Rejected |
| C · Nodes | Three connected nodes in a loop | Weak at 16–32 px (thin links) | Medium | Rejected |

**Revision note:** Orbit's first draft had the ring gap at the top with a dot above it, which read as a *power button*. The gap and node were rotated to the diagonal and the inner arc counter-rotated, giving a pinwheel/motion reading.

**Meaning:** outer ring = reload/refresh; inner core = discovery and warmth; satellite = connection. No third-party logos or shapes.

## Assets
- `final/` — editable SVG (1024 grid, 824 px body): default, `-dark`, `-light`, `-tinted`.
- `generated/png/` — 16–1024 px PNGs and 1024 dark/light/tinted variants.
- `generated/Reloventa.icns`, `Reloventa.iconset/`, `AppIcon.appiconset/` (Xcode).
- `../build/icon.icns`, `dmg-background*.png` — used by the installer.
- Regenerate: `npm run icons` (needs Python 3 + Playwright).

## Usage
Keep clear space equal to the satellite diameter around the mark. Don't recolour, rotate or add effects. Wordmark: SF Pro Rounded Bold, tracking −1%.
