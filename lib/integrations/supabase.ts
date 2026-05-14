import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';

function getSupabaseUrl() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is required');
  }
  return url;
}

function getSupabaseAnonKey() {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key) {
    throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is required');
  }
  return key;
}

function getSupabaseServiceRoleKey() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required');
  }
  return key;
}

export function getSupabaseAdmin() {
  return createClient(getSupabaseUrl(), getSupabaseServiceRoleKey());
}

export function createBrowserSupabaseClient() {
  return createClient(getSupabaseUrl(), getSupabaseAnonKey());
}

export function createServerSupabaseClient(request: NextRequest) {
  // response is used only to propagate refreshed session cookies back to the browser
  const response = NextResponse.next({ request: { headers: request.headers } });
  const client = createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) =>
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        )
    }
  });
  return client;
}

export async function getFirstAdminProfileId() {
  const supabaseAdmin = getSupabaseAdmin();
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('role', 'admin')
    .limit(1)
    .maybeSingle();

  if (error || !data?.id) {
    return null;
  }

  return data.id;
}
