# Website Redesign Prompt — NOVA Radio Theme

Give this document directly to Claude Code so it can redesign your existing site according to this theme.

---

## Project summary

My site is an online radio station (PWA). I want its look and UX turned into a modern, single-page, no-scroll app inspired by Spotify — with a central player, a side navigation, and a persistent full-width mini-player bar docked at the bottom of the screen on every view.

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
- **Curated accent-palette system:** 10 hand-picked two-color gradients (`lib/accentPalettes.ts`) — vibrant, cohesive with each other and the brand's neon-dark identity (two of them intentionally reuse the exact brand accent hexes). One palette is assigned per track deterministically: a small fast hash (sum of char codes mod 10) of `artist::track` (or the ad slug, in sponsor mode) always picks the same palette for the same song/ad — no live color sampling from artwork. This is the site's active theme, not just a background tint: it drives the disc's glow, the play button's glass tint, the ambient background blob, the active-nav-item highlight, *and* the page background itself, site-wide (persists across views since playback continues). Each palette also defines a near-black background tint (`bgFrom`/`bgTo`, hue-matched to that palette — e.g. violet-fuchsia leans toward `#0a0612`) applied as a gradient on `body`; a tint shift only, never a lightness change (max channel ~20/255 across all 10, verified >7:1 WCAG contrast against both `--foreground` and `--muted` text in every case). Accent and background crossfade together over ~1s as one cohesive shift — same tween, same tick, same CSS-custom-property mechanism (`--accent-from-rgb`/`--accent-to-rgb`/`--bg-from-rgb`/`--bg-to-rgb`); applied instantly instead under `prefers-reduced-motion`.

## 2. Overall page structure (no scrolling)

- The entire site must **fit in a single viewport, with no vertical scrolling needed** (`height: 100dvh`, `overflow: hidden`) — on desktop, unconditionally; on mobile, see the scroll/swipe exception below (content *can* scroll there, but is never left unreachable — the swipe-to-next-view gesture picks up exactly where scrolling leaves off).
- Instead of scrolling, the site should behave like a **single-page app with view switching**:
  - **Desktop:** a fixed sidebar (like Spotify desktop) containing the logo (a typographic wordmark, "radiofaaz" in Latin letters, never translated), nav items (Home / Schedule / Events / Contact), and at the bottom of the sidebar: the language switcher.
  - **Mobile:** the sidebar becomes a **bottom tab bar**, just like the Spotify mobile app.
  - LTR structure always, regardless of language; Persian text renders naturally within it, no layout mirroring.
- Each section (Home/Schedule/Events/Contact) must be designed so its content fits within the viewport height (use `clamp()` for font sizes and spacing, and relative units) rather than needing internal scrolling.
- Switching between views should use a smooth transition (short fade + slide), not an abrupt jump.
- **Scroll/swipe navigation (additive, not a replacement for sidebar/tab-bar clicks):** on the main content area, a mouse-wheel/trackpad scroll or a vertical touch swipe steps through views in nav order (Home → DJ Majid → Events → Contact). Debounced with an accumulated-delta threshold (ignore tiny/accidental input) plus an ~800ms cooldown lock after each trigger, so one physical gesture — which can keep emitting wheel/touch events for a few hundred ms — only ever changes the view once. Reuses the exact same fade transition as click-triggered switches (same `setView` call, same render path — not a separate animation), including the instant-instead-of-animated behavior under `prefers-reduced-motion`. Skipped when the gesture starts on a native-scrollable form control (`textarea`/`select`/`input`) so it doesn't fight normal scrolling/interaction there.
  - **Desktop** (`md`+, ≥768px — same breakpoint the sidebar uses): views never scroll internally (unchanged from the no-scroll rule above). Wheel scroll down/up goes to the next/previous view; no wrap-around at either end (scrolling up on Home or down on Contact does nothing).
  - **Mobile** (<768px) — the one exception to "no scrolling": each view's own container allows natural `overflow-y: auto` when its content is taller than the viewport (sidebar/bottom-tab-bar/mini-player stay outside this scrollable area, fixed as always). Content reserves bottom clearance equal to `--mini-player-height` so the last element is never hidden behind the mini-player once scrolled down — one shared mechanism, no per-view padding hacks. A swipe only changes views once already scrolled to the corresponding edge of the current view's content (bottom, swiping further down → next view; top, swiping further up → previous view) — mid-scroll swipes just scroll normally. Wraps around cyclically: past Contact's bottom goes to Home; past Home's top goes to Contact.

