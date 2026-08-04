# Website Redesign Prompt — NOVA Radio Theme

Give this document directly to Claude Code so it can redesign your existing site according to this theme.

---

## Project summary

My site is an online radio station (PWA). I want its look and UX turned into a modern, single-page, no-scroll app inspired by Spotify — with a central player, a side navigation, and a small floating glass mini-player that appears when the user switches views.

---

## 1. Visual identity and color theme

- **Default mode:** Dark, with the ability to switch to Light mode that preserves the same brand identity — not just inverted colors.
- **Color palette:**
  - Dark background: `#06060c`
  - Light background: `#f3f4fa`
  - Accent 1 (neon blue): `#22d3ee` to `#3b82f6`
  - Accent 2 (neon purple): `#a855f7` to `#7c3aed`
  - Glass surfaces (glassmorphism): semi-transparent background with `backdrop-filter: blur()` and a thin semi-transparent border
- Surfaces (cards, player, nav bar) should have a frosted-glass effect, not flat color.
- Soft, blurred gradient blobs in the background as an ambient effect — subtle, not dominant.

## 2. Overall page structure (no scrolling)

- The entire site must **fit in a single viewport, with no vertical scrolling needed** (`height: 100dvh`, `overflow: hidden`).
- Instead of scrolling, the site should behave like a **single-page app with view switching**:
  - **Desktop:** a fixed sidebar (like Spotify desktop) containing the logo, nav items (Home / Schedule / Events / Contact), and at the bottom of the sidebar: language switcher and theme toggle.
  - **Mobile:** the sidebar becomes a **bottom tab bar**, just like the Spotify mobile app.
- Each section (Home/Schedule/Events/Contact) must be designed so its content fits within the viewport height (use `clamp()` for font sizes and spacing, and relative units) rather than needing internal scrolling.
- Switching between views should use a smooth transition (short fade + slide), not an abrupt jump.

## 3. Main player (Home view)

- A circular disc/album cover in the center that **does not spin** (no rotation animation).
- A soft glow around the disc that gently pulses (scale pulse) only while music is playing — not rotation.
- Below the disc: track title (with a subtle shine/gradient text effect), artist name.
- Since this is a live radio broadcast (not a playlist), the player only has **a single play/stop button** (no previous, next, shuffle, or like) — the large button with the neon glow that toggles between play and stop on click.
- A volume slider plus a small, subtle audio waveform visualizer next to it.
- Next to the player (on desktop), an "Upcoming events" card with a thumbnail image for each event and a "View all" button linking to the Events view.

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
- Audio waveform visualizer that only moves while "playing"
- Gentle pulse on the glow around the disc while playback is active
- Smooth transition when switching views
- Smooth transition when toggling day/night theme

## 6. Internationalization (i18n)

- Three languages: **English, German, Persian**.
- Language switcher with short labels: `EN` / `DE` / `FA` (use the Latin letters "FA" for Persian too, not "فا").
- When Persian is selected, the whole page must switch to **RTL** (sidebar direction, icons, spacing — everything must mirror correctly); English and German stay LTR.
- All UI text must come from a translation dictionary/object (not hardcoded in HTML), and switching languages must be instant (no page reload).
- Dates and numbers (e.g. show broadcast times) should be formatted appropriately for the selected language.

## 7. Light/dark mode

- A theme toggle button (sun/moon icon) that's always accessible (in the desktop sidebar, or the mobile header).
- Default based on the user's system `prefers-color-scheme`, but manually toggleable by click.
- Smooth transition between the two modes (no abrupt color change).

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

1. **Home** — main player + "Upcoming events" card
2. **Schedule** — weekly show list (day, time, title, host)
3. **Events** — grid of event cards with image, title, short description, date
4. **Contact** — email, phone, social media icons

---

### Important note for Claude Code
Before starting implementation, please review the current project structure (framework, components, style files) and implement this theme with minimal changes to application logic — UI/UX layer only. If any part of this spec conflicts with the current architecture, ask before making a large change.
