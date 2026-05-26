'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Building2, Calendar, CreditCard, ExternalLink, FolderOpen, Mail,
  MessageSquare, Phone, Plus, RefreshCw, Search, Trash2, Users,
  X, ChevronDown, ChevronUp, ChevronsUpDown, UserCircle2,
} from 'lucide-react';
import { WaTemplateModal } from '@/components/admin/WaTemplateModal';

// ── Types ────────────────────────────────────────────────────────────────────

interface Persona {
  id: string;
  full_name: string | null;
  email: string;
  phone: string | null;
  whatsapp_number: string | null;
  status: string;
  created_at: string;
  totalCases: number;
  activeCases: number;
  plan: string | null;
  lastWhatsApp: string | null;
}

interface Empresa {
  id: string;
  razon_social: string | null;
  cif_nif: string | null;
  forma_juridica: string | null;
  ciudad: string | null;
  email: string | null;
  phone: string | null;
  status: string;
  created_at: string;
  memberCount: number;
}

type SortKey = 'full_name' | 'created_at' | 'totalCases' | 'activeCases' | 'plan';
type EmpSortKey = 'razon_social' | 'created_at' | 'memberCount';
type SortDir = 'asc' | 'desc';

// ── Helpers ───────────────────────────────────────────────────────────────────

const PLAN_LABEL: Record<string, string> = {
  gratuito: 'Prueba Holded', supervision: 'Supervisión', avanzado: 'Avanzado', colaborativo: 'Colaborativo',
  'plan-supervision': 'Supervisión', 'Plan Supervisión': 'Supervisión',
  'Plan Avanzado': 'Avanzado', 'Plan Colaborativo': 'Colaborativo',
  'Plan Presupuesto Personalizado': 'Personalizado',
  'Plan Delegado': 'Personalizado', 'Plan Premium': 'Personalizado',
};
const PLAN_CLS: Record<string, string> = {
  gratuito: 'bg-gray-100 text-gray-600', supervision: 'bg-emerald-100 text-emerald-700',
  'plan-supervision': 'bg-emerald-100 text-emerald-700',
  'Plan Supervisión': 'bg-emerald-100 text-emerald-700',
  avanzado: 'bg-blue-100 text-blue-700',
  colaborativo: 'bg-[#d7a33a]/15 text-[#c88b25]',
  'Plan Avanzado': 'bg-blue-100 text-blue-700',
  'Plan Colaborativo': 'bg-[#d7a33a]/15 text-[#c88b25]',
  'Plan Presupuesto Personalizado': 'bg-purple-100 text-purple-700',
  'Plan Delegado': 'bg-purple-100 text-purple-700',
  'Plan Premium': 'bg-purple-100 text-purple-700',
};
const FORMAS_JURIDICAS = ['SL', 'SA', 'SLU', 'SAU', 'SLL', 'Autónomo', 'Comunidad de Bienes', 'Asociación', 'Fundación', 'Otra'];

function fmt(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' });
}
function fmtRelative(d: string | null) {
  if (!d) return null;
  const days = Math.floor((Date.now() - new Date(d).getTime()) / 86_400_000);
  if (days === 0) return 'hoy';
  if (days === 1) return 'ayer';
  if (days < 7) return `hace ${days}d`;
  if (days < 30) return `hace ${Math.floor(days / 7)}sem`;
  return fmt(d);
}

function SortBtn({ col, active, dir, onClick }: { col: string; active: boolean; dir: SortDir; onClick: () => void }) {
  const Icon = active ? (dir === 'asc' ? ChevronUp : ChevronDown) : ChevronsUpDown;
  return (
    <button type="button" onClick={onClick} className="inline-flex items-center gap-0.5 hover:text-[#07111d]">
      {col} <Icon className={`h-3 w-3 ${active ? 'text-[#d7a33a]' : 'text-[#9ca3af]'}`} />
    </button>
  );
}