## 3. Main player (Home view)

- **Giant centered disc:** the album cover dominates the view, sized to roughly 60-70% of available viewport height (`clamp()` combining `vh` and `vw` so it never overflows on narrow/short mobile screens), scaling down proportionally on smaller viewports. Does **not** spin (no rotation animation) — only the glow pulse animates. Request the largest available artwork size from the source (e.g. iTunes Search API's `600x600bb` instead of the default `100x100bb`).
- Chrome stays minimal and close beneath the disc: track title, artist name, the play/stop button, and a compact mute toggle — nothing else competes with the disc for space.
- **Glow halo, the sole "music is playing" signal around the disc** (no ring of bars — removed, see below): two blurred, palette-colored layers (from-color and to-color) sit behind the disc, always present but at a dim, static minimum when paused/stopped. **Simulated, not audio-reactive** — the remote stream's CORS restrictions make a Web Audio `AnalyserNode` unreliable here, and the actual goal is just to visibly communicate "music is playing," not real frequency analysis. Driven imperatively via `requestAnimationFrame` (not framer-motion keyframes, which read as a robotic identical loop): each layer's opacity/scale follows a sum of two slow, incommensurate sine waves with a random phase picked once per mount, an organic breathing rhythm rather than a metronome. An eased envelope ramps the pulse up on play and settles it smoothly (not abruptly) back to the dim static state on pause — same envelope pattern the removed bar visualizer used, just applied to the glow instead. Strong swing (opacity ~0.16 dim → ~0.78 bright peak, scale ~0.88 → ~1.3) and a wider blur (84px) than the base glow so it reads as a clear halo, not a faint edge shimmer; stays fully behind/around the disc's silhouette, no spikes or bars breaking the circle. Colored by the track's assigned accent palette (§1). Under `prefers-reduced-motion`: static brightness (dim when paused, a fixed brighter level when playing), no animation loop at all.
- Below the disc: track title (with a subtle shine/gradient text effect), artist name.
- Since this is a live radio broadcast (not a playlist), the player only has **a single play/stop button** (no previous, next, shuffle, or like) — a glassmorphic button (frosted blur, semi-transparent surface, soft border, subtle inner highlight) with a smooth crossfade between the play/pause/loading icon states, not an abrupt swap.
- No volume slider — a small compact mute/unmute icon button sits next to the play button instead (44px touch target, not a full-width control).
- **Sponsor mode:** the Icecast now-playing title announces sponsored content with an `AD:` prefix (e.g. `"AD: sponsor-one"`); the remainder is a slug looked up in `public/data/ads.json` (`{ "slug": { image, advertiser, link? } }`). While active: the ad image renders as the cover art with the exact same styling as a track (no frame/badge on the image itself), the accent palette is hashed from the ad slug the same way a track's is hashed from `artist::track` — no special-cased sponsor color — and the text below the disc shows the advertiser name plus a "Visit Sponsor" button linking to `link` (omitted if absent) instead of track/artist. The radial visualizer keeps reacting to real audio, unchanged. Returning to a normal track crossfades the palette and layout back the same way. A dev-only `?test-ad=<slug>` query param force-activates a given ad for testing (stripped in production builds).
- No other widgets on the Home view — the disc and its chrome are the entire view. Events are not previewed here; they're reached via the dedicated Events nav item.
- **Hard constraint — cover art visibility:** the track cover art, when available, must ALWAYS be visible and never hidden — never behind the decorative Faaz logo, never clipped, never obscured by any other element. The cover art and the decorative Faaz logo must always occupy distinct, non-overlapping positions in the layout, regardless of breakpoint or screen size. This is a hard constraint for all future changes to the hero.

## 4. Persistent mini-player

- **A full-width, edge-to-edge fixed bar** (not a floating pill card) is persistently visible at the bottom of the screen on **every** view, including Home — since Home now also carries its own large hero CTA (§3's single play/stop button, unchanged and intentionally minimal), both controls read from and drive the exact same shared playback state, so they're always in sync by construction.
  - Shape: flush against the viewport's bottom edge, flat/rectangular (no pill border-radius), a thin top border plus glass blur backdrop for separation from content above — consistent with the site's glass aesthetic, but the silhouette is a straight bar, not a floating card.
  - **Unlike the Home hero's deliberately minimal single button, this bar carries the fuller reference control set**, left to right: album/ad thumbnail; track title (with a small red "LIVE" tag) + artist, truncated; shuffle / rewind-10 / forward-10 icons; the large primary play/stop button (palette-filled); a functional mute/unmute toggle; a compact waveform plus a "• LIVE" text badge; and a "Full Player" button.
    - Shuffle, rewind-10, and forward-10 are **decorative only** — there's no seekable position or shuffleable playlist on a continuous live stream. Rendered at reduced opacity, `disabled`, `cursor: not-allowed`, with an i18n'd tooltip/`aria-label` ("Not available for live radio") explaining why.
    - Mute/unmute reuses the same functional toggle as everywhere else in the app.
    - "Full Player" switches the active view to Home (client-side view switch, same mechanism as the sidebar/tab bar) — hidden while already on Home, since it would be redundant there.
    - On narrow mobile widths, only the thumbnail, title/artist, play/stop button, and "Full Player" are guaranteed visible — shuffle/rewind/forward, mute, and the waveform+"LIVE" badge collapse away below the `sm` breakpoint to avoid crowding.
  - It must clearly signal that the radio playback **hasn't stopped and is still going**, even while the user is on another view.
  - On mobile, this bar sits directly stacked above the bottom tab bar (no gap between them). On desktop, it spans from the sidebar's edge to the right of the viewport, flush at the bottom.
  - Its height is a shared CSS var (`--mini-player-height`, in `globals.css`) so view containers can reserve exact bottom clearance for it — applied per-view in `page.tsx` (`pb-[var(--mini-player-height)]`, the same value on every breakpoint now that the bar is flush with no offset gap to add). Never visually overlaps interactive content underneath it (e.g. the Contact form's submit button on shorter laptop-height viewports).

## 5. Animations (creative, but lightweight and unobtrusive)

Enable these effects only on devices with a real mouse (`(hover: hover) and (pointer: fine)`); on mobile/touch they must be completely disabled (not just hidden — never executed at all, to save battery and performance):
- A subtle particle network in the background that gently drifts away from the cursor as it approaches
- Gentle parallax on background gradient blobs based on cursor position
- A very subtle 3D tilt on the album disc based on cursor position (not automatic rotation)

General animations (must work on all devices, lightweight, no performance hit):
- Simulated glow-halo pulse around the disc, eased in/out on play/pause (driven by `requestAnimationFrame`, not `setInterval`)
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

- **Phone-landscape orientation** (`orientation: landscape` combined with a phone-range `max-height: 500px` — tallest phone landscape is ~430px, shortest tablet landscape is ~768px, so tablets are never caught by this and keep their normal landscape layout unaffected): the Home view's three-card section (Meet DJ Majid / Next Event / Advertise with Us) is hidden entirely — there's too little vertical room for it alongside the hero — and the hero expands to fill the freed height, same `flex-1`/auto-height behavior the `md+` layout already uses. No rotation/transform trick — this is a plain responsive breakpoint, and the hero's own `clamp()` values still handle its internal sizing fluidly within that expanded space.
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
3. **Events** — grid of glassmorphic event cards (placeholder photo via a seeded placeholder-image service, date, title, short description). "Read more" flips the card (3D transform) to a back face with fake placeholder details (longer description, time, location, organizer) and a back/close control; instant instead of animated under `prefers-reduced-motion`. Capped to 3 visible cards below the `sm` breakpoint (single-column) to stay within the no-scroll viewport; `sm`+ shows all via 2-3 columns.
4. **Contact** — email, phone, social media icons

---

### Important note for Claude Code
Before starting implementation, please review the current project structure (framework, components, style files) and implement this theme with minimal changes to application logic — UI/UX layer only. If any part of this spec conflicts with the current architecture, ask before making a large change.
