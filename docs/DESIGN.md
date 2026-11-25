# Reloventa Design Language — "Orbit"

## Principles
1. **Content first.** Chrome recedes; platforms are the stars. Focus mode removes all chrome.
2. **Luminous depth.** Layered glass over a slowly drifting ambient light field tinted by the active platform.
3. **Motion with meaning.** Short, eased transitions; everything honours Reduce Motion (`--dur` → 0).
4. **Adaptive by content.** Vertical feeds get a phone column; cinema content goes full-bleed.

## Colour
| Token | Midnight | Daylight |
|-------|----------|----------|
| Background | `#0B0820` | `#F4F2FF` |
| Text | `#F5F3FF` (17.9:1) | `#1A1440` (15.6:1) |
| Muted | `#B8B2D8` (9.7:1) | `#4F4878` (7.5:1) |
| Faint | `#8E88B3` (5.9:1) | `#6E6896` (4.7:1) |

Brand spectrum: cyan `#2EE6FF` → violet `#7B61FF` → pink `#FF5FA2`, warm core amber `#FFD27A` → coral `#FF7A59`. Default accent `#7B61FF`; eight alternatives in Settings. Accent foreground (white/dark) is chosen automatically for contrast.

## Typography
System fonts only (no downloads): SF Pro Text/Display for UI, SF Pro Rounded (`ui-rounded`) for headings and wordmark.

## Shape & components
- Radii: 22 (surfaces) / 14 (controls) / 10 (chips). Gradient "tiles" for platforms with original abstract glyphs.
- Floating glass sidebar (236 px, collapses to a 76 px rail), glass overlays (palette, settings), segmented layout control, pill buttons, switches.
- Layout switch: `Auto` shows a 440 px phone column for vertical platforms when the stage is wider than 720 px.

## Overlays over native web views
Native views sit above the shell, so overlays hide the active view and show a blurred JPEG snapshot instead (`view:hide` → `capturePage`), preserving the glass effect.

## Motion budget
Ambient blobs (3, transform-only, paused when hidden), card hover lift, sidebar width transition, overlay pop. No continuous JS animation.
