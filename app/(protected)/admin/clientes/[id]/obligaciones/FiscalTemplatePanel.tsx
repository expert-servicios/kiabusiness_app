'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, Loader2, RefreshCw, ShieldCheck, X } from 'lucide-react';

type Company = { id: string; name: string; nif: string | null };
type Template = {
  code: string;
  modelo: string;
  title: string;
  cadence: 'quarterly' | 'triannual' | 'annual';
  description: string;
  warning: string;
};
type Activation = {
  id: string;
  company_id: string;
  template_code: string;
  status: 'active' | 'inactive';
  effective_from: string;
  effective_to: string | null;
  notes: string | null;
};

export function FiscalTemplatePanel({ clientId, companies, onGenerated }: { clientId: string; companies: Company[]; onGenerated: () => void }) {
  const [companyId, setCompanyId] = useState(companies.length === 1 ? companies[0].id : '');
  const [templates, setTemplates] = useState<Template[]>([]);
  const [activations, setActivations] = useState<Activation[]>([]);
  const [working, setWorking] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const taxYear = new Date().getFullYear();

  useEffect(() => {
    if (!companyId && companies.length === 1) setCompanyId(companies[0].id);
  }, [companies, companyId]);

  const load = useCallback(async () => {
    setError('');
    const qs = companyId ? `?companyId=${encodeURIComponent(companyId)}` : '';
    const response = await fetch(`/api/admin/clientes/${clientId}/fiscal-templates${qs}`, { cache: 'no-store' });
    const json = await response.json();
    if (!response.ok) throw new Error(json.error ?? 'No se pudieron cargar las plantillas fiscales');
    setTemplates(json.templates ?? []);
    setActivations(json.activations ?? []);
  }, [clientId, companyId]);

  useEffect(() => { void load().catch((e) => setError(e instanceof Error ? e.message : 'Error de conexión')); }, [load]);

  const activeCodes = useMemo(() => new Set(activations.filter((item) => item.status === 'active').map((item) => item.template_code)), [activations]);

  const act = async (templateCode: string, action: 'activate' | 'deactivate' | 'generate') => {
    if (!companyId) { setError('Selecciona primero una entidad.'); return; }
    setWorking(`${templateCode}:${action}`); setError(''); setMessage('');
    try {
      const response = await fetch(`/api/admin/clientes/${clientId}/fiscal-templates`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ companyId, templateCode, action, taxYear, includePast: false, syncCalendar: true }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error ?? 'No se pudo completar la acción');
      if (action === 'generate') {
        setMessage(`Generados ${json.generated ?? 0} vencimientos del ejercicio ${taxYear}; ${json.createdOperational ?? 0} seguimientos nuevos.`);
        onGenerated();
      } else {
        setMessage(action === 'activate' ? 'Plantilla activada. Ahora puedes generar sus próximos vencimientos.' : 'Plantilla desactivada. Los vencimientos ya creados no se borran ni se modifican.');
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error de conexión');
    } finally {
      setWorking(null);
    }
  };

  return (
    <section className="rounded-2xl border border-[#d8cbb5] bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><h2 className="font-serif text-lg font-bold">Plantillas fiscales confirmadas</h2><p className="mt-1 max-w-3xl text-xs leading-5 text-[#52606d]">Activa solo los modelos que hayas confirmado que corresponden a la entidad. EXPERT no los deduce por forma jurídica, plan ni tipo de cliente.</p></div>
        <button type="button" onClick={() => void load()} className="rounded-lg border border-[#d8cbb5] p-2" title="Actualizar"><RefreshCw className="h-4 w-4" /></button>
      </div>

      <label className="mt-4 block max-w-md text-xs font-semibold">Entidad
        <select value={companyId} onChange={(e) => setCompanyId(e.target.value)} className="mt-1 w-full rounded-lg border border-[#d8cbb5] px-3 py-2 text-sm">
          <option value="">Seleccionar…</option>{companies.map((company) => <option key={company.id} value={company.id}>{company.name}{company.nif ? ` · ${company.nif}` : ''}</option>)}
        </select>
      </label>

      {error && <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>}
      {message && <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">{message}</div>}

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        {templates.map((template) => {
          const active = activeCodes.has(template.code);
          const busy = working?.startsWith(`${template.code}:`);
          return <article key={template.code} className={`rounded-xl border p-4 ${active ? 'border-emerald-200 bg-emerald-50/40' : 'border-[#eee6d8]'}`}>
            <div className="flex items-start justify-between gap-3"><div><div className="flex items-center gap-2"><span className="rounded-md bg-[#07111d] px-2 py-0.5 font-mono text-xs font-bold text-white">{template.modelo}</span><h3 className="font-bold">{template.title}</h3>{active && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800"><ShieldCheck className="h-3 w-3" />Activa</span>}</div><p className="mt-2 text-xs text-[#52606d]">{template.description}</p><p className="mt-2 text-[11px] leading-5 text-amber-800">{template.warning}</p></div></div>
            <div className="mt-3 flex flex-wrap gap-2">
              {!active ? <button disabled={busy || !companyId} onClick={() => void act(template.code, 'activate')} className="inline-flex items-center gap-1 rounded-lg bg-[#07111d] px-3 py-1.5 text-[11px] font-bold text-white disabled:opacity-40">{busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}Confirmar y activar</button> : <>
                <button disabled={busy} onClick={() => void act(template.code, 'generate')} className="inline-flex items-center gap-1 rounded-lg bg-[#c88b25] px-3 py-1.5 text-[11px] font-bold text-white disabled:opacity-40">{busy ? <Loader2 className="h-3 w-3 animate-spin" /> : null}Generar próximos {taxYear}</button>
                <button disabled={busy} onClick={() => void act(template.code, 'deactivate')} className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-[11px] font-bold text-red-700"><X className="h-3 w-3" />Desactivar</button>
              </>}
            </div>
          </article>;
        })}
      </div>
    </section>
  );
}
