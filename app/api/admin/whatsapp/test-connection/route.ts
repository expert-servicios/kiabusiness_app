import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';

export async function GET(request: NextRequest) {
  // Admin only
  const supabase = createServerSupabaseClient(request);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const admin = getSupabaseAdmin();
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const token         = process.env.META_WHATSAPP_ACCESS_TOKEN?.replace(/^﻿/, '').trim();
  const phoneNumberId = process.env.META_WHATSAPP_PHONE_NUMBER_ID;
  const wabaId        = process.env.META_WHATSAPP_BUSINESS_ACCOUNT_ID;

  if (!token || !phoneNumberId) {
    return NextResponse.json({
      ok: false,
      issue: 'missing_env',
      missing: [...(!token ? ['META_WHATSAPP_ACCESS_TOKEN'] : []), ...(!phoneNumberId ? ['META_WHATSAPP_PHONE_NUMBER_ID'] : [])],
    });
  }

  // 1. Check token validity via /me
  const meRes  = await fetch(`https://graph.facebook.com/v20.0/me?access_token=${token}`);
  const meData = await meRes.json();

  // 2. Check phone number status
  const phoneRes  = await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}?fields=display_phone_number,verified_name,quality_rating,status,name_status&access_token=${token}`);
  const phoneData = await phoneRes.json();

  // 3. Check WABA status if configured
  let wabaData: unknown = null;
  if (wabaId) {
    const wabaRes = await fetch(`https://graph.facebook.com/v20.0/${wabaId}?fields=name,status,on_behalf_of_business_info&access_token=${token}`);
    wabaData = await wabaRes.json();
  }

  const tokenOk  = meRes.ok && !meData.error;
  const phoneOk  = phoneRes.ok && !phoneData.error;

  return NextResponse.json({
    ok: tokenOk && phoneOk,
    token: {
      valid: tokenOk,
      identity: tokenOk ? meData : null,
      error: meData?.error ?? null,
    },
    phoneNumber: {
      ok: phoneOk,
      data: phoneOk ? {
        number:         phoneData.display_phone_number,
        verified_name:  phoneData.verified_name,
        quality_rating: phoneData.quality_rating,
        status:         phoneData.status,
        name_status:    phoneData.name_status,
      } : null,
      error: phoneData?.error ?? null,
    },
    waba: wabaData,
    env: {
      hasToken:         !!token,
      hasPhoneId:       !!phoneNumberId,
      hasWabaId:        !!wabaId,
      tokenPrefix:      token ? `${token.slice(0, 8)}…` : null,
      phoneNumberId,
    },
  });
}
