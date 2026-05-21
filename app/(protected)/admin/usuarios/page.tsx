import { cookies } from 'next/headers';
import { Users } from 'lucide-react';
import { AdminUsersTable, type AdminUser } from '@/components/admin/AdminUsersTable';
import { absoluteAppUrl } from '@/lib/utils/app-url';

async function getUsers(): Promise<AdminUser[]> {
  try {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.getAll().map((c) => `${c.name}=${c.value}`).join('; ');
    const res = await fetch(absoluteAppUrl('/api/admin/users'), {
      headers: { cookie: cookieHeader },
      cache: 'no-store'
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.users as AdminUser[];
  } catch {
    return [];
  }
}

export default async function AdminUsersPage() {
  const users = await getUsers();

  const admins = users.filter((u) => u.role === 'admin').length;
  const clients = users.filter((u) => u.role === 'client').length;
  const inactive = users.filter((u) => u.status === 'inactive').length;

  return (
    <main className="min-h-screen bg-[#f8f4eb] py-8">
      <div className="mx-auto max-w-7xl px-6">

        {/* Header */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#c88b25]">Gestión de accesos</p>
            <h1 className="mt-1 flex items-center gap-2 font-serif text-2xl font-bold text-[#07111d]">
              <Users className="h-6 w-6 text-[#d7a33a]" /> Usuarios
            </h1>
          </div>
          <div className="flex items-center gap-5 text-sm text-[#29384a]">
            <span><strong className="font-serif text-xl font-bold text-[#07111d]">{clients}</strong> clientes</span>
            <span><strong className="font-serif text-xl font-bold text-[#07111d]">{admins}</strong> admins</span>
            {inactive > 0 && (
              <span className="text-xs text-gray-500"><strong>{inactive}</strong> inactivos</span>
            )}
          </div>
        </div>

        <AdminUsersTable initialUsers={users} />
      </div>
    </main>
  );
}
