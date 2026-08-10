import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const BASE_URL = "http://localhost:3000";

const VIEWPORTS = [
  { width: 360, height: 800 },
  { width: 375, height: 812 },
  { width: 414, height: 896 },
  { width: 768, height: 1024 },
  { width: 820, height: 1180 },
  { width: 1024, height: 768 },
  { width: 1440, height: 900 },
  // Phone-landscape (short + wide) — the fluid clamp() system must handle
  // these as just more sizes, not a special rotation-locked mode.
  { width: 667, height: 375 },
  { width: 812, height: 375 },
  { width: 896, height: 414 },
  { width: 932, height: 430 },
];

function timestampFolder() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const time = `${pad(now.getHours())}${pad(now.getMinutes())}`;
  return `${date}-${time}`;
}

async function assertServerReachable() {
  try {
    const res = await fetch(BASE_URL, { signal: AbortSignal.timeout(5000) });
    if (!res.ok && res.status >= 500) {
      throw new Error(`Server responded with status ${res.status}`);
    }
  } catch (err) {
    console.error(
      `\nCould not reach ${BASE_URL} — is the dev server running? (npm run dev)\n` +
        `Underlying error: ${err.message}\n`,
    );
    process.exit(1);
  }
}

// Nav order must match navItems.tsx (Home / DJ Majid / Events / Contact /
// Install App) — English is the default language on first load, so these
// are the accessible names rendered by both Sidebar (>=1024px) and the
// MobileMenu drawer (<1024px).
const VIEWS_TO_VISIT = [
  { name: "DJ Majid", slug: "dj-majid" },
  { name: "Events", slug: "events" },
  { name: "Contact", slug: "contact" },
  { name: "Install App", slug: "install-app" },
];

// Sidebar.tsx uses lg:flex (1024px) as its breakpoint; below that,
// MobileMenu.tsx's hamburger + drawer is the only way to switch views.
const DESKTOP_NAV_BREAKPOINT = 1024;

// View-switch fade transition is 0.2s (see app/page.tsx) — pad generously.
const VIEW_TRANSITION_WAIT_MS = 500;

async function navigateToView(page, width, name) {
  if (width < DESKTOP_NAV_BREAKPOINT) {
    await page.getByRole("button", { name: "Open menu" }).click();
    await page.getByRole("dialog").getByRole("button", { name }).click();
    // MobileMenu closes its own drawer on nav-item click (setOpen(false)),
    // so no separate close step is needed — just wait for it to unmount.
    await page.getByRole("dialog").waitFor({ state: "detached" });
  } else {
    // Scope to the sidebar's own nav list — a separate floating
    // "Install App" shortcut button (InstallAppButton.tsx) shares the
    // same accessible name elsewhere in the top-right header group.
    await page.locator("aside").getByRole("button", { name, exact: true }).click();
  }
  await page.waitForTimeout(VIEW_TRANSITION_WAIT_MS);
}

async function main() {
  await assertServerReachable();

  const outDir = path.join("screenshots", timestampFolder());
  await mkdir(outDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const filenames = [];

  try {
    for (const { width, height } of VIEWPORTS) {
      const page = await browser.newPage({ viewport: { width, height } });
      await page.goto(BASE_URL, { waitUntil: "networkidle" });
      await page.waitForTimeout(500);

      const homeFilename = `${width}x${height}-home.png`;
      await page.screenshot({
        path: path.join(outDir, homeFilename),
        fullPage: true,
      });
      filenames.push(homeFilename);

      for (const view of VIEWS_TO_VISIT) {
        await navigateToView(page, width, view.name);

        const filename = `${width}x${height}-${view.slug}.png`;
        await page.screenshot({
          path: path.join(outDir, filename),
          fullPage: true,
        });
        filenames.push(filename);
      }

      await page.close();
    }
  } finally {
    await browser.close();
  }

  console.log(`\nScreenshots saved to: ${outDir}`);
  for (const name of filenames) {
    console.log(`  - ${name}`);
  }
  console.log(`\nTotal: ${filenames.length} screenshots`);
}

main();
