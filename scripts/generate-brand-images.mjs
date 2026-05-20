/**
 * Generates brand images for EXPERT:
 *   - app/icon.png          (512x512)  — browser favicon / Next.js app icon
 *   - app/apple-icon.png    (180x180)  — Apple touch icon
 *   - public/branding/expert-app.png (512x512) — PWA manifest icon (maskable-safe zone)
 *   - public/og-image.png   (1200x630) — default Open Graph / social sharing image
 */

import sharp from 'sharp';
import { readFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const DARK_BLUE = { r: 13, g: 27, b: 42, alpha: 1 };   // #0D1B2A
const GOLD     = { r: 212, g: 160, b: 23, alpha: 1 };  // #D4A017
// logo_expert_new.png has a proper transparent background → use for icons.
// logo_expert_dark.png has a white RGB background → used for the OG text card.
const LOGO_SRC      = join(root, 'public', 'logo_expert_new.png');
const LOGO_DARK_SRC = join(root, 'public', 'logo_expert_dark.png');

// ── helpers ──────────────────────────────────────────────────────────────────

function solidBackground(width, height, color) {
  return sharp({
    create: { width, height, channels: 3, background: { r: color.r, g: color.g, b: color.b } }
  }).png();
}

async function logoOnBackground(logoSize, canvasW, canvasH, padPct = 0.12) {
  const pad = Math.round(Math.min(canvasW, canvasH) * padPct);
  const maxLogo = logoSize - pad * 2;

  // logo_expert_new.png has proper RGBA transparency — composite directly onto dark blue
  const logoResized = await sharp(LOGO_SRC)
    .resize(maxLogo, maxLogo, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  const meta = await sharp(logoResized).metadata();
  const left = Math.round((canvasW - meta.width) / 2);
  const top  = Math.round((canvasH - meta.height) / 2);

  const bg = await solidBackground(canvasW, canvasH, DARK_BLUE).toBuffer();

  return sharp(bg)
    .composite([{ input: logoResized, left, top, blend: 'over' }])
    .png();
}

// ── 1. app/icon.png  (512×512) ───────────────────────────────────────────────
async function generateAppIcon() {
  const out = join(root, 'app', 'icon.png');
  await (await logoOnBackground(512, 512, 512, 0.10)).toFile(out);
  console.log('✓ app/icon.png');
}

// ── 2. app/apple-icon.png  (180×180) ─────────────────────────────────────────
async function generateAppleIcon() {
  const out = join(root, 'app', 'apple-icon.png');
  await (await logoOnBackground(180, 180, 180, 0.10)).toFile(out);
  console.log('✓ app/apple-icon.png');
}

// ── 3. public/branding/expert-app.png  (512×512, maskable safe zone) ─────────
async function generatePwaIcon() {
  mkdirSync(join(root, 'public', 'branding'), { recursive: true });
  const out = join(root, 'public', 'branding', 'expert-app.png');
  // maskable icons need ~20 % safe-zone padding on each side
  await (await logoOnBackground(512, 512, 512, 0.20)).toFile(out);
  console.log('✓ public/branding/expert-app.png');
}

// ── 4. public/og-image.png  (1200×630) ───────────────────────────────────────
async function generateOgImage() {
  const W = 1200, H = 630;
  const LOGO_H = 300;   // logo area height on the left column

  // logo_expert_new.png has proper RGBA — composite directly on dark blue
  const logoResized = await sharp(LOGO_SRC)
    .resize(360, LOGO_H, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  const lMeta = await sharp(logoResized).metadata();

  // Gold horizontal rule (1100 x 2 px)
  const rule = await sharp({
    create: { width: 900, height: 2, channels: 4, background: GOLD }
  }).png().toBuffer();

  // Gold left accent bar (4 x 220 px)
  const bar = await sharp({
    create: { width: 4, height: 220, channels: 4, background: GOLD }
  }).png().toBuffer();

  const bg = await solidBackground(W, H, DARK_BLUE).toBuffer();

  // Text rendered as SVG overlay (right column)
  const textSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <!-- Right-column labels -->
  <text x="530" y="195" font-family="Georgia,serif" font-size="72" font-weight="700"
        fill="#F8F6F1" letter-spacing="6">EXPERT</text>
  <text x="530" y="255" font-family="Arial,sans-serif" font-size="24" font-weight="400"
        fill="#D4A017" letter-spacing="3">ASESORÍA FISCAL Y LEGAL</text>
  <text x="534" y="330" font-family="Arial,sans-serif" font-size="18"
        fill="#9CA3AF">expertconsulting.es</text>
  <!-- Bottom tagline -->
  <text x="530" y="490" font-family="Georgia,serif" font-size="28" font-style="italic"
        fill="#F8F6F1">Tu gestión, con criterio.</text>
</svg>`;

  const textBuf = Buffer.from(textSvg);

  const logoLeft = 70;
  const logoTop  = Math.round((H - lMeta.height) / 2);

  await sharp(bg)
    .composite([
      // logo on the left
      { input: logoResized, left: logoLeft, top: logoTop },
      // gold vertical separator
      { input: bar, left: 490, top: Math.round((H - 220) / 2) },
      // horizontal rule below title
      { input: rule, left: 530, top: 280 },
      // text SVG
      { input: textBuf, left: 0, top: 0 },
    ])
    .png()
    .toFile(join(root, 'public', 'og-image.png'));

  console.log('✓ public/og-image.png');
}

// ── run ───────────────────────────────────────────────────────────────────────
(async () => {
  try {
    await Promise.all([
      generateAppIcon(),
      generateAppleIcon(),
      generatePwaIcon(),
      generateOgImage(),
    ]);
    console.log('\nAll brand images generated successfully.');
  } catch (e) {
    console.error('Error:', e);
    process.exit(1);
  }
})();
