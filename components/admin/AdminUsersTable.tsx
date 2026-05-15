'use client';

import { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  Search, Download, Plus, ChevronUp, ChevronDown, ChevronsUpDown,
  MoreHorizontal, Pencil, Building2, UserX, UserCheck, Trash2,
  FileText, FolderOpen, X, Check, AlertCircle, Loader2, ShieldCheck, User
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Company { id: string; razon_social: string; cif_nif: string | null; role: string }
interface AllCompany { id: string; razon_social: string; cif_nif: string | null; forma_juridica: string; ciudad: string | null }

export interface AdminUser {
  id: string;
  full_name: string | null;
  email: string;
  phone: string | null;
  whatsapp_number: string | null;
  whatsapp_consent: boolean;
  role: string;
  status: string | null;
  created_at: string;
  totalQuotes: number;
  totalCases: number;
  activeCases: number;
  companies: Company[];
}

type SortKey = 'full_name' | 'email' | 'created_at' | 'totalCases' | 'totalQuotes' | 'role';
type SortDir = 'asc' | 'desc';
type Modal = null | 'invite' | 'edit' | 'companies' | 'delete';

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(d: string) {
  return new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

function exportCSV(users: AdminUser[]) {
  const header = ['Nombre', 'Email', 'Teléfono', 'Rol', 'Estado', 'Alta', 'Empresas', 'Presupuestos', 'Expedientes (activos/total)'];
  const rows = users.map((u) => [
    u.full_name ?? '',
    u.email,
    u.phone ?? '',
    u.role,
    u.status ?? 'active',
    fmt(u.created_at),
    u.companies.map((c) => c.razon_social).join(' | '),
    String(u.totalQuotes),
    `${u.activeCases}/${u.totalCases}`
  ]);
  const csv = [header, ...rows].map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `usuarios_expert_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function SortBtn({ col, active, dir, onClick }: { col: string; active: boolean; dir: SortDir; onClick: () => void }) {
  const Icon = active ? (dir === 'asc' ? ChevronUp : ChevronDown) : ChevronsUpDown;
  return (
    <button type="button" onClick={onClick} className="inline-flex items-center gap-0.5 hover:text-[#07111d]">
      {col} <Icon className={`h-3 w-3 ${active ? 'text-[#d7a33a]' : 'text-[#9ca3af]'}`} />
    </button>
  );
}

function StatusBadge({ status, role }: { status: string | null; role: string }) {
  if (role === 'admin') return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[#d7a33a]/15 px-2 py-0.5 text-[10px] font-bold text-[#c88b25]">
      <ShieldCheck className="h-2.5 w-2.5" /> Admin
    </span>
  );
  if (status === 'inactive') return (
    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-500">
      Inactivo
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700">
      <span className="h-1.5 w-1.5 rounded-full bg-green-500" /> Activo
    </span>
  );
}

function Toast({ msg, ok }: { msg: string; ok: boolean }) {
  return (
    <div className={`fixed bottom-6 right-6 z-[100] flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold shadow-xl ${ok ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
      {ok ? <Check className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
      {msg}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function AdminUsersTable({ initialUsers }: { initialUsers: AdminUser[] }) {
  const [users, setUsers] = useState<AdminUser[]>(initialUsers);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'admin' | 'client'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortKey, setSortKey] = useState<SortKey>('created_at');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [modal, setModal] = useState<Modal>(null);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  // invite / edit form state
  const [form, setForm] = useState({ email: '', full_name: '', phone: '', mode: 'invite_email' });
  // company assign state
  const [allCompanies, setAllCompanies] = useState<AllCompany[]>([]);
  const [companySearch, setCompanySearch] = useState('');

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const api = useCallback(async (path: string, method: string, body?: object) => {
    const res = await fetch(path, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined
    });
    return res.json();
  }, []);

  // ── Filter + sort ──────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return users
      .filter((u) => {
        const matchSearch = !q || u.email.toLowerCase().includes(q) || (u.full_name ?? '').toLowerCase().includes(q) || u.companies.some((c) => c.razon_social.toLowerCase().includes(q));
        const matchRole = filterRole === 'all' || u.role === filterRole;
        const matchStatus = filterStatus === 'all' || (filterStatus === 'inactive' ? u.status === 'inactive' : u.status !== 'inactive');
        return matchSearch && matchRole && matchStatus;
      })
      .sort((a, b) => {
        let av: string | number = a[sortKey] ?? '';
        let bv: string | number = b[sortKey] ?? '';
        if (typeof av === 'string') av = av.toLowerCase();
        if (typeof bv === 'string') bv = bv.toLowerCase();
        const cmp = av < bv ? -1 : av > bv ? 1 : 0;
        return sortDir === 'asc' ? cmp : -cmp;
      });
  }, [users, search, filterRole, filterStatus, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  // ── Actions ────────────────────────────────────────────────────────────────

  const openEdit = (u: AdminUser) => {
    setSelectedUser(u);
    setForm({ email: u.email, full_name: u.full_name ?? '', phone: u.phone ?? '', mode: 'invite_email' });
    setModal('edit');
    setOpenMenu(null);
  };

  const openCompanies = async (u: AdminUser) => {
    setSelectedUser(u);
    setModal('companies');
    setOpenMenu(null);
    if (allCompanies.length === 0) {
      const data = await api('/api/admin/users/companies', 'GET');
      setAllCompanies(data.companies ?? []);
    }
  };

  const openDelete = (u: AdminUser) => {
    setSelectedUser(u);
    setModal('delete');
    setOpenMenu(null);
  };

  const closeModal = () => { setModal(null); setSelectedUser(null); setCompanySearch(''); };

  // Invite new user
  const handleInvite = async () => {
    if (!form.email) return;
    setLoading(true);
    const res = await api('/api/admin/users/invite', 'POST', {
      email: form.email,
      fullName: form.full_name || undefined,
      phone: form.phone || undefined,
      mode: form.mode
    });
    setLoading(false);
    if (res.ok) {
      showToast(res.isNewUser ? 'Usuario creado correctamente' : 'Perfil actualizado', true);
      // Refresh list
      const fresh = await api('/api/admin/users', 'GET');
      if (fresh.users) setUsers(fresh.users);
      closeModal();
    } else {
      showToast(res.error ?? 'Error al crear usuario', false);
    }
  };

  // Edit profile
  const handleEditSave = async () => {
    if (!selectedUser) return;
    setLoading(true);
    const res = await api('/api/admin/users', 'PATCH', {
      action: 'update_profile',
      userId: selectedUser.id,
      full_name: form.full_name,
      phone: form.phone
    });
    setLoading(false);
    if (res.ok) {
      setUsers((prev) => prev.map((u) => u.id === selectedUser.id ? { ...u, full_name: form.full_name || null, phone: form.phone || null } : u));
      showToast('Perfil actualizado', true);
      closeModal();
    } else {
      showToast(res.error ?? 'Error al guardar', false);
    }
  };

  // Toggle status
  const handleToggleStatus = async (u: AdminUser) => {
    setOpenMenu(null);
    setLoading(true);
    const res = await api('/api/admin/users', 'PATCH', { action: 'toggle_status', userId: u.id });
    setLoading(false);
    if (res.ok) {
      setUsers((prev) => prev.map((p) => p.id === u.id ? { ...p, status: res.status } : p));
      showToast(res.status === 'inactive' ? 'Usuario desactivado' : 'Usuario activado', true);
    } else {
      showToast(res.error ?? 'Error', false);
    }
  };

  // Change role
  const handleRoleChange = async (u: AdminUser, role: string) => {
    setOpenMenu(null);
    const res = await api('/api/admin/users', 'PATCH', { action: 'update_role', userId: u.id, role });
    if (res.ok) {
      setUsers((prev) => prev.map((p) => p.id === u.id ? { ...p, role } : p));
      showToast('Rol actualizado', true);
    } else {
      showToast(res.error ?? 'Error', false);
    }
  };

  // Delete
  const handleDelete = async () => {
    if (!selectedUser) return;
    setLoading(true);
    const res = await api('/api/admin/users', 'DELETE', { userId: selectedUser.id });
    setLoading(false);
    if (res.ok) {
      setUsers((prev) => prev.filter((u) => u.id !== selectedUser.id));
      showToast('Usuario eliminado', true);
      closeModal();
    } else {
      showToast(res.error ?? 'Error al eliminar', false);
    }
  };

  // Assign company
  const handleAssignCompany = async (companyId: string) => {
    if (!selectedUser) return;
    const res = await api('/api/admin/users/companies', 'POST', { userId: selectedUser.id, companyId });
    if (res.ok) {
      const co = allCompanies.find((c) => c.id === companyId);
      if (co) {
        setUsers((prev) => prev.map((u) => u.id === selectedUser.id
          ? { ...u, companies: [...u.companies.filter((c) => c.id !== companyId), { id: co.id, razon_social: co.razon_social, cif_nif: co.cif_nif, role: 'owner' }] }
          : u));
        setSelectedUser((prev) => prev ? { ...prev, companies: [...prev.companies.filter((c) => c.id !== companyId), { id: co.id, razon_social: co.razon_social, cif_nif: co.cif_nif, role: 'owner' }] } : prev);
      }
      showToast('Empresa asignada', true);
    } else {
      showToast(res.error ?? 'Error', false);
    }
  };

  const handleRemoveCompany = async (companyId: string) => {
    if (!selectedUser) return;
    const res = await api('/api/admin/users/companies', 'DELETE', { userId: selectedUser.id, companyId });
    if (res.ok) {
      setUsers((prev) => prev.map((u) => u.id === selectedUser.id ? { ...u, companies: u.companies.filter((c) => c.id !== companyId) } : u));
      setSelectedUser((prev) => prev ? { ...prev, companies: prev.companies.filter((c) => c.id !== companyId) } : prev);
      showToast('Empresa desvinculada', true);
    } else {
      showToast(res.error ?? 'Error', false);
    }
  };

  const companiesNotAssigned = allCompanies.filter(
    (c) => !selectedUser?.companies.some((sc) => sc.id === c.id) && c.razon_social.toLowerCase().includes(companySearch.toLowerCase())
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">

      {/* ── Toolbar ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative min-w-[200px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9ca3af]" />
            <input
              type="text"
              placeholder="Buscar por nombre, email o empresa…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-[#d8cbb5] bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-[#d7a33a] focus:ring-2 focus:ring-[#d7a33a]/20"
            />
          </div>
          {/* Role filter */}
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value as 'all' | 'admin' | 'client')}
            className="rounded-xl border border-[#d8cbb5] bg-white px-3 py-2 text-sm outline-none focus:border-[#d7a33a]"
          >
            <option value="all">Todos los roles</option>
            <option value="client">Clientes</option>
            <option value="admin">Admins</option>
          </select>
          {/* Status filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as 'all' | 'active' | 'inactive')}
            className="rounded-xl border border-[#d8cbb5] bg-white px-3 py-2 text-sm outline-none focus:border-[#d7a33a]"
          >
            <option value="all">Todos los estados</option>
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
          </select>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-[#29384a]">{filtered.length} de {users.length}</span>
          <button
            type="button"
            onClick={() => exportCSV(filtered)}
            className="flex items-center gap-1.5 rounded-xl border border-[#d8cbb5] bg-white px-3 py-2 text-xs font-semibold text-[#29384a] transition hover:border-[#d7a33a] hover:text-[#07111d]"
          >
            <Download className="h-3.5 w-3.5" /> Exportar CSV
          </button>
          <button
            type="button"
            onClick={() => { setForm({ email: '', full_name: '', phone: '', mode: 'invite_email' }); setSelectedUser(null); setModal('invite'); }}
            className="flex items-center gap-1.5 rounded-xl bg-[#d7a33a] px-3 py-2 text-xs font-bold text-[#07111d] transition hover:bg-[#f0bf54]"
          >
            <Plus className="h-3.5 w-3.5" /> Nuevo usuario
          </button>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="overflow-x-auto rounded-2xl border border-[#d8cbb5] bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#d8cbb5] text-left text-[11px] font-semibold uppercase tracking-[0.15em] text-[#29384a]">
              <th className="px-4 py-3">
                <SortBtn col="Usuario" active={sortKey === 'full_name'} dir={sortDir} onClick={() => toggleSort('full_name')} />
              </th>
              <th className="px-4 py-3">Empresa</th>
              <th className="px-4 py-3 text-center">
                <SortBtn col="Pres." active={sortKey === 'totalQuotes'} dir={sortDir} onClick={() => toggleSort('totalQuotes')} />
              </th>
              <th className="px-4 py-3 text-center">
                <SortBtn col="Exped." active={sortKey === 'totalCases'} dir={sortDir} onClick={() => toggleSort('totalCases')} />
              </th>
              <th className="px-4 py-3">
                <SortBtn col="Alta" active={sortKey === 'created_at'} dir={sortDir} onClick={() => toggleSort('created_at')} />
              </th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="py-12 text-center text-sm text-[#29384a]">
                  Sin usuarios que coincidan con los filtros.
                </td>
              </tr>
            )}
            {filtered.map((u) => (
              <tr
                key={u.id}
                className={`border-b border-[#f8f4eb] transition hover:bg-[#faf7f0] ${u.status === 'inactive' ? 'opacity-60' : ''}`}
              >
                {/* Usuario */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#d7a33a]/10 text-[#d7a33a]">
                      {u.role === 'admin' ? <ShieldCheck className="h-4 w-4" /> : <User className="h-4 w-4" />}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-[#07111d]">
                        {u.full_name ?? <span className="italic text-[#9ca3af]">Sin nombre</span>}
                      </p>
                      <p className="truncate text-xs text-[#29384a]">{u.email}</p>
                      {u.phone && <p className="text-[10px] text-[#9ca3af]">{u.phone}</p>}
                    </div>
                  </div>
                </td>

                {/* Empresa */}
                <td className="px-4 py-3">
                  {u.companies.length === 0 ? (
                    <span className="text-xs italic text-[#9ca3af]">Sin empresa</span>
                  ) : (
                    <div>
                      <p className="text-xs font-semibold text-[#07111d] leading-tight">{u.companies[0].razon_social}</p>
                      {u.companies[0].cif_nif && <p className="text-[10px] text-[#29384a]">{u.companies[0].cif_nif}</p>}
                      {u.companies.length > 1 && (
                        <p className="text-[10px] text-[#c88b25]">+{u.companies.length - 1} empresa{u.companies.length - 1 !== 1 ? 's' : ''}</p>
                      )}
                    </div>
                  )}
                </td>

                {/* Presupuestos */}
                <td className="px-4 py-3 text-center">
                  {u.totalQuotes > 0 ? (
                    <Link href={`/admin/presupuestos?client=${u.id}`} className="inline-flex items-center gap-1 text-xs font-semibold text-[#c88b25] hover:underline">
                      <FileText className="h-3 w-3" /> {u.totalQuotes}
                    </Link>
                  ) : <span className="text-xs text-[#9ca3af]">—</span>}
                </td>

                {/* Expedientes */}
                <td className="px-4 py-3 text-center">
                  {u.totalCases > 0 ? (
                    <Link href={`/admin/expedientes?client=${u.id}`} className="inline-flex items-center gap-1 text-xs font-semibold text-[#1fae4b] hover:underline">
                      <FolderOpen className="h-3 w-3" /> {u.activeCases}<span className="font-normal text-[#29384a]">/{u.totalCases}</span>
                    </Link>
                  ) : <span className="text-xs text-[#9ca3af]">—</span>}
                </td>

                {/* Alta */}
                <td className="px-4 py-3 text-xs text-[#29384a] whitespace-nowrap">{fmt(u.created_at)}</td>

                {/* Estado */}
                <td className="px-4 py-3">
                  <StatusBadge status={u.status} role={u.role} />
                </td>

                {/* Acciones */}
                <td className="px-4 py-3 text-right">
                  <div className="relative inline-block">
                    <button
                      type="button"
                      onClick={() => setOpenMenu(openMenu === u.id ? null : u.id)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-[#9ca3af] transition hover:bg-[#f8f4eb] hover:text-[#07111d]"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>

                    {openMenu === u.id && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setOpenMenu(null)} />
                        <div className="absolute right-0 top-9 z-20 w-52 rounded-xl border border-[#d8cbb5] bg-white py-1 shadow-xl">
                          <button type="button" onClick={() => openEdit(u)} className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-[#07111d] hover:bg-[#f8f4eb]">
                            <Pencil className="h-3.5 w-3.5 text-[#d7a33a]" /> Editar perfil
                          </button>
                          <button type="button" onClick={() => openCompanies(u)} className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-[#07111d] hover:bg-[#f8f4eb]">
                            <Building2 className="h-3.5 w-3.5 text-[#d7a33a]" /> Gestionar empresas
                          </button>
                          <div className="my-1 border-t border-[#f8f4eb]" />
                          {u.role !== 'admin' && (
                            <button type="button" onClick={() => handleRoleChange(u, 'admin')} className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-[#07111d] hover:bg-[#f8f4eb]">
                              <ShieldCheck className="h-3.5 w-3.5 text-[#d7a33a]" /> Hacer admin
                            </button>
                          )}
                          {u.role === 'admin' && (
                            <button type="button" onClick={() => handleRoleChange(u, 'client')} className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-[#07111d] hover:bg-[#f8f4eb]">
                              <User className="h-3.5 w-3.5" /> Quitar admin
                            </button>
                          )}
                          <Link href={`/admin/presupuestos?client=${u.id}`} onClick={() => setOpenMenu(null)} className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-[#07111d] hover:bg-[#f8f4eb]">
                            <FileText className="h-3.5 w-3.5 text-[#c88b25]" /> Ver presupuestos
                          </Link>
                          <Link href={`/admin/expedientes?client=${u.id}`} onClick={() => setOpenMenu(null)} className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-[#07111d] hover:bg-[#f8f4eb]">
                            <FolderOpen className="h-3.5 w-3.5 text-[#1fae4b]" /> Ver expedientes
                          </Link>
                          <div className="my-1 border-t border-[#f8f4eb]" />
                          <button type="button" onClick={() => handleToggleStatus(u)} className="flex w-full items-center gap-2.5 px-4 py-2 text-sm hover:bg-[#f8f4eb]">
                            {u.status === 'inactive'
                              ? <><UserCheck className="h-3.5 w-3.5 text-green-600" /><span className="text-green-700">Activar usuario</span></>
                              : <><UserX className="h-3.5 w-3.5 text-amber-600" /><span className="text-amber-700">Desactivar</span></>}
                          </button>
                          {u.role !== 'admin' && (
                            <button type="button" onClick={() => openDelete(u)} className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                              <Trash2 className="h-3.5 w-3.5" /> Eliminar usuario
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Modals ── */}

      {/* Invite / New user */}
      {(modal === 'invite') && (
        <ModalShell title="Nuevo usuario" onClose={closeModal}>
          <div className="space-y-3">
            <Field label="Email *">
              <input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="cliente@email.com" className={inputCls} />
            </Field>
            <Field label="Nombre completo">
              <input type="text" value={form.full_name} onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))} placeholder="María García" className={inputCls} />
            </Field>
            <Field label="Teléfono">
              <input type="tel" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="+34 600 000 000" className={inputCls} />
            </Field>
            <Field label="Modo de alta">
              <select value={form.mode} onChange={(e) => setForm((f) => ({ ...f, mode: e.target.value }))} className={inputCls}>
                <option value="invite_email">Enviar invitación por email</option>
                <option value="admin_fill">Crear sin enviar email</option>
              </select>
            </Field>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={closeModal} className={btnSecondary}>Cancelar</button>
              <button type="button" onClick={handleInvite} disabled={loading || !form.email} className={btnPrimary}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                {form.mode === 'invite_email' ? 'Invitar' : 'Crear'}
              </button>
            </div>
          </div>
        </ModalShell>
      )}

      {/* Edit profile */}
      {modal === 'edit' && selectedUser && (
        <ModalShell title={`Editar — ${selectedUser.email}`} onClose={closeModal}>
          <div className="space-y-3">
            <Field label="Email">
              <input type="email" value={selectedUser.email} disabled className={inputCls + ' opacity-50'} />
            </Field>
            <Field label="Nombre completo">
              <input type="text" value={form.full_name} onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))} placeholder="Nombre completo" className={inputCls} />
            </Field>
            <Field label="Teléfono">
              <input type="tel" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="+34 600 000 000" className={inputCls} />
            </Field>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={closeModal} className={btnSecondary}>Cancelar</button>
              <button type="button" onClick={handleEditSave} disabled={loading} className={btnPrimary}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Guardar
              </button>
            </div>
          </div>
        </ModalShell>
      )}

      {/* Manage companies */}
      {modal === 'companies' && selectedUser && (
        <ModalShell title={`Empresas — ${selectedUser.full_name ?? selectedUser.email}`} onClose={closeModal} wide>
          <div className="space-y-4">
            {/* Assigned */}
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[#29384a]">Asignadas ({selectedUser.companies.length})</p>
              {selectedUser.companies.length === 0 ? (
                <p className="text-sm text-[#9ca3af] italic">Sin empresas asignadas</p>
              ) : (
                <div className="space-y-1.5">
                  {selectedUser.companies.map((c) => (
                    <div key={c.id} className="flex items-center justify-between rounded-lg border border-[#d8cbb5] px-3 py-2">
                      <div>
                        <p className="text-sm font-semibold text-[#07111d]">{c.razon_social}</p>
                        {c.cif_nif && <p className="text-xs text-[#29384a]">{c.cif_nif}</p>}
                      </div>
                      <button type="button" onClick={() => handleRemoveCompany(c.id)} className="rounded-lg p-1 text-[#9ca3af] hover:bg-red-50 hover:text-red-500">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add */}
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[#29384a]">Añadir empresa</p>
              <input
                type="text"
                placeholder="Buscar empresa…"
                value={companySearch}
                onChange={(e) => setCompanySearch(e.target.value)}
                className={inputCls + ' mb-2'}
              />
              {companiesNotAssigned.length === 0 ? (
                <p className="text-sm text-[#9ca3af] italic">No hay más empresas disponibles</p>
              ) : (
                <div className="max-h-48 space-y-1 overflow-y-auto">
                  {companiesNotAssigned.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => handleAssignCompany(c.id)}
                      className="flex w-full items-center justify-between rounded-lg border border-dashed border-[#d8cbb5] px-3 py-2 text-left transition hover:border-[#d7a33a] hover:bg-[#d7a33a]/5"
                    >
                      <div>
                        <p className="text-sm font-semibold text-[#07111d]">{c.razon_social}</p>
                        {c.cif_nif && <p className="text-xs text-[#29384a]">{c.cif_nif}</p>}
                      </div>
                      <Plus className="h-4 w-4 shrink-0 text-[#d7a33a]" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </ModalShell>
      )}

      {/* Delete confirm */}
      {modal === 'delete' && selectedUser && (
        <ModalShell title="Eliminar usuario" onClose={closeModal}>
          <div className="space-y-4">
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-sm font-semibold text-red-800">Esta acción no se puede deshacer.</p>
              <p className="mt-1 text-xs text-red-700">
                El usuario <strong>{selectedUser.email}</strong> y todos sus datos de sesión serán eliminados permanentemente. Los expedientes y presupuestos vinculados bloquearán la eliminación.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={closeModal} className={btnSecondary}>Cancelar</button>
              <button type="button" onClick={handleDelete} disabled={loading} className="flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-700 disabled:opacity-60">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Eliminar definitivamente
              </button>
            </div>
          </div>
        </ModalShell>
      )}

      {/* Toast */}
      {toast && <Toast msg={toast.msg} ok={toast.ok} />}
    </div>
  );
}

// ── Shared modal shell ─────────────────────────────────────────────────────────

function ModalShell({ title, onClose, children, wide }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative z-10 w-full rounded-2xl border border-[#d8cbb5] bg-white p-6 shadow-2xl ${wide ? 'max-w-lg' : 'max-w-md'}`}>
        <div className="mb-5 flex items-start justify-between gap-4">
          <h2 className="font-serif text-lg font-bold text-[#07111d]">{title}</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-[#9ca3af] hover:bg-[#f8f4eb] hover:text-[#07111d]">
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-[#29384a]">{label}</label>
      {children}
    </div>
  );
}

const inputCls = 'w-full rounded-xl border border-[#d8cbb5] bg-white px-3 py-2 text-sm outline-none focus:border-[#d7a33a] focus:ring-2 focus:ring-[#d7a33a]/20';
const btnPrimary = 'flex items-center gap-1.5 rounded-xl bg-[#d7a33a] px-4 py-2 text-sm font-bold text-[#07111d] transition hover:bg-[#f0bf54] disabled:opacity-60';
const btnSecondary = 'rounded-xl border border-[#d8cbb5] px-4 py-2 text-sm font-semibold text-[#29384a] transition hover:bg-[#f8f4eb]';
