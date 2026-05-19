'use client';

import { useEffect, useState } from 'react';
import { Users, UserPlus, Shield, User, Briefcase, Trash2, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

const ROLES = [
  { value: 'admin', label: 'Administrador', color: 'text-[#c88b25] bg-[#d7a33a]/10 border-[#d7a33a]/30' },
  { value: 'collaborator', label: 'Colaborador', color: 'text-blue-700 bg-blue-50 border-blue-200' },
  { value: 'client', label: 'Cliente', color: 'text-[#29384a] bg-[#f8f4eb] border-[#d8cbb5]' }
];

const ROLE_ICONS: Record<string, React.ElementType> = {
  admin: Shield,
  collaborator: Briefcase,
  client: User
};

interface Member {
  id: string;
  email: string | undefined;
  full_name: string | null;
  role: string | null;
  provider: string;
  created_at: string;
}

function RoleBadge({ role }: { role: string | null }) {
  const r = ROLES.find((x) => x.value === (role ?? 'client')) ?? ROLES[2];
  const Icon = ROLE_ICONS[role ?? 'client'] ?? User;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${r.color}`}>
      <Icon className="h-3 w-3" />
      {r.label}
    </span>
  );
}

export default function AdminEquipoPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('collaborator');
  const [inviting, setInviting] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/team');
      const data = await res.json();
      setMembers(data.members ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleRoleChange = async (userId: string, role: string) => {
    setUpdatingId(userId);
    try {
      await fetch('/api/admin/team', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role })
      });
      setMembers((prev) => prev.map((m) => m.id === userId ? { ...m, role } : m));
    } finally {
      setUpdatingId(null);
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail) return;
    setInviting(true);
    setMsg(null);
    try {
      const res = await fetch('/api/admin/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole })
      });
      const data = await res.json();
      if (!res.ok) { setMsg({ text: data.error ?? 'Error al invitar', ok: false }); return; }
      setMsg({ text: `Invitación enviada a ${inviteEmail}`, ok: true });
      setInviteEmail('');
      await load();
    } catch {
      setMsg({ text: 'Error de conexión', ok: false });
    } finally {
      setInviting(false);
    }
  };

  const adminsAndCollabs = members.filter((m) => m.role === 'admin' || m.role === 'collaborator');
  const clients = members.filter((m) => !m.role || m.role === 'client');

  return (
    <main className="min-h-screen bg-[#f8f4eb] py-10">
      <div className="mx-auto max-w-4xl space-y-6 px-6">

        <div className="flex items-center gap-3">
          <Users className="h-5 w-5 text-[#c88b25]" />
          <div>
            <h1 className="font-serif text-2xl font-bold text-[#07111d]">Equipo y accesos</h1>
            <p className="text-sm text-[#29384a]">Gestiona usuarios, roles y colaboradores</p>
          </div>
        </div>

        {/* Invite */}
        <div className="rounded-2xl border border-[#d8cbb5] bg-white p-6">
          <div className="mb-4 flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-[#c88b25]" />
            <p className="text-xs font-bold uppercase tracking-widest text-[#c88b25]">Invitar usuario</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="correo@ejemplo.com"
              className="flex-1 rounded-xl border border-[#d8cbb5] px-4 py-2.5 text-sm text-[#07111d] outline-none focus:border-[#c88b25]"
            />
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              className="rounded-xl border border-[#d8cbb5] px-3 py-2.5 text-sm text-[#07111d] outline-none focus:border-[#c88b25]"
            >
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleInvite}
              disabled={inviting || !inviteEmail}
              className="inline-flex items-center gap-2 rounded-xl bg-[#d7a33a] px-5 py-2.5 text-sm font-bold text-[#061321] transition hover:bg-[#f0bf54] disabled:opacity-50"
            >
              {inviting ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
              Invitar
            </button>
          </div>
          {msg && (
            <p className={`mt-3 flex items-center gap-1.5 text-sm ${msg.ok ? 'text-green-700' : 'text-red-600'}`}>
              {msg.ok ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              {msg.text}
            </p>
          )}
          <p className="mt-2 text-[10px] text-[#29384a]">
            El usuario recibirá un email para establecer su contraseña y acceder a la plataforma.
          </p>
        </div>

        {/* Team (admins + collaborators) */}
        <div className="rounded-2xl border border-[#d8cbb5] bg-white p-6">
          <p className="mb-4 text-xs font-bold uppercase tracking-widest text-[#c88b25]">
            Equipo interno ({adminsAndCollabs.length})
          </p>
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-[#29384a]">
              <Loader2 className="h-4 w-4 animate-spin" /> Cargando...
            </div>
          ) : adminsAndCollabs.length === 0 ? (
            <p className="text-sm text-[#29384a]">No hay administradores ni colaboradores.</p>
          ) : (
            <div className="space-y-2">
              {adminsAndCollabs.map((m) => (
                <MemberRow key={m.id} member={m} onRoleChange={handleRoleChange} updatingId={updatingId} />
              ))}
            </div>
          )}
        </div>

        {/* Clients */}
        <div className="rounded-2xl border border-[#d8cbb5] bg-white p-6">
          <p className="mb-4 text-xs font-bold uppercase tracking-widest text-[#29384a]">
            Clientes registrados ({clients.length})
          </p>
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-[#29384a]">
              <Loader2 className="h-4 w-4 animate-spin" /> Cargando...
            </div>
          ) : clients.length === 0 ? (
            <p className="text-sm text-[#29384a]">No hay clientes registrados.</p>
          ) : (
            <div className="space-y-2">
              {clients.map((m) => (
                <MemberRow key={m.id} member={m} onRoleChange={handleRoleChange} updatingId={updatingId} />
              ))}
            </div>
          )}
        </div>

      </div>
    </main>
  );
}

function MemberRow({
  member,
  onRoleChange,
  updatingId
}: {
  member: Member;
  onRoleChange: (id: string, role: string) => void;
  updatingId: string | null;
}) {
  const initials = (member.full_name ?? member.email ?? '?').charAt(0).toUpperCase();
  const isUpdating = updatingId === member.id;

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-[#d8cbb5] bg-[#f8f4eb] p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#c88b25]/15 text-sm font-bold text-[#c88b25]">
          {initials}
        </div>
        <div>
          <p className="text-sm font-semibold text-[#07111d]">{member.full_name ?? '(sin nombre)'}</p>
          <p className="text-xs text-[#29384a]">{member.email}</p>
          <p className="text-[10px] text-[#29384a]/60">
            {member.provider === 'google' ? '· Google' : '· Email'} · Alta {new Date(member.created_at).toLocaleDateString('es-ES')}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {isUpdating
          ? <Loader2 className="h-4 w-4 animate-spin text-[#c88b25]" />
          : <RoleBadge role={member.role} />}
        <select
          value={member.role ?? 'client'}
          onChange={(e) => onRoleChange(member.id, e.target.value)}
          disabled={isUpdating}
          className="rounded-lg border border-[#d8cbb5] bg-white px-2 py-1.5 text-xs text-[#07111d] outline-none focus:border-[#c88b25] disabled:opacity-50"
        >
          {ROLES.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
