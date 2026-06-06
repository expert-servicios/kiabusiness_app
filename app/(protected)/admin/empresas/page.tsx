'use client';

import { useState } from 'react';
import {
  Building2, Search, Loader2, AlertCircle, CheckCircle2,
  ExternalLink, MapPin, Calendar, Banknote, User, Shield, Info,
} from 'lucide-react';

interface CompanySuggestion {
  name              ?: string;
  taxId             ?: string;
  vatNumber         ?: string;
  registeredAddress ?: string;
  postalCode        ?: string;
  city              ?: string;
  province          ?: string;
  shareCapital      ?: string;
  representativeName?: string;
  representativeRole?: string;
  incorporationDate ?: string;
  companyStatus     ?: string;
  source             : string;
  sourceUrl         ?: string;
  retrievedAt        : string;
  confidence         : 'high' | 'medium' | 'low';
  warnings           : string[];
}

interface ResolveResult {
  suggestions    : CompanySuggestion[];
  bestSuggestion?: CompanySuggestion;
  meta           : { sources: string[]; elapsedMs: number };
}

const SOURCE_LABEL: Record<string, { label: string; color: string }> = {
  borme          : { label: 'BORME (BOE)',      color: 'bg-blue-100 text-blue-700' },
  vies           : { label: 'VIES (UE VAT)',    color: 'bg-purple-100 text-purple-700' },
  opencorporates : { label: 'OpenCorporates',   color: 'bg-amber-100 text-amber-700' },
  ckan_datos_gob_es    : { label: 'datos.gob.es',  color: 'bg-green-100 text-green-700' },
  ckan_place_contratos : { label: 'PLACE',          color: 'bg-teal-100 text-teal-700' },
  ckan_generalitat_catalunya: { label: 'Catalunya OD', color: 'bg-rose-100 text-rose-700' },
  ckan_madrid_open_data : { label: 'Madrid OD',   color: 'bg-orange-100 text-orange-700' },
  ckan_fundae    : { label: 'FUNDAE',            color: 'bg-cyan-100 text-cyan-700' },
  ckan_custom    : { label: 'CKAN Custom',       color: 'bg-gray-100 text-gray-600' },
};

const CONFIDENCE_BADGE: Record<string, { label: string; icon: typeof CheckCircle2; color: string }> = {
  high   : { label: 'Alta',  icon: CheckCircle2, color: 'text-green-600' },
  medium : { label: 'Media', icon: Info,         color: 'text-amber-600' },
  low    : { label: 'Baja',  icon: AlertCircle,  color: 'text-slate-500' },
};

