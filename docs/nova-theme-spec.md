# Website Redesign Prompt — NOVA Radio Theme

Give this document directly to Claude Code so it can redesign your existing site according to this theme.

---

## Project summary

My site is an online radio station (PWA). I want its look and UX turned into a modern, single-page, no-scroll app inspired by Spotify — with a central player, a side navigation, and a small floating glass mini-player that appears when the user switches views.

---

## 1. Visual identity and color theme

- **Dark only, permanently** — no light mode, no toggle (see §7).
- **Color palette:**
  - Background: `#06060c`
  - Accent 1 (neon blue): `#22d3ee` to `#3b82f6`
  - Accent 2 (neon purple): `#a855f7` to `#7c3aed`
  - Glass surfaces (glassmorphism): semi-transparent background with `backdrop-filter: blur()` and a thin semi-transparent border
- Surfaces (cards, player, nav bar) should have a frosted-glass effect, not flat color.
- Soft, blurred gradient blobs in the background as an ambient effect — subtle, not dominant.
- **Curated accent-palette system:** 10 hand-picked two-color gradients (`lib/accentPalettes.ts`) — vibrant, cohesive with each other and the brand's neon-dark identity (two of them intentionally reuse the exact brand accent hexes). One palette is assigned per track deterministically: a small fast hash (sum of char codes mod 10) of `artist::track` (or the ad slug, in sponsor mode) always picks the same palette for the same song/ad — no live color sampling from artwork. This is the site's active accent theme, not just a background tint: it drives the disc's glow, the play button's glass tint, the radial visualizer ring color, the ambient background blob, and the active-nav-item highlight, site-wide (persists across views since playback continues). Crossfades over ~1s between palettes on track/ad change (via CSS custom properties `--accent-from-rgb`/`--accent-to-rgb`, tweened in JS); applied instantly instead under `prefers-reduced-motion`.

## 2. Overall page structure (no scrolling)

- The entire site must **fit in a single viewport, with no vertical scrolling needed** (`height: 100dvh`, `overflow: hidden`).
- Instead of scrolling, the site should behave like a **single-page app with view switching**:
  - **Desktop:** a fixed sidebar (like Spotify desktop) containing the logo (a typographic wordmark, "radiofaaz" in Latin letters, never translated), nav items (Home / Schedule / Events / Contact), and at the bottom of the sidebar: the language switcher.
  - **Mobile:** the sidebar becomes a **bottom tab bar**, just like the Spotify mobile app.
  - LTR structure always, regardless of language; Persian text renders naturally within it, no layout mirroring.
- Each section (Home/Schedule/Events/Contact) must be designed so its content fits within the viewport height (use `clamp()` for font sizes and spacing, and relative units) rather than needing internal scrolling.
- Switching between views should use a smooth transition (short fade + slide), not an abrupt jump.

## 3. Main player (Home view)

