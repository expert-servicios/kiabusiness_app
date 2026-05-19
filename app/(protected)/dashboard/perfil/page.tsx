import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getSupabaseAdmin } from '@/lib/integrations/supabase';
import { ProfileForm } from '@/components/profile/ProfileForm';

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  collaborator: 'Colaborador',
  client: 'Cliente'
};

export default async function ProfilePage() {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {}
      }
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: profile } = await getSupabaseAdmin()
    .from('profiles')
    .select('id,role,full_name,phone,whatsapp_number,whatsapp_consent,avatar_url')
    .eq('id', user.id)
    .single();

  const identities = user.identities ?? [];
  const hasGoogle = identities.some((i) => i.provider === 'google');
  const hasEmailPassword = identities.some((i) => i.provider === 'email');
  const role = profile?.role ?? 'client';

  return (
    <main className="min-h-screen bg-[#f8f4eb] py-10">
      <div className="mx-auto max-w-2xl px-6 space-y-6">

        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#29384a] hover:text-[#07111d]"
        >
          <ArrowLeft className="h-4 w-4" /> Volver al panel
        </Link>

        {/* Identity card */}
        <div className="rounded-3xl border border-[#d8cbb5] bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            {/* Avatar initials */}
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#c88b25]/15 text-xl font-bold text-[#c88b25]">
              {(profile?.full_name ?? user.email ?? '?').charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate font-serif text-lg font-bold text-[#07111d]">
                {profile?.full_name ?? '(sin nombre)'}
              </p>
              <p className="truncate text-sm text-[#29384a]">{user.email}</p>
              <span className={`mt-1 inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                role === 'admin'
                  ? 'bg-[#d7a33a]/15 text-[#c88b25]'
                  : role === 'collaborator'
                  ? 'bg-blue-50 text-blue-700'
                  : 'bg-[#f8f4eb] text-[#29384a]'
              }`}>
                {ROLE_LABELS[role] ?? role}
              </span>
            </div>
          </div>

          {/* Connected identity providers */}
          <div className="mt-5 flex flex-wrap gap-2 border-t border-[#f0e8d8] pt-5">
            <p className="w-full text-xs font-semibold uppercase tracking-widest text-[#29384a]">
              Acceso con
            </p>
            {hasGoogle && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#d8cbb5] bg-white px-3 py-1.5 text-xs font-semibold text-[#07111d]">
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Google
              </span>
            )}
            {hasEmailPassword && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#d8cbb5] bg-white px-3 py-1.5 text-xs font-semibold text-[#07111d]">
                ✉ Email + contraseña
              </span>
            )}
            {!hasGoogle && !hasEmailPassword && (
              <span className="text-xs text-[#29384a]">Sin métodos de acceso detectados</span>
            )}
          </div>
        </div>

        {/* Editable profile form */}
        <ProfileForm
          email={user.email ?? ''}
          role={role}
          initialFullName={profile?.full_name ?? ''}
          initialPhone={profile?.phone ?? ''}
          initialWhatsappNumber={profile?.whatsapp_number ?? ''}
          initialWhatsappConsent={profile?.whatsapp_consent ?? false}
          hasEmailPassword={hasEmailPassword}
        />

      </div>
    </main>
  );
}