function Initials({ name, email }: { name: string | null; email: string }) {
  const src = name ?? email;
  const letters = src.split(/[\s@]/).filter(Boolean).map((w) => w[0].toUpperCase()).slice(0, 2).join('');
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#d7a33a]/12 text-sm font-bold text-[#c88b25]">
      {letters}
    </div>
  );
}

// ── Modal: Nueva persona ──────────────────────────────────────────────────────

function NuevaPersonaModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', taxId: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const firstRef = useRef<HTMLInputElement>(null);
  useEffect(() => { firstRef.current?.focus(); }, []);

  const set = (k: keyof typeof form, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email) { setError('El email es requerido'); return; }
    setLoading(true); setError(null);
    try {
      const res = await fetch('/api/admin/users/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          fullName: form.fullName || undefined,
          phone: form.phone || undefined,
          taxId: form.taxId || undefined,
          mode: 'admin_fill',
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Error al crear'); return; }
      onCreated();
    } catch {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-serif text-lg font-bold text-[#07111d]">
            <UserCircle2 className="h-5 w-5 text-[#d7a33a]" /> Nueva persona
          </h2>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="rounded-lg p-1 text-[#9ca3af] hover:bg-[#f0e9d8]">
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
        )}

        <div className="space-y-3">
          {[
            { label: 'Nombre completo', key: 'fullName', type: 'text', placeholder: 'María García', ref: firstRef },
            { label: 'Email *', key: 'email', type: 'email', placeholder: 'cliente@email.com' },
            { label: 'Teléfono', key: 'phone', type: 'tel', placeholder: '+34 600 000 000' },
            { label: 'DNI / NIE', key: 'taxId', type: 'text', placeholder: '12345678A' },
          ].map(({ label, key, type, placeholder, ref }) => (
            <label key={key} className="block">
              <span className="mb-1 block text-xs font-semibold text-[#29384a]">{label}</span>
              <input
                ref={ref as React.RefObject<HTMLInputElement> | undefined}
                type={type}
                value={form[key as keyof typeof form]}
                onChange={(e) => set(key as keyof typeof form, e.target.value)}
                placeholder={placeholder}
                className="w-full rounded-xl border border-[#d8cbb5] px-3 py-2 text-sm outline-none focus:border-[#d7a33a]"
              />
            </label>
          ))}
        </div>

        <div className="mt-5 flex gap-2">
          <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-[#d8cbb5] py-2 text-sm font-semibold text-[#29384a] hover:border-[#c88b25]">
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 rounded-xl bg-[#07111d] py-2 text-sm font-bold text-white transition hover:bg-[#1a2d42] disabled:opacity-50"
          >
            {loading ? 'Creando…' : 'Crear persona'}
          </button>
        </div>
      </form>
    </div>
  );
}

// ── Modal: Nueva empresa ──────────────────────────────────────────────────────

function NuevaEmpresaModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({
    razon_social: '', cif_nif: '', forma_juridica: 'SL',
    email: '', phone: '', ciudad: '', direccion: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const firstRef = useRef<HTMLInputElement>(null);
  useEffect(() => { firstRef.current?.focus(); }, []);

  const set = (k: keyof typeof form, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.razon_social) { setError('La razón social es requerida'); return; }
    setLoading(true); setError(null);
    try {
      const res = await fetch('/api/admin/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          razon_social:   form.razon_social,
          cif_nif:        form.cif_nif || undefined,
          forma_juridica: form.forma_juridica || undefined,
          email:          form.email || undefined,
          phone:          form.phone || undefined,
          ciudad:         form.ciudad || undefined,
          direccion:      form.direccion || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Error al crear'); return; }
      onCreated();
    } catch {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-serif text-lg font-bold text-[#07111d]">
            <Building2 className="h-5 w-5 text-[#d7a33a]" /> Nueva empresa
          </h2>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="rounded-lg p-1 text-[#9ca3af] hover:bg-[#f0e9d8]">
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
        )}

        <div className="space-y-3">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-[#29384a]">Razón social *</span>
            <input
              ref={firstRef}
              type="text"
              value={form.razon_social}
              onChange={(e) => set('razon_social', e.target.value)}
              placeholder="Empresa Demo, S.L."
              className="w-full rounded-xl border border-[#d8cbb5] px-3 py-2 text-sm outline-none focus:border-[#d7a33a]"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-[#29384a]">CIF / NIF</span>
              <input
                type="text"
                value={form.cif_nif}
                onChange={(e) => set('cif_nif', e.target.value)}
                placeholder="B12345678"
                className="w-full rounded-xl border border-[#d8cbb5] px-3 py-2 text-sm outline-none focus:border-[#d7a33a]"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-[#29384a]">Forma jurídica</span>
              <select
                value={form.forma_juridica}
                onChange={(e) => set('forma_juridica', e.target.value)}
                className="w-full rounded-xl border border-[#d8cbb5] px-3 py-2 text-sm outline-none focus:border-[#d7a33a]"
              >
                {FORMAS_JURIDICAS.map((f) => <option key={f}>{f}</option>)}
              </select>
            </label>
          </div>

          {[
            { label: 'Email de contacto', key: 'email', type: 'email', placeholder: 'info@empresa.es' },
            { label: 'Teléfono', key: 'phone', type: 'tel', placeholder: '+34 900 000 000' },
            { label: 'Ciudad', key: 'ciudad', type: 'text', placeholder: 'Madrid' },
            { label: 'Dirección', key: 'direccion', type: 'text', placeholder: 'Calle Ejemplo, 1' },
          ].map(({ label, key, type, placeholder }) => (
            <label key={key} className="block">
              <span className="mb-1 block text-xs font-semibold text-[#29384a]">{label}</span>
              <input
                type={type}
                value={form[key as keyof typeof form]}
                onChange={(e) => set(key as keyof typeof form, e.target.value)}
                placeholder={placeholder}
                className="w-full rounded-xl border border-[#d8cbb5] px-3 py-2 text-sm outline-none focus:border-[#d7a33a]"
              />
            </label>
          ))}
        </div>

        <div className="mt-5 flex gap-2">
          <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-[#d8cbb5] py-2 text-sm font-semibold text-[#29384a] hover:border-[#c88b25]">
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 rounded-xl bg-[#07111d] py-2 text-sm font-bold text-white transition hover:bg-[#1a2d42] disabled:opacity-50"
          >
            {loading ? 'Creando…' : 'Crear empresa'}
          </button>
        </div>
      </form>
    </div>
  );
}

// ── Modal: Asignar persona a empresa ─────────────────────────────────────────

function AsignarPersonaModal({ company, onClose, onAssigned }: {
  company: Empresa;
  onClose: () => void;
  onAssigned: () => void;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ id: string; full_name: string | null; email: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    if (query.length < 2) { setResults([]); return; }
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/whatsapp/link-client?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data.clients ?? []);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  const assign = async (profileId: string) => {
    setAssigning(true);
    try {
      await fetch('/api/admin/users/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: profileId, companyId: company.id }),
      });
      onAssigned();
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-serif text-lg font-bold text-[#07111d]">
            Asignar persona a <span className="text-[#c88b25]">{company.razon_social}</span>
          </h2>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="rounded-lg p-1 text-[#9ca3af] hover:bg-[#f0e9d8]">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9ca3af]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre, email o teléfono…"
            autoFocus
            className="w-full rounded-xl border border-[#d8cbb5] py-2 pl-9 pr-3 text-sm outline-none focus:border-[#d7a33a]"
          />
        </div>

        <div className="max-h-60 overflow-y-auto space-y-1">
          {loading && <p className="py-4 text-center text-sm text-[#9ca3af]">Buscando…</p>}
          {!loading && query.length >= 2 && results.length === 0 && (
            <p className="py-4 text-center text-sm text-[#9ca3af]">Sin resultados</p>
          )}
          {results.map((p) => (
            <div key={p.id} className="flex items-center justify-between rounded-xl border border-[#f0e9d8] bg-[#faf7f0] px-3 py-2">
              <div>
                <p className="text-sm font-semibold text-[#07111d]">{p.full_name ?? 'Sin nombre'}</p>
                <p className="text-xs text-[#29384a]">{p.email}</p>
              </div>
              <button
                type="button"
                onClick={() => assign(p.id)}
                disabled={assigning}
                className="rounded-lg bg-[#07111d] px-3 py-1.5 text-xs font-bold text-white transition hover:bg-[#1a2d42] disabled:opacity-50"
              >
                Asignar
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Delete confirm ────────────────────────────────────────────────────────────

function DeleteConfirm({ label, onConfirm, onClose }: { label: string; onConfirm: () => Promise<void>; onClose: () => void }) {
  const [loading, setLoading] = useState(false);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="mb-2 font-serif text-lg font-bold text-[#07111d]">¿Eliminar cliente?</h3>
        <p className="mb-5 text-sm text-[#29384a]">
          Se desactivará <strong>{label}</strong>. Esta acción se puede revertir.
        </p>
        <div className="flex gap-2">
          <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-[#d8cbb5] py-2 text-sm font-semibold text-[#29384a] hover:border-[#c88b25]">
            Cancelar
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={async () => { setLoading(true); await onConfirm(); setLoading(false); }}
            className="flex-1 rounded-xl bg-red-600 py-2 text-sm font-bold text-white transition hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? 'Eliminando…' : 'Eliminar'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AdminClientesPage() {
  const [tab, setTab] = useState<'personas' | 'empresas'>('personas');

  // Personas state
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [loadingP, setLoadingP] = useState(true);
  const [searchP, setSearchP] = useState('');
  const [filterPlan, setFilterPlan] = useState('all');
  const [filterActive, setFilterActive] = useState('all');
  const [sortKeyP, setSortKeyP] = useState<SortKey>('created_at');
  const [sortDirP, setSortDirP] = useState<SortDir>('desc');
  const [waClient, setWaClient] = useState<Persona | null>(null);
  const [showNuevaPersona, setShowNuevaPersona] = useState(false);
  const [deletePersona, setDeletePersona] = useState<Persona | null>(null);

  // Empresas state
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loadingE, setLoadingE] = useState(true);
  const [searchE, setSearchE] = useState('');
  const [sortKeyE, setSortKeyE] = useState<EmpSortKey>('razon_social');
  const [sortDirE, setSortDirE] = useState<SortDir>('asc');
  const [showNuevaEmpresa, setShowNuevaEmpresa] = useState(false);
  const [asignarEmpresa, setAsignarEmpresa] = useState<Empresa | null>(null);
  const [deleteEmpresa, setDeleteEmpresa] = useState<Empresa | null>(null);

  const loadPersonas = useCallback(async () => {
    setLoadingP(true);
    try {
      const res = await fetch('/api/admin/clientes', { cache: 'no-store' });
      const data = await res.json();
      setPersonas(data.clients ?? []);
    } finally {
      setLoadingP(false);
    }
  }, []);

  const loadEmpresas = useCallback(async () => {
    setLoadingE(true);
    try {
      const res = await fetch('/api/admin/companies', { cache: 'no-store' });
      const data = await res.json();
      setEmpresas(data.companies ?? []);
    } finally {
      setLoadingE(false);
    }
  }, []);

  useEffect(() => { loadPersonas(); }, [loadPersonas]);
  useEffect(() => { loadEmpresas(); }, [loadEmpresas]);

  const toggleSortP = (key: SortKey) => {
    if (sortKeyP === key) setSortDirP((d) => d === 'asc' ? 'desc' : 'asc');
    else { setSortKeyP(key); setSortDirP('asc'); }
  };
  const toggleSortE = (key: EmpSortKey) => {
    if (sortKeyE === key) setSortDirE((d) => d === 'asc' ? 'desc' : 'asc');
    else { setSortKeyE(key); setSortDirE('asc'); }
  };

  const filteredPersonas = personas
    .filter((c) => {
      const q = searchP.toLowerCase();
      const matchQ = !q || (c.full_name ?? '').toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || (c.phone ?? '').includes(q);
      const matchPlan = filterPlan === 'all' || c.plan === filterPlan || (filterPlan === 'none' && !c.plan);
      const matchActive = filterActive === 'all' || (filterActive === 'active' && c.activeCases > 0) || (filterActive === 'inactive' && c.activeCases === 0);
      return matchQ && matchPlan && matchActive;
    })
    .sort((a, b) => {
      let av: string | number = (a[sortKeyP] ?? '') as string | number;
      let bv: string | number = (b[sortKeyP] ?? '') as string | number;
      if (typeof av === 'string') av = av.toLowerCase();
      if (typeof bv === 'string') bv = bv.toLowerCase();
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return sortDirP === 'asc' ? cmp : -cmp;
    });

  const filteredEmpresas = empresas
    .filter((e) => {
      const q = searchE.toLowerCase();
      return !q || (e.razon_social ?? '').toLowerCase().includes(q) || (e.cif_nif ?? '').toLowerCase().includes(q) || (e.ciudad ?? '').toLowerCase().includes(q);
    })
    .sort((a, b) => {
      let av: string | number = (a[sortKeyE] ?? '') as string | number;
      let bv: string | number = (b[sortKeyE] ?? '') as string | number;
      if (typeof av === 'string') av = av.toLowerCase();
      if (typeof bv === 'string') bv = bv.toLowerCase();
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return sortDirE === 'asc' ? cmp : -cmp;
    });

  const withPhone   = personas.filter((c) => c.phone || c.whatsapp_number).length;
  const withSub     = personas.filter((c) => c.plan).length;
  const withCases   = personas.filter((c) => c.activeCases > 0).length;

  return (
    <main className="min-h-screen bg-[#f8f4eb] py-8">
      <div className="mx-auto max-w-7xl px-6">

        {/* Header */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#c88b25]">CRM</p>
            <h1 className="mt-1 flex items-center gap-2 font-serif text-2xl font-bold text-[#07111d]">
              <Users className="h-6 w-6 text-[#d7a33a]" /> Clientes
            </h1>
            <p className="mt-1 text-sm text-[#29384a]">
              {personas.length} personas · {empresas.length} empresas
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { loadPersonas(); loadEmpresas(); }}
              disabled={loadingP || loadingE}
              className="flex items-center gap-2 rounded-xl border border-[#d8cbb5] bg-white px-4 py-2 text-sm font-semibold text-[#29384a] transition hover:border-[#c88b25] disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${(loadingP || loadingE) ? 'animate-spin' : ''}`} />
              Actualizar
            </button>
            <button
              type="button"
              onClick={() => tab === 'personas' ? setShowNuevaPersona(true) : setShowNuevaEmpresa(true)}
              className="flex items-center gap-2 rounded-xl bg-[#07111d] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#1a2d42]"
            >
              <Plus className="h-4 w-4" />
              {tab === 'personas' ? 'Nueva persona' : 'Nueva empresa'}
            </button>
          </div>
        </div>

        {/* KPI strip */}
        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Personas',               value: personas.length, icon: Users },
            { label: 'Empresas',               value: empresas.length, icon: Building2 },
            { label: 'Con expediente activo',  value: withCases,       icon: FolderOpen },
            { label: 'Con suscripción',        value: withSub,         icon: CreditCard },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="rounded-2xl border border-[#d8cbb5] bg-white px-4 py-3">
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-[#d7a33a]" />
                <span className="text-xs text-[#29384a]">{label}</span>
              </div>
              <p className="mt-1 font-serif text-2xl font-bold text-[#07111d]">{value}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="mb-4 flex gap-1 rounded-xl border border-[#d8cbb5] bg-white p-1 w-fit">
          {(['personas', 'empresas'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition ${
                tab === t
                  ? 'bg-[#07111d] text-white'
                  : 'text-[#29384a] hover:bg-[#f0e9d8]'
              }`}
            >
              {t === 'personas' ? <><UserCircle2 className="h-4 w-4" /> Personas ({personas.length})</> : <><Building2 className="h-4 w-4" /> Empresas ({empresas.length})</>}
            </button>
          ))}
        </div>

        {/* ── PERSONAS TAB ── */}
        {tab === 'personas' && (
          <>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9ca3af]" />
                <input
                  type="text"
                  placeholder="Buscar por nombre, email o teléfono…"
                  value={searchP}
                  onChange={(e) => setSearchP(e.target.value)}
                  className="w-full rounded-xl border border-[#d8cbb5] bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-[#d7a33a]"
                />
              </div>
              <select aria-label="Filtrar por plan" value={filterPlan} onChange={(e) => setFilterPlan(e.target.value)} className="rounded-xl border border-[#d8cbb5] bg-white px-3 py-2 text-sm outline-none focus:border-[#d7a33a]">
                <option value="all">Todos los planes</option>
                <option value="gratuito">Gratuito</option>
                <option value="Plan Avanzado">Avanzado</option>
                <option value="Plan Colaborativo">Colaborativo</option>
                <option value="none">Sin suscripción</option>
              </select>
              <select aria-label="Filtrar por expedientes" value={filterActive} onChange={(e) => setFilterActive(e.target.value)} className="rounded-xl border border-[#d8cbb5] bg-white px-3 py-2 text-sm outline-none focus:border-[#d7a33a]">
                <option value="all">Todos</option>
                <option value="active">Con expediente activo</option>
                <option value="inactive">Sin expediente</option>
              </select>
              <span className="text-xs text-[#29384a]">{filteredPersonas.length} de {personas.length}</span>
            </div>

            {loadingP ? (
              <div className="flex items-center justify-center py-20 text-sm text-[#29384a]">Cargando…</div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-[#d8cbb5] bg-white shadow-sm">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#d8cbb5] text-left text-[11px] font-semibold uppercase tracking-[0.15em] text-[#29384a]">
                      <th scope="col" className="px-4 py-3"><SortBtn col="Persona" active={sortKeyP === 'full_name'} dir={sortDirP} onClick={() => toggleSortP('full_name')} /></th>
                      <th scope="col" className="px-4 py-3">Contacto</th>
                      <th scope="col" className="px-4 py-3 text-center"><SortBtn col="Exped." active={sortKeyP === 'totalCases'} dir={sortDirP} onClick={() => toggleSortP('totalCases')} /></th>
                      <th scope="col" className="px-4 py-3 text-center"><SortBtn col="Plan" active={sortKeyP === 'plan'} dir={sortDirP} onClick={() => toggleSortP('plan')} /></th>
                      <th scope="col" className="px-4 py-3"><SortBtn col="Alta" active={sortKeyP === 'created_at'} dir={sortDirP} onClick={() => toggleSortP('created_at')} /></th>
                      <th scope="col" className="px-4 py-3">Último WA</th>
                      <th scope="col" className="px-4 py-3 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPersonas.length === 0 && (
                      <tr><td colSpan={7} className="py-16 text-center text-sm text-[#29384a]">Sin resultados.</td></tr>
                    )}
                    {filteredPersonas.map((c) => (
                      <tr key={c.id} className="border-b border-[#f8f4eb] transition hover:bg-[#faf7f0]">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <Initials name={c.full_name} email={c.email} />
                            <div className="min-w-0">
                              <p className="truncate font-semibold text-[#07111d]">
                                {c.full_name ?? <span className="italic text-[#9ca3af]">Sin nombre</span>}
                              </p>
                              <p className="truncate text-xs text-[#29384a]">{c.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {c.phone ? (
                            <div className="flex items-center gap-1 text-xs text-[#29384a]">
                              <Phone className="h-3 w-3 shrink-0" /><span>{c.phone}</span>
                            </div>
                          ) : <span className="text-xs italic text-[#9ca3af]">Sin teléfono</span>}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {c.totalCases > 0 ? (
                            <Link href={`/admin/expedientes?client=${c.id}`} className="inline-flex items-center gap-1 text-xs font-semibold text-[#1fae4b] hover:underline">
                              <FolderOpen className="h-3 w-3" />{c.activeCases}<span className="font-normal text-[#29384a]">/{c.totalCases}</span>
                            </Link>
                          ) : <span className="text-xs text-[#9ca3af]">—</span>}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {c.plan ? (
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${PLAN_CLS[c.plan] ?? 'bg-gray-100 text-gray-600'}`}>
                              {PLAN_LABEL[c.plan] ?? c.plan}
                            </span>
                          ) : <span className="text-xs text-[#9ca3af]">—</span>}
                        </td>
                        <td className="px-4 py-3 text-xs text-[#29384a] whitespace-nowrap">
                          <span className="flex items-center gap-1"><Calendar className="h-3 w-3 text-[#d8cbb5]" />{fmt(c.created_at)}</span>
                        </td>
                        <td className="px-4 py-3 text-xs text-[#29384a]">
                          {c.lastWhatsApp ? (
                            <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3 text-[#25D366]" />{fmtRelative(c.lastWhatsApp)}</span>
                          ) : <span className="text-[#9ca3af]">—</span>}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            {(c.phone || c.whatsapp_number) && (
                              <button type="button" onClick={() => setWaClient(c)} title="WhatsApp" className="flex h-8 w-8 items-center justify-center rounded-lg text-[#25D366] transition hover:bg-[#25D366]/10">
                                <MessageSquare className="h-4 w-4" />
                              </button>
                            )}
                            <a href={`mailto:${c.email}`} title="Email" className="flex h-8 w-8 items-center justify-center rounded-lg text-[#29384a] transition hover:bg-[#f0e9d8]">
                              <Mail className="h-4 w-4" />
                            </a>
                            <Link href={`/admin/clientes/${c.id}`} title="Ver perfil" className="flex h-8 w-8 items-center justify-center rounded-lg text-[#29384a] transition hover:bg-[#f0e9d8]">
                              <ExternalLink className="h-4 w-4" />
                            </Link>
                            <button type="button" onClick={() => setDeletePersona(c)} title="Desactivar" className="flex h-8 w-8 items-center justify-center rounded-lg text-[#9ca3af] transition hover:bg-red-50 hover:text-red-500">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* ── EMPRESAS TAB ── */}
        {tab === 'empresas' && (
          <>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9ca3af]" />
                <input
                  type="text"
                  placeholder="Buscar por razón social, CIF o ciudad…"
                  value={searchE}
                  onChange={(e) => setSearchE(e.target.value)}
                  className="w-full rounded-xl border border-[#d8cbb5] bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-[#d7a33a]"
                />
              </div>
              <span className="text-xs text-[#29384a]">{filteredEmpresas.length} de {empresas.length}</span>
            </div>

            {loadingE ? (
              <div className="flex items-center justify-center py-20 text-sm text-[#29384a]">Cargando…</div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-[#d8cbb5] bg-white shadow-sm">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#d8cbb5] text-left text-[11px] font-semibold uppercase tracking-[0.15em] text-[#29384a]">
                      <th scope="col" className="px-4 py-3"><SortBtn col="Empresa" active={sortKeyE === 'razon_social'} dir={sortDirE} onClick={() => toggleSortE('razon_social')} /></th>
                      <th scope="col" className="px-4 py-3">Identificación</th>
                      <th scope="col" className="px-4 py-3">Contacto</th>
                      <th scope="col" className="px-4 py-3 text-center"><SortBtn col="Usuarios" active={sortKeyE === 'memberCount'} dir={sortDirE} onClick={() => toggleSortE('memberCount')} /></th>
                      <th scope="col" className="px-4 py-3"><SortBtn col="Alta" active={sortKeyE === 'created_at'} dir={sortDirE} onClick={() => toggleSortE('created_at')} /></th>
                      <th scope="col" className="px-4 py-3 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEmpresas.length === 0 && (
                      <tr><td colSpan={6} className="py-16 text-center text-sm text-[#29384a]">Sin empresas. Crea la primera.</td></tr>
                    )}
                    {filteredEmpresas.map((e) => (
                      <tr key={e.id} className="border-b border-[#f8f4eb] transition hover:bg-[#faf7f0]">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#07111d]/8 text-[#07111d]">
                              <Building2 className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="truncate font-semibold text-[#07111d]">{e.razon_social ?? '—'}</p>
                              {e.forma_juridica && <p className="truncate text-xs text-[#29384a]">{e.forma_juridica}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-[#29384a]">
                          {e.cif_nif ? <span className="font-mono">{e.cif_nif}</span> : <span className="italic text-[#9ca3af]">Sin CIF</span>}
                          {e.ciudad && <span className="ml-2 text-[#9ca3af]">· {e.ciudad}</span>}
                        </td>
                        <td className="px-4 py-3 text-xs text-[#29384a]">
                          {e.email ? (
                            <a href={`mailto:${e.email}`} className="flex items-center gap-1 hover:underline">
                              <Mail className="h-3 w-3 shrink-0" />{e.email}
                            </a>
                          ) : e.phone ? (
                            <span className="flex items-center gap-1"><Phone className="h-3 w-3 shrink-0" />{e.phone}</span>
                          ) : <span className="italic text-[#9ca3af]">Sin contacto</span>}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${e.memberCount > 0 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                            {e.memberCount} {e.memberCount === 1 ? 'usuario' : 'usuarios'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-[#29384a] whitespace-nowrap">
                          <span className="flex items-center gap-1"><Calendar className="h-3 w-3 text-[#d8cbb5]" />{fmt(e.created_at)}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => setAsignarEmpresa(e)}
                              title="Asignar persona"
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-[#29384a] transition hover:bg-[#f0e9d8]"
                            >
                              <Users className="h-4 w-4" />
                            </button>
                            {e.email && (
                              <a href={`mailto:${e.email}`} title="Email" className="flex h-8 w-8 items-center justify-center rounded-lg text-[#29384a] transition hover:bg-[#f0e9d8]">
                                <Mail className="h-4 w-4" />
                              </a>
                            )}
                            <button type="button" onClick={() => setDeleteEmpresa(e)} title="Eliminar" className="flex h-8 w-8 items-center justify-center rounded-lg text-[#9ca3af] transition hover:bg-red-50 hover:text-red-500">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Modals ── */}
      {showNuevaPersona && (
        <NuevaPersonaModal
          onClose={() => setShowNuevaPersona(false)}
          onCreated={() => { setShowNuevaPersona(false); loadPersonas(); }}
        />
      )}
      {showNuevaEmpresa && (
        <NuevaEmpresaModal
          onClose={() => setShowNuevaEmpresa(false)}
          onCreated={() => { setShowNuevaEmpresa(false); loadEmpresas(); }}
        />
      )}
      {asignarEmpresa && (
        <AsignarPersonaModal
          company={asignarEmpresa}
          onClose={() => setAsignarEmpresa(null)}
          onAssigned={() => { setAsignarEmpresa(null); loadEmpresas(); }}
        />
      )}
      {deletePersona && (
        <DeleteConfirm
          label={deletePersona.full_name ?? deletePersona.email}
          onClose={() => setDeletePersona(null)}
          onConfirm={async () => {
            await fetch(`/api/admin/clientes/${deletePersona.id}`, { method: 'DELETE' });
            setDeletePersona(null);
            loadPersonas();
          }}
        />
      )}
      {deleteEmpresa && (
        <DeleteConfirm
          label={deleteEmpresa.razon_social ?? 'esta empresa'}
          onClose={() => setDeleteEmpresa(null)}
          onConfirm={async () => {
            await fetch(`/api/admin/companies/${deleteEmpresa.id}`, { method: 'DELETE' });
            setDeleteEmpresa(null);
            loadEmpresas();
          }}
        />
      )}
      {waClient && (
        <WaTemplateModal
          defaultPhone={(waClient.whatsapp_number ?? waClient.phone ?? '').replace(/\D/g, '')}
          onClose={() => setWaClient(null)}
          onSent={() => setWaClient(null)}
        />
      )}
    </main>
  );
}
