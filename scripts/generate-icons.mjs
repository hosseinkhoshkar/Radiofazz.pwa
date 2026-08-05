import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const SOURCE = path.resolve("public/logo-faaz.png");
const ICONS_DIR = path.resolve("public/icons");

async function main() {
  await mkdir(ICONS_DIR, { recursive: true });

  await sharp(SOURCE).resize(192, 192).png().toFile(path.join(ICONS_DIR, "icon-192.png"));
  await sharp(SOURCE).resize(512, 512).png().toFile(path.join(ICONS_DIR, "icon-512.png"));

  // Maskable icon: logo padded to ~80% of a safe zone so OS masks don't clip it.
  const maskableSize = 512;
  const logoSize = Math.round(maskableSize * 0.7);
  const resizedLogo = await sharp(SOURCE).resize(logoSize, logoSize).toBuffer();
  await sharp({
    create: {
      width: maskableSize,
      height: maskableSize,
      channels: 4,
      background: { r: 5, g: 1, b: 15, alpha: 1 },
    },
  })
    .composite([{ input: resizedLogo, gravity: "center" }])
    .png()
    .toFile(path.join(ICONS_DIR, "icon-maskable.png"));

  await sharp(SOURCE).resize(32, 32).png().toFile(path.resolve("app/icon.png"));
  await sharp(SOURCE).resize(180, 180).png().toFile(path.resolve("app/apple-icon.png"));

  console.log("Icons generated from", SOURCE);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
