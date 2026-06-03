import Link from 'next/link';
import { cookies } from 'next/headers';
import { Mail } from 'lucide-react';
import { absoluteAppUrl } from '@/lib/utils/app-url';
import { EmailsPageClient } from '@/components/admin/EmailsPageClient';

interface EmailEvent {
  id: number;
  event_type: string;
  recipient_email: string;
  subject: string;
  status: string;
  created_at: string;
}

async function getEmailEvents(): Promise<EmailEvent[]> {
  try {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.getAll().map((c) => `${c.name}=${c.value}`).join('; ');
    const response = await fetch(absoluteAppUrl('/api/admin/emails'), {
      headers: { cookie: cookieHeader },
      cache: 'no-store',
    });
    if (!response.ok) return [];
    const data = await response.json();
    return data.events as EmailEvent[];
  } catch {
    return [];
  }
}

export default async function AdminEmailsPage() {
  const events = await getEmailEvents();

  return (
    <main className="min-h-screen bg-[#f8f4eb] py-8">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-6 flex items-center gap-3 text-sm font-semibold text-[#061321]">
          <Mail className="h-4 w-4 text-[#d7a33a]" />
          <Link href="/admin" className="text-xs text-[#29384a] hover:text-[#07111d]">← Panel admin</Link>
        </div>

        <div className="mb-6">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#c88b25]">Comunicaciones</p>
          <h1 className="mt-1 font-serif text-2xl font-bold text-[#07111d]">Emails</h1>
        </div>

        <EmailsPageClient initialEvents={events} />
      </div>
    </main>
  );
}
