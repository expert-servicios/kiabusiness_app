'use client';

/**
 * CompanyDataLookup
 *
 * Panel that queries /api/company/resolve with a company name or CIF and
 * presents suggestions with confidence badges, source labels, and warnings.
 *
 * "Usar datos" fills the parent form with the selected suggestion —
 * it does NOT create the company automatically. The user must still
 * submit the form to save.
 *
 * Privacy: displays RGPD notice when NIF/NIE is entered.
 */

import { useState } from 'react';
import { Search, AlertCircle, CheckCircle2, Info, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

type ConfidenceLevel = 'high' | 'medium' | 'low';
type DataSource =
  | 'boe_borme'
  | 'registradores_opendata'
  | 'opencorporates'
  | 'vies'
  | 'ckan_open_data'
  | 'manual';

interface CompanySuggestion {
  name               ?: string;
  taxId              ?: string;
  vatNumber          ?: string;
  registeredAddress  ?: string;
  postalCode         ?: string;
  city               ?: string;
  province           ?: string;
  country            ?: string;
  shareCapital       ?: string;
  representativeName ?: string;
  representativeRole ?: string;
  incorporationDate  ?: string;
  companyStatus      ?: string;
  source              : DataSource;
  sourceUrl          ?: string;
  retrievedAt         : string;
  confidence          : ConfidenceLevel;
  warnings            : string[];
}

interface ResolveResponse {
  suggestions             : CompanySuggestion[];
  bestSuggestion         ?: CompanySuggestion;
  requiresUserConfirmation: true;
  suggestionIds          ?: string[];
  taxIdType              ?: 'nif' | 'nie' | 'cif' | null;
  note                   ?: string;
  meta                   ?: { sources: string[]; elapsedMs: number; queriedAt: string };
}

export interface SuggestionFormFill {
  razon_social      ?: string;
  cif_nif           ?: string;
  nombre_comercial  ?: string;
  direccion         ?: string;
  ciudad            ?: string;
  provincia         ?: string;
  codigo_postal     ?: string;
  pais              ?: string;
}

interface Props {
  onFill   : (data: SuggestionFormFill, suggestionId?: string) => void;
  className?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

const SOURCE_LABELS: Record<DataSource, string> = {
  boe_borme              : 'BOE / BORME',
  registradores_opendata : 'Registradores Open Data',
  opencorporates         : 'OpenCorporates',
  vies                   : 'VIES (UE)',
  ckan_open_data         : 'Datos Abiertos',
  manual                 : 'Manual',
};

const CONFIDENCE_CONFIG: Record<ConfidenceLevel, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  high  : { label: 'Alta',  color: 'bg-green-100 text-green-700 border-green-200',  icon: CheckCircle2 },
  medium: { label: 'Media', color: 'bg-amber-100 text-amber-700 border-amber-200',  icon: Info },
  low   : { label: 'Baja',  color: 'bg-slate-100 text-slate-500 border-slate-200',  icon: AlertCircle },
};

// ── SuggestionCard ────────────────────────────────────────────────────────────

function SuggestionCard({
  suggestion,
  suggestionId,
  onUse,
}: {
  suggestion  : CompanySuggestion;
  suggestionId?: string;
  onUse       : (s: CompanySuggestion, id?: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const conf = CONFIDENCE_CONFIG[suggestion.confidence];
  const Icon = conf.icon;

  return (
    <div className="rounded-xl border border-[#d8cbb5] bg-white p-4 shadow-sm">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="truncate font-semibold text-[#07111d]">{suggestion.name ?? '—'}</p>
          {suggestion.taxId && (
            <p className="mt-0.5 text-xs text-[#6b7280]">{suggestion.taxId}</p>
          )}
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {/* Confidence badge */}
            <span className={cn(
              'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold',
              conf.color,
            )}>
              <Icon className="h-3 w-3" />
              Fiabilidad {conf.label}
            </span>
            {/* Source badge */}
            <span className="inline-flex items-center rounded-full border border-[#d8cbb5] bg-[#f8f4eb] px-2 py-0.5 text-[11px] text-[#6b7280]">
              {SOURCE_LABELS[suggestion.source]}
            </span>
          </div>
        </div>
        <button
          onClick={() => onUse(suggestion, suggestionId)}
          className="shrink-0 rounded-lg bg-[#d7a33a] px-3 py-1.5 text-xs font-semibold text-[#061321] transition hover:bg-[#f0bf54]"
        >
          Usar datos
        </button>
      </div>

      {/* Quick info line */}
      {(suggestion.city || suggestion.province || suggestion.registeredAddress) && (
        <p className="mt-2 text-xs text-[#6b7280]">
          {[suggestion.registeredAddress, suggestion.city, suggestion.province]
            .filter(Boolean).join(', ')}
          {suggestion.postalCode ? ` ${suggestion.postalCode}` : ''}
        </p>
      )}

      {/* Toggle details */}
      <button
        onClick={() => setExpanded((e) => !e)}
        className="mt-2 flex items-center gap-1 text-[11px] text-[#c88b25] hover:text-[#d7a33a]"
      >
        {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        {expanded ? 'Ocultar detalles' : 'Ver detalles'}
      </button>

      {expanded && (
        <div className="mt-3 space-y-1.5 border-t border-[#f0e8d5] pt-3">
          {suggestion.shareCapital && (
            <DetailRow label="Capital social" value={suggestion.shareCapital} />
          )}
          {suggestion.incorporationDate && (
            <DetailRow label="Fecha constitución" value={suggestion.incorporationDate} />
          )}
          {suggestion.representativeName && (
            <DetailRow
              label={suggestion.representativeRole ?? 'Representante'}
              value={suggestion.representativeName}
            />
          )}
          {suggestion.companyStatus && (
            <DetailRow label="Estado" value={suggestion.companyStatus} />
          )}

          {/* Warnings */}
          {suggestion.warnings.length > 0 && (
            <div className="mt-2 space-y-1">
              {suggestion.warnings.map((w, i) => (
                <p key={i} className="flex items-start gap-1 rounded-md bg-amber-50 px-2 py-1 text-[11px] text-amber-700">
                  <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
                  {w}
                </p>
              ))}
            </div>
          )}

          {/* Source link */}
          {suggestion.sourceUrl && (
            <a
              href={suggestion.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 flex items-center gap-1 text-[11px] text-[#c88b25] hover:underline"
            >
              <ExternalLink className="h-3 w-3" />
              Ver fuente
            </a>
          )}

          <p className="text-[10px] text-[#9ca3af]">
            Recuperado: {new Date(suggestion.retrievedAt).toLocaleString('es-ES')}
          </p>
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2 text-xs">
      <span className="w-36 shrink-0 text-[#9ca3af]">{label}</span>
      <span className="text-[#07111d]">{value}</span>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function CompanyDataLookup({ onFill, className }: Props) {
  const [query,       setQuery]       = useState('');
  const [loading,     setLoading]     = useState(false);
  const [result,      setResult]      = useState<ResolveResponse | null>(null);
  const [error,       setError]       = useState<string | null>(null);
  const [usedId,      setUsedId]      = useState<string | null>(null);

  const handleSearch = async () => {
    const q = query.trim();
    if (q.length < 2) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setUsedId(null);

    try {
      // Decide whether query looks like a CIF or a name
      const isCif = /^[ABCDEFGHJNPQRSUVW][0-9]{7}[0-9A-J]$/i.test(q.replace(/[\s.-]/g, ''));
      const body  = isCif ? { taxId: q } : { name: q };

      const res = await fetch('/api/company/resolve', {
        method : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body   : JSON.stringify(body),
      });
      const data = await res.json() as ResolveResponse & { error?: string };

      if (!res.ok) {
        setError(data.error ?? `Error ${res.status}`);
        return;
      }
      setResult(data);
    } catch {
      setError('Error de conexión. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleUse = (suggestion: CompanySuggestion, suggestionId?: string) => {
    const fill: SuggestionFormFill = {
      razon_social  : suggestion.name,
      cif_nif       : suggestion.taxId,
      direccion     : suggestion.registeredAddress,
      ciudad        : suggestion.city,
      provincia     : suggestion.province,
      codigo_postal : suggestion.postalCode,
      pais          : suggestion.country ?? 'ES',
    };
    onFill(fill, suggestionId);
    setUsedId(suggestionId ?? suggestion.taxId ?? suggestion.name ?? '?');
  };

  return (
    <div className={cn('rounded-xl border border-[#d8cbb5] bg-[#f8f4eb] p-4', className)}>
      <p className="mb-1 text-xs font-bold uppercase tracking-widest text-[#c88b25]">
        Buscar datos públicos
      </p>
      <p className="mb-3 text-xs text-[#6b7280]">
        Introduce el nombre o CIF de la empresa para precargar datos de fuentes oficiales.
        Los datos son orientativos — revísalos antes de guardar.
      </p>

      {/* Search input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
          placeholder="Nombre empresa o CIF (ej. B12345678)"
          className="min-h-10 flex-1 rounded-lg border border-[#d8cbb5] bg-white px-3 text-sm text-[#07111d] outline-none placeholder:text-[#9ca3af] focus:border-[#d7a33a] focus:ring-2 focus:ring-[#d7a33a]/20"
        />
        <button
          onClick={handleSearch}
          disabled={loading || query.trim().length < 2}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#29384a] px-4 text-sm font-semibold text-white transition hover:bg-[#07111d] disabled:opacity-50"
        >
          <Search className="h-4 w-4" />
          {loading ? 'Buscando…' : 'Buscar'}
        </button>
      </div>

      {/* Success fill notification */}
      {usedId && (
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700">
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
          Datos precargados en el formulario. Revísalos y guarda cuando estés listo.
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {error}
        </div>
      )}

      {/* RGPD note for NIF/NIE */}
      {result?.note && (
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-700">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {result.note}
        </div>
      )}

      {/* Results */}
      {result && !result.note && (
        <div className="mt-3">
          {result.suggestions.length === 0 ? (
            <p className="text-xs text-[#9ca3af]">
              No se encontraron resultados en fuentes públicas. Introduce los datos manualmente.
            </p>
          ) : (
            <div className="space-y-2">
              <p className="text-[11px] text-[#9ca3af]">
                {result.suggestions.length} resultado{result.suggestions.length !== 1 ? 's' : ''} —
                fuentes: {result.meta?.sources?.join(', ')}
              </p>
              {result.suggestions.map((s, i) => (
                <SuggestionCard
                  key={i}
                  suggestion={s}
                  suggestionId={result.suggestionIds?.[i]}
                  onUse={handleUse}
                />
              ))}
              <p className="text-[10px] text-[#9ca3af]">
                Datos sugeridos, no verificados. Confirma antes de guardar.
                Fuente consultada: {new Date(result.meta?.queriedAt ?? '').toLocaleString('es-ES')}.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
