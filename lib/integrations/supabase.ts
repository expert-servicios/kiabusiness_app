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

/**
 * IMP-014: Contexto de tenant para route handlers autenticados.
 * Devuelve user_id + tenant_id del usuario autenticado.
 * tenant_id es null para usuarios legacy EXPERT sin tenant asignado.
 */
export async function getTenantContext(request: NextRequest): Promise<{
  userId: string | null;
  tenantId: string | null;
}> {
  const supabase = createServerSupabaseClient(request);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { userId: null, tenantId: null };

  const admin = getSupabaseAdmin();
  const { data: profile } = await admin
    .from('profiles')
    .select('tenant_id')
    .eq('id', user.id)
    .maybeSingle();

  return {
    userId: user.id,
    tenantId: profile?.tenant_id ?? null,
  };
}

/**
 * Paginates auth.admin.listUsers until all users are fetched.
 * Replaces listUsers({ perPage: 1000 }) which silently truncates at 1000.
 */
export async function listAllAuthUsers(): Promise<Array<{ id: string; email?: string; user_metadata?: Record<string, unknown> }>> {
  const admin = getSupabaseAdmin();
  const all: Array<{ id: string; email?: string; user_metadata?: Record<string, unknown> }> = [];
  let page = 1;
  const PER_PAGE = 1000;

  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: PER_PAGE });
    if (error || !data?.users?.length) break;
    all.push(...(data.users as typeof all));
    if (data.users.length < PER_PAGE) break;
    page++;
  }

  return all;
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