- **Giant centered disc:** the album cover dominates the view, sized to roughly 60-70% of available viewport height (`clamp()` combining `vh` and `vw` so it never overflows on narrow/short mobile screens), scaling down proportionally on smaller viewports. Does **not** spin (no rotation animation) — only the glow pulse and radial visualizer bars animate. Request the largest available artwork size from the source (e.g. iTunes Search API's `600x600bb` instead of the default `100x100bb`).
- Chrome stays minimal and close beneath the disc: track title, artist name, the play/stop button, and a compact mute toggle — nothing else competes with the disc for space.
- A soft glow around the disc that gently pulses (scale pulse) only while music is playing — not rotation. Glow blur radius scales up with the disc's larger size. Colored by the track's assigned accent palette (§1), two layers (from-color and to-color).
- Below the disc: track title (with a subtle shine/gradient text effect), artist name.
- Since this is a live radio broadcast (not a playlist), the player only has **a single play/stop button** (no previous, next, shuffle, or like) — a glassmorphic button (frosted blur, semi-transparent surface, soft border, subtle inner highlight) with a smooth crossfade between the play/pause/loading icon states, not an abrupt swap.
- No volume slider — a small compact mute/unmute icon button sits next to the play button instead (44px touch target, not a full-width control).
- A circular radial frequency visualizer: a thin ring of bars around the disc's circumference, driven by real-time frequency data from a Web Audio `AnalyserNode` connected to the audio element. Subtle — thin bars, moderate opacity, scaling with the disc's size without getting proportionally thicker (bar width stays fixed; only the ring radius and bar length grow), colored by the track's assigned accent palette. Only animates while playing; settles to a minimal flat ring when paused/stopped, and stays static (no per-frame animation) under `prefers-reduced-motion`.
- **Sponsor mode:** the Icecast now-playing title announces sponsored content with an `AD:` prefix (e.g. `"AD: sponsor-one"`); the remainder is a slug looked up in `public/data/ads.json` (`{ "slug": { image, advertiser, link? } }`). While active: the ad image renders as the cover art with the exact same styling as a track (no frame/badge on the image itself), the accent palette is hashed from the ad slug the same way a track's is hashed from `artist::track` — no special-cased sponsor color — and the text below the disc shows the advertiser name plus a "Visit Sponsor" button linking to `link` (omitted if absent) instead of track/artist. The radial visualizer keeps reacting to real audio, unchanged. Returning to a normal track crossfades the palette and layout back the same way. A dev-only `?test-ad=<slug>` query param force-activates a given ad for testing (stripped in production builds).
- No other widgets on the Home view — the disc and its chrome are the entire view. Events are not previewed here; they're reached via the dedicated Events nav item.

## 4. Floating mini-player

- When the user navigates away from the Home view (e.g. to "Events"), the large player fades out and **a small floating glass mini-player** (similar to the iOS Now Playing bar / Spotify's mini-player) appears at the bottom of the screen:
  - Shape: pill/rounded with very rounded corners, glassy (blur + transparency)
  - Content: small album thumbnail, track title + artist (single line, truncated with `ellipsis` if long), a small play/stop button, a thin progress bar line
  - It must clearly signal that the radio playback **hasn't stopped and is still going**, even while the user is on another view.
  - On mobile, this mini-player sits directly above the bottom nav bar.

## 5. Animations (creative, but lightweight and unobtrusive)

Enable these effects only on devices with a real mouse (`(hover: hover) and (pointer: fine)`); on mobile/touch they must be completely disabled (not just hidden — never executed at all, to save battery and performance):
- A subtle particle network in the background that gently drifts away from the cursor as it approaches
- Gentle parallax on background gradient blobs based on cursor position
- A very subtle 3D tilt on the album disc based on cursor position (not automatic rotation)

General animations (must work on all devices, lightweight, no performance hit):
- Radial frequency visualizer around the disc that only moves while "playing" (driven by `requestAnimationFrame`, not `setInterval`)
- Gentle pulse on the glow around the disc while playback is active
- Accent-palette crossfade on track/ad change (skipped — applied instantly — under `prefers-reduced-motion`)
- Smooth transition when switching views
- Smooth icon crossfade on the play button between play/pause/loading states

## 6. Internationalization (i18n)

- Three languages: **English, German, Persian**. Default language on first load: **English**.
- Language switcher with short labels: `EN` / `DE` / `FA` (use the Latin letters "FA" for Persian too, not "فا").
- LTR structure always, regardless of language; Persian text renders naturally within it, no layout mirroring. No `dir="rtl"` is ever set — Persian characters still shape and flow right-to-left at the character level (inherent to the script), but sidebar position, alignment, spacing, icon order, and the mini-player's offset stay exactly as in English/German.
- All UI text must come from a translation dictionary/object (not hardcoded in HTML), and switching languages must be instant (no page reload).
- Dates and numbers (e.g. show broadcast times) should be formatted appropriately for the selected language.

## 7. Dark mode only

- The site is permanently dark — no light mode, no theme toggle, no `prefers-color-scheme`/`localStorage` theme-persistence logic. One color palette (§1), applied everywhere.

## 8. Responsiveness and PWA

- Fully responsive down to mobile; on mobile:
  - The sidebar becomes a bottom tab bar
  - Mouse-driven effects are fully disabled
  - Use `100dvh` instead of `100vh` (to account for the mobile browser's address bar)
  - Respect `env(safe-area-inset-*)` for the notch and bottom safe area (especially when installed as a PWA)
  - All buttons must be at least 44px (Apple/Google touch target standard)
- Keyboard focus must be clearly visible on all interactive elements (`:focus-visible`).
- Respect `prefers-reduced-motion` and disable non-essential animations accordingly.

## 9. Site sections (views)

1. **Home** — giant centered disc player, no other widgets
2. **DJ Majid (About)** — bio, avatar, personal site link, feature highlights
3. **Events** — grid of event cards with image, title, short description, date
4. **Contact** — email, phone, social media icons

---

### Important note for Claude Code
Before starting implementation, please review the current project structure (framework, components, style files) and implement this theme with minimal changes to application logic — UI/UX layer only. If any part of this spec conflicts with the current architecture, ask before making a large change.
