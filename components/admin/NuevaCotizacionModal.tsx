'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Search, FileText, Euro, Calendar, Plus, Check, Loader2 } from 'lucide-react';

interface Client {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
}

interface Props {
  onClose: () => void;
  onCreated: () => void;
}

const DOCS_SUGERIDOS = [
  'DNI/NIE vigente',
  'Pasaporte vigente',
  'Contrato de trabajo',
  'Nóminas últimos 3 meses',
  'Declaración de la renta',
  'Certificado de empadronamiento',
  'Vida laboral',
  'Extracto bancario',
];

export function NuevaCotizacionModal({ onClose, onCreated }: Props) {
  // Client selector state
  const [query, setQuery]           = useState('');
  const [clients, setClients]       = useState<Client[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Form state
  const [title, setTitle]           = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount]         = useState('');
  const [expiresInDays, setExpiresInDays] = useState('14');
  const [docs, setDocs]             = useState<string[]>([]);
  const [customDoc, setCustomDoc]   = useState('');

  // Submit state
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState<string | null>(null);

  // Fetch clients on query change (debounced)
  const fetchClients = useCallback(async (q: string) => {
    setLoadingClients(true);
    try {
      const res = await fetch(`/api/admin/clients-quick?q=${encodeURIComponent(q)}`);
      if (res.ok) { const d = await res.json(); setClients(d.clients ?? []); }
    } finally { setLoadingClients(false); }
  }, []);

  useEffect(() => {
    // Load all clients on mount
    fetchClients(''); // eslint-disable-line react-hooks/set-state-in-effect
  }, [fetchClients]);

  useEffect(() => {
    const t = setTimeout(() => fetchClients(query), 200);
    return () => clearTimeout(t);
  }, [query, fetchClients]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
        searchRef.current && !searchRef.current.contains(e.target as Node)
      ) setShowDropdown(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelectClient = (c: Client) => {
    setSelectedClient(c);
    setQuery(c.name ?? c.email);
    setShowDropdown(false);
  };

  const handleClearClient = () => {
    setSelectedClient(null);
    setQuery('');
    setClients([]);
    fetchClients('');
    setTimeout(() => searchRef.current?.focus(), 50);
  };

  const toggleDoc = (doc: string) => {
    setDocs((prev) => prev.includes(doc) ? prev.filter((d) => d !== doc) : [...prev, doc]);
  };

  const addCustomDoc = () => {
    const d = customDoc.trim();
    if (d && !docs.includes(d)) { setDocs((prev) => [...prev, d]); }
    setCustomDoc('');
  };

  const handleSubmit = async () => {
    if (!selectedClient) { setError('Selecciona un cliente.'); return; }
    if (!title.trim())   { setError('El título es obligatorio.'); return; }
    if (!description.trim()) { setError('La descripción es obligatoria.'); return; }
    if (!amount || parseFloat(amount) <= 0) { setError('El importe debe ser mayor que 0.'); return; }

    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientEmail:    selectedClient.email,
          title:          title.trim(),
          description:    description.trim(),
          amountEur:      parseFloat(amount),
          expiresInDays:  parseInt(expiresInDays, 10),
          docsChecklist:  docs,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Error al crear el presupuesto.'); return; }
      onCreated();
    } finally { setSaving(false); }
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-black/50 sm:items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-t-3xl bg-white shadow-2xl sm:rounded-2xl max-h-[92dvh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#f0e9d8] px-5 py-4 shrink-0">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-[#c88b25]" />
            <p className="font-semibold text-[#07111d]">Nueva cotización</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-[#29384a] hover:bg-[#f0e9d8]">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

          {/* ── Client selector ── */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#07111d]">
              Cliente *
            </label>
            {selectedClient ? (
              <div className="flex items-center gap-3 rounded-xl border border-[#D4A017] bg-[#D4A017]/5 px-4 py-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#D4A017]/15 text-xs font-bold text-[#c88b25]">
                  {(selectedClient.name ?? selectedClient.email)[0].toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-[#07111d]">{selectedClient.name ?? selectedClient.email}</p>
                  <p className="truncate text-xs text-[#29384a]/60">{selectedClient.email}</p>
                </div>
                <button type="button" onClick={handleClearClient} className="shrink-0 text-[#9ca3af] hover:text-[#29384a]">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9ca3af]" />
                <input
                  ref={searchRef}
                  type="text"
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); setShowDropdown(true); }}
                  onFocus={() => setShowDropdown(true)}
                  placeholder="Buscar por nombre o email…"
                  className="w-full rounded-xl border border-[#d8cbb5] py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#c88b25]"
                />
                {showDropdown && (
                  <div
                    ref={dropdownRef}
                    className="absolute left-0 right-0 top-full z-50 mt-1 max-h-52 overflow-y-auto rounded-xl border border-[#d8cbb5] bg-white shadow-lg"
                  >
                    {loadingClients ? (
                      <div className="flex items-center justify-center py-6">
                        <Loader2 className="h-4 w-4 animate-spin text-[#d7a33a]" />
                      </div>
                    ) : clients.length === 0 ? (
                      <p className="px-4 py-3 text-sm text-[#9ca3af]">Sin resultados</p>
                    ) : (
                      clients.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onMouseDown={() => handleSelectClient(c)}
                          className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition hover:bg-[#f8f4eb]"
                        >
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#f0e9d8] text-xs font-semibold text-[#c88b25]">
                            {(c.name ?? c.email)[0].toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-[#07111d]">{c.name ?? <span className="text-[#9ca3af]">Sin nombre</span>}</p>
                            <p className="truncate text-xs text-[#29384a]/60">{c.email}</p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Title ── */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#07111d]">
              Título / Servicio *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Autorización de residencia por arraigo social"
              className="w-full rounded-xl border border-[#d8cbb5] px-4 py-2.5 text-sm outline-none focus:border-[#c88b25]"
            />
          </div>

          {/* ── Description ── */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#07111d]">
              Descripción *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalla el alcance del servicio, gestiones incluidas, plazo estimado…"
              rows={3}
              className="w-full resize-none rounded-xl border border-[#d8cbb5] px-4 py-2.5 text-sm outline-none focus:border-[#c88b25]"
            />
          </div>

          {/* ── Amount + Expires ── */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#07111d]">
                Importe (€) *
              </label>
              <div className="relative">
                <Euro className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9ca3af]" />
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="450.00"
                  className="w-full rounded-xl border border-[#d8cbb5] py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#c88b25]"
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#07111d]">
                Vence en (días)
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9ca3af]" />
                <select
                  value={expiresInDays}
                  onChange={(e) => setExpiresInDays(e.target.value)}
                  className="w-full rounded-xl border border-[#d8cbb5] py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#c88b25]"
                >
                  {[7, 14, 21, 30, 45, 60, 90].map((d) => (
                    <option key={d} value={d}>{d} días</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* ── Docs checklist ── */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#07111d]">
              Documentos a aportar <span className="font-normal text-[#9ca3af]">(opcional)</span>
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {DOCS_SUGERIDOS.map((doc) => (
                <button
                  key={doc}
                  type="button"
                  onClick={() => toggleDoc(doc)}
                  className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition ${
                    docs.includes(doc)
                      ? 'border-[#D4A017] bg-[#D4A017]/10 text-[#c88b25]'
                      : 'border-[#d8cbb5] text-[#29384a] hover:border-[#c88b25]'
                  }`}
                >
                  {docs.includes(doc) && <Check className="h-3 w-3" />}
                  {doc}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={customDoc}
                onChange={(e) => setCustomDoc(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomDoc(); } }}
                placeholder="Añadir otro documento…"
                className="flex-1 rounded-xl border border-[#d8cbb5] px-3 py-2 text-sm outline-none focus:border-[#c88b25]"
              />
              <button type="button" onClick={addCustomDoc} disabled={!customDoc.trim()}
                className="flex items-center gap-1 rounded-xl border border-[#d8cbb5] px-3 py-2 text-sm text-[#29384a] hover:border-[#c88b25] disabled:opacity-40">
                <Plus className="h-3.5 w-3.5" /> Añadir
              </button>
            </div>
            {docs.length > 0 && (
              <ul className="mt-2 space-y-1">
                {docs.map((d) => (
                  <li key={d} className="flex items-center gap-2 text-xs text-[#07111d]">
                    <Check className="h-3 w-3 shrink-0 text-[#D4A017]" /> {d}
                    <button type="button" onClick={() => setDocs((prev) => prev.filter((x) => x !== d))}
                      className="ml-auto text-[#9ca3af] hover:text-red-500">
                      <X className="h-3 w-3" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {error && <p className="rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-[#f0e9d8] px-5 py-4 shrink-0">
          <p className="text-xs text-[#9ca3af]">Se envía email con enlace de pago al cliente.</p>
          <div className="flex gap-2">
            <button type="button" onClick={onClose}
              className="rounded-xl border border-[#d8cbb5] px-4 py-2 text-sm font-semibold text-[#29384a] hover:bg-[#f0e9d8]">
              Cancelar
            </button>
            <button type="button" onClick={handleSubmit} disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-[#07111d] px-5 py-2 text-sm font-bold text-white hover:bg-[#1a2a3a] disabled:opacity-50">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
              {saving ? 'Creando…' : 'Crear y enviar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
