/**
 * Generates brand images for EXPERT:
 *   - app/icon.png                     (512x512)  — browser favicon / Next.js app icon
 *   - app/apple-icon.png               (180x180)  — Apple touch icon
 *   - public/branding/expert-app.png   (512x512)  — PWA manifest icon (maskable safe zone)
 *   - public/branding/expert-app-192.png (192x192) — PWA manifest icon (any)
 *   - public/og-image.png              (1200x630) — default Open Graph / social sharing image
 *
 * Source logo: public/logos/EXPERT_logo/expert-logo-light-clean.png
 *   → 1254×1254, RGBA, transparent background, light-colored mark
 *   → composites cleanly on the dark navy (#0D1B2A) background
 */

import sharp from 'sharp';
import { mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const DARK_BLUE = { r: 13, g: 27, b: 42 };   // #0D1B2A
const GOLD      = { r: 212, g: 160, b: 23 };  // #D4A017

const LOGO_SRC = join(root, 'public', 'logos', 'EXPERT_logo', 'expert-logo-light-clean.png');

// ── helpers ──────────────────────────────────────────────────────────────────

function solidBg(w, h) {
  return sharp({
    create: { width: w, height: h, channels: 3, background: DARK_BLUE }
  }).png();
}

async function logoOnBg(canvasW, canvasH, padPct = 0.12) {
  const pad = Math.round(Math.min(canvasW, canvasH) * padPct);
  const maxLogo = Math.min(canvasW, canvasH) - pad * 2;

  const logoResized = await sharp(LOGO_SRC)
    .resize(maxLogo, maxLogo, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  const meta = await sharp(logoResized).metadata();
  const left = Math.round((canvasW - meta.width) / 2);
  const top  = Math.round((canvasH - meta.height) / 2);

  const bg = await solidBg(canvasW, canvasH).toBuffer();

  return sharp(bg)
    .composite([{ input: logoResized, left, top, blend: 'over' }])
    .png();
}

// ── 1. app/icon.png  (512×512) ───────────────────────────────────────────────
async function generateAppIcon() {
  await (await logoOnBg(512, 512, 0.10)).toFile(join(root, 'app', 'icon.png'));
  console.log('✓ app/icon.png');
}

// ── 2. app/apple-icon.png  (180×180) ─────────────────────────────────────────
async function generateAppleIcon() {
  await (await logoOnBg(180, 180, 0.10)).toFile(join(root, 'app', 'apple-icon.png'));
  console.log('✓ app/apple-icon.png');
}

// ── 3. public/branding/expert-app.png  (512×512, maskable safe zone ≥20%) ───
async function generatePwaIcon512() {
  mkdirSync(join(root, 'public', 'branding'), { recursive: true });
  await (await logoOnBg(512, 512, 0.20)).toFile(join(root, 'public', 'branding', 'expert-app.png'));
  console.log('✓ public/branding/expert-app.png');
}

// ── 4. public/branding/expert-app-192.png  (192×192, any purpose) ────────────
async function generatePwaIcon192() {
  mkdirSync(join(root, 'public', 'branding'), { recursive: true });
  await (await logoOnBg(192, 192, 0.12)).toFile(join(root, 'public', 'branding', 'expert-app-192.png'));
  console.log('✓ public/branding/expert-app-192.png');
}

// ── 5. public/og-image.png  (1200×630) ───────────────────────────────────────
async function generateOgImage() {
  const W = 1200, H = 630;

  const logoResized = await sharp(LOGO_SRC)
    .resize(340, 340, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  const lMeta = await sharp(logoResized).metadata();

  const rule = await sharp({
    create: { width: 900, height: 2, channels: 4, background: { ...GOLD, alpha: 1 } }
  }).png().toBuffer();

  const bar = await sharp({
    create: { width: 4, height: 220, channels: 4, background: { ...GOLD, alpha: 1 } }
  }).png().toBuffer();

  const bg = await solidBg(W, H).toBuffer();

  const textSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <text x="530" y="200" font-family="Georgia,serif" font-size="72" font-weight="700"
        fill="#F8F6F1" letter-spacing="6">EXPERT</text>
  <text x="530" y="258" font-family="Arial,sans-serif" font-size="24" font-weight="400"
        fill="#D4A017" letter-spacing="3">ASESORÍA FISCAL Y LEGAL</text>
  <text x="534" y="330" font-family="Arial,sans-serif" font-size="18"
        fill="#9CA3AF">expertconsulting.es</text>
  <text x="530" y="490" font-family="Georgia,serif" font-size="28" font-style="italic"
        fill="#F8F6F1">Tu gestión, con criterio.</text>
</svg>`;

  const logoLeft = 60;
  const logoTop  = Math.round((H - lMeta.height) / 2);

  await sharp(bg)
    .composite([
      { input: logoResized, left: logoLeft, top: logoTop },
      { input: bar, left: 480, top: Math.round((H - 220) / 2) },
      { input: rule, left: 530, top: 282 },
      { input: Buffer.from(textSvg), left: 0, top: 0 },
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
      generatePwaIcon512(),
      generatePwaIcon192(),
      generateOgImage(),
    ]);
    console.log('\nAll brand images generated successfully.');
  } catch (e) {
    console.error('Error:', e);
    process.exit(1);
  }
})();
