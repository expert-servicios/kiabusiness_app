/**
 * One-time script: upload kia_bot.png as the WhatsApp Business profile picture.
 * Run: node scripts/update-waba-avatar.mjs
 * Requires META_WHATSAPP_ACCESS_TOKEN + META_WHATSAPP_PHONE_NUMBER_ID +
 *           META_APP_ID (Facebook App ID) in .env.local
 */

import { readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Load .env.local ───────────────────────────────────────────────────────────
const envPath = path.join(__dirname, '..', '.env.local');
const envRaw  = await readFile(envPath, 'utf8').catch(() => '');
const env = Object.fromEntries(
  envRaw.split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => { const [k, ...v] = l.split('='); return [k.trim(), v.join('=').trim()]; })
);

const token         = (env.META_WHATSAPP_ACCESS_TOKEN ?? '').replace(/^﻿/, '').trim();
const phoneNumberId = (env.META_WHATSAPP_PHONE_NUMBER_ID ?? '').trim();
const appId         = (env.META_APP_ID ?? '').trim();

if (!token || !phoneNumberId) {
  console.error('❌ Missing META_WHATSAPP_ACCESS_TOKEN or META_WHATSAPP_PHONE_NUMBER_ID in .env.local');
  process.exit(1);
}

// ── Load image ────────────────────────────────────────────────────────────────
const imgPath   = path.join(__dirname, '..', 'public', 'branding', 'kia_bot.png');
const imgBuffer = await readFile(imgPath);
console.log(`✅ Image loaded: ${(imgBuffer.length / 1024).toFixed(0)} KB`);

// ── Strategy A: Resumable Upload API (requires META_APP_ID) ──────────────────

if (appId) {
  console.log('\n📤 Strategy A: Resumable Upload API...');

  // Step 1: Create upload session
  const sessionRes = await fetch(
    `https://graph.facebook.com/v20.0/${appId}/uploads?file_name=kia_bot.png&file_length=${imgBuffer.length}&file_type=image%2Fpng&access_token=${token}`,
    { method: 'POST' },
  );
  const sessionData = await sessionRes.json();

  if (!sessionRes.ok || !sessionData.id) {
    console.error('❌ Could not create upload session:', JSON.stringify(sessionData, null, 2));
    console.log('\nFalling back to Strategy B...\n');
  } else {
    const uploadSessionId = sessionData.id;
    console.log(`✅ Upload session: ${uploadSessionId}`);

    // Step 2: Upload the file
    const uploadRes = await fetch(
      `https://graph.facebook.com/${uploadSessionId}`,
      {
        method : 'POST',
        headers: {
          Authorization     : `OAuth ${token}`,
          file_offset       : '0',
          'Content-Type'    : 'image/png',
        },
        body: imgBuffer,
      },
    );
    const uploadData = await uploadRes.json();

    if (!uploadRes.ok || !uploadData.h) {
      console.error('❌ Upload failed:', JSON.stringify(uploadData, null, 2));
    } else {
      const handle = uploadData.h;
      console.log(`✅ File handle: ${handle}`);

      // Step 3: Set profile picture
      const profileRes = await fetch(
        `https://graph.facebook.com/v20.0/${phoneNumberId}/whatsapp_business_profile`,
        {
          method : 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body   : JSON.stringify({ messaging_product: 'whatsapp', profile_picture_handle: handle }),
        },
      );
      const profileData = await profileRes.json();

      if (profileRes.ok && profileData.success) {
        console.log('\n🎉 WABA profile picture updated successfully via Resumable Upload!');
        process.exit(0);
      }
      console.error('❌ Set profile error:', JSON.stringify(profileData, null, 2));
    }
  }
}

// ── Strategy B: Multipart form POST to business profile ──────────────────────

console.log('\n📤 Strategy B: Multipart form POST...');
const form = new FormData();
form.append('messaging_product', 'whatsapp');
form.append('profile_picture', new Blob([imgBuffer], { type: 'image/png' }), 'kia_bot.png');

const profileRes = await fetch(
  `https://graph.facebook.com/v20.0/${phoneNumberId}/whatsapp_business_profile`,
  {
    method : 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body   : form,
  },
);
const profileData = await profileRes.json();

if (profileRes.ok && profileData.success) {
  console.log('\n🎉 WABA profile picture updated successfully via multipart POST!');
  process.exit(0);
}

console.error('❌ Strategy B failed:', JSON.stringify(profileData, null, 2));

// ── Manual fallback ───────────────────────────────────────────────────────────
console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️  API update failed. Manual steps to update the avatar:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Go to: https://business.facebook.com/
2. Select your business → WhatsApp Manager
3. Find your phone number → Settings → Profile
4. Upload the image: public/branding/kia_bot.png
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Alternatively, add META_APP_ID to .env.local and re-run this script.
`);
process.exit(1);
