import Link from 'next/link';
import { cookies } from 'next/headers';
import { Users, FileText, FolderOpen, MessageCircle } from 'lucide-react';
import { UserRoleSelect } from '@/components/admin/UserRoleSelect';

interface AdminUser {
  id: string;
  full_name: string | null;
  email: string;
  phone: string | null;
  whatsapp_number: string | null;
  whatsapp_consent: boolean;
  role: string;
  created_at: string;
  totalQuotes: number;
  totalCases: number;
  activeCases: number;
}

async function getUsers(): Promise<AdminUser[]> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.getAll().map((c) => `${c.name}=${c.value}`).join('; ');
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/admin/users`, {
    headers: { cookie: cookieHeader },
    cache: 'no-store'
  });
  if (!response.ok) return [];
  const data = await response.json();
  return data.users as AdminUser[];
}

export default async function AdminUsersPage() {
  const users = await getUsers();
  const admins = users.filter((u) => u.role === 'admin');
  const clients = users.filter((u) => u.role === 'client');

  return (
    <main className="min-h-screen bg-[#f8f4eb] py-12">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-8 flex items-center gap-3 text-sm font-semibold text-[#061321]">
          <Users className="h-4 w-4" />
          <Link href="/admin" className="underline underline-offset-4">Volver al panel</Link>
        </div>

        <div className="rounded-3xl border border-[#d8cbb5] bg-white p-8 shadow-lg">
          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.28em] text-[#c88b25]">Gestión de accesos</p>
              <h1 className="mt-3 font-serif text-3xl font-bold text-[#07111d]">Usuarios</h1>
            </div>
            <div className="flex gap-6 text-sm text-[#29384a]">
              <span><strong className="font-serif text-2xl text-[#07111d]">{clients.length}</strong> clientes</span>
              <span><strong className="font-serif text-2xl text-[#07111d]">{admins.length}</strong> admins</span>
            </div>
          </div>

          {users.length === 0 ? (
            <div className="rounded-3xl border border-[#d8cbb5] bg-[#f8f4eb] p-10 text-center text-[#29384a]">
              No hay usuarios registrados todavía.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#d8cbb5] text-left text-xs font-semibold uppercase tracking-[0.15em] text-[#29384a]">
                    <th className="pb-3 pr-4">Usuario</th>
                    <th className="pb-3 pr-4">Contacto</th>
                    <th className="pb-3 pr-4 text-center">Presupuestos</th>
                    <th className="pb-3 pr-4 text-center">Expedientes</th>
                    <th className="pb-3 pr-4">WhatsApp</th>
                    <th className="pb-3 pr-4">Alta</th>
                    <th className="pb-3">Rol</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-[#f8f4eb] hover:bg-[#f8f4eb]/60">
                      <td className="py-3 pr-4">
                        <p className="font-semibold text-[#07111d]">
                          {user.full_name ?? <span className="text-[#29384a] italic">Sin nombre</span>}
                        </p>
                        <p className="text-xs text-[#29384a]">{user.email}</p>
                      </td>
                      <td className="py-3 pr-4 text-xs text-[#29384a]">
                        {user.phone ?? '—'}
                      </td>
                      <td className="py-3 pr-4 text-center">
                        <span className="inline-flex items-center gap-1 text-xs text-[#07111d]">
                          <FileText className="h-3 w-3 text-[#d7a33a]" />
                          {user.totalQuotes}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-center">
                        <span className="inline-flex items-center gap-1 text-xs text-[#07111d]">
                          <FolderOpen className="h-3 w-3 text-[#1fae4b]" />
                          {user.activeCases}<span className="text-[#29384a]">/{user.totalCases}</span>
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        {user.whatsapp_number ? (
                          <span className="inline-flex items-center gap-1 text-xs text-[#29384a]">
                            <MessageCircle className="h-3 w-3 text-[#25D366]" />
                            {user.whatsapp_consent ? 'Sí' : 'Sin consentimiento'}
                          </span>
                        ) : (
                          <span className="text-xs text-[#29384a]">—</span>
                        )}
                      </td>
                      <td className="py-3 pr-4 text-xs text-[#29384a]">
                        {new Date(user.created_at).toLocaleDateString('es-ES')}
                      </td>
                      <td className="py-3">
                        <UserRoleSelect userId={user.id} currentRole={user.role} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
