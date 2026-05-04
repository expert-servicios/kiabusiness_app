import Link from 'next/link';
import { cookies } from 'next/headers';
import { ArrowLeft, User } from 'lucide-react';
import { ProfileForm } from '@/components/profile/ProfileForm';

interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  whatsapp_number: string | null;
  whatsapp_consent: boolean;
  email: string;
}

async function getProfile(): Promise<Profile | null> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.getAll().map((c) => `${c.name}=${c.value}`).join('; ');
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/profile`, {
    headers: { cookie: cookieHeader },
    cache: 'no-store'
  });
  if (!response.ok) return null;
  const data = await response.json();
  return data.profile as Profile;
}

export default async function ProfilePage() {
  const profile = await getProfile();

  return (
    <main className="min-h-screen bg-[#f8f4eb] py-12">
      <div className="mx-auto max-w-2xl px-6">
        <div className="mb-8 flex items-center gap-3 text-sm font-semibold text-[#061321]">
          <ArrowLeft className="h-4 w-4" />
          <Link href="/dashboard" className="underline underline-offset-4">Volver a mi panel</Link>
        </div>

        <div className="rounded-3xl border border-[#d8cbb5] bg-white p-8 shadow-lg">
          <div className="mb-8 flex items-center gap-4">
            <div className="rounded-2xl bg-[#c88b25]/10 p-4 text-[#c88b25]">
              <User className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm uppercase tracking-[0.28em] text-[#c88b25]">Mi cuenta</p>
              <h1 className="mt-1 font-serif text-2xl font-bold text-[#07111d]">Mi perfil</h1>
            </div>
          </div>

          {profile ? (
            <ProfileForm
              initialFullName={profile.full_name ?? ''}
              initialPhone={profile.phone ?? ''}
              initialWhatsappNumber={profile.whatsapp_number ?? ''}
              initialWhatsappConsent={profile.whatsapp_consent}
              email={profile.email}
            />
          ) : (
            <p className="text-sm text-[#29384a]">No se pudo cargar el perfil. Inténtalo de nuevo.</p>
          )}
        </div>
      </div>
    </main>
  );
}
