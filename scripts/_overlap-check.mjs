import { chromium } from "playwright";

const BASE_URL = "http://localhost:3000";

// Width/height pairs: the 7 required checkpoints plus a dense sweep around
// the mobile/desktop (768px) structural switch and across the full range,
// each paired with both a "short" and "tall" plausible viewport height.
const widths = [
  360, 375, 390, 414, 430, 480, 600, 700, 740, 750, 760, 764, 767, 768, 772,
  780, 800, 820, 900, 1000, 1024, 1100, 1200, 1300, 1366, 1440,
];
const heightsFor = (w) =>
  w < 768 ? [700, 800, 812, 896, 950] : [700, 768, 900, 1024, 1180];

function rect(bb) {
  return { left: bb.x, right: bb.x + bb.width, top: bb.y, bottom: bb.y + bb.height };
}

function intersects(a, b) {
  if (!a || !b || a.width === 0 || a.height === 0 || b.width === 0 || b.height === 0) return false;
  const ra = rect(a);
  const rb = rect(b);
  return !(ra.right <= rb.left || rb.right <= ra.left || ra.bottom <= rb.top || rb.bottom <= ra.top);
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  // Navigate once — resizing the viewport afterward just reflows the
  // existing page (CSS media queries + vh/vw recompute automatically), no
  // repeated network round-trips, far more resilient than a goto per combo.
  await page.goto(BASE_URL, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(500);

  let checked = 0;
  let overlaps = [];
  let errors = [];

  for (const w of widths) {
    for (const h of heightsFor(w)) {
      try {
        await page.setViewportSize({ width: w, height: h });
        await page.waitForTimeout(150);

        const logo = await page.locator('[data-testid="hero-logo-visual"]').boundingBox();
        const cover = await page.locator('[data-testid="hero-cover-art"]').boundingBox();
        checked++;
        if (intersects(logo, cover)) {
          overlaps.push({ w, h, logo, cover });
        }
      } catch (err) {
        errors.push({ w, h, error: String(err) });
      }
    }
  }

  await browser.close();

  if (errors.length > 0) {
    console.log(`${errors.length} combinations errored (not measured):`);
    for (const e of errors) console.log(JSON.stringify(e));
  }

  console.log(`Checked ${checked} width/height combinations.`);
  if (overlaps.length === 0) {
    console.log("NO OVERLAP detected at any tested size.");
  } else {
    console.log(`OVERLAP detected at ${overlaps.length} combinations:`);
    for (const o of overlaps) {
      console.log(JSON.stringify(o));
    }
  }
}

main();