function SourceBadge({ source }: { source: string }) {
  const s = SOURCE_LABEL[source] ?? { label: source, color: 'bg-gray-100 text-gray-600' };
  return <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${s.color}`}>{s.label}</span>;
}

function SuggestionCard({ s, onAssociate }: { s: CompanySuggestion; onAssociate: (s: CompanySuggestion) => void }) {
  const conf = CONFIDENCE_BADGE[s.confidence] ?? CONFIDENCE_BADGE.low;
  const ConfIcon = conf.icon;

  return (
    <div className="rounded-2xl border border-[#d8cbb5] bg-white p-5 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <SourceBadge source={s.source} />
            <span className={`flex items-center gap-1 text-xs font-semibold ${conf.color}`}>
              <ConfIcon className="h-3 w-3" /> Confianza {conf.label}
            </span>
          </div>
          <h3 className="font-serif text-base font-bold text-[#07111d] truncate">{s.name ?? '—'}</h3>
          {s.taxId && (
            <p className="font-mono text-xs text-[#29384a]">{s.taxId}</p>
          )}
        </div>
        <Building2 className="h-5 w-5 shrink-0 text-[#d7a33a] mt-1" />
      </div>

      {/* Data grid */}
      <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2 text-xs">
        {s.registeredAddress && (
          <div className="flex items-start gap-1.5 col-span-full">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-[#29384a]/50 mt-0.5" />
            <span className="text-[#29384a]">
              {[s.registeredAddress, s.postalCode, s.city, s.province].filter(Boolean).join(', ')}
            </span>
          </div>
        )}
        {s.incorporationDate && (
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 shrink-0 text-[#29384a]/50" />
            <span className="text-[#29384a]">Constitución: {s.incorporationDate}</span>
          </div>
        )}
        {s.shareCapital && (
          <div className="flex items-center gap-1.5">
            <Banknote className="h-3.5 w-3.5 shrink-0 text-[#29384a]/50" />
            <span className="text-[#29384a]">Capital: {s.shareCapital}</span>
          </div>
        )}
        {s.representativeName && (
          <div className="flex items-center gap-1.5 col-span-full">
            <User className="h-3.5 w-3.5 shrink-0 text-[#29384a]/50" />
            <span className="text-[#29384a]">
              {s.representativeName}{s.representativeRole ? ` (${s.representativeRole})` : ''}
            </span>
          </div>
        )}
        {s.companyStatus && (
          <div className="flex items-center gap-1.5">
            <Shield className="h-3.5 w-3.5 shrink-0 text-[#29384a]/50" />
            <span className="text-[#29384a]">Estado: {s.companyStatus}</span>
          </div>
        )}
      </dl>

      {/* Warnings */}
      {s.warnings.length > 0 && (
        <div className="rounded-xl bg-amber-50 px-3 py-2 text-[10px] text-amber-700 space-y-0.5">
          {s.warnings.map((w, i) => <p key={i}>{w}</p>)}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1 border-t border-[#f0e8d5]">
        <button
          type="button"
          onClick={() => onAssociate(s)}
          className="flex-1 rounded-xl bg-[#d7a33a] px-3 py-2 text-xs font-bold text-[#061321] transition hover:bg-[#c88b25]"
        >
          Crear / asociar empresa
        </button>
        {s.sourceUrl && (
          <a
            href={s.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl border border-[#d8cbb5] p-2 text-[#29384a]/60 transition hover:bg-[#f8f4eb] hover:text-[#29384a]"
            title="Ver fuente original"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
      </div>
    </div>
  );
}

export default function AdminEmpresasPage() {
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<'name' | 'nif'>('name');
  const [deepSearch, setDeepSearch] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ResolveResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const body = mode === 'nif'
        ? { taxId: query.trim() }
        : { name: query.trim() };

      // Deep search = more BORME history; pass via a custom header the resolver picks up
      const res = await fetch('/api/company/resolve', {
        method : 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(deepSearch ? { 'X-Borme-Deep-Search': 'true' } : {}),
        },
        body   : JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Error al buscar'); return; }
      setResult(data);
    } catch {
      setError('Error de conexión. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleAssociate = (s: CompanySuggestion) => {
    // Link to company creation with pre-filled data via query params
    const params = new URLSearchParams();
    if (s.name)   params.set('name',   s.name);
    if (s.taxId)  params.set('taxId',  s.taxId);
    if (s.city)   params.set('city',   s.city);
    if (s.registeredAddress) params.set('address', s.registeredAddress);
    window.open(`/admin/clientes?new=1&${params.toString()}`, '_blank');
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      {/* Header */}
      <div>
        <h1 className="font-serif text-2xl font-bold text-[#07111d]">Consulta de empresas</h1>
        <p className="mt-1 text-sm text-[#29384a]">
          Busca datos oficiales desde BORME, VIES, datos.gob.es y PLACE.
        </p>
      </div>

      {/* Search form */}
      <form onSubmit={handleSearch} className="rounded-2xl border border-[#d8cbb5] bg-white p-5 space-y-4">
        {/* Mode toggle */}
        <div className="flex gap-1 rounded-xl border border-[#d8cbb5] bg-[#f8f4eb] p-1">
          {(['name', 'nif'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => { setMode(m); setQuery(''); setResult(null); }}
              className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition ${
                mode === m ? 'bg-white text-[#07111d] shadow-sm' : 'text-[#29384a]/60'
              }`}
            >
              {m === 'name' ? 'Por nombre / razón social' : 'Por NIF / CIF'}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={mode === 'nif' ? 'A12345678 / B87654321...' : 'Gestoría López, SL...'}
            className="flex-1 rounded-xl border border-[#d8cbb5] bg-[#f8f4eb] px-4 py-2.5 text-sm text-[#07111d] placeholder-[#29384a]/40 focus:border-[#d7a33a] focus:outline-none focus:ring-1 focus:ring-[#d7a33a]"
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="flex items-center gap-2 rounded-xl bg-[#d7a33a] px-5 py-2.5 text-sm font-bold text-[#061321] transition hover:bg-[#c88b25] disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            Buscar
          </button>
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={deepSearch}
            onChange={(e) => setDeepSearch(e.target.checked)}
            className="h-4 w-4 rounded border-[#d8cbb5] accent-[#d7a33a]"
          />
          <span className="text-xs text-[#29384a]">
            Búsqueda extendida en BORME (12 meses — más lento)
          </span>
        </label>
      </form>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {/* Meta */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-[#29384a]">
              <span className="font-semibold">{result.suggestions.length}</span> resultado{result.suggestions.length !== 1 ? 's' : ''}
              {result.meta.sources.length > 0 && (
                <> · fuentes: {result.meta.sources.join(', ')}</>
              )}
            </p>
            <p className="text-xs text-[#29384a]/50">{result.meta.elapsedMs} ms</p>
          </div>

          {result.suggestions.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#d8cbb5] bg-[#f8f4eb] p-10 text-center">
              <Building2 className="mx-auto mb-3 h-8 w-8 text-[#d8cbb5]" />
              <p className="text-sm font-semibold text-[#29384a]">Sin resultados</p>
              <p className="mt-1 text-xs text-[#29384a]/60">
                Prueba con una denominación diferente o activa la búsqueda extendida en BORME.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {result.suggestions.map((s, i) => (
                <SuggestionCard key={i} s={s} onAssociate={handleAssociate} />
              ))}
            </div>
          )}

          {/* Disclaimer */}
          <p className="text-center text-[10px] text-[#29384a]/40 px-4">
            Datos extraídos de fuentes públicas oficiales. Requieren confirmación y pueden no reflejar el estado vigente completo de la sociedad.
          </p>
        </div>
      )}
    </div>
  );
}
