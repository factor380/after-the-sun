import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import toIco from "to-ico";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const svg = readFileSync(join(root, "public/favicon.svg"));

async function png(size) {
  return sharp(svg).resize(size, size).png().toBuffer();
}

const [icon16, icon32, icon180] = await Promise.all([png(16), png(32), png(180)]);

const faviconIco = await toIco([icon16, icon32]);

writeFileSync(join(root, "src/app/favicon.ico"), faviconIco);
writeFileSync(join(root, "src/app/icon.png"), icon32);
writeFileSync(join(root, "src/app/apple-icon.png"), icon180);
writeFileSync(join(root, "public/apple-touch-icon.png"), icon180);
writeFileSync(join(root, "public/favicon-32x32.png"), icon32);
writeFileSync(join(root, "public/favicon-16x16.png"), icon16);

console.log("Generated app icons and public PNG fallbacks");
