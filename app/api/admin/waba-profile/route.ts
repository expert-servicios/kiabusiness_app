import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';
import { getSupabaseAdmin } from '@/lib/integrations/supabase';

// Admin-only endpoint: update the WhatsApp Business profile picture
// POST /api/admin/waba-profile — no body needed, reads kia_bot.png from public/branding/

export async function POST(request: NextRequest) {
  // Verify admin session
  const admin = getSupabaseAdmin();
  const authHeader = request.headers.get('authorization') ?? '';
  const token = authHeader.replace(/^Bearer /, '');

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: { user }, error: authErr } = await admin.auth.getUser(token);
  if (authErr || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin' && profile?.role !== 'owner') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const waToken       = process.env.META_WHATSAPP_ACCESS_TOKEN?.replace(/^﻿/, '').trim();
  const phoneNumberId = process.env.META_WHATSAPP_PHONE_NUMBER_ID;

  if (!waToken || !phoneNumberId) {
    return NextResponse.json({ error: 'META_WHATSAPP_ACCESS_TOKEN or META_WHATSAPP_PHONE_NUMBER_ID not configured' }, { status: 500 });
  }

  try {
    // Step 1: read the image from disk
    const imgPath = path.join(process.cwd(), 'public', 'branding', 'kia_bot.png');
    const imgBuffer = await readFile(imgPath);

    // Step 2: upload to Meta as a media object to get a media_id
    const uploadForm = new FormData();
    uploadForm.append('messaging_product', 'whatsapp');
    uploadForm.append('type', 'image/png');
    uploadForm.append('file', new Blob([imgBuffer], { type: 'image/png' }), 'kia_bot.png');

    const uploadRes = await fetch(
      `https://graph.facebook.com/v20.0/${phoneNumberId}/media`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${waToken}` },
        body: uploadForm,
      },
    );
    const uploadData = await uploadRes.json() as { id?: string; error?: { message: string } };

    if (!uploadRes.ok || !uploadData.id) {
      console.error('[waba-profile] upload error:', uploadData);
      return NextResponse.json(
        { error: 'Error uploading image to Meta', detail: uploadData.error?.message },
        { status: 500 },
      );
    }

    const mediaId = uploadData.id;

    // Step 3: set as profile picture
    const profileRes = await fetch(
      `https://graph.facebook.com/v20.0/${phoneNumberId}/whatsapp_business_profile`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${waToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          profile_picture_handle: mediaId,
        }),
      },
    );
    const profileData = await profileRes.json() as { success?: boolean; error?: { message: string } };

    if (!profileRes.ok) {
      console.error('[waba-profile] set error:', profileData);
      return NextResponse.json(
        { error: 'Error setting profile picture', detail: profileData.error?.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, mediaId });
  } catch (err) {
    console.error('[waba-profile] error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
